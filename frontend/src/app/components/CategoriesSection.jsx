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
    badge = "",
    title = "",
    showHeader = false,
    titleClassName = "font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-forest leading-[1.1]",
    align = "left",
    isDocked = true
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
        ? "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-7 gap-2.5 sm:gap-3 pb-2 lg:pb-0 no-scrollbar snap-x"
        : colCount === 8
            ? "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-8 gap-2.5 sm:gap-3 pb-2 lg:pb-0 no-scrollbar snap-x"
            : "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-9 gap-2.5 sm:gap-3 pb-2 lg:pb-0 no-scrollbar snap-x";

    return (
        <section 
            id="categories" 
            className={`relative z-20 scroll-mt-24 ${isDocked ? '-mt-10 sm:-mt-14 mb-10 px-4 md:px-8 lg:px-12' : 'my-8 py-4'}`}
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-4">
                {/* Section Headline */}
                {showHeader && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className={`mb-8 sm:mb-10 space-y-2 ${align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                        <span className="font-sans text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.4em] text-gold block">
                            {badge || "KATEGORIEN"}
                        </span>
                        <h2 className={titleClassName}>
                            {title || "Camping hat viele Seiten. Wir bringen sie zusammen."}
                        </h2>
                        <p className="font-sans text-xs sm:text-sm md:text-base text-charcoal/70 max-w-2xl font-light leading-relaxed mx-auto">
                            Neun Kategorien, ein Marktplatz: Wähle deinen Bereich und stöbere durch Angebote aus ganz Deutschland.
                        </p>
                    </motion.div>
                )}

                {/* Responsive Categories: Horizontally scrollable on mobile/tablet (docked & home), responsive grid on desktop */}
                <div className={
                    isDocked
                        ? "flex overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-9 gap-2.5 sm:gap-3 pb-3 lg:pb-0 no-scrollbar snap-x items-stretch"
                        : `flex overflow-x-auto lg:overflow-visible lg:grid ${
                            colCount === 8
                                ? 'lg:grid-cols-8'
                                : colCount === 7
                                ? 'lg:grid-cols-7'
                                : 'lg:grid-cols-9'
                        } gap-2.5 sm:gap-3 pb-3 lg:pb-0 no-scrollbar snap-x items-stretch`
                }>
                    {filteredCategories.map((cat, index) => {
                        const Icon = ICON_MAP[cat.name] || Tent;
                        const slug = CATEGORY_SLUGS[cat.name] || cat.slug || '';

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.03, duration: 0.4 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="bg-white border border-forest/10 hover:border-gold p-2.5 sm:p-3 xl:p-2.5 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 group flex flex-col items-center justify-center text-center cursor-pointer min-w-[102px] sm:min-w-[120px] lg:min-w-0 lg:w-full min-h-[105px] sm:min-h-[115px] xl:min-h-[110px] shrink-0 lg:shrink snap-start relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <Link
                                    href={`/kategorie/${slug}`}
                                    className="flex flex-col items-center justify-center text-center w-full h-full relative z-10"
                                    onClick={(e) => handleCategoryClick(e, cat.name)}
                                >
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-forest/5 text-forest group-hover:bg-forest group-hover:text-gold transition-all duration-300 mb-2 shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105">
                                        <Icon className="w-5 h-5 transition-transform duration-300" />
                                    </div>

                                    <h3 className="font-display text-[10.5px] sm:text-xs font-semibold text-charcoal group-hover:text-forest leading-tight tracking-tight transition-colors duration-300 line-clamp-2 h-[2.2em] flex items-center justify-center text-center">
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