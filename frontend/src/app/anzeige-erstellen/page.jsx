'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Upload,
    Trash2,
    Sparkles,
    MapPin,
    CheckCircle2,
    Info,
    FileText,
    Layers,
    Tag,
    ChevronDown,
    Check,
    Lock,
    AlertCircle
} from 'lucide-react';
import { CATEGORIES } from '@/data';
import { createListing } from '@/api/listings';
import { toast } from 'react-hot-toast';

// Map of subcategories based on categories
const SUBCATEGORIES_MAP = {
    'Camping Zubehör': [
        'Ausrüstung und Zubehör',
        'Vorzelte & Markisen',
        'Campingmöbel',
        'Küche & Grillen',
        'Elektrik & Solar',
        'Heizung & Klima',
        'Sonstiges'
    ],
    'Wohnmobile & Camper': [
        'Kastenwagen & Van',
        'Teilintegriert',
        'Integriert',
        'Alkoven',
        'Wohnwagen',
        'Sonstiges'
    ],
    'Zelte & Dachzelte': [
        'Dachzelte',
        'Kuppel- & Tunnelzelte',
        'Familienzelte',
        'Wurfzelte',
        'Zubehör'
    ],
    'Fahrräder & Träger': [
        'Fahrradträger Heck',
        'Fahrradträger Deichsel',
        'E-Bikes & Fahrräder',
        'Zubehör'
    ],
    'Stellplätze & Campingplätze': [
        'Stellplatz',
        'Campingplatz',
        'Zeltplatz',
        'Privatgrundstück'
    ],
    'Camping Services': [
        'Reparatur & Wartung',
        'Umbau & Nachrüstung',
        'Reinigung & Pflege',
        'Transport & Überführung'
    ],
    'Tiny Houses': [
        'Tiny House mobil',
        'Tiny House stationär',
        'Modulhäuser'
    ],
    'Mieten & Vermieten': [
        'Camper mieten',
        'Wohnwagen mieten',
        'Zubehör mieten'
    ],
    'Boote & Wassersport': [
        'Motorboote',
        'Segelboote',
        'Schlauchboote',
        'Kajaks & SUPs',
        'Wassersport-Zubehör',
        'Sonstiges'
    ]
};

// German cities for mock site autocomplete
const MOCK_LOCATIONS = [
    'Berlin', 'München', 'Hamburg', 'Erfurt', 'Köln', 'Frankfurt am Main',
    'Stuttgart', 'Düsseldorf', 'Leipzig', 'Trebbin', 'Bruchsal', 'Dausenau',
    'Riegelsberg', 'Waidring', 'Schuby', 'Oberhausen', 'Schkeuditz', 'Neidenau'
];

export default function CreateListingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        price: '96', // Initial default from requested content
        isNegotiable: true,
        condition: 'Zustand', // Default value
        description: '',
        category: 'Camping Zubehör', // Will map to 'Ausrüstung und Zubehör' initially or we can set it
        subcategory: 'Ausrüstung und Zubehör',
        location: '',
    });

    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pioneerBadgeInfo, setPioneerBadgeInfo] = useState(null);

    // Suggested values for condition
    const conditions = ['Neu', 'Sehr gut', 'Gut', 'Gebraucht', 'Defekt'];

    // Handle textual input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'location') {
            if (value.trim().length > 1) {
                const filtered = MOCK_LOCATIONS.filter(city =>
                    city.toLowerCase().includes(value.toLowerCase())
                );
                setLocationSuggestions(filtered);
                setShowLocationDropdown(true);
            } else {
                setLocationSuggestions([]);
                setShowLocationDropdown(false);
            }
        }
    };

    // Select location from suggestion list
    const selectLocation = (city) => {
        setFormData((prev) => ({
            ...prev,
            location: city
        }));
        setShowLocationDropdown(false);
    };

    // Toggle Negotiable Checkbox
    const handleCheckboxChange = () => {
        setFormData((prev) => ({
            ...prev,
            isNegotiable: !prev.isNegotiable,
        }));
    };

    // Dynamic Subcategory lists based on Category
    const handleCategoryChange = (e) => {
        const selectedCat = e.target.value;
        const subcats = SUBCATEGORIES_MAP[selectedCat] || [];
        setFormData((prev) => ({
            ...prev,
            category: selectedCat,
            subcategory: subcats[0] || 'Kategorie waehlen'
        }));
    };

    // Handle Drag & Drop for Image Upload
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const files = Array.from(e.dataTransfer.files);
            addImages(files);
        }
    };

    const handleImageFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const files = Array.from(e.target.files);
            addImages(files);
        }
    };

    const addImages = (files) => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validImageFiles = files.filter(file => file.type.startsWith('image/'));
        
        const oversizedFiles = validImageFiles.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.error('Einige Bilder überschreiten das Limit von 5 MB und wurden nicht hinzugefügt.');
        }

        const allowedFiles = validImageFiles.filter(file => file.size <= maxSize);
        const newImageUrls = allowedFiles.map(file => URL.createObjectURL(file));
        setImages((prev) => [...prev, ...newImageUrls]);
        setImageFiles((prev) => [...prev, ...allowedFiles]);
    };

    const removeImage = (indexToRemove) => {
        setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // Simulated Campuna AI description generator with typewriter typing effect!
    const generateAiDescription = () => {
        if (!formData.title.trim()) {
            alert('Bitte geben Sie zuerst einen Titel ein, damit Campuna AI eine Beschreibung erstellen kann.');
            return;
        }

        setAiGenerating(true);
        setAiProgress(0);

        // Dynamic prompt simulation based on user selected fields
        const titleVal = formData.title;
        const catVal = formData.category;
        const condVal = formData.condition !== 'Zustand' ? formData.condition : 'guten';
        const priceVal = formData.price ? `${formData.price}€` : 'Verhandlungssache';

        const sentences = [
            `Hallo zusammen! Ich verkaufe hier: ${titleVal}.`,
            `Der Artikel befindet sich in einem ${condVal.toLowerCase()} Zustand und wurde stets sorgfältig gepflegt und trocken gelagert.`,
            catVal === 'Camping Zubehör'
                ? `Dieses hochwertige Camping-Zubehör eignet sich hervorragend für den nächsten Urlaub mit dem Caravan oder Zelt. Es bietet genau die Zuverlässigkeit und den Komfort, den man sich auf Reisen wünscht.`
                : `Ideales Angebot für alle Camping-Enthusiasten und Naturliebhaber, die auf der Suche nach Qualität und Langlebigkeit sind.`,
            `Details:\n- Zustand: ${condVal}\n- Zubehör/Kategorie: ${catVal}\n- Sofort einsatzbereit und voll funktionsfähig.`,
            `Preis liegt bei ${priceVal}${formData.isNegotiable ? ' (Verhandlungsbasis)' : ''}. Besichtigung und Abholung sind nach Absprache möglich. Bei Fragen oder Interesse schreibt mir einfach eine Nachricht!`
        ];

        const finalDescription = sentences.join('\n\n');
        let progressInterval = setInterval(() => {
            setAiProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);

                    // Start Typwriter Effect
                    let currentText = "";
                    let charIndex = 0;
                    let typingInterval = setInterval(() => {
                        if (charIndex < finalDescription.length) {
                            currentText += finalDescription.charAt(charIndex);
                            setFormData(prev => ({ ...prev, description: currentText }));
                            charIndex += 2; // Type two chars at a time for snappiness
                        } else {
                            clearInterval(typingInterval);
                            setAiGenerating(false);
                        }
                    }, 15);

                    return 100;
                }
                return prev + 10;
            });
        }, 100);
    };

    // Form Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate fields
        if (!formData.title.trim()) {
            toast.error('Bitte einen Titel eingeben.');
            return;
        }
        if (!formData.price.trim()) {
            toast.error('Bitte einen Preis eingeben.');
            return;
        }
        if (formData.condition === 'Zustand') {
            toast.error('Bitte einen Zustand auswählen.');
            return;
        }
        if (!formData.location.trim()) {
            toast.error('Bitte einen Ort eingeben.');
            return;
        }

        setSubmitLoading(true);
        const toastId = toast.loading('Anzeige wird erstellt...');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('price', formData.price);
            data.append('isNegotiable', formData.isNegotiable);
            data.append('condition', formData.condition);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('subcategory', formData.subcategory || '');
            data.append('location', formData.location);

            // Append images files
            imageFiles.forEach((file) => {
                data.append('images', file);
            });

            const res = await createListing(data);

            if (res.success) {
                toast.success('Anzeige erfolgreich erstellt!', { id: toastId });
                setPioneerBadgeInfo(res.data.pioneer_badge_info);
                setShowSuccessModal(true);
            } else {
                toast.error(res.error || 'Erstellung fehlgeschlagen.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Netzwerkfehler beim Erstellen der Anzeige.', { id: toastId });
        } finally {
            setSubmitLoading(false);
        }
    };

    // Quick fill helper for testing
    const handleQuickFill = () => {
        setFormData({
            title: 'Vorzelt Dorema Größe 10, sehr guter Zustand',
            price: '96',
            isNegotiable: true,
            condition: 'Sehr gut',
            description: '',
            category: 'Camping Zubehör',
            subcategory: 'Vorzelte & Markisen',
            location: 'Trebbin',
        });
    };

    const displayedPreviewImage = images.length > 0
        ? images[0]
        : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80';

    return (
        <div className="bg-sand min-h-screen py-16 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-forest/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto  pt-10 relative z-10">

                {/* Top Info Banner containing requested content headings */}
                <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-forest/10">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mb-2">
                            Erstelle deine Anzeige in unter 2 Minuten
                        </h1>
                        <p className="font-sans text-sm md:text-base text-charcoal/70 font-light">
                            Verkaufe Dinge, die du nicht mehr nutzt – schnell, einfach und kostenlos
                        </p>
                    </div>
                    <div className="flex flex-col items-center sm:items-end shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-semibold mb-1">
                            <Info className="w-3.5 h-3.5" />
                            Kostenlos inserieren
                        </span>
                        <span className="font-sans text-[10px] text-charcoal/50">
                            Du kannst alles später jederzeit bearbeiten
                        </span>
                    </div>
                </div>

                {/* Quick Fill Testing Helper Badge */}

                {/* Grid Container split content layout: Form Left, Preview Card Right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Main Listing Form */}
                    <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-forest/5 space-y-6">

                            {/* Titel Row */}
                            <div className="space-y-2">
                                <label htmlFor="title" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                    Titel
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="z.B. Vorzelt Dorema Größe 10, sehr guter Zustand"
                                    className="w-full bg-sand/35 border border-forest/15 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200"
                                />
                            </div>

                            {/* Price & Negotiable Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="price" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                        Preis (€)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="price"
                                            name="price"
                                            required
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="96"
                                            className="w-full bg-sand/35 border border-forest/15 rounded-xl pl-4 pr-10 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-charcoal/50 font-sans text-sm">
                                            €
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.isNegotiable}
                                                onChange={handleCheckboxChange}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${formData.isNegotiable ? 'bg-forest border-forest text-sand' : 'border-forest/30 bg-white'
                                                }`}>
                                                {formData.isNegotiable && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                        <span className="font-sans text-sm text-charcoal/80 font-medium transition-colors">
                                            {formData.isNegotiable ? 'Der Preis ist verhandelbar.' : 'Der Preis ist nicht verhandelbar.'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Images Upload Area */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <label className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                        Bilder
                                    </label>
                                    <span className="font-sans text-[10px] text-charcoal/40 italic">
                                        Tipp: Anzeigen mit mehreren Bildern werden häufiger angeklickt.
                                    </span>
                                </div>

                                {/* Dropzone */}
                                <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer ${dragActive
                                        ? 'border-forest bg-forest/5'
                                        : 'border-forest/20 hover:border-forest/40 bg-sand/10 hover:bg-sand/20'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center text-forest group-hover:scale-105 transition-transform duration-300">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="font-sans text-xs font-semibold text-charcoal">
                                            Lade Bilder hoch (optional, aber empfohlen)
                                        </p>
                                        <p className="font-sans text-[10px] text-charcoal/50">
                                            Zieh deine Bilder hierher oder klicke zum Auswählen (Max. 5 MB pro Bild)
                                        </p>
                                    </div>
                                </div>

                                {/* Uploaded Previews List */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-3">
                                        {images.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-md border border-forest/10">
                                                <img src={url} alt={`Upload preview ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center  transition-opacity duration-200 shadow hover:bg-red-650"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Condition Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="condition" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                        Zustand
                                    </label>
                                    <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-widest">
                                        optional
                                    </span>
                                </div>
                                <div className="relative">
                                    <select
                                        id="condition"
                                        name="condition"
                                        value={formData.condition}
                                        onChange={handleInputChange}
                                        className="w-full appearance-none bg-sand/35 border border-forest/15 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200 pr-10 cursor-pointer text-charcoal"
                                    >
                                        <option value="Zustand" disabled className="text-charcoal/50">Zustand</option>
                                        {conditions.map((cond) => (
                                            <option key={cond} value={cond} className="text-charcoal bg-white">
                                                {cond}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/50 pointer-events-none" />
                                </div>
                            </div>

                            {/* Description Section with AI button */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="description" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                        Beschreibung
                                    </label>

                                    {/* Campuna AI trigger button */}
                                    <button
                                        type="button"
                                        onClick={generateAiDescription}
                                        disabled={aiGenerating}
                                        className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 shadow-md ${aiGenerating
                                            ? 'bg-forest/10 text-forest/50 cursor-not-allowed'
                                            : 'bg-forest text-white hover:bg-gold hover:text-forest'
                                            }`}
                                    >
                                        <Sparkles className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-pulse' : ''}`} />
                                        Campuna AI
                                    </button>
                                </div>

                                <div className="relative">
                                    {aiGenerating && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4">
                                            <div className="w-48 bg-sand h-2 rounded-full overflow-hidden border border-forest/10 mb-2">
                                                <div
                                                    className="bg-forest h-full rounded-full transition-all duration-100 ease-out"
                                                    style={{ width: `${aiProgress}%` }}
                                                />
                                            </div>
                                            <span className="font-sans text-[10px] font-semibold text-forest animate-pulse uppercase tracking-wider">
                                                Schreibe Anzeige mit Campuna AI...
                                            </span>
                                        </div>
                                    )}
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={6}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Detaillierte Beschreibung Ihres Angebots"
                                        className="w-full bg-sand/35 border border-forest/15 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200 resize-y"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Categorization */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Category Dropdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="category" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                            Kategorie
                                        </label>
                                        <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-widest">
                                            optional
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleCategoryChange}
                                            className="w-full appearance-none bg-sand/35 border border-forest/15 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200 pr-10 cursor-pointer text-charcoal"
                                        >
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat.id} value={cat.name} className="text-charcoal bg-white">
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/50 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Subcategory Dropdown */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="subcategory" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                            Unterkategorie
                                        </label>
                                        <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-widest">
                                            optional
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            id="subcategory"
                                            name="subcategory"
                                            value={formData.subcategory}
                                            onChange={handleInputChange}
                                            className="w-full appearance-none bg-sand/35 border border-forest/15 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200 pr-10 cursor-pointer text-charcoal"
                                        >
                                            <option disabled value="">Kategorie waehlen</option>
                                            {SUBCATEGORIES_MAP[formData.category]?.map((sub) => (
                                                <option key={sub} value={sub} className="text-charcoal bg-white">
                                                    {sub}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/50 pointer-events-none" />
                                    </div>
                                </div>

                            </div>

                            {/* Location Input with autocomplete suggestions */}
                            <div className="space-y-2 relative">
                                <label htmlFor="location" className="font-sans text-xs font-semibold text-forest uppercase tracking-wider block">
                                    Standort
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Stadt, PLZ oder Region"
                                        className="w-full bg-sand/35 border border-forest/15 rounded-xl pl-11 pr-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/50 transition-all duration-200"
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/50" />
                                </div>

                                {/* Suggestions items */}
                                <AnimatePresence>
                                    {showLocationDropdown && locationSuggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute z-20 top-full left-0 right-0 bg-white border border-forest/10 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100"
                                        >
                                            {locationSuggestions.map((city) => (
                                                <button
                                                    key={city}
                                                    type="button"
                                                    onClick={() => selectLocation(city)}
                                                    className="w-full text-left px-4 py-2.5 font-sans text-xs text-charcoal hover:bg-forest/5 transition-colors"
                                                >
                                                    {city}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>

                        {/* Publishing Submit details and Button */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-forest/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-2.5 max-w-md">
                                <Lock className="w-4.5 h-4.5 text-forest/40 shrink-0 mt-0.5" />
                                <p className="font-sans text-[11px] text-charcoal/50 leading-relaxed">
                                    Deine Anzeige wird sofort veröffentlicht und ist für die Campuna Camping-Community sichtbar. Du gehst keinerlei Bindung oder Kosten ein.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="bg-forest text-sand hover:bg-gold hover:text-forest w-full sm:w-auto px-8 py-4 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-65 active:scale-98 shrink-0 flex items-center justify-center gap-2"
                            >
                                {submitLoading ? (
                                    <span className="w-4.5 h-4.5 border-2 border-sand/30 border-t-sand rounded-full animate-spin inline-block" />
                                ) : (
                                    'Anzeige kostenlos veröffentlichen'
                                )}
                            </button>
                        </div>

                    </form>

                    {/* Right Column: Real-time dynamic preview card */}
                    <div className="sticky top-28 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-sans text-xs font-semibold text-forest uppercase tracking-wider">
                                Anzeigen-Vorschau
                            </h3>

                            <button
                                type="button"
                                onClick={handleQuickFill}
                                className="text-xs bg-forest text-sand hover:bg-gold hover:text-forest font-semibold py-1.5 px-4 rounded-full border border-forest/20 shadow-sm transition-all duration-300"
                            >
                                Demo-Daten laden
                            </button>

                        </div>


                        {/* Simulated Campuna Marketplace Listing Card */}
                        <div className="bg-white rounded-[24px] overflow-hidden border border-forest/10 shadow-lg select-none flex flex-col">

                            {/* Card Image area */}
                            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand/30">
                                <img
                                    src={displayedPreviewImage}
                                    alt={formData.title || 'Vorschau'}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out"
                                />

                                {/* User Type Badge */}
                                <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                                    <span className="bg-forest flex items-center gap-1 justify-center text-gold text-[8px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                                        <CheckCircle2 className="w-3 h-3 text-gold" />
                                        Privat
                                    </span>
                                </div>

                                {/* Location Overlay */}
                                <div className="absolute bottom-4 right-0 inset-x-4 flex items-center justify-end pointer-events-none text-white/90">
                                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-[9px] flex items-center gap-1 shadow-md">
                                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                                        <span>{formData.location || 'Deutschland'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content area */}
                            <div className="p-5 flex-1 flex flex-col justify-between min-h-[160px]">
                                <div>

                                    {/* Category breadcrumb */}
                                    <span className="block font-sans text-[8px] uppercase tracking-widest text-gold font-bold mb-1">
                                        {formData.category}
                                    </span>

                                    {/* Title */}
                                    <h4 className="font-display text-base font-bold text-black mb-2 line-clamp-2 leading-tight">
                                        {formData.title || 'Dein Anzeigentitel wird hier live angezeigt'}
                                    </h4>

                                    {/* Feature highlights */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {formData.condition !== 'Zustand' && (
                                            <span className="text-[9px] text-charcoal/70 bg-sand px-2 py-0.5 rounded border border-forest/5 font-semibold">
                                                {formData.condition}
                                            </span>
                                        )}
                                        {formData.subcategory && formData.subcategory !== 'Kategorie waehlen' && (
                                            <span className="text-[9px] text-charcoal/70 bg-sand px-2 py-0.5 rounded border border-forest/5 font-semibold">
                                                {formData.subcategory}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing row */}
                                <div className="pt-3 border-t border-forest/5 flex items-end justify-between">
                                    <div>
                                        <span className="block text-[8px] uppercase tracking-widest text-charcoal/40 font-mono">
                                            {formData.category === 'Mieten & Vermieten' ? 'pro Tag' : 'Kaufpreis'}
                                        </span>
                                        <span className="font-display text-lg font-extrabold text-forest">
                                            {formData.price ? parseFloat(formData.price).toLocaleString('de-DE') : '0'} €
                                            {formData.isNegotiable && (
                                                <span className="text-[10px] font-sans font-normal text-charcoal/50 ml-1.5">VB</span>
                                            )}
                                        </span>
                                    </div>

                                    <span className="font-sans text-[10px] font-bold text-forest flex items-center space-x-1">
                                        <span>Vorschau</span>
                                        <span>→</span>
                                    </span>
                                </div>

                            </div>

                        </div>

                        {/* Context/SEO Help Tip Card */}
                        <div className="bg-forest/5 rounded-2xl p-4 border border-forest/10 space-y-1">
                            <span className="font-sans text-[9px] font-bold text-gold uppercase tracking-widest block">Campuna Tipp</span>
                            <p className="font-sans text-[11px] text-charcoal/70 leading-relaxed">
                                Beschreibe deinen Artikel möglichst genau. Inserate mit aussagekräftigen Bildern und detailliertem Zustand werden bis zu <strong>4x schneller</strong> verkauft!
                            </p>
                        </div>

                    </div>

                </div>

            </div>

            {/* Success Modal Backdrop overlay */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    >
                        {/* Modal Body */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-forest/10 space-y-6"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center text-forest">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-display text-2xl font-bold text-charcoal">
                                    Anzeige veröffentlicht!
                                </h3>
                                <p className="font-sans text-sm text-charcoal/60 leading-relaxed">
                                    Deine Anzeige <strong>"{formData.title}"</strong> wurde erfolgreich erstellt und ist nun auf dem Marktplatz sichtbar.
                                </p>
                            </div>

                             {pioneerBadgeInfo && (
                                 <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20 text-center space-y-1">
                                     <span className="font-sans text-[10px] font-bold text-gold uppercase tracking-wider block">Pioneer-Programm</span>
                                     <p className="font-sans text-xs text-charcoal/80 leading-relaxed">
                                         {pioneerBadgeInfo.badge_unlocked ? (
                                             <span>🎉 <strong>Glückwunsch!</strong> Du hast das Campuna Pioneer Badge freigeschaltet! 🏆</span>
                                         ) : (
                                             <span>
                                                 Noch <strong>{pioneerBadgeInfo.remaining_for_badge} Inserat{pioneerBadgeInfo.remaining_for_badge > 1 ? 'e' : ''}</strong> einstellen, um das Campuna Pioneer Badge zu erhalten! 🚀
                                             </span>
                                         )}
                                     </p>
                                 </div>
                             )}

                             <div className="bg-sand/40 rounded-xl p-3 text-xs text-forest/80 font-medium">
                                 Viel Erfolg beim Verkaufen! 🎉
                             </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        router.push('/');
                                    }}
                                    className="w-full bg-forest text-sand hover:bg-gold hover:text-forest py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow cursor-pointer"
                                >
                                    Zum Marktplatz
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        // Reset form and images
                                        setFormData({
                                            title: '',
                                            price: '',
                                            isNegotiable: true,
                                            condition: 'Zustand',
                                            description: '',
                                            category: 'Camping Zubehör',
                                            subcategory: '',
                                            location: '',
                                        });
                                        setImages([]);
                                    }}
                                    className="w-full bg-sand hover:bg-forest/10 text-forest py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300"
                                >
                                    Weitere Anzeige erstellen
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
}
