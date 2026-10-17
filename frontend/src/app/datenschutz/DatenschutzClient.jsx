'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ShieldCheck
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
                        Privatsphäre &amp; Sicherheit
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
                        Informationen über die Verarbeitung personenbezogener Daten auf der Plattform Campuna | Stand: 16. Oktober 2026
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
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">

                    {/* 1. Allgemeine Hinweise zum Datenschutz */}
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
                            Diese Datenschutzerklärung gilt für die Website <a href="https://www.campuna.de" className="text-forest font-medium underline">www.campuna.de</a> sowie die darüber angebotenen Funktionen und Dienste. Für externe Websites, auf die wir lediglich verlinken, gelten die Datenschutzbestimmungen der jeweiligen Betreiber.
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
                            <p className="text-charcoal/80">Premnitzer Straße 8, 99091 Erfurt, Deutschland</p>
                            <div className="pt-2 border-t border-forest/10 mt-3 space-y-1 text-sm">
                                <p><strong>Telefon:</strong> +49 163 1516518 | <strong>E-Mail:</strong> <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a> | <strong>Website:</strong> <a href="https://www.campuna.de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.campuna.de</a></p>
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
                            Campuna wird auf einem Virtual Private Server (VPS) der IONOS SE betrieben (IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, Deutschland). Der produktive Server befindet sich in <strong>Spanien und damit innerhalb der Europäischen Union</strong>.
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
                            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, soweit sie zur Bereitstellung der vereinbarten Plattformfunktionen erforderlich ist, sowie Art. 6 Abs. 1 lit. f DSGVO zur Gewährleistung eines sicheren, stabilen und zuverlässigen Betriebs. Soweit IONOS personenbezogene Daten in unserem Auftrag verarbeitet, erfolgt dies auf Grundlage der datenschutzrechtlichen Anforderungen des Art. 28 DSGVO.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 4. Server-Logfiles */}
                    <section id="abschnitt-4" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            4. Server-Logfiles
                        </h2>
                        <p>
                            Beim Besuch unserer Website werden technisch erforderliche Zugriffsdaten verarbeitet (IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seiten und Dateien, Browsertyp und Browserversion, Betriebssystem, Referrer-URL, HTTP-Statuscode, technische Verbindungsinformationen).
                        </p>
                        <p>
                            Diese Daten werden benötigt, um die Website bereitzustellen, technische Fehler zu erkennen, die Systemsicherheit zu gewährleisten und Angriffe, insbesondere DDoS-Angriffe, abzuwehren.
                        </p>
                        <p>
                            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse besteht im sicheren und störungsfreien Betrieb der Plattform.
                        </p>
                        <p>
                            <strong>Speicherdauer:</strong> Server-Zugriffsprotokolle werden grundsätzlich für 7 bis 14 Tage gespeichert und anschließend gelöscht, sofern keine weitere Speicherung zur Untersuchung konkreter Sicherheitsvorfälle oder aufgrund gesetzlicher Verpflichtungen erforderlich ist.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 5. Datensicherung und Backups */}
                    <section id="abschnitt-5" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            5. Datensicherung und Backups
                        </h2>
                        <p>
                            Zum Schutz vor Datenverlust und zur Wiederherstellung der Plattform werden regelmäßige Datensicherungen durchgeführt. Campuna verwendet zwei Sicherungsebenen:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li>
                                <strong>Lokale Datenbank-Backups:</strong> Diese werden auf dem IONOS-Server in Spanien gespeichert und für 14 Tage aufbewahrt.
                            </li>
                            <li>
                                <strong>Vollständige Server-Backups:</strong> Diese erfolgen über IONOS Backup unter Verwendung der Backup-Technologie von Acronis. Die Sicherungen werden innerhalb der Europäischen Union gespeichert und für 30 Tage aufbewahrt.
                            </li>
                        </ul>
                        <p>
                            Die Verarbeitung dient der Gewährleistung der Verfügbarkeit, Integrität und Wiederherstellbarkeit unserer Systeme. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Personenbezogene Daten, die bereits aus dem Produktivsystem gelöscht wurden, können vorübergehend noch in vorhandenen Datensicherungen enthalten sein. Diese werden entsprechend den genannten Aufbewahrungszyklen überschrieben beziehungsweise gelöscht.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 6. Cookies und vergleichbare Technologien */}
                    <section id="abschnitt-6" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            6. Cookies und vergleichbare Technologien
                        </h2>
                        <p>
                            Campuna verwendet Cookies und vergleichbare Technologien, um die Website technisch bereitzustellen und bestimmte Funktionen zu ermöglichen. Technisch notwendige Cookies dienen insbesondere der Anmeldung und Authentifizierung, der Verwaltung von Nutzersitzungen, der Sicherheit der Plattform, der Speicherung von Cookie-Einstellungen und der Bereitstellung grundlegender Funktionen (§ 25 Abs. 2 TDDDG, Art. 6 Abs. 1 lit. b / lit. f DSGVO).
                        </p>
                        <p>
                            Für nicht notwendige Analyse- und Marketingtechnologien wird vor deren Einsatz eine Einwilligung eingeholt (Rechtsgrundlagen: § 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO). Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft über die Cookie-Einstellungen widerrufen oder geändert werden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 7. Cookie-Einwilligungsverwaltung mit Cookiebot */}
                    <section id="abschnitt-7" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            7. Cookie-Einwilligungsverwaltung mit Cookiebot
                        </h2>
                        <p>
                            Zur Verwaltung der Cookie-Einstellungen verwenden wir Cookiebot (Usercentrics A/S, Havnegade 39, 1058 Kopenhagen K, Dänemark). Cookiebot ermöglicht es, Einwilligungen für unterschiedliche Kategorien von Cookies und Tracking-Technologien zu erteilen, abzulehnen oder nachträglich zu ändern. Dabei werden IP-Adresse, Zeitpunkt der Einwilligung, Einwilligungsstatus, Browserinformationen und technische Identifikationsmerkmale verarbeitet (Art. 6 Abs. 1 lit. c und lit. f DSGVO).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 8. Registrierung und Nutzerkonten */}
                    <section id="abschnitt-8" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            8. Registrierung und Nutzerkonten
                        </h2>
                        <p>
                            Für die Nutzung bestimmter Funktionen von Campuna ist die Erstellung eines Nutzerkontos erforderlich. Dabei verarbeiten wir Name bzw. Benutzername, E-Mail-Adresse, Passwort in geschützter Form, Kontotyp (privat oder gewerblich), Profilinformationen, Registrierungsdatum, Kontoeinstellungen sowie Vertrags- und Nutzungsinformationen (Art. 6 Abs. 1 lit. b DSGVO).
                        </p>
                        <p>
                            Zur Überprüfung der E-Mail-Adresse können Bestätigungsnachrichten über unseren E-Mail-Dienstleister Brevo versendet werden.
                        </p>
                        <p>
                            Bei der Löschung eines Nutzerkontos werden der zugehörige Nutzerdatensatz und die damit verknüpften Daten aus der produktiven PostgreSQL-Datenbank dauerhaft entfernt. Hierzu gehören insbesondere Profile, Inserate, Nachrichten, Konversationen, Favoriten, Abonnementdaten, Guthaben- bzw. Credit-Datensätze und weitere kontobezogene Informationen. Gesetzliche Aufbewahrungspflichten und erforderliche Sicherungen von Buchhaltungsunterlagen bleiben hiervon unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 9. Private und gewerbliche Nutzerprofile */}
                    <section id="abschnitt-9" className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            9. Private und gewerbliche Nutzerprofile
                        </h2>
                        <div className="space-y-2 pt-1">
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
                                Gewerbliche Anbieter können einen eigenen Firmenauftritt auf Campuna erstellen (Firmenname, Beschreibung, Logo, Kontaktdaten, Geschäftsanschrift, Website, Social-Media-Links, Impressumsangaben, Inserate; Art. 6 Abs. 1 lit. b DSGVO). Öffentlich bereitgestellte Profilinformationen können auch von Suchmaschinen erfasst und indexiert werden.
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
                            Registrierte Nutzer können campingbezogene Inserate veröffentlichen (Titel, Beschreibung, Kategorie, Preis, Standort, Bilder, Anbieterzuordnung, Status; Art. 6 Abs. 1 lit. b DSGVO). Bei der Löschung eines Inserats werden der zugehörige Datensatz und die damit verbundenen Daten aus der produktiven PostgreSQL-Datenbank dauerhaft gelöscht (zugehörige Konversationen, Nachrichten, Meldungen, Moderationsprotokolle, Favoriten). Hochgeladene Bilddateien werden von der Datenbankverknüpfung getrennt; physische Dateireste werden im Rahmen regelmäßiger Serverbereinigungen entfernt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 11. Nachrichtenfunktion */}
                    <section id="abschnitt-11" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            11. Nachrichtenfunktion
                        </h2>
                        <p>
                            Campuna stellt eine Nachrichtenfunktion zur direkten Kommunikation zwischen Nutzern bereit (Absender, Empfänger, Inhalt, Zeitpunkt, zugehöriges Inserat; Art. 6 Abs. 1 lit. b DSGVO). Nachrichten sind nicht öffentlich sichtbar und werden grundsätzlich nur den jeweiligen Kommunikationspartnern angezeigt. Bei der Löschung des zugehörigen Nutzerkontos oder Inserats werden die betroffenen Konversationen und Nachrichten dauerhaft aus der produktiven Datenbank entfernt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 12. Favoriten und Merklisten */}
                    <section id="abschnitt-12" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            12. Favoriten und Merklisten
                        </h2>
                        <p>
                            Registrierte Nutzer können Inserate in einer persönlichen Merkliste speichern (Art. 6 Abs. 1 lit. b DSGVO). Favoriten sind nur für den jeweiligen Nutzer sichtbar und werden gelöscht, sobald der Nutzer sie entfernt oder das Konto/Inserat gelöscht wird.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 13. Inseratsstatistiken */}
                    <section id="abschnitt-13" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            13. Inseratsstatistiken
                        </h2>
                        <p>
                            Campuna kann Anbietern statistische Informationen zur Nutzung ihrer Inserate bereitstellen (Aufrufe, Favoriten, Interaktionsereignisse; Art. 6 Abs. 1 lit. b / lit. f DSGVO). Anbieter erhalten grundsätzlich zusammengefasste Kennzahlen ohne Personenbezug.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 14. KI-gestützte Inhaltsmoderation */}
                    <section id="abschnitt-14" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            14. KI-gestützte Inhaltsmoderation
                        </h2>
                        <p>
                            Campuna setzt zur Überprüfung von Inseraten ein KI-gestütztes Moderationssystem ein. Hierfür wird das Sprachmodell <strong>Qwen 3 lokal auf dem Campuna-Server bei IONOS in Spanien</strong> betrieben. Die Verarbeitung erfolgt innerhalb der Europäischen Union ohne Übermittlung an externe Cloud-KI-Dienstleister.
                        </p>
                        <p>
                            Das System prüft auf Betrug, Spam, verbotene Waren, Waffen, Drogen und unzulässige Inhalte. Ergebnisse: Automatische Freigabe, Manuelle Überprüfung durch Administrator oder Automatische Ablehnung. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (ergänzend lit. c DSGVO). Moderationsprotokolle werden für die Dauer des Inserats gespeichert und bei Löschung des Inserats/Kontos dauerhaft entfernt. Nutzer können sich bei Einwänden an <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a> wenden.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 15. Meldung von Inseraten und Missbrauchsbekämpfung */}
                    <section id="abschnitt-15" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            15. Meldung von Inseraten und Missbrauchsbekämpfung
                        </h2>
                        <p>
                            Nutzer können auffällige oder unzulässige Inserate melden (Art. 6 Abs. 1 lit. f / lit. c DSGVO). Meldedaten werden bei Löschung des Inserats aus der Produktivdatenbank entfernt, sofern keine gesonderte Aufbewahrung rechtlich vorgeschrieben ist.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 16. Kostenpflichtige Leistungen und Vertragsverwaltung */}
                    <section id="abschnitt-16" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            16. Kostenpflichtige Leistungen und Vertragsverwaltung
                        </h2>
                        <p>
                            Bei der Buchung von Business-Paketen, Hervorhebungen (Premium, Premium Plus) und Spotlights verarbeiten wir Kontaktdaten, Rechnungsanschrift, Rechnungs- und Transaktionsdaten zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) sowie zur Erfüllung steuerrechtlicher Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 17. Zahlungsabwicklung über Stripe */}
                    <section id="abschnitt-17" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            17. Zahlungsabwicklung über Stripe
                        </h2>
                        <p>
                            Für kostenpflichtige Leistungen verwenden wir Stripe (Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland) zur sicheren Abwicklung von Kartenzahlungen (Art. 6 Abs. 1 lit. b / lit. c DSGVO; <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://stripe.com/de/privacy</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 18. Apple Pay */}
                    <section id="abschnitt-18" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            18. Apple Pay
                        </h2>
                        <p>
                            Soweit Apple Pay als Zahlungsmethode angeboten wird, erfolgt die Abwicklung über Apple Distribution International Ltd. und die beteiligten Finanzinstitute (Art. 6 Abs. 1 lit. b DSGVO; <a href="https://www.apple.com/de/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.apple.com/de/legal/privacy/</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 19. Zahlungsabwicklung über PayPal */}
                    <section id="abschnitt-19" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            19. Zahlungsabwicklung über PayPal
                        </h2>
                        <p>
                            Campuna bietet die Zahlungsabwicklung über PayPal an (PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg; Art. 6 Abs. 1 lit. b DSGVO; <a href="https://www.paypal.com/de/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.paypal.com/de/legalhub/paypal/privacy-full</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 20. Vertragskündigungen */}
                    <section id="abschnitt-20" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            20. Vertragskündigungen
                        </h2>
                        <p>
                            Campuna bietet eine gesetzliche Online-Kündigungsfunktion gem. § 312k BGB unter <Link href="/vertraege-kuendigen" className="text-forest font-semibold underline hover:text-forest/80">/vertraege-kuendigen</Link> an (Art. 6 Abs. 1 lit. b / lit. c DSGVO). Die Kündigung einer Zusatzleistung führt nicht automatisch zur Löschung des gesamten Nutzerkontos.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 21. Transaktions-E-Mails über Brevo */}
                    <section id="abschnitt-21" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            21. Transaktions-E-Mails über Brevo
                        </h2>
                        <p>
                            Für den automatisierten E-Mail-Versand (Bestätigungen, Benachrichtigungen, Kündigungsbelege) nutzen wir Brevo (Brevo SAS, Paris, Frankreich) über die offizielle REST API v3 mit Serverstandorten in Frankfurt und Paris (Art. 6 Abs. 1 lit. b / lit. c / lit. f DSGVO; <a href="https://www.brevo.com/de/legal/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.brevo.com/de/legal/privacypolicy/</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 22. Kontaktaufnahme */}
                    <section id="abschnitt-22" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            22. Kontaktaufnahme
                        </h2>
                        <p>
                            Bei Kontakt per E-Mail oder Kontaktformular verarbeiten wir die mitgeteilten Daten zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b / lit. f DSGVO) und löschen sie nach abschließender Klärung.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 23. Google Analytics */}
                    <section id="abschnitt-23" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            23. Google Analytics
                        </h2>
                        <p>
                            Google Analytics (Google Ireland Limited, Dublin, Irland) wird nur nach ausdrücklicher vorheriger Einwilligung über Cookiebot und Google Consent Mode v2 eingesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO; <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://policies.google.com/privacy?hl=de</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 24. Google Ads und Conversion-Tracking */}
                    <section id="abschnitt-24" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            24. Google Ads und Conversion-Tracking
                        </h2>
                        <p>
                            Der Einsatz von Google Ads Conversion-Tracking zur Reichweitenmessung erfolgt nach Aktivierung ausschließlich auf Grundlage Ihrer Einwilligung gem. § 25 Abs. 1 TDDDG und Art. 6 Abs. 1 lit. a DSGVO.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 25. Meta Pixel (Facebook und Instagram) */}
                    <section id="abschnitt-25" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            25. Meta Pixel (Facebook und Instagram)
                        </h2>
                        <p>
                            Das Meta Pixel (Meta Platforms Ireland Limited, Dublin, Irland) wird nach technischer Aktivierung nur nach vorheriger Einwilligung eingesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO; <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.facebook.com/privacy/policy/</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 26. TikTok Pixel */}
                    <section id="abschnitt-26" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            26. TikTok Pixel
                        </h2>
                        <p>
                            Das TikTok Pixel (TikTok Technology Limited, Dublin, Irland) wird nach technischer Aktivierung nur nach vorheriger Einwilligung eingesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO; <a href="https://www.tiktok.com/legal/page/eea/privacy-policy/de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.tiktok.com/legal/page/eea/privacy-policy/de</a>).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 27. Social-Media-Präsenzen und externe Links */}
                    <section id="abschnitt-27" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            27. Social-Media-Präsenzen und externe Links
                        </h2>
                        <p>
                            Campuna unterhält Profile auf Facebook, Instagram und TikTok. Das bloße Vorhandensein von Verlinkungen aktiviert keine Tracking-Pixel auf Campuna.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 28. Empfänger personenbezogener Daten */}
                    <section id="abschnitt-28" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            28. Empfänger personenbezogener Daten
                        </h2>
                        <p>
                            Empfängerkategorien: Hosting- und Backup-Dienstleister (IONOS SE, Acronis), Zahlungsdienstleister (Stripe, PayPal, Apple Pay), E-Mail-Dienstleister (Brevo), Cookiebot/Usercentrics, beauftragte technische Dienstleister und gesetzliche Behörden (Art. 28 DSGVO).
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 29. Datenübermittlung in Drittländer */}
                    <section id="abschnitt-29" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            29. Datenübermittlung in Drittländer
                        </h2>
                        <p>
                            Kernanwendung, Datenbank, Dateien und KI-Moderation laufen ausschließlich innerhalb der EU. Bei externen Zahlungs- und Marketingdiensten erfolgt eine eventuelle Drittlandübermittlung nur nach den strengen Garantien der Art. 44 ff. DSGVO.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 30. Speicherdauer und Löschung personenbezogener Daten */}
                    <section id="abschnitt-30" className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            30. Speicherdauer und Löschung personenbezogener Daten
                        </h2>
                        <div className="bg-white/80 rounded-2xl p-6 border border-forest/10 shadow-xs space-y-2 text-xs sm:text-sm">
                            <p>• <strong>Nutzerkonten:</strong> Vollständige kaskadierende Löschung aus PostgreSQL bei Kontolöschung.</p>
                            <p>• <strong>Inserate &amp; Nachrichten:</strong> Dauerhafte Entfernung aus Produktivdatenbank bei Löschung.</p>
                            <p>• <strong>Moderationsprotokolle:</strong> Löschung zusammen mit dem zugehörigen Inserat.</p>
                            <p>• <strong>Hochgeladene Dateien:</strong> Bereinigung im Rahmen regelmäßiger Server-Wartungsroutinen.</p>
                            <p>• <strong>Server-Logfiles:</strong> 7 bis 14 Tage.</p>
                            <p>• <strong>Lokale Datenbank-Backups:</strong> 14 Tage (rotierend).</p>
                            <p>• <strong>Vollständige Server-Backups:</strong> 30 Tage (rotierend).</p>
                            <p>• <strong>Rechnungs- und Buchhaltungsdaten:</strong> Gesetzliche Fristen (HGB/AO, 6 bzw. 10 Jahre).</p>
                            <p>• <strong>Kontaktanfragen:</strong> Bis zum Abschluss der Bearbeitung.</p>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 31. Datensicherheit */}
                    <section id="abschnitt-31" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            31. Datensicherheit
                        </h2>
                        <p>
                            Verschlüsselte Datenübertragung (HTTPS/TLS), strenge Berechtigungs- und Zugriffskonzepte, Serverstandort in der EU und kontinuierliche Sicherheitsüberwachung schützen Ihre Daten vor unbefugtem Zugriff.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 32. Rechte betroffener Personen */}
                    <section id="abschnitt-32" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            32. Rechte betroffener Personen
                        </h2>
                        <p>
                            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) und jederzeitigen Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO). Wenden Sie sich hierzu an <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a>.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 33. Beschwerderecht */}
                    <section id="abschnitt-33" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            33. Beschwerderecht
                        </h2>
                        <p>
                            Zuständige Aufsichtsbehörde: <strong>Thüringer Landesbeauftragter für den Datenschutz und die Informationsfreiheit (TLfDI)</strong>, Website: <a href="https://www.tlfdi.de" target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline">https://www.tlfdi.de</a>.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 34. Bereitstellung personenbezogener Daten */}
                    <section id="abschnitt-34" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            34. Bereitstellung personenbezogener Daten
                        </h2>
                        <p>
                            Bestimmte Angaben sind für Registrierung, Inserate und Buchungen erforderlich. Öffentliche Bereiche sind grundsätzlich ohne Registrierung nutzbar.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* 35. Änderungen dieser Datenschutzerklärung */}
                    <section id="abschnitt-35" className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            35. Änderungen dieser Datenschutzerklärung
                        </h2>
                        <p>
                            Wir behalten uns Anpassungen an veränderte Rechtslagen oder technische Abläufe vor. Die jeweils aktuelle Version ist dauerhaft auf der Website abrufbar.
                        </p>
                        <div className="pt-4 text-xs text-charcoal/60 font-sans">
                            Campuna · Datenschutzerklärung · Stand: 16. Oktober 2026
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
