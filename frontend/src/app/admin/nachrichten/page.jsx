'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Search,
    Send,
    ArrowLeft,
    Check,
    CheckCheck,
    MapPin,
    ExternalLink,
    Tag,
    User,
    ShieldCheck,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    Sparkles,
    ChevronRight,
    Inbox,
    Layers,
    ChevronLeft,
    Building2,
    Crown,
    Compass
} from 'lucide-react';
import {
    getConversations,
    getConversationDetail,
    sendChatMessage
} from '@/api/conversations';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket } from '@/utils/socket';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUrl';

function formatMessageTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Heute, ${timeStr}`;
    if (isYesterday) return `Gestern, ${timeStr}`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + `, ${timeStr}`;
}

const QUICK_REPLIES = [
    'Hallo, vielen Dank für Ihre Anfrage! Das Fahrzeug ist derzeit noch verfügbar.',
    'Gerne können wir einen unverbindlichen Besichtigungstermin vereinbaren.',
    'Vielen Dank für Ihr Interesse! Bei weiteren Fragen stehe ich Ihnen gerne zur Verfügung.',
    'Das Inserat ist leider bereits reserviert / vergeben.'
];

function AdminMessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeConvIdFromQuery = searchParams.get('id');

    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedConvId, setSelectedConvId] = useState(activeConvIdFromQuery || null);
    const [mobileStep, setMobileStep] = useState('contacts'); // 'contacts' | 'listings' | 'chat'

    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNREAD'
    const [loadingList, setLoadingList] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

    const currentUser = useAuthStore((state) => state.user);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback((smooth = true) => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'instant'
            });
        }
    }, []);

    // ── 1. Group Conversations by Contact (User) ─────────────────────────
    const groupedContacts = useMemo(() => {
        const map = new Map();

        conversations.forEach((conv) => {
            const contactId = conv.other_user?.id || 'unknown';
            if (!map.has(contactId)) {
                map.set(contactId, {
                    userId: contactId,
                    user: conv.other_user || { name: 'Interessent', type: 'Privat' },
                    conversations: [],
                    totalUnreadCount: 0,
                    latestUpdatedAt: conv.last_message?.created_at || conv.updated_at || conv.created_at,
                    latestMessage: conv.last_message || null
                });
            }

            const group = map.get(contactId);
            group.conversations.push(conv);
            group.totalUnreadCount += (conv.unread_count || 0);

            const convTime = new Date(conv.last_message?.created_at || conv.updated_at || conv.created_at).getTime();
            const groupTime = new Date(group.latestUpdatedAt).getTime();
            if (convTime > groupTime || !group.latestMessage) {
                group.latestUpdatedAt = conv.last_message?.created_at || conv.updated_at || conv.created_at;
                group.latestMessage = conv.last_message;
            }
        });

        const list = Array.from(map.values()).map((group) => {
            group.conversations.sort((a, b) => {
                const timeA = new Date(a.last_message?.created_at || a.updated_at || a.created_at).getTime();
                const timeB = new Date(b.last_message?.created_at || b.updated_at || b.created_at).getTime();
                return timeB - timeA;
            });
            return group;
        });

        list.sort((a, b) => new Date(b.latestUpdatedAt).getTime() - new Date(a.latestUpdatedAt).getTime());

        return list;
    }, [conversations]);

    // ── 2. Filtered Contacts List ────────────────────────────────────────
    const filteredContacts = useMemo(() => {
        return groupedContacts.filter((group) => {
            if (filterTab === 'UNREAD' && group.totalUnreadCount === 0) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = group.user?.name?.toLowerCase().includes(q);
                const emailMatch = group.user?.email?.toLowerCase().includes(q);
                const listingMatch = group.conversations.some((c) =>
                    c.listing?.title?.toLowerCase().includes(q)
                );
                const messageMatch = group.conversations.some((c) =>
                    c.last_message?.content?.toLowerCase().includes(q)
                );
                return nameMatch || emailMatch || listingMatch || messageMatch;
            }

            return true;
        });
    }, [groupedContacts, filterTab, searchQuery]);

    // Active Contact Group
    const activeContactGroup = useMemo(() => {
        if (!selectedUserId) return null;
        return groupedContacts.find((g) => g.userId === selectedUserId) || null;
    }, [groupedContacts, selectedUserId]);

    const totalUnreadCount = useMemo(
        () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
        [conversations]
    );

    // ── 3. Fetch Conversations ───────────────────────────────────────────
    const fetchConversationsList = useCallback(async (silent = false) => {
        if (!silent) setLoadingList(true);
        try {
            const res = await getConversations();
            const list = res.conversations || res.data?.conversations;
            if (res.success && Array.isArray(list)) {
                setConversations(list);

                // If query param ID exists, auto select corresponding user and conversation
                if (activeConvIdFromQuery) {
                    const targetConv = list.find((c) => c.id === activeConvIdFromQuery);
                    if (targetConv) {
                        setSelectedUserId(targetConv.other_user?.id);
                        setSelectedConvId(targetConv.id);
                        setMobileStep('chat');
                        return;
                    }
                }

                // If on desktop and no user selected, default to first user with no conversation opened yet
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    if (!selectedUserId && list.length > 0) {
                        const firstUser = list[0].other_user?.id;
                        setSelectedUserId(firstUser);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching admin conversations:', err);
            if (!silent) toast.error('Fehler beim Laden der Nachrichten.');
        } finally {
            if (!silent) setLoadingList(false);
            setRefreshing(false);
        }
    }, [activeConvIdFromQuery, selectedUserId]);

    useEffect(() => {
        fetchConversationsList();
    }, [fetchConversationsList]);

    // Poll conversations list every 5s
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversationsList(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchConversationsList]);

    // ── 4. Fetch Active Conversation Detail ───────────────────────────────
    const fetchConversationDetail = useCallback(async (convId, silent = false) => {
        if (!convId) return;
        if (!silent) setLoadingChat(true);
        try {
            const res = await getConversationDetail(convId);
            const conv = res.conversation || res.data?.conversation;
            if (res.success && conv) {
                setActiveConversation(conv);
                setMessages(conv.messages || []);

                // Mark unread locally
                setConversations((prev) =>
                    prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
                );
            }
        } catch (err) {
            console.error('Error fetching conversation detail:', err);
            if (!silent) toast.error('Fehler beim Laden des Chats.');
        } finally {
            if (!silent) setLoadingChat(false);
        }
    }, []);

    // ── 4.1 Realtime Socket Room & Listeners ──────────────────────────
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // Global message received listener
        const handleGlobalMessage = ({ conversationId, message }) => {
            setConversations((prev) => {
                let found = false;
                const updated = prev.map((c) => {
                    if (c.id === conversationId) {
                        found = true;
                        const isCurrentActive = selectedConvId === conversationId;
                        return {
                            ...c,
                            last_message: message,
                            updated_at: message.created_at || new Date().toISOString(),
                            unread_count: isCurrentActive ? 0 : (c.unread_count || 0) + 1
                        };
                    }
                    return c;
                });
                if (!found) {
                    fetchConversationsList(true);
                }
                return updated;
            });
        };

        socket.on('message_received', handleGlobalMessage);
        socket.on('admin_new_message', handleGlobalMessage);

        if (selectedConvId) {
            socket.emit('join_conversation', { conversationId: selectedConvId });
            socket.emit('mark_read', { conversationId: selectedConvId });

            const handleRoomNewMessage = ({ conversationId, message }) => {
                if (conversationId === selectedConvId) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === message.id)) return prev;
                        const isMine = String(message.sender_id).toLowerCase() === String(currentUser?.id).toLowerCase();
                        return [
                            ...prev,
                            {
                                ...message,
                                is_mine: isMine
                            }
                        ];
                    });
                    setIsOtherUserTyping(false);
                    socket.emit('mark_read', { conversationId: selectedConvId });
                }
            };

            const handleUserTyping = ({ conversationId, userId }) => {
                if (conversationId === selectedConvId && String(userId).toLowerCase() !== String(currentUser?.id).toLowerCase()) {
                    setIsOtherUserTyping(true);
                }
            };

            const handleUserStoppedTyping = ({ conversationId, userId }) => {
                if (conversationId === selectedConvId && String(userId).toLowerCase() !== String(currentUser?.id).toLowerCase()) {
                    setIsOtherUserTyping(false);
                }
            };

            const handleMessagesRead = ({ conversationId }) => {
                if (conversationId === selectedConvId) {
                    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
                }
            };

            socket.on('new_message', handleRoomNewMessage);
            socket.on('user_typing', handleUserTyping);
            socket.on('user_stopped_typing', handleUserStoppedTyping);
            socket.on('messages_read', handleMessagesRead);

            return () => {
                socket.emit('leave_conversation', { conversationId: selectedConvId });
                socket.off('new_message', handleRoomNewMessage);
                socket.off('user_typing', handleUserTyping);
                socket.off('user_stopped_typing', handleUserStoppedTyping);
                socket.off('messages_read', handleMessagesRead);
                socket.off('message_received', handleGlobalMessage);
                socket.off('admin_new_message', handleGlobalMessage);
            };
        }

        return () => {
            socket.off('message_received', handleGlobalMessage);
            socket.off('admin_new_message', handleGlobalMessage);
        };
    }, [selectedConvId, currentUser?.id, fetchConversationsList]);

    useEffect(() => {
        if (selectedConvId) {
            fetchConversationDetail(selectedConvId);
            setIsOtherUserTyping(false);
        } else {
            setActiveConversation(null);
            setMessages([]);
            setIsOtherUserTyping(false);
        }
    }, [selectedConvId, fetchConversationDetail]);

    // Scroll to bottom on messages update
    useEffect(() => {
        scrollToBottom(true);
    }, [messages, isOtherUserTyping, scrollToBottom]);

    // Handle selecting a contact (Side 1: Users on left -> shows Listings on right)
    const handleSelectContact = (contactId) => {
        setSelectedUserId(contactId);
        setSelectedConvId(null);
        setMobileStep('listings');
    };

    // Handle selecting a listing conversation (Side 2: Listings on left -> shows Chat on right)
    const handleSelectListingConversation = (convId) => {
        setSelectedConvId(convId);
        setMobileStep('chat');
        router.replace(`/admin/nachrichten?id=${encodeURIComponent(convId)}`, { scroll: false });
    };

    // Handle going back to Contacts list
    const handleBackToContacts = () => {
        setSelectedConvId(null);
        setMobileStep('contacts');
        router.replace('/admin/nachrichten', { scroll: false });
    };

    // Handle going back to Listings list on mobile
    const handleBackToListings = () => {
        setSelectedConvId(null);
        setMobileStep('listings');
        router.replace('/admin/nachrichten', { scroll: false });
    };

    // Apply quick reply
    const handleApplyQuickReply = (text) => {
        setNewMessageText(text);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    // ── Send Message ──────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = newMessageText.trim();
        if (!text || !selectedConvId || isSending) return;

        const socket = getSocket();
        if (socket && selectedConvId) {
            socket.emit('typing_stop', { conversationId: selectedConvId });
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        setIsSending(true);
        try {
            const res = await sendChatMessage(selectedConvId, text);
            const sentMsg = res.message || res.data?.message;
            if (res.success && sentMsg) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === sentMsg.id)) return prev;
                    return [...prev, sentMsg];
                });
                setNewMessageText('');

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === selectedConvId
                            ? {
                                  ...c,
                                  last_message: sentMsg,
                                  updated_at: new Date().toISOString()
                              }
                            : c
                    )
                );

                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
            } else {
                toast.error(res.error || res.message || 'Fehler beim Senden.');
            }
        } catch (err) {
            console.error('Error sending admin message:', err);
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Senden.');
        } finally {
            setIsSending(false);
        }
    };

    const handleTextareaChange = (e) => {
        const val = e.target.value;
        setNewMessageText(val);

        e.target.style.height = 'auto';
        const newH = Math.min(e.target.scrollHeight, 180);
        e.target.style.height = `${newH}px`;
        scrollToBottom(false);

        const socket = getSocket();
        if (socket && selectedConvId) {
            if (val.trim().length > 0) {
                socket.emit('typing_start', { conversationId: selectedConvId });
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('typing_stop', { conversationId: selectedConvId });
                }, 2000);
            } else {
                socket.emit('typing_stop', { conversationId: selectedConvId });
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CONTACTS LIST VIEW
    // ─────────────────────────────────────────────────────────────────────────
    const renderContactsList = () => (
        <div className="flex flex-col h-full bg-[#fdfcf9]">
            {/* Header & Search */}
            <div className="p-3.5 sm:p-4 border-b border-beige bg-white space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm sm:text-base text-charcoal">
                            Kontakte
                        </span>
                        <span className="bg-sand text-forest font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                            {groupedContacts.length}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setRefreshing(true);
                            fetchConversationsList();
                        }}
                        disabled={refreshing}
                        title="Neu laden"
                        className="p-1.5 rounded-xl hover:bg-sand/40 text-charcoal/50 hover:text-forest transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-forest' : ''}`} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Person oder Inserat suchen..."
                        className="w-full bg-[#faf8f3] border border-beige rounded-xl pl-8 pr-3 py-1.5 text-xs text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest transition-colors"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 pt-0.5 text-[11px] font-bold">
                    {[
                        { id: 'ALL', label: 'Alle' },
                        { id: 'UNREAD', label: 'Ungelesen', badge: totalUnreadCount > 0 ? totalUnreadCount : undefined }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterTab(tab.id)}
                            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                                filterTab === tab.id
                                    ? 'bg-forest text-sand shadow-xs font-black'
                                    : 'bg-sand/40 text-charcoal/70 hover:bg-sand'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className="bg-gold text-forest text-[9px] px-1 rounded-full font-mono font-bold">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contacts List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-beige/60">
                {loadingList ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-2 text-charcoal/60">
                        <Loader2 className="w-5 h-5 text-forest animate-spin" />
                        <p className="text-xs">Kontakte werden geladen...</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 text-charcoal/60">
                        <div className="w-12 h-12 rounded-2xl bg-sand/40 flex items-center justify-center text-charcoal/40">
                            <Inbox className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-charcoal">Keine Kontakte</p>
                        <p className="text-[11px] leading-relaxed max-w-[200px]">
                            {searchQuery
                                ? 'Keine Treffer für deine Suche.'
                                : 'Aktuell liegen keine Kundenunterhaltungen vor.'}
                        </p>
                    </div>
                ) : (
                    filteredContacts.map((contactGroup, cIdx) => {
                        const isSelected = selectedUserId === contactGroup.userId;
                        const hasUnread = contactGroup.totalUnreadCount > 0;
                        const listingsCount = contactGroup.conversations.length;

                        return (
                            <motion.div
                                key={contactGroup.userId}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(cIdx * 0.03, 0.25) }}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleSelectContact(contactGroup.userId)}
                                className={`p-3 sm:p-3.5 transition-colors cursor-pointer relative flex gap-3 items-start ${
                                    isSelected
                                        ? 'bg-white border-l-4 border-l-forest shadow-xs'
                                        : hasUnread
                                        ? 'bg-amber-500/5 hover:bg-white'
                                        : 'hover:bg-white'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-forest text-sand font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative">
                                    {contactGroup.user?.avatar ? (
                                        <img
                                            src={getImageUrl(contactGroup.user.avatar)}
                                            alt={contactGroup.user.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        contactGroup.user?.name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="font-display font-bold text-xs sm:text-sm text-charcoal truncate">
                                            {contactGroup.user?.name || 'Benutzer'}
                                        </span>
                                        <span className="text-[10px] text-charcoal/45 shrink-0 font-mono">
                                            {contactGroup.latestUpdatedAt
                                                ? formatMessageTime(contactGroup.latestUpdatedAt)
                                                : ''}
                                        </span>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sand text-forest uppercase shrink-0">
                                            {contactGroup.user?.type || 'Interessent'}
                                        </span>
                                        <span className="text-[10px] font-bold text-forest bg-forest/5 px-1.5 py-0.2 rounded flex items-center gap-1 shrink-0">
                                            <Layers className="w-2.5 h-2.5" />
                                            {listingsCount} {listingsCount === 1 ? 'Inserat' : 'Inserate'}
                                        </span>
                                    </div>

                                    {/* Latest Message Preview */}
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className={`text-[11px] truncate ${
                                                hasUnread
                                                    ? 'font-bold text-charcoal'
                                                    : 'text-charcoal/60'
                                            }`}
                                        >
                                            {contactGroup.latestMessage ? (
                                                <span>
                                                    {contactGroup.latestMessage.is_mine && (
                                                        <span className="text-charcoal/40 font-normal mr-1">
                                                            Du:
                                                        </span>
                                                    )}
                                                    {contactGroup.latestMessage.content}
                                                </span>
                                            ) : (
                                                <span className="italic text-charcoal/40">
                                                    Unterhaltung gestartet
                                                </span>
                                            )}
                                        </p>

                                        {hasUnread && (
                                            <span className="bg-gold-dark text-white font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                                                {contactGroup.totalUnreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 2. LISTINGS OF ACTIVE CONTACT
    // ─────────────────────────────────────────────────────────────────────────
    const renderListingsList = () => {
        if (!activeContactGroup) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#fdfcf9]">
                    <div className="w-14 h-14 rounded-3xl bg-sand/40 text-forest flex items-center justify-center shadow-inner">
                        <User className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-charcoal">
                        Kein Kontakt ausgewählt
                    </h3>
                    <p className="text-xs text-charcoal/60 max-w-sm leading-relaxed">
                        Wähle links eine Person aus, um die zugehörigen Inserate anzuzeigen.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-[#fdfcf9]">
                {/* Header with Inline Back Arrow on Mobile */}
                <div className="p-3.5 sm:p-4 border-b border-beige bg-white shrink-0">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* Back Arrow Button (Shows on mobile or when conversation is selected) */}
                        <button
                            onClick={handleBackToContacts}
                            className={`${selectedConvId ? 'flex' : 'lg:hidden flex'} p-1.5 -ml-1 rounded-full hover:bg-sand/40 text-charcoal/70 hover:text-forest transition-colors cursor-pointer shrink-0`}
                            title="Zurück zu allen Kontakten"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="w-9 h-9 rounded-full bg-forest text-sand font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            {activeContactGroup.user?.avatar ? (
                                <img
                                    src={getImageUrl(activeContactGroup.user.avatar)}
                                    alt={activeContactGroup.user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                activeContactGroup.user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-sm text-charcoal truncate">
                                    {activeContactGroup.user?.name}
                                </h3>
                                <span className="text-[9px] font-bold bg-sand text-forest px-1.5 py-0.2 rounded uppercase">
                                    {activeContactGroup.user?.type}
                                </span>
                            </div>
                            <p className="text-[11px] text-charcoal/50 truncate">
                                {activeContactGroup.conversations.length}{' '}
                                {activeContactGroup.conversations.length === 1 ? 'aktives Inserat' : 'aktive Inserate'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listings Items */}
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2.5 divide-y divide-beige/40">
                    <div className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1">
                        <Layers className="w-3.5 h-3.5 text-forest" />
                        <span>Inserate mit {activeContactGroup.user?.name}</span>
                    </div>

                    {activeContactGroup.conversations.map((conv, lIdx) => {
                        const isSelected = selectedConvId === conv.id;
                        const hasUnread = (conv.unread_count || 0) > 0;
                        const hasListing = Boolean(conv.listing && (conv.listing.title || conv.listing.id));

                        return (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(lIdx * 0.04, 0.2) }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleSelectListingConversation(conv.id)}
                                className={`pt-2.5 transition-colors cursor-pointer rounded-2xl p-3 flex items-start sm:items-center justify-between gap-3 group ${
                                    isSelected
                                        ? 'bg-white border-2 border-forest shadow-xs'
                                        : 'bg-white hover:bg-sand/20 border border-beige'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-forest/5 border border-beige shrink-0 flex items-center justify-center relative">
                                        {hasListing && conv.listing?.main_image ? (
                                            <img
                                                src={getImageUrl(conv.listing.main_image)}
                                                alt={conv.listing.title || 'Listing'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : activeContactGroup.user?.avatar ? (
                                            <img
                                                src={getImageUrl(activeContactGroup.user.avatar)}
                                                alt={activeContactGroup.user.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-forest/60" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-sand text-forest">
                                                {hasListing ? 'Kaufanfrage' : 'Direktanfrage'}
                                            </span>
                                            {(conv.listing?.location || activeContactGroup.user?.location) && (
                                                <span className="text-[10px] text-charcoal/50 flex items-center gap-0.5 truncate">
                                                    <MapPin className="w-3 h-3 text-gold-dark" />
                                                    {conv.listing?.location || activeContactGroup.user?.location || 'Deutschland'}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-display font-bold text-xs sm:text-sm text-charcoal group-hover:text-forest transition-colors truncate">
                                            {hasListing
                                                ? conv.listing.title
                                                : `Allgemeine Kontaktanfrage an ${activeContactGroup.user?.name || 'den Anbieter'}`}
                                        </h4>

                                        <div className="flex items-baseline gap-2">
                                            {hasListing ? (
                                                <span className="font-display font-extrabold text-xs text-forest font-mono">
                                                    {conv.listing?.price
                                                        ? `${conv.listing.price.toLocaleString('de-DE')} €`
                                                        : 'Auf Anfrage'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-forest">
                                                    Direkte Anbieter-Unterhaltung
                                                </span>
                                            )}
                                            {conv.last_message && (
                                                <span className="text-[10px] text-charcoal/50 truncate max-w-[150px] sm:max-w-xs">
                                                    • {conv.last_message.content}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Arrow / Unread */}
                                <div className="flex items-center gap-2 shrink-0 self-center">
                                    {hasUnread && (
                                        <span className="bg-gold-dark text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                    <span className="p-1.5 rounded-xl bg-sand/40 group-hover:bg-forest group-hover:text-sand text-charcoal/60 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ACTIVE CHAT THREAD VIEW WITH REALTIME MESSENGER ANIMATIONS
    // ─────────────────────────────────────────────────────────────────────────
    const renderChatThread = () => {
        if (!selectedConvId || !activeConversation) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#fdfcf9]">
                    <div className="w-14 h-14 rounded-3xl bg-sand/40 text-forest flex items-center justify-center shadow-inner">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-charcoal">
                        Keine Unterhaltung ausgewählt
                    </h3>
                    <p className="text-xs text-charcoal/60 max-w-sm leading-relaxed">
                        Wähle links ein Inserat aus, um den Chat für dieses Inserat zu öffnen.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-white relative overflow-hidden">
                {/* Thread Top Bar */}
                <div className="p-3 sm:p-3.5 bg-white border-b border-beige flex items-center justify-between gap-3 shadow-2xs shrink-0 z-20">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mobile Back Button */}
                        <button
                            onClick={handleBackToListings}
                            className="lg:hidden p-1.5 rounded-full hover:bg-sand/40 text-charcoal/70 cursor-pointer shrink-0"
                            title="Zurück zu Inseraten"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-forest text-sand font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            {activeConversation.other_user?.avatar ? (
                                <img
                                    src={getImageUrl(activeConversation.other_user.avatar)}
                                    alt={activeConversation.other_user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                activeConversation.other_user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>

                        {/* Participant Title */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-display font-bold text-xs sm:text-sm text-charcoal truncate">
                                    {activeConversation.other_user?.name}
                                </h3>
                                <span className="text-[9px] font-bold bg-sand text-forest px-1.5 py-0.2 rounded-full shrink-0 uppercase">
                                    {activeConversation.other_user?.type || 'Interessent'}
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-forest truncate max-w-[200px] sm:max-w-sm" title={activeConversation.listing?.title}>
                                {activeConversation.listing?.title || 'Direktanfrage'}
                            </p>
                        </div>
                    </div>

                    {/* Context Pill: Listing Link Card */}
                    {activeConversation.listing && (activeConversation.listing.title || activeConversation.listing.slug) && (
                        <Link
                            href={`/inserate/${activeConversation.listing.slug || activeConversation.listing.id}`}
                            target="_blank"
                            className="bg-[#faf8f3] hover:bg-sand border border-beige rounded-xl p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-2 transition-colors group shrink-0 max-w-[170px] sm:max-w-xs"
                            title="Inserat anzeigen"
                        >
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-forest/5 shrink-0 flex items-center justify-center">
                                {activeConversation.listing.main_image ? (
                                    <img
                                        src={getImageUrl(activeConversation.listing.main_image)}
                                        alt={activeConversation.listing.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <Compass className="w-4 h-4 text-forest/70" />
                                )}
                            </div>
                            <div className="min-w-0 hidden sm:block text-left">
                                <span className="block text-[10px] font-bold text-forest truncate">
                                    {activeConversation.listing.title}
                                </span>
                                <span className="font-display font-extrabold text-[11px] text-charcoal font-mono">
                                    {activeConversation.listing.price ? `${activeConversation.listing.price.toLocaleString('de-DE')} €` : 'Auf Anfrage'}
                                </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-charcoal/40 group-hover:text-forest shrink-0 ml-0.5" />
                        </Link>
                    )}
                </div>

                {/* Message Stream (Flex-1 scrollable, automatically shrinks as input grows upward) */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-[#fdfcf9]"
                >
                    {loadingChat ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-2 text-charcoal/60">
                            <Loader2 className="w-5 h-5 text-forest animate-spin" />
                            <p className="text-xs">Nachrichten werden geladen...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-charcoal/60 py-12">
                            <Sparkles className="w-6 h-6 text-forest" />
                            <p className="text-xs font-bold text-charcoal">Noch keine Nachrichten</p>
                            <p className="text-[11px] max-w-xs">
                                Schreibe die erste Nachricht an {activeConversation.other_user?.name} als Campuna Club.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => {
                                const isMine = msg.is_mine || msg.sender_id === currentUser?.id;

                                return (
                                    <motion.div
                                        key={msg.id || idx}
                                        initial={{ opacity: 0, y: 14, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 450,
                                            damping: 30,
                                            mass: 0.8
                                        }}
                                        className={`flex flex-col ${
                                            isMine ? 'items-end' : 'items-start'
                                        }`}
                                    >
                                        {/* Sender Tag */}
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[10px] font-bold text-charcoal/45 uppercase tracking-wider font-sans">
                                                {isMine ? 'Campuna Club (Admin)' : (activeConversation.other_user?.name || 'Interessent')}
                                            </span>
                                            {isMine && (
                                                <span className="inline-flex items-center gap-0.5 bg-gold/20 text-forest text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-gold/40">
                                                    <Crown className="w-2.5 h-2.5 text-amber-600" /> Admin
                                                </span>
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <motion.div
                                            layout
                                            className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm transition-shadow ${
                                                isMine
                                                    ? 'bg-[#004709] text-sand rounded-br-xs shadow-emerald-950/10'
                                                    : 'bg-white border border-beige text-charcoal rounded-bl-xs shadow-slate-900/5'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words select-text">{msg.content}</p>
                                        </motion.div>

                                        {/* Timestamp & Delivery */}
                                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-charcoal/45 font-mono">
                                            <span>{formatMessageTime(msg.created_at)}</span>
                                            {isMine && (
                                                <span>
                                                    {msg.is_read ? (
                                                        <CheckCheck
                                                            className="w-3.5 h-3.5 text-emerald-600 inline"
                                                            title="Gelesen"
                                                        />
                                                    ) : (
                                                        <Check
                                                            className="w-3.5 h-3.5 text-charcoal/40 inline"
                                                            title="Zugestellt"
                                                        />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}

                    {/* Typing Indicator */}
                    {isOtherUserTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 text-charcoal/60 text-xs py-1"
                        >
                            <div className="bg-white border border-beige rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-sm">
                                <span className="text-[11px] font-medium text-forest">
                                    {activeConversation?.other_user?.name || 'Nutzer'} tippt
                                </span>
                                <span className="flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce"></span>
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* ── WHATSAPP-STYLE BOTTOM INPUT BAR (EXPANDS UPWARD) ── */}
                <div className="bg-white border-t border-beige p-2.5 sm:p-3.5 space-y-2 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-20">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                        {QUICK_REPLIES.map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => handleApplyQuickReply(chip)}
                                className="px-2.5 py-1 rounded-full bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 transition-colors whitespace-nowrap cursor-pointer text-[10px] shrink-0"
                            >
                                {chip.slice(0, 36)}...
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={newMessageText}
                            onChange={handleTextareaChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Nachricht als Campuna Club eingeben... (Enter zum Senden)"
                            className="flex-1 bg-[#faf8f3] border border-beige rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 resize-none min-h-[42px] max-h-[180px] leading-relaxed transition-[height] duration-75 overflow-y-auto"
                        />

                        <button
                            type="submit"
                            disabled={isSending || !newMessageText.trim()}
                            className="bg-forest hover:bg-gold text-sand hover:text-forest disabled:opacity-40 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 cursor-pointer mb-0.5"
                            title="Senden"
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* ── Main Chat Shell Container (Responsive 2 Sides, 100% Height, Inner Scroll Only) ── */}
            <div className="bg-white rounded-none lg:rounded-3xl border-0 lg:border border-[#E8EAEF] shadow-none lg:shadow-2xs overflow-hidden flex flex-col lg:flex-row h-full w-full relative">
                
                {/* ═════════════════════════════════════════════════════════════
                    SIDE 1 (LEFT PANEL):
                    - If no listing selected: Users on Left
                    - If listing selected: Listings on Left (with "← Zurück zu Kontakten")
                   ═════════════════════════════════════════════════════════════ */}
                <div
                    className={`w-full lg:w-80 xl:w-96 lg:border-r border-beige flex flex-col shrink-0 overflow-hidden ${
                        mobileStep === 'contacts'
                            ? 'flex'
                            : !selectedConvId && mobileStep === 'listings'
                            ? 'hidden lg:flex'
                            : selectedConvId && mobileStep === 'chat'
                            ? 'hidden lg:flex'
                            : 'flex'
                    }`}
                >
                    {!selectedConvId ? renderContactsList() : renderListingsList()}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    SIDE 2 (RIGHT PANEL):
                    - If no listing selected: Listings on Right
                    - If listing selected: Live Chat on Right
                   ═════════════════════════════════════════════════════════════ */}
                <div
                    className={`flex-1 flex flex-col bg-white overflow-hidden relative ${
                        mobileStep === 'contacts'
                            ? 'hidden lg:flex'
                            : mobileStep === 'listings'
                            ? 'flex'
                            : mobileStep === 'chat'
                            ? 'flex'
                            : 'hidden lg:flex'
                    }`}
                >
                    {!selectedConvId ? renderListingsList() : renderChatThread()}
                </div>
            </div>
        </div>
    );
}

export default function AdminMessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-forest animate-spin" />
            </div>
        }>
            <AdminMessagesContent />
        </Suspense>
    );
}

