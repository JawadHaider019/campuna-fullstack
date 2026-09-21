'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Users, Compass, CheckCircle2 } from 'lucide-react';

const WhyCampuna = React.memo(function WhyCampuna() {
    const FEATURES = [
        {
            id: '01',
            icon: Compass,
            title: 'Camping an einem Ort',
            desc: 'Angebote, Anbieter, Campingplätze, Services, Wissen und hilfreiche Funktionen auf einer spezialisierten Plattform.',
        },
        {
            id: '02',
            icon: Users,
            title: 'Von Campern gedacht',
            desc: 'Wir bauen die Campingplattform, die wir selbst vermisst haben.',
        },
        {
            id: '03',
            icon: Layers,
            title: 'Campuna wächst mit euch',
            desc: 'Camper, private Anbieter, Händler, Campingplätze und Dienstleister bringen Campuna gemeinsam zum Leben.',
        }
    ];

    return (
        <section id="why-campuna" className="py-16 md:py-24 bg-sand relative overflow-hidden scroll-mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-gold block">
                        Mehr als nur ein Marktplatz</span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight leading-tight"
                    >
                        Warum Campuna?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="font-sans text-charcoal/70 text-base sm:text-lg mt-4 font-light max-w-2xl mx-auto"
                    >
                        Eine Plattform, die alle Facetten der Campingwelt nahtlos miteinander verbindet.
                    </motion.p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
                    {FEATURES.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                className="bg-white border border-forest/10 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-forest/20 hover:-translate-y-1.5 transition-all duration-300 group relative flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-forest text-gold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <span className="font-display font-extrabold text-3xl text-forest/10 group-hover:text-gold/30 transition-colors">
                                            {item.id}
                                        </span>
                                    </div>

                                    <h3 className="font-display text-xl font-bold text-forest mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="font-sans text-sm text-charcoal/70 leading-relaxed font-light">
                                        {item.desc}
                                    </p>
                                </div>

                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});

export default WhyCampuna;
