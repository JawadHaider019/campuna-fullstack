'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Calendar,
    Clock,
    ArrowRight,
    BookOpen,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPublicPosts } from '@/api/posts';
import { BLOG_POSTS as FALLBACK_POSTS } from '@/data';
import { getImageUrl } from '@/utils/imageUrl';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import CircleLoader from '@/app/components/CircleLoader';


export default function AllBlogsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const res = await getPublicPosts({
                    search: searchQuery || undefined
                });

                if (res.data?.success && res.data.posts?.length > 0) {
                    setPosts(res.data.posts);
                } else if (res.data?.success && res.data.posts?.length === 0 && searchQuery) {
                    setPosts([]);
                } else {
                    // Fallback to static data if DB is still seeding or offline
                    setPosts(FALLBACK_POSTS.map(p => ({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        excerpt: p.excerpt,
                        image_url: p.image,
                        read_time: p.readTime,
                        created_at: p.date,
                        author_name: p.author?.name || 'Campuna Redaktion'
                    })));
                }
            } catch (err) {
                console.error('Error fetching blogs:', err);
                // Fallback
                setPosts(FALLBACK_POSTS.map(p => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    excerpt: p.excerpt,
                    image_url: p.image,
                    read_time: p.readTime,
                    created_at: p.date,
                    author_name: p.author?.name || 'Campuna Redaktion'
                })));
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(fetchPosts, 250);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-sand/20 font-sans pb-20">
            {/* HERO BANNER */}
            <div className="relative bg-gradient-to-b from-[#003807] via-[#002204] to-[#040805] text-white pt-24 pb-20 px-6 sm:px-12 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/15 via-transparent to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 space-y-4 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gold text-xs font-mono font-bold tracking-[0.3em] uppercase">
                        <BookOpen className="w-4 h-4" />
                        <span>Campuna Magazin & Ratgeber</span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
                        Expertenwissen, Tipps & Kaufberatung rund ums Camping
                    </h1>

                    <p className="text-sand/80 text-sm sm:text-base md:text-lg font-light max-w-2xl leading-relaxed">
                        Entdecke praxisnahe Anleitungen, Checklisten für den Gebrauchtkauf, Zuladungstipps und aktuelle Neuigkeiten aus der Camping-Welt.
                    </p>
                </div>
            </div>

            {/* ── Breadcrumbs below Hero ── */}
            <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-6 pb-2">
                <Breadcrumbs
                    items={[{ label: 'Magazin & Ratgeber' }]}
                    variant="light"
                />
            </div>

            {/* FILTER & CONTENT SECTION */}
            <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-2 relative z-20 space-y-8">
                {/* Search Input Card */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-forest/10 flex items-center justify-between">
                    <div className="relative w-full">
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Artikel durchsuchen (z.B. Wohnmobil, Zuladung, Mieten)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold bg-slate-50/50"
                        />
                    </div>
                </div>

                {/* POSTS GRID */}
                {isLoading ? (
                    <div className="py-20">
                        <CircleLoader size="lg" color="forest" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-forest/20 p-8 space-y-4 shadow-sm">
                        <BookOpen className="w-12 h-12 text-forest/20 mx-auto" />
                        <h3 className="font-display font-bold text-forest text-xl">Keine Artikel gefunden</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Für deine Suchanfrage &quot;{searchQuery}&quot; wurden leider keine passenden Beiträge gefunden.
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-5 py-2.5 rounded-2xl bg-forest text-sand text-xs font-bold hover:bg-forest/90 cursor-pointer"
                        >
                            Filter zurücksetzen
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id || post.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                onClick={() => router.push(`/post/${post.slug}`)}
                                className="group bg-white rounded-3xl border border-forest/10 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
                            >
                                {/* Cover Image */}
                                <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden shrink-0">
                                    <img
                                        src={getImageUrl(post.image_url || post.image)}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/collection/camping-zubehoer-hero.png';
                                        }}
                                    />
                                </div>

                                {/* Body */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-gold" />
                                                {formatDate(post.created_at || post.date)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {post.read_time || post.readTime || '5 Min.'}
                                            </span>
                                        </div>

                                        <h3 className="font-display font-bold text-forest text-lg sm:text-xl line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                                            {post.title}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-light">
                                            {post.excerpt}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">
                                            {post.author_name || 'Campuna Redaktion'}
                                        </span>

                                        <div className="flex items-center gap-1.5 text-xs font-bold text-forest group-hover:text-gold transition-colors">
                                            <span>Artikel lesen</span>
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
