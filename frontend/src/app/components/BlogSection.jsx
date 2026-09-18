'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BLOG_POSTS } from '@/data';
import { getPublicPosts } from '@/api/posts';
import { getImageUrl } from '@/utils/imageUrl';

export default function BlogSection() {
    const router = useRouter();
    const [posts, setPosts] = useState(BLOG_POSTS || []);

    useEffect(() => {
        getPublicPosts({ limit: 4 })
            .then(res => {
                if (res.data?.success && res.data.posts?.length > 0) {
                    const formatted = res.data.posts.map(p => ({
                        id: p.id,
                        title: p.title,
                        excerpt: p.excerpt,
                        image: getImageUrl(p.image_url || p.image),
                        date: new Date(p.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }),
                        updateDate: new Date(p.updated_at || p.created_at).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', year: 'numeric' }),
                        slug: p.slug
                    }));
                    setPosts(formatted);
                }
            })
            .catch(() => {});
    }, []);

    const featuredPost = posts && posts.length > 0 ? posts[0] : null;
    const secondaryPosts = posts && posts.length > 1 ? posts.slice(1) : [];

    if (!featuredPost) return null;

    // Reusable Blog Card Component for non-featured state
    const BlogCardSmall = ({ post, index, isFirst = false }) => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            onClick={() => router.push(`/post/${post.slug}`)}
            className={`group flex flex-row gap-3 sm:gap-4 cursor-pointer border-b border-forest/5 pb-3 last:border-0 last:pb-0 w-full ${isFirst ? 'lg:hidden' : ''}`}
        >
            <div className="relative w-24 sm:w-32 h-20 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-md">
                <img
                    src={getImageUrl(post.image || post.image_url)}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = '/collection/camping-zubehoer-hero.png'; }}
                />
            </div>

            <div className="flex flex-col justify-center flex-1 min-w-0 space-y-1.5">
                <h3 className="font-display text-sm font-bold text-forest group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-tight">
                    {post.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-charcoal/40 font-mono">
                    <span>{post.date}</span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <section id="journal" className="py-10 sm:py-16 bg-white overflow-hidden scroll-mt-24">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                    <div className="space-y-4">
                        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                            Campuna Ratgeber
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black">
                            Camping-Ratgeber & Tipps
                        </h2>
                    </div>
                    {/* Desktop View All - Hidden on Mobile & Tablet */}
                    <div className="hidden lg:block">
                        <button onClick={() => router.push('/all_blogs')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer">
                            <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Artikel ansehen</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Magazine Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 items-start">

                    {/* Large Featured Article - ONLY visible on Desktop (lg+) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        onClick={() => router.push(`/post/${featuredPost.slug}`)}
                        className="hidden lg:block lg:col-span-3 group cursor-pointer w-full"
                    >
                        <div className="relative aspect-[16/10] w-full rounded-[32px] overflow-hidden shadow-2xl">
                            <img
                                src={getImageUrl(featuredPost.image || featuredPost.image_url)}
                                alt={featuredPost.title}
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.src = '/collection/camping-zubehoer-hero.png'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                            <div className="absolute inset-x-10 bottom-10 space-y-4">
                                <h3 className="font-display text-4xl font-extrabold text-white">
                                    {featuredPost.title}
                                </h3>
                                <p className="font-sans text-[15px] text-white/70 leading-relaxed font-light line-clamp-2 max-w-xl">
                                    {featuredPost.excerpt}
                                </p>
                                <div className="pt-2 flex items-center justify-between border-t border-white/10 gap-4">
                                    <div className="flex items-center gap-4 text-[11px] text-white/60 font-mono">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gold" />{featuredPost.date}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        <span>Aktualisiert {featuredPost.updateDate}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white text-forest px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest group-hover:bg-gold transition-colors shadow-lg">
                                        <span>Artikel lesen</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Unified Stack for Tablet & Mobile (Featured + Rest) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col w-full">
                        {/* Show Featured Post as a small card on Tablet/Mobile */}
                        <BlogCardSmall post={featuredPost} index={0} isFirst={true} />

                        {secondaryPosts.map((post, index) => (
                            <BlogCardSmall key={post.id} post={post} index={index + 1} />
                        ))}
                    </div>
                </div>

                {/* Mobile & Tablet Only View All - Bottom Center */}
                <div className="mt-7 flex justify-center lg:hidden">
                    <button onClick={() => router.push('/all_blogs')} className="group flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-forest cursor-pointer">
                        <span className="pb-0.5 border-b-2 border-gold/50 group-hover:border-gold transition-colors">Alle Artikel ansehen</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </section>
    );
}
