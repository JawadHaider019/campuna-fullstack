'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function TipCard({ tip, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.35, delay: (index % 3) * 0.06, ease: [0.21, 0.47, 0.32, 0.98] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white rounded-3xl border border-forest/10 hover:border-forest/25 shadow-xs hover:shadow-xl transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between space-y-3.5 select-none"
        >
            <div className="space-y-3">
                {/* 1. Category & Date Header */}
                <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-forest/5 text-forest border border-forest/10">
                        {tip.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                        {tip.date}
                    </span>
                </div>

                {/* 2. Title */}
                <h3 className="font-display font-bold text-forest text-lg sm:text-xl leading-snug group-hover:text-gold transition-colors duration-200">
                    {tip.title}
                </h3>

                {/* 3. Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                    {tip.description}
                </p>
            </div>
        </motion.div>
    );
}
