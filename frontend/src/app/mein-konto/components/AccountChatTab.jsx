'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
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
    ChevronLeft
} from 'lucide-react';
import {
    getConversations,
    getConversationDetail,
    sendChatMessage
} from '@/api/conversations';
import { useChatStore } from '@/store/useChatStore';
import { toast } from 'react-hot-toast';

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

export default function AccountChatTab({ currentUser, onNavigateToListings }) {
    const fetchGlobalUnreadCount = useChatStore((state) => state.fetchUnreadCount);

    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedConvId, setSelectedConvId] = useState(null);
    const [mobileStep, setMobileStep] = useState('contacts'); // 'contacts' | 'listings' | 'chat'
    
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'SELLER' | 'BUYER'

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // ── Group Conversations by Contact (User) ─────────────────────────
    const groupedContacts = useMemo(() => {
        const map = new Map();

        conversations.forEach((conv) => {
            const contactId = conv.other_user?.id || 'unknown';
            if (!map.has(contactId)) {
                map.set(contactId, {
                    userId: contactId,
                    user: conv.other_user || { name: 'Benutzer', type: 'Privat' },
                    conversations: [],
                    totalUnreadCount: 0,
                    latestUpdatedAt: conv.last_message?.created_at || conv.updated_at || conv.created_at,
                    latestMessage: conv.last_message || null,
                    buyerCount: 0,
                    sellerCount: 0
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

            if (conv.is_buyer) {
                group.buyerCount += 1;
            } else {
                group.sellerCount += 1;
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

    // ── Filtered Contacts ─────────────────────────────────────────────
    const filteredContacts = useMemo(() => {
        return groupedContacts.filter((group) => {
            if (filterTab === 'UNREAD' && group.totalUnreadCount === 0) return false;
            if (filterTab === 'SELLER' && group.sellerCount === 0) return false;
            if (filterTab === 'BUYER' && group.buyerCount === 0) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = group.user?.name?.toLowerCase().includes(q);
                const listingMatch = group.conversations.some((c) =>
                    c.listing?.title?.toLowerCase().includes(q)
                );
                const messageMatch = group.conversations.some((c) =>
                    c.last_message?.content?.toLowerCase().includes(q)
                );
                return nameMatch || listingMatch || messageMatch;
            }

            return true;
        });
    }, [groupedContacts, filterTab, searchQuery]);

    // Active Contact Group
    const activeContactGroup = useMemo(() => {
        if (!selectedUserId) return null;
        return groupedContacts.find((g) => g.userId === selectedUserId) || null;
    }, [groupedContacts, selectedUserId]);

    // ── Load Conversations ───────────────────────────────────────────
    const loadConversations = async (showLoading = false) => {
        if (showLoading) setIsLoadingList(true);
        try {
            const res = await getConversations();
            const list = res.conversations || res.data?.conversations;
            if (res.success && Array.isArray(list)) {
                setConversations(list);
                fetchGlobalUnreadCount();

                // Check URL parameter id on initial load
                const urlParamId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
                if (urlParamId) {
                    const targetConv = list.find((c) => c.id === urlParamId);
                    if (targetConv) {
                        setSelectedUserId(targetConv.other_user?.id);
                        setSelectedConvId(targetConv.id);
                        setMobileStep('chat');
                        return;
                    }
                }

                // If on desktop and nothing selected, default to first contact
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    if (!selectedUserId && list.length > 0) {
                        setSelectedUserId(list[0].other_user?.id);
                    }
                }
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            if (showLoading) setIsLoadingList(false);
        }
    };

    useEffect(() => {
        loadConversations(true);

        const interval = setInterval(() => {
            loadConversations(false);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Handle selecting a contact
    const handleSelectContact = (contactId) => {
        setSelectedUserId(contactId);
        setSelectedConvId(null);
        setMobileStep('listings');
    };

    // Handle selecting a listing conversation
    const handleSelectListingConversation = (convId) => {
        setSelectedConvId(convId);
        setMobileStep('chat');
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'nachrichten');
            url.searchParams.set('id', convId);
            window.history.replaceState(null, '', url.toString());
        }
    };

    // Handle going back to Contacts list
    const handleBackToContacts = () => {
        setSelectedConvId(null);
        setMobileStep('contacts');
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'nachrichten');
            url.searchParams.delete('id');
            window.history.replaceState(null, '', url.toString());
        }
    };

    // Handle going back to Listings list
    const handleBackToListings = () => {
        setSelectedConvId(null);
        setMobileStep('listings');
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'nachrichten');
            url.searchParams.delete('id');
            window.history.replaceState(null, '', url.toString());
        }
    };

    // ── Load Thread Detail ───────────────────────────────────────────
    const loadThread = async (convId, silent = false) => {
        if (!convId) return;
        if (!silent) setIsLoadingThread(true);
        try {
            const res = await getConversationDetail(convId);
            const conv = res.conversation || res.data?.conversation;
            if (res.success && conv) {
                setActiveConversation(conv);
                setMessages(conv.messages || []);

                // Update unread count locally
                setConversations((prev) =>
                    prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
                );
                fetchGlobalUnreadCount();
            }
        } catch (err) {
            console.error('Error loading thread:', err);
        } finally {
            if (!silent) setIsLoadingThread(false);
        }
    };

    useEffect(() => {
        if (selectedConvId) {
            loadThread(selectedConvId);
            const interval = setInterval(() => {
                loadThread(selectedConvId, true);
            }, 5000);
            return () => clearInterval(interval);
        } else {
            setActiveConversation(null);
            setMessages([]);
        }
    }, [selectedConvId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ── Send Message ──────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = newMessageText.trim();
        if (!text || !selectedConvId || isSending) return;

        setIsSending(true);
        try {
            const res = await sendChatMessage(selectedConvId, text);
            const sentMsg = res.message || res.data?.message;
            if (res.success && sentMsg) {
                setMessages((prev) => [...prev, sentMsg]);
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
                toast.error(res.error || res.message || 'Fehler beim Senden der Nachricht.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error(err.response?.data?.error || err.message || 'Fehler beim Senden der Nachricht.');
        } finally {
            setIsSending(false);
        }
    };

    const totalUnreadCount = useMemo(
        () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
        [conversations]
    );

    const sellerInquiriesCount = useMemo(
        () => conversations.filter((c) => !c.is_buyer && c.unread_count > 0).length,
        [conversations]
    );

    const buyerInquiriesCount = useMemo(
        () => conversations.filter((c) => c.is_buyer && c.unread_count > 0).length,
        [conversations]
    );

    const isChatOpen = Boolean(selectedConvId);

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-VIEWS FOR MODULAR RESPONSIVE RENDERING
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Contacts List View
    const renderContactsList = () => (
        <div className="flex flex-col h-full bg-[#fdfcf9]">
            {/* Header & Search */}
            <div className="p-3.5 sm:p-4 border-b border-beige bg-white space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm sm:text-base text-charcoal">
                            Nachrichten & Kontakte
                        </span>
                        <span className="bg-sand text-forest font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                            {groupedContacts.length}
                        </span>
                    </div>
                    <button
                        onClick={() => loadConversations(true)}
                        title="Neu laden"
                        className="p-1.5 rounded-xl hover:bg-sand/40 text-charcoal/50 hover:text-forest transition-colors cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
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
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[11px] font-bold">
                    {[
                        { id: 'ALL', label: 'Alle' },
                        { id: 'UNREAD', label: 'Ungelesen', badge: totalUnreadCount > 0 ? totalUnreadCount : undefined },
                        {
                            id: 'SELLER',
                            label: 'Anfragen für mich',
                            badge: sellerInquiriesCount > 0 ? sellerInquiriesCount : undefined
                        },
                        {
                            id: 'BUYER',
                            label: 'Meine Anfragen',
                            badge: buyerInquiriesCount > 0 ? buyerInquiriesCount : undefined
                        }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterTab(tab.id)}
                            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                                filterTab === tab.id
                                    ? 'bg-forest text-sand shadow-xs font-black'
                                    : 'bg-sand/40 text-charcoal/70 hover:bg-sand'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className="bg-gold text-forest text-[9px] px-1 rounded-full font-mono">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-beige/60">
                {isLoadingList ? (
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
                                : 'Hier siehst du alle Personen, mit denen du über Inserate in Kontakt stehst.'}
                        </p>
                    </div>
                ) : (
                    filteredContacts.map((contactGroup) => {
                        const isSelected = selectedUserId === contactGroup.userId;
                        const hasUnread = contactGroup.totalUnreadCount > 0;
                        const listingsCount = contactGroup.conversations.length;

                        return (
                            <div
                                key={contactGroup.userId}
                                onClick={() => handleSelectContact(contactGroup.userId)}
                                className={`p-3.5 transition-all cursor-pointer relative flex gap-3 items-start ${
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
                                            src={contactGroup.user.avatar}
                                            alt={contactGroup.user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        contactGroup.user?.name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="font-display font-bold text-xs text-charcoal truncate">
                                            {contactGroup.user?.name || 'Benutzer'}
                                        </span>
                                        <span className="text-[10px] text-charcoal/45 shrink-0">
                                            {contactGroup.latestUpdatedAt
                                                ? formatMessageTime(contactGroup.latestUpdatedAt)
                                                : ''}
                                        </span>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sand text-forest uppercase shrink-0">
                                            {contactGroup.user?.type || 'Privat'}
                                        </span>
                                        <span className="text-[10px] font-medium text-forest bg-forest/5 px-1.5 py-0.2 rounded flex items-center gap-1 shrink-0">
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
                                            <span className="bg-gold-dark text-white font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shrink-0">
                                                {contactGroup.totalUnreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // 2. Listings List View for Active Contact
    const renderListingsList = (isSidebarMode = false) => {
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
                        Wähle links eine Person oder Firma aus, um die zugehörigen Inserat-Unterhaltungen anzuzeigen.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-[#fdfcf9]">
                {/* Header with Back Button */}
                <div className="p-3.5 sm:p-4 border-b border-beige bg-white space-y-2">
                    <button
                        onClick={handleBackToContacts}
                        className="flex items-center gap-1.5 text-xs font-bold text-forest hover:text-gold-dark transition-colors cursor-pointer group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Zurück zu Kontakten</span>
                    </button>

                    <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-9 h-9 rounded-full bg-forest text-sand font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            {activeContactGroup.user?.avatar ? (
                                <img
                                    src={activeContactGroup.user.avatar}
                                    alt={activeContactGroup.user.name}
                                    className="w-full h-full object-cover"
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
                                {activeContactGroup.conversations.length === 1 ? 'Inserat im Gespräch' : 'Inserate im Gespräch'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listings Items */}
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2.5 divide-y divide-beige/40">
                    <div className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1">
                        <Layers className="w-3.5 h-3.5 text-forest" />
                        <span>Wähle ein Inserat für den Chat</span>
                    </div>

                    {activeContactGroup.conversations.map((conv) => {
                        const isSelected = selectedConvId === conv.id;
                        const hasUnread = conv.unread_count > 0;
                        const isSellerInquiry = !conv.is_buyer;

                        return (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectListingConversation(conv.id)}
                                className={`pt-2.5 transition-all cursor-pointer rounded-2xl p-3 flex items-start sm:items-center justify-between gap-3 group ${
                                    isSelected
                                        ? 'bg-white border-2 border-forest shadow-xs'
                                        : 'bg-white hover:bg-sand/20 border border-beige'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-forest/5 border border-beige shrink-0 relative">
                                        <img
                                            src={conv.listing?.main_image || '/hero-campuna.webp'}
                                            alt={conv.listing?.title || 'Listing'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                                    isSellerInquiry
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-sand text-forest'
                                                }`}
                                            >
                                                {isSellerInquiry ? 'Kaufanfrage' : 'Meine Anfrage'}
                                            </span>
                                            {conv.listing?.location && (
                                                <span className="text-[10px] text-charcoal/50 flex items-center gap-0.5 truncate">
                                                    <MapPin className="w-3 h-3 text-gold-dark" />
                                                    {conv.listing.location}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-display font-bold text-xs sm:text-sm text-charcoal group-hover:text-forest transition-colors truncate">
                                            {conv.listing?.title}
                                        </h4>

                                        <div className="flex items-baseline gap-2">
                                            <span className="font-display font-extrabold text-xs text-forest font-mono">
                                                {conv.listing?.price
                                                    ? `${conv.listing.price.toLocaleString('de-DE')} €`
                                                    : 'Auf Anfrage'}
                                            </span>
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
                                        <span className="bg-gold-dark text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                    <span className="p-1.5 rounded-xl bg-sand/40 group-hover:bg-forest group-hover:text-sand text-charcoal/60 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 3. Active Chat Thread View
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
                        Wähle ein Inserat aus, um den Chat zu öffnen.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-white">
                {/* Thread Top Bar */}
                <div className="p-3 sm:p-3.5 bg-white border-b border-beige flex items-center justify-between gap-3 shadow-2xs">
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
                                    src={activeConversation.other_user.avatar}
                                    alt={activeConversation.other_user.name}
                                    className="w-full h-full object-cover"
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
                                <span className="text-[9px] font-bold bg-sand text-forest px-1.5 py-0.2 rounded-full shrink-0">
                                    {activeConversation.other_user?.type}
                                </span>
                            </div>
                            <p className="text-[10px] text-charcoal/50 truncate">
                                {activeConversation.is_buyer
                                    ? 'Verkäufer des Inserats'
                                    : 'Interessent für dein Inserat'}
                            </p>
                        </div>
                    </div>

                    {/* Listing Context Pill */}
                    {activeConversation.listing && (
                        <Link
                            href={`/inserate/${activeConversation.listing.slug || activeConversation.listing.id}`}
                            target="_blank"
                            className="bg-[#faf8f3] hover:bg-sand border border-beige rounded-xl p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-2 transition-colors group shrink-0 max-w-[170px] sm:max-w-xs"
                            title="Inserat anzeigen"
                        >
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-forest/5 shrink-0">
                                <img
                                    src={activeConversation.listing.main_image || '/hero-campuna.webp'}
                                    alt={activeConversation.listing.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 hidden sm:block text-left">
                                <span className="block text-[10px] font-bold text-forest truncate">
                                    {activeConversation.listing.title}
                                </span>
                                <span className="font-display font-extrabold text-[11px] text-charcoal">
                                    {activeConversation.listing.price ? `${activeConversation.listing.price.toLocaleString('de-DE')} €` : 'Preis auf Anfrage'}
                                </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-charcoal/40 group-hover:text-forest shrink-0 ml-0.5" />
                        </Link>
                    )}
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-[#fdfcf9]">
                    {isLoadingThread ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-2 text-charcoal/60">
                            <Loader2 className="w-5 h-5 text-forest animate-spin" />
                            <p className="text-xs">Nachrichten werden geladen...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-charcoal/60">
                            <Sparkles className="w-6 h-6 text-forest" />
                            <p className="text-xs font-bold text-charcoal">Noch keine Nachrichten</p>
                            <p className="text-[11px] max-w-xs">
                                Schreibe die erste Nachricht an {activeConversation.other_user?.name} zu {activeConversation.listing?.title}.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.is_mine;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${
                                        isMine ? 'items-end' : 'items-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                                            isMine
                                                ? 'bg-[#004709] text-sand rounded-br-xs'
                                                : 'bg-white border border-beige text-charcoal rounded-bl-xs'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    </div>

                                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-charcoal/45">
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
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Box */}
                <div className="p-3 sm:p-4 bg-white border-t border-beige space-y-2 sticky bottom-0 z-10">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                        {[
                            'Hallo, das Fahrzeug ist noch verfügbar.',
                            'Besichtigung ist gerne möglich.',
                            'Vielen Dank für Ihre Nachricht!'
                        ].map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => setNewMessageText(chip)}
                                className="px-2.5 py-1 rounded-full bg-[#faf8f3] hover:bg-sand border border-beige text-charcoal/70 transition-colors whitespace-nowrap cursor-pointer text-[10px]"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={newMessageText}
                            onChange={(e) => {
                                setNewMessageText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Nachricht eingeben... (Enter zum Senden)"
                            className="flex-1 bg-[#faf8f3] border border-beige rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest resize-none max-h-28 leading-relaxed"
                        />

                        <button
                            type="submit"
                            disabled={isSending || !newMessageText.trim()}
                            className="bg-forest hover:bg-gold text-sand hover:text-forest disabled:opacity-40 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer"
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
        <div className="space-y-4">
            {/* ── Main Chat Shell Container ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-beige overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-130px)] min-h-[580px] max-h-[820px] lg:h-[740px]">
                
                {/* ═════════════════════════════════════════════════════════════
                    PANEL 1 (LEFT ON DESKTOP):
                    - Desktop Mode 1 (No Chat Open): Contacts List
                    - Desktop Mode 2 (Chat Open): Listings of Active Contact
                    - Mobile: Managed smoothly via mobileStep state
                   ═════════════════════════════════════════════════════════════ */}
                <div
                    className={`w-full lg:w-80 xl:w-96 lg:border-r border-beige flex flex-col shrink-0 ${
                        mobileStep === 'contacts'
                            ? 'flex'
                            : !isChatOpen && mobileStep === 'listings'
                            ? 'hidden lg:flex'
                            : isChatOpen
                            ? 'hidden lg:flex'
                            : 'hidden lg:flex'
                    }`}
                >
                    {!isChatOpen ? renderContactsList() : renderListingsList(true)}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    PANEL 2 (RIGHT ON DESKTOP):
                    - Desktop Mode 1 (No Chat Open): Listings of Active Contact
                    - Desktop Mode 2 (Chat Open): Live Chat Thread
                    - Mobile: Shows Listings (if mobileStep === 'listings') or Chat (if mobileStep === 'chat')
                   ═════════════════════════════════════════════════════════════ */}
                <div
                    className={`flex-1 flex flex-col bg-white ${
                        mobileStep === 'contacts'
                            ? 'hidden lg:flex'
                            : mobileStep === 'listings'
                            ? 'flex'
                            : mobileStep === 'chat'
                            ? 'flex'
                            : 'hidden lg:flex'
                    }`}
                >
                    {!isChatOpen ? renderListingsList(false) : renderChatThread()}
                </div>
            </div>
        </div>
    );
}
