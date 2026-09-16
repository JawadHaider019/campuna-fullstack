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
    SendHorizontal
} from 'lucide-react';
import {
    getConversations,
    getConversationDetail,
    sendChatMessage,
    markConversationAsRead
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
    const [selectedId, setSelectedId] = useState(null);
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

    const handleSelectConversation = (convId) => {
        setSelectedId(convId);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'nachrichten');
            url.searchParams.set('id', convId);
            window.history.replaceState(null, '', url.toString());
        }
    };

    // 1. Fetch conversations
    const loadConversations = async (showLoading = false) => {
        if (showLoading) setIsLoadingList(true);
        try {
            const res = await getConversations();
            const list = res.conversations || res.data?.conversations;
            if (res.success && Array.isArray(list)) {
                setConversations(list);
                fetchGlobalUnreadCount();

                // If URL has id parameter or if on desktop and no selection, pick target thread
                const urlParamId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
                if (urlParamId && list.some(c => c.id === urlParamId)) {
                    setSelectedId(urlParamId);
                } else if (!selectedId && list.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    setSelectedId(list[0].id);
                }
            }
        } catch (err) {
            console.error('Error loading conversations in account:', err);
        } finally {
            if (showLoading) setIsLoadingList(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const idParam = new URLSearchParams(window.location.search).get('id');
            if (idParam) {
                setSelectedId(idParam);
            }
        }
    }, []);

    useEffect(() => {
        loadConversations(true);

        const interval = setInterval(() => {
            loadConversations(false);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // 2. Fetch thread messages when selectedId changes
    const loadThread = async (convId, silent = false) => {
        if (!convId) return;
        if (!silent) setIsLoadingThread(true);
        try {
            const res = await getConversationDetail(convId);
            const conv = res.conversation || res.data?.conversation;
            if (res.success && conv) {
                setActiveConversation(conv);
                setMessages(conv.messages || []);

                // Update unread badge in list
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
        if (selectedId) {
            loadThread(selectedId);
            const interval = setInterval(() => {
                loadThread(selectedId, true);
            }, 5000);
            return () => clearInterval(interval);
        } else {
            setActiveConversation(null);
            setMessages([]);
        }
    }, [selectedId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Send message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = newMessageText.trim();
        if (!text || !selectedId || isSending) return;

        setIsSending(true);
        try {
            const res = await sendChatMessage(selectedId, text);
            const sentMsg = res.message || res.data?.message;
            if (res.success && sentMsg) {
                setMessages((prev) => [...prev, sentMsg]);
                setNewMessageText('');

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === selectedId
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

    // Filter conversations
    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            if (filterTab === 'UNREAD' && c.unread_count === 0) return false;
            if (filterTab === 'BUYER' && !c.is_buyer) return false;
            if (filterTab === 'SELLER' && c.is_buyer) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const titleMatch = c.listing?.title?.toLowerCase().includes(query);
                const nameMatch = c.other_user?.name?.toLowerCase().includes(query);
                const lastMsgMatch = c.last_message?.content?.toLowerCase().includes(query);
                return titleMatch || nameMatch || lastMsgMatch;
            }

            return true;
        });
    }, [conversations, filterTab, searchQuery]);

    const sellerInquiriesCount = useMemo(
        () => conversations.filter((c) => !c.is_buyer && c.unread_count > 0).length,
        [conversations]
    );

    const buyerInquiriesCount = useMemo(
        () => conversations.filter((c) => c.is_buyer && c.unread_count > 0).length,
        [conversations]
    );

    return (
        <div className="space-y-4">
            {/* ── Chat Container Box ── */}
            <div className="bg-white rounded-3xl shadow-sm border border-beige overflow-hidden flex flex-col lg:flex-row h-[720px]">
                {/* ════════ LEFT COLUMN: Conversation List ════════ */}
                <div
                    className={`w-full lg:w-80 xl:w-96 border-r border-beige flex flex-col bg-[#fdfcf9] shrink-0 ${
                        selectedId ? 'hidden lg:flex' : 'flex'
                    }`}
                >
                    {/* Header & Search */}
                    <div className="p-4 border-b border-beige bg-white space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-base text-charcoal">
                                    Unterhaltungen
                                </span>
                                <span className="bg-sand text-forest font-bold text-xs px-2 py-0.5 rounded-full font-mono">
                                    {conversations.length}
                                </span>
                            </div>
                            <button
                                onClick={() => loadConversations(true)}
                                title="Neu laden"
                                className="p-1.5 rounded-xl hover:bg-sand/40 text-charcoal/50 hover:text-forest transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nachricht oder Inserat suchen..."
                                className="w-full bg-[#faf8f3] border border-beige rounded-xl pl-8 pr-3 py-1.5 text-xs text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-forest"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 text-[11px] font-bold">
                            {[
                                { id: 'ALL', label: 'Alle' },
                                { id: 'UNREAD', label: 'Ungelesen' },
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

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-beige/60">
                        {isLoadingList ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center space-y-2 text-charcoal/60">
                                <Loader2 className="w-5 h-5 text-forest animate-spin" />
                                <p className="text-xs">Nachrichten werden geladen...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 text-charcoal/60">
                                <div className="w-12 h-12 rounded-2xl bg-sand/40 flex items-center justify-center text-charcoal/40">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-charcoal">Keine Unterhaltungen</p>
                                <p className="text-[11px] leading-relaxed max-w-[200px]">
                                    {searchQuery
                                        ? 'Keine Treffer für deine Suche.'
                                        : 'Hier siehst du alle Nachrichten zu deinen Inseraten und Anfragen an andere Verkäufer.'}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isSelected = selectedId === conv.id;
                                const hasUnread = conv.unread_count > 0;
                                const isSellerInquiry = !conv.is_buyer; // Someone messaged about my listing

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => handleSelectConversation(conv.id)}
                                        className={`p-3.5 transition-all cursor-pointer relative flex gap-3 items-start ${
                                            isSelected
                                                ? 'bg-white border-l-4 border-l-forest shadow-xs'
                                                : hasUnread
                                                ? 'bg-amber-500/5 hover:bg-white'
                                                : 'hover:bg-white'
                                        }`}
                                    >
                                        {/* Listing Thumbnail */}
                                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-forest/5 border border-beige shrink-0 relative">
                                            <img
                                                src={conv.listing?.main_image || '/hero-campuna.webp'}
                                                alt={conv.listing?.title || 'Listing'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <span className="font-display font-bold text-xs text-charcoal truncate">
                                                    {conv.other_user?.name || 'Benutzer'}
                                                </span>
                                                <span className="text-[10px] text-charcoal/45 shrink-0">
                                                    {conv.last_message?.created_at
                                                        ? formatMessageTime(conv.last_message.created_at)
                                                        : formatMessageTime(conv.updated_at)}
                                                </span>
                                            </div>

                                            {/* Role badge + Listing Title */}
                                            <div className="flex items-center gap-1.5 mb-1 truncate">
                                                <span
                                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                                                        isSellerInquiry
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-sand text-forest'
                                                    }`}
                                                >
                                                    {isSellerInquiry ? 'Kaufanfrage' : 'Meine Anfrage'}
                                                </span>
                                                <span className="text-[11px] font-medium text-forest truncate">
                                                    {conv.listing?.title}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`text-[11px] truncate ${
                                                        hasUnread
                                                            ? 'font-bold text-charcoal'
                                                            : 'text-charcoal/60'
                                                    }`}
                                                >
                                                    {conv.last_message ? (
                                                        <span>
                                                            {conv.last_message.is_mine && (
                                                                <span className="text-charcoal/40 font-normal mr-1">
                                                                    Du:
                                                                </span>
                                                            )}
                                                            {conv.last_message.content}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-charcoal/40">
                                                            Unterhaltung gestartet
                                                        </span>
                                                    )}
                                                </p>

                                                {hasUnread && (
                                                    <span className="bg-gold-dark text-white font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shrink-0">
                                                        {conv.unread_count}
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

                {/* ════════ RIGHT COLUMN: Active Chat Thread ════════ */}
                <div
                    className={`flex-1 flex flex-col bg-white ${
                        selectedId ? 'flex' : 'hidden lg:flex'
                    }`}
                >
                    {!selectedId || !activeConversation ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#fdfcf9]">
                            <div className="w-14 h-14 rounded-3xl bg-sand/40 text-forest flex items-center justify-center shadow-inner">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <h3 className="font-display font-bold text-lg text-charcoal">
                                Keine Unterhaltung ausgewählt
                            </h3>
                            <p className="text-xs text-charcoal/60 max-w-sm leading-relaxed">
                                Wähle eine Unterhaltung links aus, um Details einzusehen, Käufern zu antworten oder neue Fragen zu stellen.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Top Bar */}
                            <div className="p-3.5 sm:p-4 bg-white border-b border-beige flex items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="lg:hidden p-1.5 rounded-full hover:bg-sand/40 text-charcoal/70 cursor-pointer shrink-0"
                                        title="Zurück zur Liste"
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
                                            <h3 className="font-display font-bold text-sm text-charcoal truncate">
                                                {activeConversation.other_user?.name}
                                            </h3>
                                            <span className="text-[10px] font-bold bg-sand text-forest px-2 py-0.2 rounded-full">
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
                                        className="bg-[#faf8f3] hover:bg-sand border border-beige rounded-xl p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-2 transition-colors group shrink-0 max-w-[200px] sm:max-w-xs"
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
                                                {activeConversation.listing.price.toLocaleString('de-DE')} €
                                            </span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-charcoal/40 group-hover:text-forest shrink-0 ml-0.5" />
                                    </Link>
                                )}
                            </div>

                            {/* Message Stream */}
                            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-[#fdfcf9]">
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
                                            Schreibe die erste Nachricht an {activeConversation.other_user?.name}.
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
                            <div className="p-3 sm:p-4 bg-white border-t border-beige space-y-2">
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
