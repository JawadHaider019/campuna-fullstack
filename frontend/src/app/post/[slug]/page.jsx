'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Share2,
    Copy,
    Check,
    BookOpen,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { getPublicPost } from '@/api/posts';
import { BLOG_POSTS as FALLBACK_POSTS } from '@/data';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import { getImageUrl } from '@/utils/imageUrl';


export default function SinglePostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug;

    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const loadPost = async () => {
            try {
                setIsLoading(true);
                const res = await getPublicPost(slug);

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
                            author_name: found.author?.name || 'Campuna Redaktion',
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
                    }
                }
            } catch (err) {
                console.error('Error fetching post:', err);
                // Fallback
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
                        author_name: found.author?.name || 'Campuna Redaktion',
                        author_avatar: found.author?.avatar || '/logo.webp',
                        content: `# ${found.title}\n\n${found.excerpt}\n\n---\n\n## Camping-Wissen auf den Punkt gebracht\n\nErfahre alles Wissenswerte rund um dieses Thema. Auf Campuna findest du aktuelle Tipps, Tricks und Kaufempfehlungen für Wohnmobile, Wohnwagen und Campingzubehör.`
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPost();
    }, [slug]);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-sand/20 flex flex-col items-center justify-center font-sans">
                <RefreshCw className="w-10 h-10 text-gold animate-spin mb-4" />
                <p className="text-xs font-bold text-forest uppercase tracking-widest">
                    Artikel wird geladen...
                </p>
            </div>
        );
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
                        onClick={() => router.push('/all_blogs')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zum Ratgeber
                    </button>
                </div>
            </div>
        );
    }

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <article className="min-h-screen bg-sand/15 font-sans pb-24">
            {/* TOP BAR / BREADCRUMB */}
            <div className="bg-white border-b border-forest/10 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/all_blogs"
                        className="inline-flex items-center gap-2 text-xs font-bold text-forest hover:text-gold transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                        Zurück zum Magazin
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-forest/10 bg-sand/30 hover:bg-sand text-forest text-xs font-bold transition-all cursor-pointer"
                            title="Link kopieren"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gold" />}
                            <span>{copied ? 'Kopiert!' : 'Teilen'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* HEADER BANNER */}
            <div className="max-w-5xl mx-auto px-6 pt-10 pb-6 space-y-6">
                <div className="space-y-4">
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {post.tags.map((t) => (
                                <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-forest/5 text-forest border border-forest/10">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-forest tracking-tight leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono text-slate-500 pt-2 border-t border-forest/10">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gold" />
                            <span>{formatDate(post.created_at || post.date)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{post.read_time || '5 Min.'} Lesezeit</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-forest" />
                            <span className="font-bold text-forest">{post.author_name || 'Campuna Redaktion'}</span>
                        </div>
                    </div>
                </div>

                {/* COVER IMAGE */}
                {post.image_url && (
                    <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-2xl border border-forest/10 bg-slate-100">
                        <img
                            src={getImageUrl(post.image_url)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/collection/camping-zubehoer-hero.png';
                            }}
                        />
                    </div>
                )}
            </div>

            {/* MAIN ARTICLE BODY */}
            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-forest/10 space-y-8">
                    {/* Excerpt Lead */}
                    {post.excerpt && (
                        <div className="p-4 sm:p-6 rounded-2xl bg-sand/30 border-l-4 border-gold text-forest/90 text-base sm:text-lg font-medium leading-relaxed italic">
                            {post.excerpt}
                        </div>
                    )}

                    {/* Markdown Rendered Content */}
                    <div className="prose prose-slate max-w-none text-slate-800">
                        <MarkdownRenderer content={post.content} />
                    </div>

                    {/* AUTHOR BIO BOX */}
                    <div className="pt-8 border-t border-forest/10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-2xl bg-sand/20 border border-forest/10">
                            <div className="w-16 h-16 rounded-2xl bg-forest text-gold font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-display font-bold text-forest text-base">
                                    {post.author_name || 'Campuna Redaktion'}
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-light">
                                    Unser Team aus erfahrenen Campern, Fahrzeugexperten und Outdoor-Begeisterten recherchiert unabhängige Tipps, Checklisten und Praxiswissen für die deutsche Camping-Community.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SOCIAL SHARE BAR */}
                    <div className="pt-6 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-gold" /> Diesen Artikel teilen:
                        </span>

                        <div className="flex items-center gap-2">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-full bg-forest/5 hover:bg-forest text-forest hover:text-sand transition-colors flex items-center justify-center"
                                title="Auf X / Twitter teilen"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-full bg-forest/5 hover:bg-forest text-forest hover:text-sand transition-colors flex items-center justify-center"
                                title="Auf Facebook teilen"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-full bg-forest/5 hover:bg-forest text-forest hover:text-sand transition-colors flex items-center justify-center"
                                title="Auf LinkedIn teilen"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                </svg>
                            </a>
                            <button
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold/20 hover:bg-gold text-forest font-bold text-xs transition-colors cursor-pointer"
                                title="Link in Zwischenablage kopieren"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? 'Kopiert!' : 'Link kopieren'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RELATED POSTS SECTION */}
            {relatedPosts.length > 0 && (
                <div className="max-w-5xl mx-auto px-6 mt-16 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold block">
                                Weiterlesen
                            </span>
                            <h3 className="font-display text-2xl font-extrabold text-forest">
                                Weitere lesenswerte Ratgeber
                            </h3>
                        </div>

                        <Link
                            href="/all_blogs"
                            className="text-xs font-bold text-forest hover:text-gold flex items-center gap-1"
                        >
                            Alle Artikel <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map((rel) => (
                            <Link
                                key={rel.id || rel.slug}
                                href={`/post/${rel.slug}`}
                                className="group bg-white rounded-3xl border border-forest/10 p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col space-y-3"
                            >
                                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100">
                                    <img
                                        src={getImageUrl(rel.image_url)}
                                        alt={rel.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/collection/camping-zubehoer-hero.png';
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                                    <h4 className="font-display font-bold text-forest text-sm line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                                        {rel.title}
                                    </h4>
                                    <div className="text-[11px] font-mono text-slate-400 pt-2">
                                        {rel.read_time || '5 Min.'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}
