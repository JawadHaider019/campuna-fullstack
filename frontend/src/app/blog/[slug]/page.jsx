'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Copy,
    Check,
    BookOpen,
    ArrowRight,
    Share2,
    MessageCircle,
    Mail,
    X
} from 'lucide-react';
import { getPublicPost } from '@/api/posts';
import { BLOG_POSTS as FALLBACK_POSTS } from '@/data';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import { getImageUrl } from '@/utils/imageUrl';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';
import { toast } from 'react-hot-toast';

// ─── XSS-Safe JSON-LD Serializer ─────────────────────────────────────────────
function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

// ─── Date Formatter Helper ───────────────────────────────────────────────────
function formatPostDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
        return String(dateStr);
    }
}

// ─── Related Post Memoized Card (Identical to Blog Directory Card) ────────────
const RelatedPostCard = memo(function RelatedPostCard({ post, index }) {
    const postSlug = post.slug || post.id;
    const postImage = getImageUrl(post.image_url || post.image);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: (index % 3) * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Link
                href={`/blog/${encodeURIComponent(postSlug)}`}
                className="group bg-white rounded-3xl border border-forest/10 hover:border-forest/25 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full will-change-transform select-none"
            >
                {/* Cover Image */}
                <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden shrink-0">
                    <img
                        src={postImage}
                        alt={post.title || 'Ratgeber'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/collection/camping-zubehoer-hero.png';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {post.category && (
                        <div className="absolute top-3.5 left-3.5">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-forest shadow-xs border border-forest/10">
                                {post.category}
                            </span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                                {formatPostDate(post.created_at || post.date)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {post.read_time || post.readTime || '5 Min.'}
                            </span>
                        </div>

                        <h3 className="font-display font-bold text-forest text-lg sm:text-xl line-clamp-2 leading-snug group-hover:text-gold transition-colors duration-200">
                            {post.title}
                        </h3>

                        {post.excerpt && (
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-light">
                                {post.excerpt}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-forest/75 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                            {post.author_name || 'Campuna Club'}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-forest group-hover:text-gold transition-colors">
                            <span>Artikel lesen</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

// ─── Main Blog Detail Page Component ─────────────────────────────────────────
export default function SinglePostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug;

    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Fetch Post Data
    useEffect(() => {
        if (!slug) return;
        let isMounted = true;

        const loadPost = async () => {
            try {
                setIsLoading(true);
                const res = await getPublicPost(slug);

                if (!isMounted) return;

                if (res.data?.success && res.data.post) {
                    setPost(res.data.post);
                    setRelatedPosts(res.data.relatedPosts || []);
                } else {
                    // Fallback to static data
                    const found = FALLBACK_POSTS.find(p => p.slug === slug || p.id === slug);
                    if (found) {
                        setPost({
                            id: found.id,
                            title: found.title,
                            slug: found.slug,
                            excerpt: found.excerpt,
                            image_url: found.image,
                            read_time: found.readTime,
                            created_at: found.date,
                            author_name: found.author?.name || 'Campuna Club',
                            author_avatar: found.author?.avatar || '/logo.webp',
                            content: `# ${found.title}\n\n${found.excerpt}\n\n---\n\n## Camping-Wissen auf den Punkt gebracht\n\nErfahre alles Wissenswerte rund um dieses Thema. Auf Campuna findest du aktuelle Tipps, Tricks und Kaufempfehlungen für Wohnmobile, Wohnwagen und Campingzubehör.\n\n- Detaillierte Checklisten\n- Tipps von erfahrenen Campern\n- Sicherheit und Gewichtsempfehlungen\n\nNutze auch unsere weiteren Ratgeber und Tools wie den [Zuladungsrechner](/zuladungsrechner) oder stöbere in den [neuesten Inseraten](/inserate).`
                        });
                        setRelatedPosts(FALLBACK_POSTS.filter(p => p.slug !== slug).slice(0, 3).map(p => ({
                            id: p.id,
                            title: p.title,
                            slug: p.slug,
                            excerpt: p.excerpt,
                            image_url: p.image,
                            read_time: p.readTime,
                            created_at: p.date
                        })));
                    } else {
                        setPost(null);
                    }
                }
            } catch (err) {
                console.error('Error fetching post:', err);
                if (!isMounted) return;
                const found = FALLBACK_POSTS.find(p => p.slug === slug || p.id === slug);
                if (found) {
                    setPost({
                        id: found.id,
                        title: found.title,
                        slug: found.slug,
                        excerpt: found.excerpt,
                        image_url: found.image,
                        read_time: found.readTime,
                        created_at: found.date,
                        author_name: found.author?.name || 'Campuna Club',
                        author_avatar: found.author?.avatar || '/logo.webp',
                        content: `# ${found.title}\n\n${found.excerpt}\n\n---\n\n## Camping-Wissen auf den Punkt gebracht\n\nErfahre alles Wissenswerte rund um dieses Thema. Auf Campuna findest du aktuelle Tipps, Tricks und Kaufempfehlungen für Wohnmobile, Wohnwagen und Campingzubehör.`
                    });
                } else {
                    setPost(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadPost();

        return () => {
            isMounted = false;
        };
    }, [slug]);

    // Clean Share URL
    const getShareUrl = useCallback(() => {
        if (typeof window === 'undefined') return '';
        return window.location.href;
    }, []);

    // Share Handler (Web Share API with fallback to Share Modal)
    const handleOpenShare = useCallback(async () => {
        const shareUrl = getShareUrl();
        const shareTitle = post?.title || 'Ratgeber auf Campuna';
        const shareText = `Lies diesen interessanten Ratgeber auf Campuna: ${shareTitle}`;

        if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        setIsShareModalOpen(true);
    }, [getShareUrl, post?.title]);

    // Copy to Clipboard Handler
    const handleCopyLink = useCallback(() => {
        const url = getShareUrl();
        if (typeof window !== 'undefined' && navigator?.clipboard) {
            navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link in die Zwischenablage kopiert!', { icon: '🔗' });
            setTimeout(() => setCopied(false), 2500);
        }
    }, [getShareUrl]);

    // WhatsApp Share Handler
    const handleShareWhatsApp = useCallback(() => {
        const url = getShareUrl();
        const text = encodeURIComponent(`Lies diesen Ratgeber auf Campuna:\n${post?.title || 'Campuna Blog'}\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
    }, [getShareUrl, post?.title]);

    // Email Share Handler
    const handleShareEmail = useCallback(() => {
        const url = getShareUrl();
        const subject = encodeURIComponent(`Ratgeber: ${post?.title || 'Campuna Blog'}`);
        const body = encodeURIComponent(`Hallo,\n\nich habe diesen spannenden Ratgeber auf Campuna entdeckt:\n\n${post?.title || ''}\n\nLink zum Artikel:\n${url}\n\nBeste Grüße`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }, [getShareUrl, post?.title]);

    // Schema.org Structured Data (AEO/SEO Optimized)
    const structuredData = useMemo(() => {
        if (!post) return null;
        return {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt || post.title,
            image: post.image_url ? [getImageUrl(post.image_url)] : ['https://campuna.de/logo.webp'],
            datePublished: post.created_at || new Date().toISOString(),
            dateModified: post.updated_at || post.created_at || new Date().toISOString(),
            author: {
                '@type': 'Organization',
                name: post.author_name || 'Campuna Club',
                url: 'https://campuna.de'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Campuna',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://campuna.de/logo.webp'
                }
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `https://campuna.de/blog/${post.slug || slug}`
            }
        };
    }, [post, slug]);

    if (isLoading) {
        return <CircleLoader size="lg" color="forest" fullPage />;
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-sand/20 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="bg-white rounded-3xl p-8 max-w-md shadow-xl border border-forest/10 space-y-4">
                    <BookOpen className="w-12 h-12 text-forest/30 mx-auto" />
                    <h2 className="font-display font-extrabold text-forest text-2xl">Artikel nicht gefunden</h2>
                    <p className="text-xs text-slate-500">
                        Der gesuchte Ratgeber-Beitrag existiert leider nicht oder wurde entfernt.
                    </p>
                    <button
                        onClick={() => router.push('/blog')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zum Ratgeber
                    </button>
                </div>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-sand/15 font-sans pb-24 overflow-x-hidden">
            {/* Schema.org JSON-LD Structured Data */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
                />
            )}

            {/* HEADER BANNER */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-4 space-y-6"
            >
                {/* Breadcrumbs at Top with Share Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                    <Breadcrumbs
                        items={[
                            { label: 'Blog', href: '/blog' },
                            { label: post.title }
                        ]}
                        variant="light"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleOpenShare}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-forest/10 bg-white hover:bg-sand text-forest text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 hover:shadow-sm"
                            title="Artikel teilen"
                        >
                            <Share2 className="w-3.5 h-3.5 text-gold" />
                            <span>Teilen</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-forest tracking-tight leading-[1.18]">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-mono text-slate-500 pt-3 border-t border-forest/10">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="w-4 h-4 text-gold shrink-0" />
                            <span>{formatPostDate(post.created_at || post.date)}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{post.read_time || '5 Min.'} Lesezeit</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <User className="w-4 h-4 text-forest shrink-0" />
                            <span className="font-bold text-forest">{post.author_name || 'Campuna Club'}</span>
                        </div>
                    </div>
                </div>

                {/* COVER IMAGE */}
                {post.image_url && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                        className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-forest/10 bg-slate-100 group"
                    >
                        <img
                            src={getImageUrl(post.image_url)}
                            alt={post.title}
                            fetchPriority="high"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out will-change-transform"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/collection/camping-zubehoer-hero.png';
                            }}
                        />
                    </motion.div>
                )}

                {/* TAGS BELOW IMAGE */}
                {post.tags && post.tags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="flex items-center gap-2 flex-wrap pt-1"
                    >
                        {post.tags.map((t) => (
                            <span
                                key={t}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-forest border border-forest/10 shadow-2xs hover:bg-forest/5 transition-colors"
                            >
                                #{t}
                            </span>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            {/* MAIN ARTICLE BODY */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
                <div className="space-y-8">
                    {/* Excerpt Lead */}
                    {post.excerpt && (
                        <div className="p-4 sm:p-6 rounded-2xl bg-sand/30 border-l-4 border-gold text-forest/90 text-base sm:text-lg font-medium leading-relaxed italic shadow-2xs">
                            {post.excerpt}
                        </div>
                    )}

                    {/* Markdown Rendered Content */}
                    <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base">
                        <MarkdownRenderer content={post.content} />
                    </div>

                    {/* AUTHOR BIO BOX */}
                    <div className="pt-8 border-t border-forest/10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-forest/10 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-forest text-gold font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
                                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-display font-bold text-forest text-base sm:text-lg">
                                    {post.author_name || 'Campuna Club'}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                                    Unser Team aus erfahrenen Campern, Fahrzeugexperten und Outdoor-Begeisterten recherchiert unabhängige Tipps, Checklisten und Praxiswissen für die deutsche Camping-Community.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SHARE & COPY LINK BAR */}
                    <div className="pt-6 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-xs font-bold text-forest uppercase tracking-wider">
                            Diesen Ratgeber teilen:
                        </span>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleOpenShare}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest hover:bg-gold text-white hover:text-forest font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer active:scale-98"
                                title="Artikel teilen & Link kopieren"
                            >
                                <Share2 className="w-4 h-4 text-gold group-hover:text-forest" />
                                <span>Artikel teilen</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* RELATED POSTS SECTION */}
            {relatedPosts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold block">
                                Weiterlesen
                            </span>
                            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-forest">
                                Weitere lesenswerte Ratgeber
                            </h3>
                        </div>

                        <Link
                            href="/blog"
                            className="text-xs font-bold text-forest hover:text-gold flex items-center gap-1 transition-colors"
                        >
                            Alle Artikel <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                        {relatedPosts.map((rel, index) => (
                            <RelatedPostCard
                                key={rel.id || rel.slug || index}
                                post={rel}
                                index={index}
                            />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* SHARE MODAL */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => setIsShareModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-forest/10 relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(false)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sand/40 hover:bg-sand flex items-center justify-center text-slate-500 hover:text-forest transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-5">
                                {/* Modal Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-forest/10 text-forest flex items-center justify-center font-bold">
                                        <Share2 className="w-5 h-5 text-forest" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-forest font-sans">Ratgeber teilen</h3>
                                        <p className="text-xs text-slate-500">Teile diesen Artikel mit Freunden & Kontakten</p>
                                    </div>
                                </div>

                                {/* Sharing Action Grid */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {/* Link kopieren */}
                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs ${
                                                copied
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : 'bg-[#faf8f3] hover:bg-sand/50 border-forest/10 text-slate-700 hover:text-forest'
                                            }`}
                                        >
                                            {copied ? (
                                                <Check className="w-5 h-5 text-emerald-700" />
                                            ) : (
                                                <Copy className="w-5 h-5 text-forest group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-[11px] font-bold">
                                                {copied ? 'Kopiert!' : 'Link kopieren'}
                                            </span>
                                        </button>

                                        {/* WhatsApp */}
                                        <button
                                            type="button"
                                            onClick={handleShareWhatsApp}
                                            className="p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
                                        >
                                            <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                                            <span className="text-[11px] font-bold">WhatsApp</span>
                                        </button>

                                        {/* E-Mail */}
                                        <button
                                            type="button"
                                            onClick={handleShareEmail}
                                            className="p-3.5 rounded-2xl bg-forest/10 hover:bg-forest/20 border border-forest/25 text-forest flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
                                        >
                                            <Mail className="w-5 h-5 text-forest group-hover:scale-110 transition-transform" />
                                            <span className="text-[11px] font-bold">E-Mail</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
