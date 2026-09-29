'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    ArrowRight,
    BookOpen,
    Sparkles,
    Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPublicPosts } from '@/api/posts';
import { BLOG_POSTS as FALLBACK_POSTS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';

// ─── Safe JSON-LD Serializer (XSS Protection) ────────────────────────────────
function safeJsonLd(obj) {
    if (!obj) return '{}';
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

// ─── Date Formatter ──────────────────────────────────────────────────────────
function formatPostDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return String(dateStr);
    }
}

// ─── Blog Card Component ─────────────────────────────────────────────────────
const BlogCard = memo(function BlogCard({ post, index, onClick }) {
    const postImage = getImageUrl(post.image_url || post.image);
    const postSlug = post.slug || post.id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: (index % 3) * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => onClick(postSlug)}
            className="group bg-white rounded-3xl border border-forest/10 hover:border-forest/25 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full will-change-transform select-none"
        >
            {/* Cover Image */}
            <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden shrink-0">
                <img
                    src={postImage}
                    alt={post.title || 'Ratgeber Beitrag'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                    loading="lazy"
                    decoding="async"
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
        </motion.div>
    );
});

// ─── Main All Blogs Directory Page Component ─────────────────────────────────
export default function AllBlogsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Alle');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Posts Data
    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const res = await getPublicPosts({
                    category: activeCategory !== 'Alle' ? activeCategory : undefined
                });

                if (!isMounted) return;

                if (res.data?.success && res.data.posts?.length > 0) {
                    setPosts(res.data.posts);
                } else {
                    // Fallback to static data
                    setPosts(FALLBACK_POSTS.map(p => ({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        excerpt: p.excerpt,
                        category: p.category || 'Campuna Ratgeber',
                        image_url: p.image,
                        read_time: p.readTime,
                        created_at: p.date,
                        author_name: p.author?.name || 'Campuna Club'
                    })));
                }
            } catch (err) {
                console.error('Error fetching blogs:', err);
                if (!isMounted) return;
                setPosts(FALLBACK_POSTS.map(p => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    excerpt: p.excerpt,
                    category: p.category || 'Campuna Ratgeber',
                    image_url: p.image,
                    read_time: p.readTime,
                    created_at: p.date,
                    author_name: p.author?.name || 'Campuna Club'
                })));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchPosts();

        return () => {
            isMounted = false;
        };
    }, [activeCategory]);

    // Categories List
    const categories = useMemo(() => {
        const set = new Set(['Alle']);
        posts.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [posts]);

    // Filtered Posts
    const filteredPosts = useMemo(() => {
        if (activeCategory === 'Alle') return posts;
        return posts.filter(p => p.category === activeCategory);
    }, [posts, activeCategory]);

    // Navigate to Single Post
    const handlePostClick = useCallback((slug) => {
        router.push(`/blog/${encodeURIComponent(slug)}`);
    }, [router]);

    // Schema.org Structured Data
    const blogStructuredData = useMemo(() => {
        return {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Campuna Blog & Camping-Ratgeber',
            description: 'Expertenwissen, Checklisten und Kaufberatung für Wohnmobile, Wohnwagen und Camping-Zubehör.',
            url: 'https://campuna.de/blog',
            blogPost: filteredPosts.slice(0, 20).map((p, idx) => ({
                '@type': 'BlogPosting',
                position: idx + 1,
                headline: p.title,
                url: `https://campuna.de/blog/${p.slug || p.id}`,
                datePublished: p.created_at || new Date().toISOString()
            }))
        };
    }, [filteredPosts]);

    return (
        <div className="bg-sand/15 min-h-screen relative font-sans text-charcoal pb-24 overflow-x-hidden">
            {/* Schema.org Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(blogStructuredData) }}
            />

            {/* ── Hero Banner (Matching Inserate / Anbieter Hero Style) ── */}
            <section
                className="relative min-h-[32vh] sm:min-h-[36vh] md:min-h-[40vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 mx-4 md:mx-8 lg:mx-12 shadow-xl border border-forest/10"
            >
                {/* Background Cinematic Image with Subtle Zoom Animation */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/hero.webp"
                            alt="Campuna Blog & Camping Ratgeber"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    {/* Deep luxurious multi-layered gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/85" />
                </div>

                {/* Floating Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.14),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-12 flex flex-col justify-center items-center w-full text-center">
                    <span className="font-sans text-[9px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-gold block mb-2">
                        CAMPUNA RATGEBER & PRAXISTIPPS
                    </span>
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-xl leading-tight"
                    >
                        Camping-Wissen <span className="text-gold">& Kaufberatung</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-xs sm:text-sm md:text-base text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md mb-6"
                    >
                        Entdecke fundierte Ratgeber, Checklisten für den Gebrauchtkauf, Gewichtsempfehlungen und praxiserprobte Tipps vom Campuna Club für dein nächstes Abenteuer.
                    </motion.p>

                    {/* Action buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-3"
                    >
                        <button
                            type="button"
                            onClick={() => router.push('/inserate')}
                            className="bg-gold hover:bg-white text-forest font-bold text-xs uppercase tracking-wider py-3.5 px-7 rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2"
                        >
                            <Compass className="w-4 h-4" />
                            Alle Inserate ansehen
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/zuladungsrechner')}
                            className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 font-bold text-xs uppercase tracking-wider py-3.5 px-7 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-gold" />
                            Zuladungsrechner starten
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── Breadcrumbs below Hero (7xl Container) ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <Breadcrumbs
                    items={[{ label: 'Blog' }]}
                    variant="light"
                />
            </div>

            {/* ── Main Content Area (7xl Container) ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Category Filter Pills (if multiple categories) */}
                {categories.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                    activeCategory === cat
                                        ? 'bg-forest text-sand shadow-md'
                                        : 'bg-white text-forest/75 hover:bg-forest/5 border border-forest/10 shadow-2xs'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* POSTS GRID */}
                {isLoading ? (
                    <div className="py-20 flex justify-center items-center">
                        <CircleLoader size="lg" color="forest" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-forest/20 p-8 space-y-4 shadow-sm">
                        <BookOpen className="w-12 h-12 text-forest/20 mx-auto" />
                        <h3 className="font-display font-bold text-forest text-xl">Keine Artikel gefunden</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            In dieser Kategorie sind derzeit noch keine Beiträge hinterlegt.
                        </p>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('Alle')}
                            className="px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 cursor-pointer"
                        >
                            Alle Ratgeber anzeigen
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredPosts.map((post, index) => (
                            <BlogCard
                                key={post.id || post.slug || index}
                                post={post}
                                index={index}
                                onClick={handlePostClick}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
