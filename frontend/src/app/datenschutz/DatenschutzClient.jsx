'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ShieldCheck,
    Lock,
    Eye,
    FileText,
    Server,
    Cookie
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DatenschutzClient() {
    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION (Without bottom shadow) */}
            <section className="relative min-h-[44vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[40px] lg:rounded-[48px] mt-20 sm:mt-20 mx-4 md:mx-8 lg:mx-12 border border-forest/10">
                {/* Background Cinematic Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.08, opacity: 0 }}
                        animate={{ scale: 1.0, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src="/about_hero.webp"
                            alt="Datenschutzerklärung Campuna"
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(200,169,107,0.15),transparent_50%)] pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center w-full text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-sand/20 backdrop-blur-md border border-white/20 text-gold text-xs font-bold uppercase tracking-[0.25em] mb-4"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                        Privatsphäre & Sicherheit
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Datenschutzerklärung
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Informationen über die Verarbeitung personenbezogener Daten auf Campuna
                    </motion.p>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Datenschutz' }]}
                    variant="light"
                />
            </div>

            {/* 2. MAIN LEGAL TEXT CONTAINER */}
            <main className="max-w-5xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">
                    
                    {/* 1. Allgemeine Hinweise */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            1. Allgemeine Hinweise und Grundsätze der Datenverarbeitung
                        </h2>
                        <p>
                            Wir freuen uns, dass Sie unsere Webseite besuchen. Der Schutz Ihrer Privatsphäre und der Schutz Ihrer persönlichen Daten, der sog. personenbezogenen Daten, bei der Nutzung unserer Webseite ist uns ein wichtiges Anliegen.
                        </p>
                        <p>
                            Personenbezogene Daten sind nach Art. 4 Nr. 1 DS-GVO alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Hierzu gehören beispielsweise Informationen wie ihr Vor- und Nachname, ihre Anschrift, ihre Telefonnummer, Ihre E-Mail-Adresse, aber auch ihre IP-Adresse.
                        </p>
                        <p>
                            Daten, bei denen kein Bezug zu Ihrer Person herstellbar ist wie beispielsweise durch eine Anonymisierung, sind keine personenbezogenen Daten. Die Verarbeitung (z.B. das Erheben, die Speicherung, das Auslesen, das Abfragen, die Verwendung, die Übermittlung, das Löschen oder die Vernichtung) nach Art. 4 Nr. 2 DS-GVO bedarf immer einer gesetzlichen Rechtsgrundlage oder Ihrer Einwilligung. Verarbeitete personenbezogene Daten müssen gelöscht werden, sobald der Zweck der Verarbeitung erreicht wurde und keine gesetzlich vorgeschriebenen Aufbewahrungspflichten mehr zu wahren sind. Hier finden Sie Informationen über den Umgang mit Ihren personenbezogenen Daten beim Besuch unserer Webseite. Zur Bereitstellung der Funktionen und Dienste unserer Webseite ist es erforderlich, dass wir personenbezogene Daten über Sie erheben. Wir erklären ihnen zudem, die Art und Umfang der jeweiligen Datenverarbeitung, den Zweck und die entsprechende Rechtsgrundlage und die jeweilige Speicherdauer.
                        </p>
                        <p>
                            Diese Datenschutzerklärung gilt nur für diese Webseite. Sie gilt nicht für andere Webseiten, auf die wir durch einen Hyperlink lediglich verweisen. Wir können keine Verantwortung für den vertraulichen Umgang Ihrer personenbezogenen Daten auf diesen Webseiten Dritter übernehmen, da wir keinen Einfluss darauf haben, ob diese Unternehmen die Datenschutzbestimmungen einhalten. Über den Umgang mit Ihren personenbezogenen Daten durch diese Unternehmen informieren Sie sich bitte direkt auf diesen Webseiten.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 2. Verantwortliche Stelle */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            2. Verantwortliche Stelle
                        </h2>
                        <p>
                            Verantwortlich für die Verarbeitung von personenbezogenen Daten auf dieser Webseite ist:
                        </p>
                        <div className="bg-white p-5 rounded-2xl border border-forest/10 space-y-1">
                            <p className="font-bold text-forest">LMR Solutions Ronny Voigt</p>
                            <p>Inhaber: Ronny Voigt</p>
                            <p>Premnitzer Straße 8, 99091 Erfurt</p>
                            <p>E-Mail: <a href="mailto:kontakt@campuna.de" className="text-forest underline font-medium">kontakt@campuna.de</a></p>
                            <p>Telefon: +49 163 1516518</p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 3. Server Logfiles & Hosting */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            3. Bereitstellung und Nutzung der Webseite / Server Logfiles
                        </h2>
                        <h3 className="font-bold text-forest">a) Art und Umfang der Datenverarbeitung</h3>
                        <p>
                            Wenn Sie diese Webseite nutzen, ohne anderweitig (z.B. durch Registrierung oder Nutzung des Kontaktformulars) Daten an uns zu übermitteln, erheben wir über Server Logfiles technisch notwendige Daten, die automatisch an unseren Server übermittelt werden, u.a.:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>IP-Adresse</li>
                            <li>Datum und Uhrzeit der Anfrage</li>
                            <li>Name und URL der abgerufenen Datei</li>
                            <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                            <li>Zugriffsstatus/HTTP-Statuscode</li>
                            <li>Browsertyp, Sprache und Version der Browsersoftware</li>
                            <li>Betriebssystem</li>
                        </ul>
                        <p>
                            Unsere Webseite wird auf der Plattform Bubble.io betrieben und in der Standardumgebung von Bubble bei Amazon Web Services (AWS) gehostet. Das Hosting erfolgt in den USA. Zudem wird ein Content Delivery Network (CDN) durch die Infrastruktur von Bubble, AWS und Cloudflare genutzt. Der Serverstandort befindet sich aktuell außerhalb der EU. IP-Adressen werden nicht dauerhaft in der Anwendungsdatenbank gespeichert, sondern nur temporär in den Serverlogs der AWS-Infrastruktur.
                        </p>
                        <h3 className="font-bold text-forest pt-2">b) Zweck und Rechtsgrundlage</h3>
                        <p>
                            Diese Verarbeitung ist technisch erforderlich, um Ihnen unsere Webseite anzeigen zu können. Wir nutzen die Daten auch, um die Sicherheit und Stabilität unserer Webseite zu gewährleisten. Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. f) DS-GVO. Die Verarbeitung der genannten Daten ist für die Bereitstellung einer Webseite erforderlich und dient damit der Wahrung eines berechtigten Interesses unseres Unternehmens.
                        </p>
                        <h3 className="font-bold text-forest pt-2">c) Speicherdauer</h3>
                        <p>
                            Sobald die genannten personenbezogenen Daten zur Anzeige der Webseite nicht mehr erforderlich sind, werden diese gelöscht. Die Erfassung der Daten zur Bereitstellung der Webseite und die Speicherung der Daten in Logfiles ist für den Betrieb der Webseite zwingend erforderlich. Es besteht folglich bezüglich dieses Aspektes seitens des Nutzers keine Widerspruchsmöglichkeit. Eine weitergehende Speicherung kann im Einzelfall dann erfolgen, wenn dies gesetzlich vorgeschrieben ist.
                        </p>
                        
                        <div className="bg-sand/50 p-5 rounded-2xl border border-forest/10 mt-4 space-y-2">
                            <h4 className="font-bold text-forest">Hosting über Bubble.io</h4>
                            <p className="text-xs sm:text-sm">
                                Wir nutzen die Plattform Bubble.io (Bubble Group, Inc.) als zentrale technische Grundlage für Hosting, Datenbankmanagement und Workflow-Automatisierung. Daten von Nutzerkonten, Inseraten, Nachrichten und Uploads werden hierüber sicher verwaltet. Datenschutzbestimmungen von AWS: <a href="https://aws.amazon.com/de/privacy/?nc1=f_pr" target="_blank" rel="noopener noreferrer" className="text-forest underline">aws.amazon.com/de/privacy/</a>.
                            </p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 4. Cookies */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            4. Einsatz von Cookies
                        </h2>
                        <h3 className="font-bold text-forest">a) Art, Umfang und Zweck der Datenverarbeitung</h3>
                        <p>
                            Wir verwenden Cookies. Cookies sind kleine Dateien, die im Rahmen Ihres Besuchs unserer Webseite von uns an den Browser Ihres Endgeräts gesendet und dort gespeichert werden. Einige Funktionen unserer Webseite können ohne den Einsatz technisch notwendiger Cookies nicht angeboten werden. Andere Cookies ermöglichen uns dagegen verschiedene Analysen, um Einstellungen zu speichern oder unser Angebot nutzerfreundlicher zu gestalten.
                        </p>
                        <p>
                            <strong>Session-Cookies:</strong> Automatische Löschung nach Schließen des Browsers.<br />
                            <strong>Permanente Cookies:</strong> Speicherung über einen längeren Zeitraum zur Wiedererkennung.<br />
                            <strong>Drittanbieter-Cookies:</strong> Für Webanalyse, Werbe- und Social-Media-Funktionen.
                        </p>
                        <h3 className="font-bold text-forest pt-2">b) Rechtsgrundlage & Speicherdauer</h3>
                        <p>
                            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f) DS-GVO (berechtigtes Interesse) sowie bei erteilter Einwilligung über das Cookie-Banner Art. 6 Abs. 1 lit. a) DS-GVO. Daten werden gelöscht, sobald der Zweck entfällt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 5. Vorvertragliche Maßnahmen & Vertragserfüllung */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            5. Datenerhebung zur Durchführung vorvertraglicher Maßnahmen und zur Vertragserfüllung
                        </h2>
                        <p>
                            Im vorvertraglichen Bereich und bei Vertragsschluss erheben wir personenbezogene Daten über Sie (z. B. Vor- und Nachname, Anschrift, E-Mail-Adresse, Telefonnummer oder Bankverbindung). Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b) DS-GVO zur Erfüllung des Vertragsverhältnisses.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 6. Bestellformular */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            6. Bestellformular
                        </h2>
                        <p>
                            Auf unserer Webseite vorhandene Bestellformulare verarbeiten Daten (Name, Telefonnummer, E-Mail, Kontodaten, Produktname) nach Art. 6 Abs. 1 lit. b) DS-GVO zur sachgerechten Bearbeitung von Bestellungen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 7. Registrierungsmöglichkeit */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            7. Registrierungsmöglichkeit
                        </h2>
                        <p>
                            Bei der Erstellung eines Nutzerkontos erheben wir Name, E-Mail-Adresse und Passwort (Rechtsgrundlage Art. 6 Abs. 1 lit. a) & b) DS-GVO). Zur Sicherstellung der Richtigkeit der E-Mail-Adresse nutzen wir das Double-Opt-In-Verfahren über den Dienst Brevo.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 8. Datenübermittlung */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            8. Datenübermittlung
                        </h2>
                        <p>
                            Wir übermitteln personenbezogene Daten an Dritte nur bei ausdrücklicher Einwilligung (Art. 6 Abs. 1 lit. a), zur Vertragserfüllung (Art. 6 Abs. 1 lit. b), bei rechtlicher Verpflichtung (Art. 6 Abs. 1 lit. c), zur Wahrung berechtigter Interessen (Art. 6 Abs. 1 lit. f) oder an sorgfältig verpflichtete Auftragsverarbeiter gemäß Art. 28 DS-GVO (IT, Logistik, Telekommunikation).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 9. & 10. Kontaktformular und E-Mail */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            9. Kontaktformular & 10. Kontakt per E-Mail
                        </h2>
                        <p>
                            Bei Anfragen über das Kontaktformular oder per E-Mail an <a href="mailto:kontakt@campuna.de" className="text-forest underline font-medium">kontakt@campuna.de</a> werden die von Ihnen mitgeteilten Daten ausschließlich zur Bearbeitung und Beantwortung Ihres Anliegens verarbeitet (Art. 6 Abs. 1 lit. a & f DS-GVO).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 11. Nutzerprofile */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            11. Nutzerprofile
                        </h2>
                        <p>
                            Die Plattform verarbeitet Profilangaben privater und gewerblicher Nutzer. Öffentlich sichtbar sind u. a. Benutzername, Vor- und Nachname, Profilbild, Bio, Social-Links sowie bei gewerblichen Anbietern Firmenname, Anschrift, USt-ID und Impressumsangaben. Sensible Kontaktdaten wie private Telefonnummern und Adressen sind nicht öffentlich einsehbar.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 12. Öffentliche Inserate */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            12. Öffentliche Inserate
                        </h2>
                        <p>
                            Bei der Erstellung von Inseraten werden Titel, Bilder, Beschreibung, Preis, Kategorie und Standortdaten auf Basis von Art. 6 Abs. 1 lit. a DSGVO öffentlich zugänglich gemacht.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 13. Nachrichtenfunktion & 14. Favoriten */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            13. Nachrichtenfunktion & 14. Merkliste / Favoriten
                        </h2>
                        <p>
                            Direktnachrichten werden vertraulich zwischen Absender und Empfänger verarbeitet (Art. 6 Abs. 1 lit. a & b DSGVO). Gespeicherte Favoriten/Merklisten dienen der individuellen Verwaltung interessanter Angebote und sind nur für den jeweiligen Nutzer zugänglich.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 15. Meldungen & 16. Statistiken */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            15. Meldung von Inseraten & 16. Anzeige-Statistiken
                        </h2>
                        <p>
                            Meldungen dienen der Missbrauchsbekämpfung und Plattformsicherheit (Art. 6 Abs. 1 lit. f DSGVO). Statistiken (Views, Favoritenanzahl, Klicks) werden aggregiert und anonymisiert erfasst, um Anbietern Einblicke in die Inseratsperformance zu geben.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 17. Tracking & Dienste Dritter */}
                    <section className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            17. Tracking- und Analysetools sowie externe Zahlungsdienstleister
                        </h2>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <p><strong>Apple Pay:</strong> Apple Distribution International Ltd., Zahlungsabwicklung nach Art. 6 Abs. 1 lit. b & f DSGVO.</p>
                            <p><strong>Brevo (Sendinblue GmbH):</strong> E-Mail-Versand und Double-Opt-In-Bestätigungen (Server in der EU).</p>
                            <p><strong>Cookiebot (Usercentrics A/S):</strong> Verwaltung von Cookie-Einwilligungen nach Art. 6 Abs. 1 lit. f DS-GVO.</p>
                            <p><strong>Facebook & Instagram (Meta Platforms Ireland Ltd.):</strong> Social-Präsenzen und Insights-Analysen.</p>
                            <p><strong>Google Analytics & Google Ads:</strong> Google Ireland Limited, Webanalyse mit IP-Anonymisierung (Art. 6 Abs. 1 lit. a DS-GVO).</p>
                            <p><strong>TikTok:</strong> TikTok Technology Limited, Analyse von Kurzvideos und Kanal-Performance.</p>
                            <p><strong>OpenAI (OpenAI, L.L.C.):</strong> KI-gestützte Inhaltsmoderation zur Sicherstellung rechtskonformer Inserate.</p>
                            <p><strong>PayPal:</strong> PayPal (Europe) S.à.r.l. et Cie, Zahlungsabwicklung und Bonitätsprüfung.</p>
                            <p><strong>Stripe:</strong> Stripe Payments Europe Ltd., sichere Zahlungsabwicklung für Business-Abos und Zusatzoptionen.</p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 18. & 19. Datensicherheit & Änderungen */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            18. Datensicherheit & 19. Änderungen der Datenschutzerklärung
                        </h2>
                        <p>
                            Wir setzen moderne SSL/TLS-Verschlüsselungsverfahren ein und passen technische Sicherheitsmaßnahmen kontinuierlich an. Wir behalten uns vor, diese Erklärung bei Bedarf zu aktualisieren.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 20. Ihre Rechte */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            20. Ihre Rechte als betroffene Person
                        </h2>
                        <ul className="list-disc pl-6 space-y-1.5">
                            <li><strong>Widerrufsrecht (Art. 7 Abs. 3 DSGVO):</strong> Jederzeitiger Widerruf erteilter Einwilligungen.</li>
                            <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Auskunft über verarbeitete Daten.</li>
                            <li><strong>Berichtigung (Art. 16 DSGVO):</strong> Berichtigung unrichtiger Daten.</li>
                            <li><strong>Löschung (Art. 17 DSGVO):</strong> Recht auf Löschung („Vergessenwerden“).</li>
                            <li><strong>Einschränkung (Art. 18 DSGVO):</strong> Einschränkung der Verarbeitung.</li>
                            <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Bereitstellung in maschinenlesbarem Format.</li>
                            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Widerspruch gegen Verarbeitungen nach Art. 6 Abs. 1 lit. f DSGVO.</li>
                            <li><strong>Beschwerderecht (Art. 77 DSGVO):</strong> Beschwerde bei einer Datenschutzaufsichtsbehörde.</li>
                        </ul>
                    </section>

                </div>
            </main>
        </div>
    );
}
