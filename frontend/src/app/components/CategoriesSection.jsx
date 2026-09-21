'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Backpack,
    Truck,
    Tent,
    Bike,
    Trees,
    Wrench,
    Home,
    Key,
    Sailboat
} from 'lucide-react';
import { CATEGORIES } from '@/data';

const ICON_MAP = {
    'Camping Zubehör': Backpack,
    'Wohnmobile & Camper': Truck,
    'Zelte & Dachzelte': Tent,
    'Fahrräder & Träger': Bike,
    'Stellplätze & Campingplätze': Trees,
    'Camping Services': Wrench,
    'Tiny Houses': Home,
    'Mieten & Vermieten': Key,
    'Boote & Wassersport': Sailboat
};

// Mapping category names to their respective URL slugs
const CATEGORY_SLUGS = {
    'Camping Zubehör': 'ausrüstung-und-zubehör',
    'Wohnmobile & Camper': 'fahrzeuge',
    'Zelte & Dachzelte': 'zelte-and-dachzelte',
    'Fahrräder & Träger': 'fahrräder-träger',
    'Stellplätze & Campingplätze': 'campingplätze-stellplätze',
    'Camping Services': 'dienstleistungen',
    'Tiny Houses': 'tiny-houses',
    'Mieten & Vermieten': 'mieten-vermieten',
    'Boote & Wassersport': 'boote-wassersport'
};

export default function CategoriesSection({
    onSelectCategory,
    excludeCategory,
    badge = "Kategorien",
    title = "Camping hat viele Seiten. Wir bringen sie zusammen.",
    showHeader = true,
    titleClassName = "font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest leading-[1.1]",
    align = "left"
}) {
    // Filter out current/excluded category if prop is provided
    const filteredCategories = excludeCategory
        ? CATEGORIES.filter(cat => cat.name !== excludeCategory)
        : CATEGORIES;

    // Handle both navigation and the callback
    const handleCategoryClick = (e, categoryName) => {
        if (onSelectCategory) {
            onSelectCategory(categoryName);
        }
    };

    const colCount = filteredCategories.length;
    const gridClass = colCount === 7
        ? "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-7 gap-3 md:gap-4 pb-4 lg:pb-1 no-scrollbar snap-x"
        : colCount === 8
            ? "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-8 gap-3 md:gap-4 pb-4 lg:pb-1 no-scrollbar snap-x"
            : "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-9 gap-3 md:gap-4 pb-4 lg:pb-1 no-scrollbar snap-x";

    return (
        <section id="categories" className="relative z-20 my-8 py-4 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Section Headline */}
                {showHeader && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className={`mb-8 space-y-2 ${align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                        {badge && (
                            <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                                {badge}
                            </span>
                        )}
                        {title && (
                            <h2 className={titleClassName}>
                                {title}
                            </h2>
                        )}
                    </motion.div>
                )}

                {/* Horizontal Scroll on Mobile, Grid on Desktop */}
                <div className={gridClass}>
                    {filteredCategories.map((cat, index) => {
                        const Icon = ICON_MAP[cat.name] || Tent;
                        const slug = CATEGORY_SLUGS[cat.name] || cat.slug || '';

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ delay: index * 0.05, duration: 0.6 }}
                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                className="bg-white border border-white/40 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center min-w-[120px] sm:min-w-[140px] lg:min-w-0 flex-shrink-0 snap-center"
                            >
                                <Link
                                    href={`/kategorie/${slug}`}
                                    className="flex flex-col items-center text-center w-full"
                                    onClick={(e) => handleCategoryClick(e, cat.name)}
                                >
                                    <div className="p-2.5 rounded-xl bg-forest/5 text-black group-hover:bg-forest group-hover:text-gold transition-all duration-300 mb-3 shrink-0">
                                        <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                    </div>

                                    <h3 className="font-display text-[10px] md:text-xs font-bold text-black leading-tight tracking-tight group-hover:text-gold transition-colors duration-300 line-clamp-2">
                                        {cat.name}
                                    </h3>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}