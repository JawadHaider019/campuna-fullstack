'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Link as LinkIcon,
    X,
    Eye,
    EyeOff,
    Send,
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Table,
    Calendar,
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    Star,
    Save,
    Search,
    Globe,
    RefreshCw,
    Layers,
    Clock,
    BookOpen
} from 'lucide-react';
import {
    getAdminPosts,
    createPost,
    updatePost,
    deletePost,
    uploadPostImage
} from '@/api/posts';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import { getImageUrl } from '@/utils/imageUrl';


// ─── NOTIFICATION ALERT COMPONENT (STABLE DOM) ───
const ToastAlert = ({ type = 'success', message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgStyles = {
        success: 'bg-[#002D05] text-white border-gold/40',
        error: 'bg-rose-950 text-white border-rose-600',
        warning: 'bg-amber-950 text-amber-200 border-amber-600',
        info: 'bg-slate-900 text-sand border-white/20'
    };

    return (
        <div
            className={`flex items-center p-4 rounded-2xl border shadow-2xl max-w-md transition-all duration-300 pointer-events-auto ${bgStyles[type] || bgStyles.info}`}
        >
            <span className="shrink-0 mr-3">
                {type === 'success' && <CheckCircle2 className="text-gold w-5 h-5" />}
                {type === 'error' && <AlertCircle className="text-rose-400 w-5 h-5" />}
            </span>
            <span className="text-xs sm:text-sm font-medium flex-1">{message}</span>
            <button onClick={onClose} className="ml-3 hover:opacity-75 text-sand cursor-pointer shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};


// ─── SEO CHECKLIST HELPER ───
const SEOChecklist = ({ post }) => {
    const tips = [];

    if (!post?.title || !post.title.trim()) {
        tips.push({ type: 'error', msg: 'Titel fehlt noch' });
    } else if (post.title.length < 25) {
        tips.push({ type: 'warning', msg: 'Titel ist etwas kurz (< 25 Zeichen)' });
    } else if (post.title.length > 70) {
        tips.push({ type: 'warning', msg: 'Titel ist sehr lang (> 70 Zeichen)' });
    } else {
        tips.push({ type: 'success', msg: 'Optimale Titellänge' });
    }

    if (!post?.content || !post.content.trim()) {
        tips.push({ type: 'error', msg: 'Artikelinhalt ist leer' });
    } else if (post.content.length < 250) {
        tips.push({ type: 'warning', msg: 'Textlänge noch kurz (< 250 Zeichen)' });
    } else {
        tips.push({ type: 'success', msg: 'Umfangreicher Artikelinhalt' });
    }

    if (!post?.tags || post.tags.length === 0) {
        tips.push({ type: 'warning', msg: 'Schlagwörter (Tags) für SEO hinzufügen' });
    } else {
        tips.push({ type: 'success', msg: `${post.tags.length} Tags hinterlegt` });
    }

    if (!post?.image_url) {
        tips.push({ type: 'warning', msg: 'Kein Titelbild vorhanden' });
    } else {
        tips.push({ type: 'success', msg: 'Titelbild vorhanden' });
    }

    return (
        <div className="bg-sand/30 rounded-2xl p-4 border border-forest/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-gold" />
                <span>SEO- & Qualitätsprüfung</span>
            </div>
            <div className="space-y-1.5 pt-1">
                {tips.map((tip, i) => (
                    <div
                        key={`seo-tip-${i}-${tip.msg}`}
                        className={`text-xs flex items-center gap-2 ${
                            tip.type === 'error'
                                ? 'text-rose-600 font-semibold'
                                : tip.type === 'warning'
                                ? 'text-amber-700 font-medium'
                                : 'text-emerald-700 font-medium'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                        <span>{tip.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── INSERT LINK MODAL ───
const LinkModal = ({ isOpen, onClose, onInsert }) => {
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    if (!isOpen) return null;

    const handleInsert = (e) => {
        e.preventDefault();
        if (!linkUrl.trim()) return;
        onInsert(linkText.trim() || linkUrl.trim(), linkUrl.trim());
        setLinkText('');
        setLinkUrl('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-forest/10">
                <div className="flex items-center justify-between pb-3 border-b border-forest/10 mb-4">
                    <h4 className="font-display font-bold text-forest text-base flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gold" />
                        <span>Link einfügen</span>
                    </h4>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleInsert} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                            Link-Text (Angezeigter Text)
                        </label>
                        <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="z.B. Hier klicken oder Ratgeber lesen"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                            Ziel-URL
                        </label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://campuna.de/... oder /all_blogs"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={!linkUrl.trim()}
                            className="flex-1 py-2.5 bg-forest text-sand rounded-xl text-xs font-bold hover:bg-forest/90 disabled:opacity-50 cursor-pointer"
                        >
                            Einfügen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ─── MAIN ADMIN BLOG PAGE ───
export default function AdminBlogPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'editor'
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toast, setToast] = useState(null);

    // Editor Form State
    const [editingPostId, setEditingPostId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        tags: ['Ratgeber', 'Camping'],
        image_url: '',
        author_name: 'Campuna Redaktion',
        author_avatar: '/logo.webp',
        read_time: '5 Min.',
        featured: false,
        status: 'published'
    });

    const [currentTagInput, setCurrentTagInput] = useState('');
    const [showPreview, setShowPreview] = useState(true);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, post: null });

    const textareaRef = useRef(null);
    const coverFileInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch posts on mount & when filter changes
    const loadPosts = async () => {
        try {
            setIsLoading(true);
            const res = await getAdminPosts({
                search: searchTerm,
                status: filterStatus
            });
            if (res.data?.success) {
                setPosts(res.data.posts || []);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Error loading posts:', err);
            setToast({ type: 'error', message: 'Fehler beim Laden der Beiträge' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            loadPosts();
        }
    }, [mounted, searchTerm, filterStatus]);

    // Handle Editing a Post
    const handleEditClick = (post) => {
        setEditingPostId(post.id);
        setFormData({
            title: post.title || '',
            slug: post.slug || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            tags: Array.isArray(post.tags) ? post.tags : [],
            image_url: post.image_url || '',
            author_name: post.author_name || 'Campuna Redaktion',
            author_avatar: post.author_avatar || '/logo.webp',
            read_time: post.read_time || '5 Min.',
            featured: Boolean(post.featured),
            status: post.status || 'published'
        });
        setActiveTab('editor');
    };

    // Reset Form for New Post
    const handleNewPostClick = () => {
        setEditingPostId(null);
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            tags: ['Ratgeber', 'Camping'],
            image_url: '',
            author_name: 'Campuna Redaktion',
            author_avatar: '/logo.webp',
            read_time: '5 Min.',
            featured: false,
            status: 'published'
        });
        setActiveTab('editor');
    };

    // Rich Markdown Formatting Toolbar Helpers
    const applyFormatting = (action) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        const content = textarea.value;

        let newContent = '';
        let newCursor = start;

        switch (action) {
            case 'bold':
                newContent = content.substring(0, start) + `**${selected || 'Fettgedruckter Text'}**` + content.substring(end);
                newCursor = end + 4;
                break;
            case 'italic':
                newContent = content.substring(0, start) + `*${selected || 'Kursiver Text'}*` + content.substring(end);
                newCursor = end + 2;
                break;
            case 'h1':
                newContent = content.substring(0, start) + `\n# ${selected || 'Hauptüberschrift'}\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 4 : 20);
                break;
            case 'h2':
                newContent = content.substring(0, start) + `\n## ${selected || 'Abschnittsüberschrift'}\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 5 : 24);
                break;
            case 'h3':
                newContent = content.substring(0, start) + `\n### ${selected || 'Unterüberschrift'}\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 6 : 22);
                break;
            case 'ul':
                newContent = content.substring(0, start) + `\n- ${selected || 'Listenpunkt 1'}\n- Listenpunkt 2\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 4 : 30);
                break;
            case 'ol':
                newContent = content.substring(0, start) + `\n1. ${selected || 'Erster Schritt'}\n2. Zweiter Schritt\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 5 : 32);
                break;
            case 'quote':
                newContent = content.substring(0, start) + `\n> ${selected || 'Wichtiger Hinweis oder Zitat...'}\n` + content.substring(end);
                newCursor = start + (selected ? selected.length + 4 : 36);
                break;
            case 'table':
                const tableTpl = `\n| Spalte 1 | Spalte 2 | Spalte 3 |\n| --- | --- | --- |\n| Wert 1 | Wert 2 | Wert 3 |\n`;
                newContent = content.substring(0, start) + tableTpl + content.substring(end);
                newCursor = start + tableTpl.length;
                break;
            default:
                return;
        }

        setFormData(prev => ({ ...prev, content: newContent }));

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
    };

    // Insert Link at Cursor
    const handleInsertLink = (text, url) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const linkMd = `[${text}](${url})`;
        const newContent = formData.content.substring(0, start) + linkMd + formData.content.substring(end);
        setFormData(prev => ({ ...prev, content: newContent }));
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + linkMd.length, start + linkMd.length);
        }, 0);
    };

    // Direct Cover Image Upload Handler
    const handleCoverImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setIsUploading(true);
            const res = await uploadPostImage(uploadData);
            if (res.data?.success && res.data.imageUrl) {
                const imgUrl = res.data.imageUrl;
                setFormData(prev => ({
                    ...prev,
                    image_url: imgUrl
                }));
                setToast({ type: 'success', message: 'Titelbild erfolgreich gesetzt!' });
            }
        } catch (err) {
            console.error('Error uploading cover image:', err);
            setToast({ type: 'error', message: 'Fehler beim Hochladen des Titelbilds' });
        } finally {
            setIsUploading(false);
            if (coverFileInputRef.current) coverFileInputRef.current.value = '';
        }
    };

    // Tag Management
    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = currentTagInput.trim().replace(/^#/, '');
            if (tag && !formData.tags.includes(tag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                setCurrentTagInput('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    };

    // Save/Publish Post
    const handleSubmit = async (targetStatus = 'published') => {
        if (!formData.title.trim()) {
            setToast({ type: 'error', message: 'Bitte gib einen Titel für den Beitrag ein.' });
            return;
        }

        if (!formData.content.trim()) {
            setToast({ type: 'error', message: 'Der Beitragsinhalt darf nicht leer sein.' });
            return;
        }

        const payload = {
            ...formData,
            status: targetStatus
        };

        try {
            setIsSaving(true);
            let res;
            if (editingPostId) {
                res = await updatePost(editingPostId, payload);
            } else {
                res = await createPost(payload);
            }

            if (res.data?.success) {
                setToast({
                    type: 'success',
                    message: targetStatus === 'draft' ? 'Entwurf erfolgreich gespeichert!' : 'Beitrag erfolgreich veröffentlicht!'
                });
                await loadPosts();
                setActiveTab('manage');
                setEditingPostId(null);
            }
        } catch (err) {
            console.error('Error saving post:', err);
            setToast({ type: 'error', message: 'Fehler beim Speichern: ' + (err.response?.data?.message || err.message) });
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Post Execution
    const executeDelete = async () => {
        if (!deleteConfirm.post) return;
        try {
            const res = await deletePost(deleteConfirm.post.id);
            if (res.data?.success) {
                setToast({ type: 'success', message: 'Beitrag erfolgreich gelöscht.' });
                setPosts(prev => prev.filter(p => p.id !== deleteConfirm.post.id));
                setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            setToast({ type: 'error', message: 'Fehler beim Löschen des Beitrags' });
        } finally {
            setDeleteConfirm({ isOpen: false, post: null });
        }
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-10">
            {/* Fixed Toast Container */}
            <div className="fixed top-5 right-5 z-50 pointer-events-none">
                {toast && (
                    <ToastAlert
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>

            {/* Top Page Header (Consistent UI) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand/50 via-white to-sand/30 p-5 rounded-3xl border border-[#E8EAEF] shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black font-sans text-slate-900 tracking-tight">
                            Blog- & Ratgeber-Verwaltung
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Verfasse, bearbeite und verwalte Experten-Ratgeber für die Camping-Community.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'manage' ? (
                        <button
                            onClick={handleNewPostClick}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold uppercase tracking-wider hover:bg-forest/90 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-gold shrink-0" />
                            <span>Neuen Artikel erstellen</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setActiveTab('manage')}
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-forest/20 text-forest text-xs font-bold hover:bg-forest/5 transition-all cursor-pointer"
                        >
                            <Layers className="w-4 h-4 shrink-0" />
                            <span>Zurück zur Übersicht</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TAB RENDERING */}
            {activeTab === 'manage' ? (
                /* TAB 1: MANAGE POSTS LIST */
                <div key="tab-manage" className="space-y-6">
                    {/* Stats Cards (Consistent 3-Card Bento) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div
                            onClick={() => { setFilterStatus('all'); }}
                            className="bg-gradient-to-br from-forest via-[#003807] to-[#040805] text-white rounded-3xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[145px] border border-forest/30 cursor-pointer group transition-transform hover:-translate-y-0.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
                                    Gesamtbeiträge
                                </span>
                                <div className="w-6 h-6 rounded-full bg-white/10 text-gold flex items-center justify-center font-bold text-xs group-hover:bg-gold group-hover:text-forest transition-colors shrink-0">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                                    {stats.total || 0}
                                </div>
                                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 text-[10px] text-sand/80">
                                    <span className="text-gold font-bold">{`${stats.published || 0} Veröffentlicht`}</span>
                                    <span>{`${stats.draft || 0} Entwürfe`}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => { setFilterStatus('published'); }}
                            className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Veröffentlicht
                                </span>
                                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                                    {stats.published || 0}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-1">
                                    <span>Live im Magazin sichtbar</span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => { setFilterStatus('draft'); }}
                            className="bg-white border border-[#E8EAEF] rounded-3xl p-5 shadow-2xs flex flex-col justify-between min-h-[145px] cursor-pointer group transition-transform hover:-translate-y-0.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Entwürfe (Drafts)
                                </span>
                                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Save className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                                    {stats.draft || 0}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold mt-1">
                                    <span>In Bearbeitung</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white rounded-2xl p-3 border border-forest/10 shadow-sm">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Artikel suchen (Titel, Inhalt)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-forest focus:outline-none focus:ring-2 focus:ring-gold"
                            >
                                <option value="all">Alle Status</option>
                                <option value="published">Veröffentlicht</option>
                                <option value="draft">Nur Entwürfe</option>
                            </select>

                            <button
                                onClick={loadPosts}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Aktualisieren"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {isLoading ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-forest/10">
                            <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                            <p className="text-xs font-bold text-forest uppercase tracking-widest">Artikel werden geladen...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-forest/20 p-6 space-y-3">
                            <BookOpen className="w-12 h-12 text-forest/20 mx-auto" />
                            <h3 className="font-display font-bold text-forest text-lg">Keine Ratgeber-Artikel gefunden</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Erstelle deinen ersten Artikel mit unserem Rich-Text Markdown Editor.
                            </p>
                            <button
                                onClick={handleNewPostClick}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-gold" />
                                <span>Jetzt Artikel erstellen</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {posts.map((post) => (
                                <div
                                    key={`post-card-${post.id}`}
                                    className="bg-white rounded-3xl border border-forest/10 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden shrink-0">
                                        <img
                                            src={getImageUrl(post.image_url)}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/collection/camping-zubehoer-hero.png';
                                            }}
                                        />

                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            {post.status === 'draft' && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-900 shadow-md">
                                                    Entwurf
                                                </span>
                                            )}
                                        </div>

                                        {post.featured && (
                                            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-gold text-forest shadow-md">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gold" />
                                                    <span>{new Date(post.created_at).toLocaleDateString('de-DE')}</span>
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{post.read_time || '5 Min.'}</span>
                                                </span>
                                            </div>

                                            <h3 className="font-display font-bold text-forest text-base line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                                                {post.title}
                                            </h3>

                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {post.excerpt || post.content?.substring(0, 100)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                                            <a
                                                href={`/post/${post.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-forest hover:text-gold transition-colors"
                                                title="Auf Website ansehen"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Ansehen</span>
                                            </a>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleEditClick(post)}
                                                    className="p-2 rounded-xl bg-forest/5 hover:bg-forest text-forest hover:text-sand transition-colors cursor-pointer"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, post })}
                                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-colors cursor-pointer"
                                                    title="Löschen"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* TAB 2: RICH BLOG EDITOR */
                <div key="tab-editor" className="space-y-6">
                    {/* Top Status Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-forest/10 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-xs font-bold text-forest">
                                {editingPostId ? 'Artikel bearbeiten' : 'Neuen Artikel verfassen'}
                            </span>
                            {formData.status === 'draft' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Entwurfsmodus
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                    showPreview ? 'bg-gold/15 text-forest border-gold/40' : 'bg-white text-slate-600 border-slate-200'
                                }`}
                            >
                                <span className="shrink-0">
                                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </span>
                                <span>{showPreview ? 'Live-Vorschau ausblenden' : 'Live-Vorschau anzeigen'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSubmit('draft')}
                                disabled={isSaving || isUploading}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5 shrink-0" />
                                <span>{isSaving ? 'Speichert...' : 'Als Entwurf sichern'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSubmit('published')}
                                disabled={isSaving || isUploading}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-forest text-sand hover:bg-forest/90 disabled:opacity-50 shadow-md cursor-pointer"
                            >
                                <span className="shrink-0">
                                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-gold" />}
                                </span>
                                <span>{editingPostId ? 'Änderungen publizieren' : 'Veröffentlichen'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Main Form Column */}
                        <div className={showPreview ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
                            {/* Metadata Card */}
                            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                                        Artikeltitel *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="z.B. Die 10 besten Campingplätze für Familien in Bayern"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-base font-bold text-forest placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                                        URL-Slug (Benutzerdefiniert oder automatisch)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="automatisch aus Titel generiert"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                                        Kurzzusammenfassung (Excerpt / Meta-Beschreibung)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Kurze 1-2 Sätze für Google und die Übersichtskarte..."
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                                    />
                                </div>

                                {/* Tags & Options */}
                                <div className="space-y-2 pt-2 border-t border-forest/10">
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider">
                                        Schlagwörter (Tags)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {formData.tags.map((tag, idx) => (
                                            <span
                                                key={`tag-badge-${tag}-${idx}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-forest/5 text-forest border border-forest/15"
                                            >
                                                <span>{`#${tag}`}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder="+ Tag eingeben & Enter drücken"
                                            value={currentTagInput}
                                            onChange={(e) => setCurrentTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            className="px-3 py-1 rounded-full border border-dashed border-slate-300 text-xs font-medium focus:outline-none focus:border-gold w-48"
                                        />
                                    </div>
                                </div>

                                {/* Featured Checkbox & Read Time */}
                                <div className="flex items-center justify-between pt-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-forest cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="w-4 h-4 rounded text-gold focus:ring-gold border-slate-300"
                                        />
                                        <Star className={`w-4 h-4 ${formData.featured ? 'text-gold fill-current' : 'text-slate-400'}`} />
                                        <span>Als Hauptartikel auf Startseite hervorheben (Featured)</span>
                                    </label>

                                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                                        <Clock className="w-3.5 h-3.5 text-gold" />
                                        <span>{`Lesezeit: ${formData.read_time || '5 Min.'}`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Image Uploader (ONLY image option) */}
                            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider">
                                        Titelbild (Cover Image)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={coverFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverImageUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => coverFileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest/5 text-forest text-xs font-bold hover:bg-forest hover:text-sand transition-colors cursor-pointer"
                                        >
                                            <UploadCloud className="w-3.5 h-3.5 text-gold shrink-0" />
                                            <span>{isUploading ? 'Wird hochgeladen...' : 'Datei hochladen'}</span>
                                        </button>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Bild-URL eingeben oder Datei hochladen..."
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold"
                                />

                                {formData.image_url && (
                                    <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-forest/10 bg-slate-50">
                                        <img
                                            src={getImageUrl(formData.image_url)}
                                            alt="Cover Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/collection/camping-zubehoer-hero.png';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image_url: '' })}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                                            title="Titelbild entfernen"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* RICH MARKDOWN TEXT EDITOR */}
                            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-forest uppercase tracking-wider">
                                        Artikelinhalt (Markdown & Rich Text Editor)
                                    </label>
                                    <span className="text-[11px] font-mono text-slate-400">
                                        {`${formData.content.length} Zeichen | ~${Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(Boolean).length / 180))} Min. Lesezeit`}
                                    </span>
                                </div>

                                {/* Rich Toolbar */}
                                <div className="flex flex-wrap items-center gap-1 p-2 bg-sand/30 rounded-2xl border border-forest/10">
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('bold')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Fett (Bold)"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('italic')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Kursiv (Italic)"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-forest/10 mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('h1')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Hauptüberschrift (H1)"
                                    >
                                        <Heading1 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('h2')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Abschnittsüberschrift (H2)"
                                    >
                                        <Heading2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('h3')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Unterüberschrift (H3)"
                                    >
                                        <Heading3 className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-forest/10 mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('ul')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Aufzählung (Bullet List)"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('ol')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Nummerierte Liste"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('quote')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Zitat / Hervorhebung"
                                    >
                                        <Quote className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('table')}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Tabelle einfügen"
                                    >
                                        <Table className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-forest/10 mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => setIsLinkModalOpen(true)}
                                        className="p-2 rounded-xl hover:bg-white text-forest transition-colors cursor-pointer"
                                        title="Link einfügen"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Large Markdown Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    rows={18}
                                    placeholder="Schreibe deinen Artikel in Markdown... Nutze die Toolbar oben für Überschriften, Formatierungen, Zitate und Tabellen."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold"
                                />
                            </div>
                        </div>

                        {/* Right Column: SEO Assistant & Live Preview */}
                        {showPreview && (
                            <div className="lg:col-span-5 space-y-6 sticky top-4">
                                <SEOChecklist post={formData} />

                                {/* Live Preview Box */}
                                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-forest/10 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                                    <div className="flex items-center justify-between pb-3 border-b border-forest/10">
                                        <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5 text-gold" />
                                            <span>Live-Vorschau</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                            Echtzeit
                                        </span>
                                    </div>

                                    {/* Simulated Article Header */}
                                    <div className="space-y-3">
                                        {formData.image_url && (
                                            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-forest/10 shadow-sm bg-slate-50">
                                                <img
                                                    src={getImageUrl(formData.image_url)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/collection/camping-zubehoer-hero.png';
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-mono text-slate-400">
                                                {formData.read_time}
                                            </span>
                                        </div>

                                        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-forest leading-tight">
                                            {formData.title || 'Artikeltitel erscheint hier...'}
                                        </h1>

                                        {formData.excerpt && (
                                            <p className="text-xs text-slate-600 italic border-l-2 border-gold pl-2">
                                                {formData.excerpt}
                                            </p>
                                        )}
                                    </div>

                                    <hr className="border-forest/10 my-4" />

                                    {/* Rendered Content */}
                                    <div className="prose prose-sm max-w-none">
                                        <MarkdownRenderer content={formData.content || '_Der Artikeltext wird hier formatiert gerendert..._'} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <LinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onInsert={handleInsertLink}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-forest/10 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h4 className="font-display font-bold text-forest text-base">Artikel unwiderruflich löschen?</h4>
                            <p className="text-xs text-slate-500">
                                {`Möchtest du den Beitrag "${deleteConfirm.post?.title || ''}" wirklich löschen?`}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm({ isOpen: false, post: null })}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md cursor-pointer"
                            >
                                Ja, löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
