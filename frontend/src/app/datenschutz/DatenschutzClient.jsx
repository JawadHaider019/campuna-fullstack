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
    Cookie,
    Mail,
    Scale,
    Bot,
    ExternalLink
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DatenschutzClient() {
    return (
        <div className="bg-white min-h-screen font-sans text-charcoal overflow-hidden">
            {/* 1. HERO SECTION */}
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
                        Transparente Informationen über die Verarbeitung personenbezogener Daten auf der Plattform Campuna
                    </motion.p>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="inline-block mt-3 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs text-sand/80 font-medium"
                    >
                        Stand: 16. Oktober 2026
                    </motion.span>
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
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">

                    {/* 1. Allgemeine Hinweise */}
                    <section id="abschnitt-1" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            1. Allgemeine Hinweise zum Datenschutz
                        </h2>
                        <p>
                            Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Mit dieser Datenschutzerklärung informieren wir Sie darüber, welche personenbezogenen Daten bei der Nutzung der Plattform Campuna verarbeitet werden, zu welchen Zwecken dies geschieht, welche Rechtsgrundlagen gelten und welche Rechte Ihnen zustehen.
                        </p>
                        <p>
                            Personenbezogene Daten sind gemäß Art. 4 Nr. 1 Datenschutz-Grundverordnung (DSGVO) alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Hierzu gehören beispielsweise Namen, Anschriften, E-Mail-Adressen, Telefonnummern, IP-Adressen und nutzerbezogene Informationen.
                        </p>
                        <p>
                            Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der geltenden Datenschutzgesetze, insbesondere der DSGVO und des Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes (TDDDG).
                        </p>
                        <p>
                            Diese Datenschutzerklärung gilt für die Website <a href="https://www.campuna.de" className="text-forest font-medium underline">www.campuna.de</a> sowie die darüber angebotenen Funktionen und Dienste.
                        </p>
                        <p>
                            Für externe Websites, auf die wir lediglich verlinken, gelten die Datenschutzbestimmungen der jeweiligen Betreiber.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 2. Verantwortlicher */}
                    <section id="abschnitt-2" className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            2. Verantwortlicher
                        </h2>
                        <p>
                            Verantwortlich für die Verarbeitung personenbezogener Daten ist:
                        </p>
                        <div className="bg-white/80 rounded-2xl p-6 border border-forest/10 shadow-xs space-y-1.5 text-sm sm:text-base font-normal">
                            <p className="font-bold text-forest text-base sm:text-lg">LMR Solutions Ronny Voigt</p>
                            <p className="text-charcoal/80">Inhaber: Ronny Voigt</p>
                            <p className="text-charcoal/80">Premnitzer Straße 8</p>
                            <p className="text-charcoal/80">99091 Erfurt</p>
                            <p className="text-charcoal/80">Deutschland</p>
                            <div className="pt-2 border-t border-forest/10 mt-3 space-y-1 text-sm">
                                <p><strong>Telefon:</strong> +49 163 1516518</p>
                                <p><strong>E-Mail:</strong> <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a></p>
                                <p><strong>Website:</strong> <a href="https://www.campuna.de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.campuna.de</a></p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 3. Hosting und technische Bereitstellung */}
                    <section id="abschnitt-3" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            3. Hosting und technische Bereitstellung
                        </h2>
                        <p>
                            Campuna wird auf einem Virtual Private Server (VPS) der IONOS SE betrieben.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Hosting-Anbieter:</p>
                            <p>IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, Deutschland</p>
                        </div>
                        <p>
                            Der produktive Server befindet sich in <strong>Spanien und damit innerhalb der Europäischen Union</strong>.
                        </p>
                        <p>
                            Auf diesem Server werden insbesondere folgende Komponenten betrieben:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 font-normal text-forest">
                            <li>Die Campuna-Webanwendung</li>
                            <li>Die PostgreSQL-Datenbank</li>
                            <li>Nutzerkonten und Profildaten</li>
                            <li>Inserate und Nachrichten</li>
                            <li>Hochgeladene Bilder und Dateien</li>
                            <li>Die KI-gestützte Inhaltsmoderation</li>
                        </ul>
                        <p>
                            Die genannten Kernkomponenten werden innerhalb der Europäischen Union betrieben. Für diese Komponenten werden nach Angaben unseres technischen Dienstleisters keine externen Server oder Drittlandanbieter eingesetzt.
                        </p>
                        <p>
                            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, soweit sie zur Bereitstellung der vereinbarten Plattformfunktionen erforderlich ist, sowie Art. 6 Abs. 1 lit. f DSGVO zur Gewährleistung eines sicheren, stabilen und zuverlässigen Betriebs.
                        </p>
                        <p>
                            Soweit IONOS personenbezogene Daten in unserem Auftrag verarbeitet, erfolgt dies auf Grundlage der datenschutzrechtlichen Anforderungen des Art. 28 DSGVO.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 4. Server-Logfiles */}
                    <section id="abschnitt-4" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            4. Server-Logfiles
                        </h2>
                        <p>
                            Beim Besuch unserer Website werden technisch erforderliche Zugriffsdaten verarbeitet. Hierzu können insbesondere gehören:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>IP-Adresse</li>
                            <li>Datum und Uhrzeit des Zugriffs</li>
                            <li>Aufgerufene Seiten und Dateien</li>
                            <li>Browsertyp und Browserversion</li>
                            <li>Betriebssystem</li>
                            <li>Referrer-URL</li>
                            <li>HTTP-Statuscode</li>
                            <li>Technische Verbindungsinformationen</li>
                        </ul>
                        <p>
                            Diese Daten werden benötigt, um die Website bereitzustellen, technische Fehler zu erkennen, die Systemsicherheit zu gewährleisten und Angriffe, insbesondere DDoS-Angriffe, abzuwehren.
                        </p>
                        <p>
                            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse besteht im sicheren und störungsfreien Betrieb der Plattform.
                        </p>
                        <p>
                            <strong>Speicherdauer:</strong> Server-Zugriffsprotokolle werden grundsätzlich für <strong>7 bis 14 Tage</strong> gespeichert und anschließend gelöscht, sofern keine weitere Speicherung zur Untersuchung konkreter Sicherheitsvorfälle oder aufgrund gesetzlicher Verpflichtungen erforderlich ist.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 5. Datensicherung und Backups */}
                    <section id="abschnitt-5" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            5. Datensicherung und Backups
                        </h2>
                        <p>
                            Zum Schutz vor Datenverlust und zur Wiederherstellung der Plattform werden regelmäßige Datensicherungen durchgeführt.
                        </p>
                        <p>
                            Campuna verwendet zwei Sicherungsebenen:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/80 p-5 rounded-2xl border border-forest/10">
                                <p className="font-bold text-forest text-sm sm:text-base">Lokale Datenbank-Backups</p>
                                <p className="text-xs sm:text-sm mt-1 text-charcoal/80">
                                    Diese werden auf dem IONOS-Server in Spanien gespeichert und für <strong>14 Tage</strong> aufbewahrt.
                                </p>
                            </div>
                            <div className="bg-white/80 p-5 rounded-2xl border border-forest/10">
                                <p className="font-bold text-forest text-sm sm:text-base">Vollständige Server-Backups</p>
                                <p className="text-xs sm:text-sm mt-1 text-charcoal/80">
                                    Diese erfolgen über IONOS Backup unter Verwendung der Backup-Technologie von Acronis. Die Sicherungen werden innerhalb der Europäischen Union gespeichert und für <strong>30 Tage</strong> aufbewahrt.
                                </p>
                            </div>
                        </div>
                        <p>
                            Die Verarbeitung dient der Gewährleistung der Verfügbarkeit, Integrität und Wiederherstellbarkeit unserer Systeme. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
                        </p>
                        <p>
                            Personenbezogene Daten, die bereits aus dem Produktivsystem gelöscht wurden, können vorübergehend noch in vorhandenen Datensicherungen enthalten sein. Diese werden entsprechend den genannten Aufbewahrungszyklen überschrieben beziehungsweise gelöscht.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 6. Cookies und vergleichbare Technologien */}
                    <section id="abschnitt-6" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            6. Cookies und vergleichbare Technologien
                        </h2>
                        <p>
                            Campuna verwendet Cookies und vergleichbare Technologien, um die Website technisch bereitzustellen und bestimmte Funktionen zu ermöglichen.
                        </p>
                        <p>
                            Technisch notwendige Cookies dienen insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Der Anmeldung und Authentifizierung</li>
                            <li>Der Verwaltung von Nutzersitzungen</li>
                            <li>Der Sicherheit der Plattform</li>
                            <li>Der Speicherung von Cookie-Einstellungen</li>
                            <li>Der Bereitstellung grundlegender Funktionen</li>
                        </ul>
                        <p>
                            Soweit diese Technologien unbedingt erforderlich sind, um einen vom Nutzer ausdrücklich gewünschten digitalen Dienst bereitzustellen, erfolgt die Speicherung beziehungsweise der Zugriff auf Informationen im Endgerät gemäß <strong>§ 25 Abs. 2 TDDDG</strong>. Die damit verbundene Verarbeitung personenbezogener Daten erfolgt je nach Zweck auf Grundlage von <strong>Art. 6 Abs. 1 lit. b oder lit. f DSGVO</strong>.
                        </p>
                        <p>
                            Für nicht notwendige Analyse- und Marketingtechnologien wird vor deren Einsatz eine Einwilligung eingeholt. Rechtsgrundlagen sind <strong>§ 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO</strong>.
                        </p>
                        <p>
                            Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft über die Cookie-Einstellungen widerrufen oder geändert werden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 7. Cookie-Einwilligungsverwaltung mit Cookiebot */}
                    <section id="abschnitt-7" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            7. Cookie-Einwilligungsverwaltung mit Cookiebot
                        </h2>
                        <p>
                            Zur Verwaltung der Cookie-Einstellungen verwenden wir Cookiebot.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>Usercentrics A/S, Havnegade 39, 1058 Kopenhagen K, Dänemark</p>
                        </div>
                        <p>
                            Cookiebot ermöglicht es, Einwilligungen für unterschiedliche Kategorien von Cookies und Tracking-Technologien zu erteilen, abzulehnen oder nachträglich zu ändern. Dabei können insbesondere folgende Informationen verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>IP-Adresse</li>
                            <li>Zeitpunkt der Einwilligung</li>
                            <li>Einwilligungsstatus</li>
                            <li>Browserinformationen</li>
                            <li>Technische Identifikationsmerkmale</li>
                        </ul>
                        <p>
                            Die Verarbeitung dient der Verwaltung und Dokumentation von Einwilligungen. Rechtsgrundlagen sind <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>, soweit die Verarbeitung zur Erfüllung gesetzlicher Nachweispflichten erforderlich ist, sowie <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> für den technischen Betrieb der Einwilligungsverwaltung.
                        </p>
                        <p>
                            Sie können Ihre Einstellungen jederzeit über die dauerhaft erreichbaren Cookie-Einstellungen auf unserer Website ändern. Weitere Informationen: <a href="https://www.cookiebot.com/de/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.cookiebot.com/de/privacy-policy/</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 8. Registrierung und Nutzerkonten */}
                    <section id="abschnitt-8" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            8. Registrierung und Nutzerkonten
                        </h2>
                        <p>
                            Für die Nutzung bestimmter Funktionen von Campuna ist die Erstellung eines Nutzerkontos erforderlich. Dabei verarbeiten wir insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Name beziehungsweise Benutzername</li>
                            <li>E-Mail-Adresse</li>
                            <li>Passwort in geschützter Form (gehasht)</li>
                            <li>Kontotyp (privat oder gewerblich)</li>
                            <li>Profilinformationen</li>
                            <li>Registrierungsdatum</li>
                            <li>Kontoeinstellungen</li>
                            <li>Vertrags- und Nutzungsinformationen</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Einrichtung und Verwaltung des Nutzerkontos sowie zur Bereitstellung der Plattformfunktionen. Rechtsgrundlage ist <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>.
                        </p>
                        <p>
                            Zur Überprüfung der E-Mail-Adresse können Bestätigungsnachrichten über unseren E-Mail-Dienstleister Brevo versendet werden.
                        </p>
                        <p>
                            Bei der Löschung eines Nutzerkontos werden der zugehörige Nutzerdatensatz und die damit verknüpften Daten aus der produktiven PostgreSQL-Datenbank dauerhaft entfernt. Hierzu gehören insbesondere Profile, Inserate, Nachrichten, Konversationen, Favoriten, Abonnementdaten, Guthaben- beziehungsweise Credit-Datensätze und weitere kontobezogene Informationen.
                        </p>
                        <p>
                            Gesetzliche Aufbewahrungspflichten und erforderliche Sicherungen von Buchhaltungsunterlagen bleiben hiervon unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 9. Private und gewerbliche Nutzerprofile */}
                    <section id="abschnitt-9" className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            9. Private und gewerbliche Nutzerprofile
                        </h2>
                        <p>
                            Campuna ermöglicht die Erstellung privater und gewerblicher Nutzerprofile.
                        </p>

                        <div className="space-y-2 pt-2">
                            <h3 className="font-display text-lg font-bold text-forest">
                                9.1 Private Nutzerprofile
                            </h3>
                            <p>
                                Bei privaten Nutzerprofilen können insbesondere Benutzername, Profilbild, freiwillige Profilangaben und veröffentlichte Inserate verarbeitet werden. Öffentlich sichtbar sind die jeweils für die Darstellung des Profils und der Inserate vorgesehenen Informationen. Nicht zur Veröffentlichung bestimmte persönliche Kontaktdaten werden nicht als öffentliche Profilinformationen bereitgestellt.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <h3 className="font-display text-lg font-bold text-forest">
                                9.2 Gewerbliche Anbieterprofile
                            </h3>
                            <p>
                                Gewerbliche Anbieter können einen eigenen Firmenauftritt auf Campuna erstellen. Dabei können insbesondere folgende Informationen verarbeitet und veröffentlicht werden:
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                                <li>Firmenname</li>
                                <li>Unternehmensbeschreibung</li>
                                <li>Firmenlogo und Profilbilder</li>
                                <li>Geschäftliche Kontaktdaten</li>
                                <li>Geschäftsanschrift</li>
                                <li>Website</li>
                                <li>Social-Media-Links</li>
                                <li>Gesetzlich erforderliche Impressumsangaben</li>
                                <li>Veröffentlichte Inserate und Dienstleistungen</li>
                            </ul>
                            <p>
                                Die Verarbeitung erfolgt zur Bereitstellung des Anbieterprofils gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>. Öffentlich bereitgestellte Profilinformationen können auch von Suchmaschinen erfasst und indexiert werden.
                            </p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 10. Erstellung und Veröffentlichung von Inseraten */}
                    <section id="abschnitt-10" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            10. Erstellung und Veröffentlichung von Inseraten
                        </h2>
                        <p>
                            Registrierte Nutzer können campingbezogene Inserate veröffentlichen. Hierzu werden insbesondere folgende Daten verarbeitet:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Inserattitel</li>
                            <li>Beschreibung</li>
                            <li>Kategorie</li>
                            <li>Preis</li>
                            <li>Standort</li>
                            <li>Bilder und hochgeladene Dateien</li>
                            <li>Anbieterzuordnung</li>
                            <li>Veröffentlichungsdatum</li>
                            <li>Inseratsstatus</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Bereitstellung und Veröffentlichung des Inserats gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>. Öffentlich veröffentlichte Inserate können von Besuchern der Plattform und Suchmaschinen eingesehen werden.
                        </p>
                        <p>
                            Bei der Löschung eines Inserats werden der zugehörige Datensatz und die damit verbundenen Daten aus der produktiven PostgreSQL-Datenbank dauerhaft gelöscht. Dies betrifft insbesondere zugehörige Konversationen, Nachrichten, Meldungen, Moderationsprotokolle und Favoritenzuordnungen.
                        </p>
                        <p>
                            Hochgeladene Bilddateien werden bei der Löschung von der Datenbankverknüpfung getrennt. Physisch gespeicherte Dateireste werden im Rahmen regelmäßiger Serverbereinigungen entfernt. Daten können darüber hinaus vorübergehend in Datensicherungen enthalten sein, bis die jeweiligen Backup-Aufbewahrungsfristen abgelaufen sind.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 11. Nachrichtenfunktion */}
                    <section id="abschnitt-11" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            11. Nachrichtenfunktion
                        </h2>
                        <p>
                            Campuna stellt eine Nachrichtenfunktion zur direkten Kommunikation zwischen Nutzern bereit. Dabei können insbesondere folgende Informationen verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Absender und Empfänger</li>
                            <li>Nachrichteninhalt</li>
                            <li>Zeitpunkt der Nachricht</li>
                            <li>Zugehöriges Inserat</li>
                            <li>Nachrichten- und Konversationsstatus</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Bereitstellung der Kommunikationsfunktion gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>.
                        </p>
                        <p>
                            Nachrichten sind nicht öffentlich sichtbar und werden grundsätzlich nur den jeweiligen Kommunikationspartnern angezeigt. Soweit zur Bearbeitung von Missbrauchsmeldungen, Sicherheitsvorfällen oder gesetzlichen Verpflichtungen erforderlich, können berechtigte Personen im rechtlich zulässigen Umfang auf entsprechende Informationen zugreifen.
                        </p>
                        <p>
                            Bei der Löschung des zugehörigen Nutzerkontos oder Inserats werden die betroffenen Konversationen und Nachrichten gemäß den technischen Löschregeln dauerhaft aus der produktiven Datenbank entfernt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 12. Favoriten und Merklisten */}
                    <section id="abschnitt-12" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            12. Favoriten und Merklisten
                        </h2>
                        <p>
                            Registrierte Nutzer können Inserate in einer persönlichen Merkliste speichern. Hierfür werden die entsprechenden Inserate dem Nutzerkonto zugeordnet.
                        </p>
                        <p>
                            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO.
                        </p>
                        <p>
                            Favoriten sind grundsätzlich nur für den jeweiligen Nutzer sichtbar. Die Daten werden gelöscht, wenn der Nutzer die Favoriten entfernt oder das zugehörige Nutzerkonto beziehungsweise Inserat gelöscht wird.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 13. Inseratsstatistiken */}
                    <section id="abschnitt-13" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            13. Inseratsstatistiken
                        </h2>
                        <p>
                            Campuna kann Anbietern statistische Informationen zur Nutzung ihrer Inserate bereitstellen. Hierzu können insbesondere gehören:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Anzahl der Inseratsaufrufe</li>
                            <li>Anzahl der Favoriten</li>
                            <li>Kontakt- und Interaktionsereignisse</li>
                            <li>Weitere inseratsbezogene Kennzahlen</li>
                        </ul>
                        <p>
                            Die Verarbeitung dient der Bereitstellung entsprechender Plattformfunktionen und der Verbesserung unseres Angebots. Rechtsgrundlagen sind <strong>Art. 6 Abs. 1 lit. b beziehungsweise lit. f DSGVO</strong>.
                        </p>
                        <p>
                            Anbieter erhalten grundsätzlich zusammengefasste Kennzahlen und keine personenbezogenen Informationen über einzelne Besucher, soweit diese nicht im Rahmen einer direkten Kontaktaufnahme selbst offengelegt werden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 14. KI-gestützte Inhaltsmoderation */}
                    <section id="abschnitt-14" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            14. KI-gestützte Inhaltsmoderation
                        </h2>
                        <p>
                            Campuna setzt zur Überprüfung von Inseraten ein KI-gestütztes Moderationssystem ein.
                        </p>
                        <div className="bg-forest/5 rounded-2xl p-5 border border-forest/15 space-y-2">
                            <p className="font-bold text-forest flex items-center gap-2">
                                <Bot className="w-4 h-4 text-forest" />
                                Lokaler Betrieb ohne Cloud-Drittlandübermittlung:
                            </p>
                            <p className="text-xs sm:text-sm text-charcoal/85">
                                Hierfür wird das Sprachmodell <strong>Qwen 3 lokal auf dem Campuna-Server bei IONOS in Spanien</strong> betrieben. Die Verarbeitung der Moderationsdaten erfolgt innerhalb der Europäischen Union. Eine Übermittlung der zu moderierenden Inhalte an externe KI-Dienstleister findet für diese Funktion nicht statt.
                            </p>
                        </div>
                        <p>
                            Das Moderationssystem überprüft Inseratsinhalte auf mögliche Verstöße gegen gesetzliche Vorschriften, Plattformregeln und Sicherheitsanforderungen. Hierzu gehören insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Betrügerische oder irreführende Angebote</li>
                            <li>Spam und missbräuchliche Inhalte</li>
                            <li>Verbotene Waren oder Dienstleistungen</li>
                            <li>Waffen und Drogen</li>
                            <li>Unzulässige Inhalte für Erwachsene</li>
                            <li>Weitere potenziell rechtswidrige oder regelwidrige Inhalte</li>
                        </ul>
                        <p>
                            Das System bewertet Inserate anhand eines automatisierten Moderationsverfahrens. Dabei sind folgende Ergebnisse möglich:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm font-normal">
                            <li><strong>Automatische Freigabe:</strong> Unauffällige Inserate können unmittelbar veröffentlicht werden.</li>
                            <li><strong>Manuelle Überprüfung:</strong> Auffällige oder nicht eindeutig bewertbare Inserate werden zunächst zurückgehalten und zur Prüfung durch einen Administrator vorgesehen.</li>
                            <li><strong>Automatische Ablehnung:</strong> Inserate, die als unzulässig eingestuft werden, können automatisch abgelehnt und von der öffentlichen Veröffentlichung ausgeschlossen werden.</li>
                        </ul>
                        <p>
                            Die automatisierte Moderation dient der Sicherheit der Plattform, der Bekämpfung rechtswidriger Inhalte und dem Schutz der Nutzer.
                        </p>
                        <p>
                            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der Gewährleistung eines sicheren und rechtskonformen Plattformbetriebs. Soweit konkrete gesetzliche Pflichten bestehen, kann ergänzend Art. 6 Abs. 1 lit. c DSGVO einschlägig sein.
                        </p>
                        <p>
                            Die Moderationsergebnisse, einschließlich Bewertungswerten und Begründungen, werden in der PostgreSQL-Datenbank gespeichert. Diese Informationen werden für die Dauer des Bestehens des jeweiligen Inserats aufbewahrt und bei dessen Löschung beziehungsweise bei Löschung des zugehörigen Nutzerkontos dauerhaft aus der Produktivdatenbank entfernt.
                        </p>
                        <p>
                            Nutzer können sich bei Fragen oder Einwänden gegen Moderationsentscheidungen an <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a> wenden. Soweit gesetzlich vorgesehen, werden Informationen über Moderationsentscheidungen und entsprechende Überprüfungsmöglichkeiten bereitgestellt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 15. Meldung von Inseraten und Missbrauchsbekämpfung */}
                    <section id="abschnitt-15" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            15. Meldung von Inseraten und Missbrauchsbekämpfung
                        </h2>
                        <p>
                            Nutzer können auffällige oder unzulässige Inserate melden. Dabei können insbesondere folgende Daten verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Gemeldetes Inserat</li>
                            <li>Meldegrund</li>
                            <li>Freiwillige ergänzende Angaben</li>
                            <li>Zeitpunkt der Meldung</li>
                            <li>Angaben zum meldenden Nutzer, soweit vorhanden</li>
                            <li>Bearbeitungsstatus</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Missbrauchsbekämpfung, zur Einhaltung gesetzlicher Verpflichtungen und zur Durchsetzung der Plattformregeln. Rechtsgrundlagen sind <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> und, soweit gesetzliche Verpflichtungen bestehen, <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>.
                        </p>
                        <p>
                            Meldedaten, die einem Inserat zugeordnet sind, werden nach den technischen Löschregeln bei dessen Löschung aus der produktiven Datenbank entfernt, soweit keine rechtlich erforderliche gesonderte Aufbewahrung besteht.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 16. Kostenpflichtige Leistungen und Vertragsverwaltung */}
                    <section id="abschnitt-16" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            16. Kostenpflichtige Leistungen und Vertragsverwaltung
                        </h2>
                        <p>
                            Campuna bietet neben kostenlosen Funktionen kostenpflichtige Zusatzleistungen an. Hierzu gehören insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Business-Pakete</li>
                            <li>Premium-Hervorhebungen</li>
                            <li>Premium-Plus-Hervorhebungen</li>
                            <li>Anbieter-Spotlight</li>
                            <li>Weitere kostenpflichtige Sichtbarkeitsoptionen</li>
                        </ul>
                        <p>
                            Bei der Buchung und Verwaltung dieser Leistungen können insbesondere folgende Daten verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Name und Kontaktdaten</li>
                            <li>Rechnungsanschrift</li>
                            <li>Unternehmensdaten</li>
                            <li>Gebuchte Leistungen</li>
                            <li>Vertragsbeginn und Laufzeit</li>
                            <li>Zahlungsstatus</li>
                            <li>Rechnungs- und Transaktionsdaten</li>
                            <li>Vertrags- und Kündigungsstatus</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> zur Durchführung vorvertraglicher Maßnahmen und zur Vertragserfüllung. Soweit handels- und steuerrechtliche Aufbewahrungspflichten bestehen, erfolgt die Verarbeitung auf Grundlage von <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>. Gesetzlich aufbewahrungspflichtige Buchhaltungsunterlagen werden entsprechend den jeweils geltenden gesetzlichen Fristen gespeichert.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 17. Zahlungsabwicklung über Stripe */}
                    <section id="abschnitt-17" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            17. Zahlungsabwicklung über Stripe
                        </h2>
                        <p>
                            Für bestimmte kostenpflichtige Leistungen verwenden wir Stripe. Stripe ermöglicht die Abwicklung von Kartenzahlungen und weiteren unterstützten Zahlungsmethoden.
                        </p>
                        <p>
                            Im Rahmen der Zahlungsabwicklung können insbesondere folgende Daten verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Name und Kontaktdaten</li>
                            <li>Rechnungsdaten</li>
                            <li>Zahlungsbetrag</li>
                            <li>Zahlungsmethode</li>
                            <li>Transaktionsinformationen</li>
                            <li>Technische Verbindungsdaten</li>
                            <li>Informationen zur Betrugsprävention</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Durchführung der Zahlung gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> sowie gegebenenfalls zur Erfüllung gesetzlicher Pflichten gemäß <strong>Art. 6 Abs. 1 lit. c DSGVO</strong>.
                        </p>
                        <p>
                            Stripe kann personenbezogene Daten im Rahmen seiner eigenen datenschutzrechtlichen Verantwortlichkeit verarbeiten und unter Beachtung der gesetzlichen Anforderungen auch an Empfänger außerhalb des Europäischen Wirtschaftsraums übermitteln.
                        </p>
                        <p>
                            Weitere Informationen finden Sie unter: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://stripe.com/de/privacy</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 18. Apple Pay */}
                    <section id="abschnitt-18" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            18. Apple Pay
                        </h2>
                        <p>
                            Soweit Apple Pay als Zahlungsmethode angeboten wird, können zahlungsbezogene Informationen durch Apple, den beteiligten Zahlungsdienstleister und die jeweiligen Zahlungsinstitute verarbeitet werden.
                        </p>
                        <p>
                            Die Verarbeitung erfolgt zur Durchführung der vom Nutzer gewählten Zahlung gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>.
                        </p>
                        <p>
                            Weitere Informationen zum Datenschutz bei Apple: <a href="https://www.apple.com/de/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.apple.com/de/legal/privacy/</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 19. Zahlungsabwicklung über PayPal */}
                    <section id="abschnitt-19" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            19. Zahlungsabwicklung über PayPal
                        </h2>
                        <p>
                            Campuna bietet die Zahlungsabwicklung über PayPal an.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg</p>
                        </div>
                        <p>
                            Bei Auswahl dieser Zahlungsart werden die für die Zahlungsabwicklung erforderlichen Informationen an PayPal übermittelt beziehungsweise dort verarbeitet. Hierzu können insbesondere Name, E-Mail-Adresse, Zahlungsbetrag und Transaktionsinformationen gehören.
                        </p>
                        <p>
                            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO.
                        </p>
                        <p>
                            PayPal verarbeitet bestimmte Informationen auch in eigener datenschutzrechtlicher Verantwortlichkeit, insbesondere zur Zahlungsabwicklung, Betrugsprävention und Erfüllung gesetzlicher Verpflichtungen. Weitere Informationen: <a href="https://www.paypal.com/de/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.paypal.com/de/legalhub/paypal/privacy-full</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 20. Vertragskündigungen */}
                    <section id="abschnitt-20" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            20. Vertragskündigungen
                        </h2>
                        <p>
                            Campuna bietet eine Funktion zur Einreichung und Bearbeitung von Vertragskündigungen. Diese kann innerhalb eines angemeldeten Nutzerkontos oder über eine öffentlich erreichbare Kündigungsseite (<Link href="/vertraege-kuendigen" className="text-forest font-medium underline">/vertraege-kuendigen</Link>) genutzt werden.
                        </p>
                        <p>
                            Dabei können insbesondere folgende Daten verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Name</li>
                            <li>E-Mail-Adresse</li>
                            <li>Vertrags- beziehungsweise Leistungsbezeichnung</li>
                            <li>Nutzerkonto, soweit vorhanden</li>
                            <li>Gewünschter Kündigungstermin</li>
                            <li>Freiwilliger Kündigungsgrund</li>
                            <li>Zeitpunkt des Kündigungseingangs</li>
                            <li>Bearbeitungs- und Bestätigungsstatus</li>
                        </ul>
                        <p>
                            Die Verarbeitung erfolgt zur Vertragsabwicklung gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> sowie zur Erfüllung gesetzlicher Pflichten gemäß <strong>Art. 6 Abs. 1 lit. c DSGVO</strong> (insbesondere § 312k BGB). Soweit erforderlich, können Kündigungsinformationen zur Geltendmachung oder Abwehr von Rechtsansprüchen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO weiterverarbeitet werden.
                        </p>
                        <p>
                            Die Kündigung einer kostenpflichtigen Leistung führt nicht automatisch zur Löschung des gesamten Nutzerkontos.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 21. Transaktions-E-Mails über Brevo */}
                    <section id="abschnitt-21" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            21. Transaktions-E-Mails über Brevo
                        </h2>
                        <p>
                            Für den Versand automatisierter E-Mails verwenden wir den Dienstleister Brevo, ehemals Sendinblue. Hierzu gehören insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Registrierungs- und Bestätigungs-E-Mails</li>
                            <li>Sicherheitsbenachrichtigungen</li>
                            <li>Kontoinformationen</li>
                            <li>Vertrags- und Zahlungsinformationen</li>
                            <li>Kündigungsbestätigungen</li>
                            <li>Weitere für die Nutzung der Plattform erforderliche Mitteilungen</li>
                        </ul>
                        <p>
                            Dabei können insbesondere Name, E-Mail-Adresse, Nachrichteninhalt und technische Versandinformationen verarbeitet werden.
                        </p>
                        <p>
                            Nach Angaben unseres technischen Dienstleisters erfolgt der Versand über die offizielle Brevo REST API v3 unter Verwendung <strong>europäischer Serverstandorte in Frankfurt und Paris</strong>.
                        </p>
                        <p>
                            <strong>Rechtsgrundlagen:</strong> Art. 6 Abs. 1 lit. b DSGVO, soweit die Nachrichten zur Vertragserfüllung erforderlich sind, sowie Art. 6 Abs. 1 lit. c oder lit. f DSGVO bei gesetzlichen beziehungsweise sicherheitsbezogenen Mitteilungen.
                        </p>
                        <p>
                            Weitere Informationen: <a href="https://www.brevo.com/de/legal/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.brevo.com/de/legal/privacypolicy/</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 22. Kontaktaufnahme */}
                    <section id="abschnitt-22" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            22. Kontaktaufnahme
                        </h2>
                        <p>
                            Wenn Sie uns per E-Mail oder über ein bereitgestelltes Kontaktformular kontaktieren, verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung Ihrer Anfrage. Hierzu gehören insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Name</li>
                            <li>E-Mail-Adresse</li>
                            <li>Nachrichteninhalt</li>
                            <li>Freiwillige weitere Angaben</li>
                        </ul>
                        <p>
                            Steht die Anfrage im Zusammenhang mit einem Vertrag oder einer Vertragsanbahnung, erfolgt die Verarbeitung gemäß <strong>Art. 6 Abs. 1 lit. b DSGVO</strong>. Bei sonstigen Anfragen erfolgt die Verarbeitung auf Grundlage von <strong>Art. 6 Abs. 1 lit. f DSGVO</strong>.
                        </p>
                        <p>
                            Die Daten werden gelöscht, sobald sie zur Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten oder sonstigen rechtmäßigen Gründe für eine weitere Speicherung bestehen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 23. Google Analytics */}
                    <section id="abschnitt-23" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            23. Google Analytics
                        </h2>
                        <p>
                            Campuna sieht den Einsatz von Google Analytics zur statistischen Auswertung der Website-Nutzung vor.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland</p>
                        </div>
                        <p>
                            Bei Aktivierung können insbesondere folgende Informationen verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Seitenaufrufe</li>
                            <li>Nutzungsdauer und Interaktionen</li>
                            <li>Geräte- und Browserinformationen</li>
                            <li>Ungefährer geografischer Standort</li>
                            <li>Technische Identifikatoren</li>
                            <li>Herkunft von Websitebesuchen</li>
                        </ul>
                        <p>
                            Die Verwendung von Google Analytics erfolgt <strong>nur nach vorheriger Einwilligung</strong> des Nutzers. Rechtsgrundlagen sind <strong>§ 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO</strong>.
                        </p>
                        <p>
                            Die Einwilligungsverwaltung ist über Cookiebot und Google Consent Mode v2 vorgesehen. Nach der technischen Aktivierung können Nutzer ihre Einwilligung jederzeit über die Cookie-Einstellungen widerrufen.
                        </p>
                        <p>
                            Eine Übermittlung personenbezogener Daten an Google-Unternehmen und gegebenenfalls in Drittländer kann im Rahmen der Nutzung erfolgen. Dabei sind die Anforderungen der Art. 44 ff. DSGVO zu beachten. Weitere Informationen: <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://policies.google.com/privacy?hl=de</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 24. Google Ads und Conversion-Tracking */}
                    <section id="abschnitt-24" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            24. Google Ads und Conversion-Tracking
                        </h2>
                        <p>
                            Campuna sieht den Einsatz von Google Ads zur Bewerbung der Plattform und zur Messung der Wirksamkeit von Werbekampagnen vor.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland</p>
                        </div>
                        <p>
                            Beim Conversion-Tracking kann erfasst werden, ob Nutzer nach dem Anklicken einer Werbeanzeige bestimmte Aktionen auf Campuna durchführen, beispielsweise eine Registrierung oder Buchung. Dabei können Cookies, technische Identifikatoren und Informationen über Nutzungsereignisse verarbeitet werden.
                        </p>
                        <p>
                            Die Verarbeitung erfolgt nach technischer Aktivierung ausschließlich auf Grundlage einer entsprechenden Einwilligung gemäß <strong>§ 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO</strong>. Die Einwilligung kann über Cookiebot erteilt und jederzeit mit Wirkung für die Zukunft widerrufen werden. Weitere Informationen: <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://policies.google.com/privacy?hl=de</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 25. Meta Pixel (Facebook und Instagram) */}
                    <section id="abschnitt-25" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            25. Meta Pixel (Facebook und Instagram)
                        </h2>
                        <p>
                            Campuna unterhält Präsenzen auf Facebook und Instagram und kann künftig Werbekampagnen über die Dienste von Meta durchführen. Hierfür ist der Einsatz des Meta Pixels vorgesehen.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>Meta Platforms Ireland Limited, Merrion Road, Dublin 4, Irland</p>
                        </div>
                        <p>
                            Das Meta Pixel ermöglicht nach seiner Aktivierung die Messung von Werbekampagnen, die Zuordnung bestimmter Websiteaktionen zu Werbeanzeigen und gegebenenfalls die Bildung von Zielgruppen für Werbemaßnahmen. Dabei können insbesondere folgende Daten verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Seitenaufrufe</li>
                            <li>Interaktionen mit der Website</li>
                            <li>Technische Geräte- und Browserinformationen</li>
                            <li>IP-Adresse</li>
                            <li>Cookie- und Gerätekennungen</li>
                            <li>Conversion-Ereignisse</li>
                        </ul>
                        <p>
                            Das Meta Pixel wird <strong>nur nach vorheriger Einwilligung</strong> des Nutzers eingesetzt. Rechtsgrundlagen sind <strong>§ 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO</strong>. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft über die Cookie-Einstellungen widerrufen werden.
                        </p>
                        <p>
                            Bei Aktivierung des Meta Pixels können personenbezogene Daten an Meta übermittelt und gegebenenfalls außerhalb des Europäischen Wirtschaftsraums verarbeitet werden. Dabei gelten die gesetzlichen Anforderungen an internationale Datenübermittlungen. Weitere Informationen: <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.facebook.com/privacy/policy/</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 26. TikTok Pixel */}
                    <section id="abschnitt-26" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            26. TikTok Pixel
                        </h2>
                        <p>
                            Campuna unterhält eine Präsenz auf TikTok und kann künftig Werbekampagnen über TikTok durchführen. Hierfür ist der Einsatz des TikTok Pixels vorgesehen.
                        </p>
                        <div className="bg-white/60 rounded-xl p-4 border border-forest/10 text-xs sm:text-sm font-normal text-charcoal/80">
                            <p className="font-semibold text-forest">Anbieter:</p>
                            <p>TikTok Technology Limited, 10 Earlsfort Terrace, Dublin 2, Irland</p>
                        </div>
                        <p>
                            Das TikTok Pixel kann nach seiner Aktivierung dazu verwendet werden, Websiteinteraktionen und die Wirksamkeit von Werbeanzeigen zu messen. Dabei können insbesondere folgende Informationen verarbeitet werden:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Seitenaufrufe</li>
                            <li>Nutzungs- und Interaktionsereignisse</li>
                            <li>Geräte- und Browserinformationen</li>
                            <li>IP-Adresse</li>
                            <li>Technische Identifikatoren</li>
                            <li>Conversion-Ereignisse</li>
                        </ul>
                        <p>
                            Der Einsatz erfolgt <strong>nur nach vorheriger Einwilligung</strong> gemäß <strong>§ 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO</strong>. Die Einwilligung kann jederzeit über die Cookie-Einstellungen widerrufen werden.
                        </p>
                        <p>
                            Bei der Nutzung können personenbezogene Daten an TikTok übermittelt und gegebenenfalls außerhalb des Europäischen Wirtschaftsraums verarbeitet werden. Dabei sind die geltenden datenschutzrechtlichen Anforderungen einzuhalten. Weitere Informationen: <a href="https://www.tiktok.com/legal/page/eea/privacy-policy/de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.tiktok.com/legal/page/eea/privacy-policy/de</a>
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 27. Social-Media-Präsenzen und externe Links */}
                    <section id="abschnitt-27" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            27. Social-Media-Präsenzen und externe Links
                        </h2>
                        <p>
                            Campuna unterhält eigene Präsenzen auf sozialen Netzwerken, insbesondere Facebook, Instagram und TikTok. Diese dienen der Kommunikation mit Interessenten und Nutzern, der Öffentlichkeitsarbeit und der Information über unsere Plattform.
                        </p>
                        <p>
                            Beim Besuch unserer Social-Media-Präsenzen können die jeweiligen Plattformbetreiber personenbezogene Daten in eigener oder, soweit gesetzlich vorgesehen, gemeinsamer Verantwortlichkeit verarbeiten. Für die Verarbeitung durch die Plattformbetreiber gelten ergänzend deren jeweilige Datenschutzbestimmungen.
                        </p>
                        <p>
                            Soweit Campuna selbst personenbezogene Daten im Rahmen der Kommunikation über soziale Netzwerke verarbeitet, erfolgt dies je nach Zweck auf Grundlage von Art. 6 Abs. 1 lit. b oder lit. f DSGVO beziehungsweise einer erteilten Einwilligung.
                        </p>
                        <p>
                            Das bloße Vorhandensein eines Links zu einem sozialen Netzwerk bedeutet nicht, dass dadurch bereits ein Tracking-Pixel auf Campuna aktiviert wird.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 28. Empfänger personenbezogener Daten */}
                    <section id="abschnitt-28" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            28. Empfänger personenbezogener Daten
                        </h2>
                        <p>
                            Wir geben personenbezogene Daten nur weiter, soweit dies zur Bereitstellung unserer Leistungen, zur Vertragserfüllung, zur Erfüllung gesetzlicher Pflichten oder aufgrund einer sonstigen gesetzlichen Rechtsgrundlage erforderlich ist.
                        </p>
                        <p>
                            Zu den Empfängern beziehungsweise Empfängerkategorien können insbesondere gehören:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Hosting- und Backup-Dienstleister (IONOS SE, Acronis)</li>
                            <li>Zahlungsdienstleister (Stripe, PayPal, Apple Pay)</li>
                            <li>E-Mail-Dienstleister (Brevo)</li>
                            <li>Anbieter zur Verwaltung von Cookie-Einwilligungen (Cookiebot / Usercentrics)</li>
                            <li>Analyse- und Marketingdienstleister nach entsprechender Einwilligung</li>
                            <li>Berechtigte technische Dienstleister</li>
                            <li>Behörden und öffentliche Stellen bei entsprechender gesetzlicher Verpflichtung</li>
                        </ul>
                        <p>
                            Soweit Dienstleister personenbezogene Daten in unserem Auftrag verarbeiten, erfolgt dies auf Grundlage der Anforderungen des Art. 28 DSGVO.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 29. Datenübermittlung in Drittländer */}
                    <section id="abschnitt-29" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            29. Datenübermittlung in Drittländer
                        </h2>
                        <p>
                            Die zentrale Campuna-Anwendung, die PostgreSQL-Datenbank, hochgeladene Dateien und die lokal betriebene KI-Moderation werden nach Angaben unseres technischen Dienstleisters <strong>innerhalb der Europäischen Union</strong> betrieben.
                        </p>
                        <p>
                            Bei der Nutzung externer Dienste, insbesondere Zahlungsdienstleister sowie künftig gegebenenfalls Analyse- und Marketingdiensten, können personenbezogene Daten auch außerhalb der Europäischen Union beziehungsweise des Europäischen Wirtschaftsraums verarbeitet werden.
                        </p>
                        <p>
                            Soweit solche Übermittlungen stattfinden, erfolgen sie unter Beachtung der Anforderungen der Art. 44 ff. DSGVO. Hierzu gehören insbesondere Angemessenheitsbeschlüsse der Europäischen Kommission, geeignete vertragliche Garantien oder andere gesetzlich zulässige Übermittlungsgrundlagen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 30. Speicherdauer und Löschung personenbezogener Daten */}
                    <section id="abschnitt-30" className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            30. Speicherdauer und Löschung personenbezogener Daten
                        </h2>
                        <p>
                            Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Für die technische Datenverarbeitung gelten insbesondere folgende Regelungen:
                        </p>
                        <div className="bg-white/80 rounded-2xl p-6 border border-forest/10 shadow-xs space-y-3 text-xs sm:text-sm">
                            <p><strong>• Nutzerkonten:</strong> Bei der Kontolöschung werden der Nutzerdatensatz und die zugehörigen Daten dauerhaft aus der produktiven PostgreSQL-Datenbank entfernt.</p>
                            <p><strong>• Inserate:</strong> Bei Löschung werden die entsprechenden Datenbankeinträge und zugehörigen Datensätze dauerhaft entfernt.</p>
                            <p><strong>• Nachrichten und Konversationen:</strong> Diese werden bei Löschung des zugehörigen Nutzerkontos beziehungsweise Inserats entsprechend den technischen Löschregeln dauerhaft aus der produktiven Datenbank entfernt.</p>
                            <p><strong>• Moderationsprotokolle:</strong> Diese werden für die Dauer des jeweiligen Inserats gespeichert und bei dessen Löschung beziehungsweise bei Löschung des Nutzerkontos entfernt.</p>
                            <p><strong>• Hochgeladene Dateien:</strong> Nach Löschung der zugehörigen Datensätze können physische Dateireste bis zur nächsten regelmäßigen Serverbereinigung verbleiben.</p>
                            <p><strong>• Server-Logfiles:</strong> Grundsätzlich 7 bis 14 Tage.</p>
                            <p><strong>• Lokale Datenbank-Backups:</strong> 14 Tage (rotierend).</p>
                            <p><strong>• Vollständige Server-Backups:</strong> 30 Tage (rotierend).</p>
                            <p><strong>• Vertrags- und Rechnungsdaten:</strong> Speicherung entsprechend den jeweils geltenden handels- und steuerrechtlichen Aufbewahrungspflichten.</p>
                            <p><strong>• Kontaktanfragen:</strong> Speicherung bis zum Abschluss der Bearbeitung, soweit keine weiteren gesetzlichen Aufbewahrungspflichten oder berechtigten Gründe bestehen.</p>
                        </div>
                        <p>
                            Eine weitergehende Speicherung erfolgt nur, soweit hierfür eine gesetzliche Grundlage besteht.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 31. Datensicherheit */}
                    <section id="abschnitt-31" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            31. Datensicherheit
                        </h2>
                        <p>
                            Wir treffen geeignete technische und organisatorische Maßnahmen, um personenbezogene Daten vor Verlust, unberechtigtem Zugriff, Manipulation und unzulässiger Verarbeitung zu schützen. Hierzu gehören insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                            <li>Verschlüsselte Datenübertragung mittels HTTPS/TLS</li>
                            <li>Zugriffsbeschränkungen auf technische Systeme</li>
                            <li>Berechtigungsverwaltung</li>
                            <li>Datensicherungen innerhalb der Europäischen Union</li>
                            <li>Maßnahmen zur Überwachung der Systemsicherheit</li>
                            <li>Technische Schutzmaßnahmen gegen missbräuchliche Zugriffe</li>
                        </ul>
                        <p>
                            Die Sicherheitsmaßnahmen werden unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der bestehenden Risiken regelmäßig überprüft.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 32. Rechte betroffener Personen */}
                    <section id="abschnitt-32" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            32. Rechte betroffener Personen
                        </h2>
                        <p>
                            Ihnen stehen nach Maßgabe der gesetzlichen Voraussetzungen folgende Rechte zu:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm font-normal">
                            <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über die Verarbeitung Ihrer personenbezogenen Daten verlangen.</li>
                            <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger oder die Vervollständigung unvollständiger Daten verlangen.</li>
                            <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können unter den gesetzlichen Voraussetzungen die Löschung Ihrer personenbezogenen Daten verlangen.</li>
                            <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können unter bestimmten Voraussetzungen die Einschränkung der Verarbeitung verlangen.</li>
                            <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können unter den gesetzlichen Voraussetzungen verlangen, bestimmte Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.</li>
                            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können aus Gründen, die sich aus Ihrer besonderen Situation ergeben, einer Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder lit. f DSGVO widersprechen. Gegen eine Verarbeitung zum Zweck der Direktwerbung können Sie jederzeit Widerspruch einlegen.</li>
                            <li><strong>Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt.</li>
                        </ul>
                        <p className="pt-1">
                            Zur Ausübung Ihrer Rechte können Sie sich jederzeit an <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a> wenden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 33. Beschwerderecht */}
                    <section id="abschnitt-33" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            33. Beschwerderecht
                        </h2>
                        <p>
                            Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen geltendes Datenschutzrecht verstößt.
                        </p>
                        <div className="bg-white/80 p-5 rounded-2xl border border-forest/10 space-y-1 text-xs sm:text-sm">
                            <p className="font-bold text-forest">Zuständige Aufsichtsbehörde:</p>
                            <p>Thüringer Landesbeauftragter für den Datenschutz und die Informationsfreiheit (TLfDI)</p>
                            <p>Website: <a href="https://www.tlfdi.de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.tlfdi.de</a></p>
                        </div>
                        <p>
                            Sie können sich auch an eine andere zuständige Datenschutzaufsichtsbehörde wenden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 34. Bereitstellung personenbezogener Daten */}
                    <section id="abschnitt-34" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            34. Bereitstellung personenbezogener Daten
                        </h2>
                        <p>
                            Die Bereitstellung bestimmter personenbezogener Daten ist erforderlich, um ein Nutzerkonto anzulegen, Inserate zu veröffentlichen, kostenpflichtige Leistungen zu buchen oder weitere Plattformfunktionen zu nutzen.
                        </p>
                        <p>
                            Ohne die jeweils erforderlichen Angaben können die entsprechenden Leistungen gegebenenfalls nicht bereitgestellt werden.
                        </p>
                        <p>
                            Öffentlich zugängliche Bereiche von Campuna können grundsätzlich auch ohne Registrierung besucht werden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 35. Änderungen dieser Datenschutzerklärung */}
                    <section id="abschnitt-35" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            35. Änderungen dieser Datenschutzerklärung
                        </h2>
                        <p>
                            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich gesetzliche Anforderungen, technische Abläufe oder die auf Campuna eingesetzten Dienste ändern.
                        </p>
                        <p>
                            Die jeweils aktuelle Fassung ist auf unserer Website dauerhaft abrufbar.
                        </p>
                        <div className="pt-4 text-xs text-charcoal/60 font-sans">
                            Stand: 16. Oktober 2026
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
