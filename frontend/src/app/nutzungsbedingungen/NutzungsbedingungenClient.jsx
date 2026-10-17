'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    FileCheck
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function NutzungsbedingungenClient() {
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
                            alt="Nutzungsbedingungen Campuna"
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
                        <FileCheck className="w-3.5 h-3.5 text-gold" />
                        Plattformregeln
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Nutzungsbedingungen
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        Aktualisierte Fassung | Oktober 2026 | Auf Grundlage der bisherigen sieben Paragraphen
                    </motion.p>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'Nutzungsbedingungen' }]}
                    variant="light"
                />
            </div>

            {/* 2. LEGAL DOCUMENT CONTENT */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">
                    
                    {/* § 1 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 1 Allgemeine Bestimmungen
                        </h2>
                        <p>
                            (1) Diese Nutzungsbedingungen regeln die Nutzung der Plattform Campuna, die vom Plattformbetreiber <strong>LMR Solutions Ronny Voigt</strong>, Premnitzer Straße 8, 99091 Erfurt, Telefon: +49 163 1516518, E-Mail: <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a>, bereitgestellt wird.
                        </p>
                        <p>
                            (2) Ziel dieser Nutzungsbedingungen ist es, eine sichere, gesetzeskonforme und effiziente Nutzung der Plattform sicherzustellen sowie die Rechte und Interessen aller Beteiligten zu schützen.
                        </p>
                        <p>
                            (3) Mit „Nutzer“ sind im Rahmen dieser Nutzungsbedingungen und AGB sowohl gewerbliche als auch private Verkäufer als auch gewerbliche und private Käufer gleichzeitig gemeint, sollte keine explizite Differenzierung erfolgen.
                        </p>
                        <p>
                            (4) Mit der Registrierung und der wirksamen Einbeziehung dieser Nutzungsbedingungen verpflichten sich die Nutzer, die nachstehenden Regeln bei der Nutzung der Plattform einzuhalten. Für nicht registrierte Besucher gelten die jeweils anwendbaren gesetzlichen Vorschriften.
                        </p>
                        <p>
                            (5) Im Übrigen gelten außerdem die Regelungen der AGB der Plattform. Die AGB enthalten verbindliche Regeln und ergänzen diese Nutzungsbedingungen. Die Nutzer verpflichten sich, sowohl die AGB als auch die Nutzungsbedingungen der Plattform zu beachten und einzuhalten. Die AGB sind auf der Plattform einsehbar und werden den Nutzern bei der Registrierung zur Verfügung gestellt. Bei Widersprüchen gehen die AGB hinsichtlich der Vertrags- und Zahlungsbedingungen vor; zwingendes Recht bleibt unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 2 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 2 Nutzung der Plattform und Pflichten der Nutzer
                        </h2>
                        <p>
                            (1) Die Plattform darf nur im Rahmen der gesetzlichen Bestimmungen und dieser Nutzungsbedingungen genutzt werden. Jegliche rechtswidrige Nutzung ist untersagt.
                        </p>
                        <p>
                            (2) Die Nutzer dürfen die Plattform nicht für illegale Aktivitäten oder solche, die gegen geltendes Recht verstoßen, verwenden. Dies umfasst insbesondere:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>a. Verbreitung von rechtswidrigen, beleidigenden, verleumderischen, diskriminierenden oder anderweitig rechtsverletzenden Inhalten;</li>
                            <li>b. Nutzung der Plattform zur Begehung oder Unterstützung von Straftaten;</li>
                            <li>c. das Anbieten gesetzlich verbotener Waren oder Leistungen.</li>
                        </ul>
                        <p>
                            (3) Es ist den Nutzern untersagt, die Plattform für Aktivitäten zu verwenden, die die Sicherheit, Integrität oder Verfügbarkeit der Plattform oder der Daten anderer Nutzer gefährden könnten.
                        </p>
                        <p>
                            (4) Reverse Engineering, Dekompilierung oder andere Versuche, den Quellcode der Plattform zu rekonstruieren, sind untersagt, soweit sie nicht gesetzlich ausdrücklich erlaubt sind.
                        </p>
                        <p>
                            (5) Jegliche unbefugte Manipulation der Plattform oder ihrer Komponenten ist verboten.
                        </p>
                        <p>
                            (6) Die Nutzung der Plattform zur Versendung von Spam, Kettenbriefen oder unerwünschten Massen-Nachrichten ist verboten.
                        </p>
                        <p>
                            (7) Nutzer dürfen keine automatisierten Systeme oder Bots einsetzen, um übermäßige Anfragen an die Plattform zu senden, Inserate missbräuchlich zu veröffentlichen, Daten unbefugt abzugreifen oder sonstige störende Aktivitäten durchzuführen. Gesetzlich zulässige Nutzungen bleiben unberührt.
                        </p>
                        <p>
                            (8) Nutzern ist es untersagt, die Software der Plattform und die Dienstleistungen ohne ausdrückliche Genehmigung des Plattformbetreibers zu anderen als den vertragsgemäß erlaubten persönlichen oder beruflichen/gewerblichen Zwecken zu nutzen. Insbesondere ist es den Nutzern untersagt:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>a. Viren, Trojaner, Würmer oder sonstigen Schadcode auf die Plattform zu schleusen oder dies zu versuchen;</li>
                            <li>b. die Software der Plattform zu hacken oder unbefugt zu manipulieren;</li>
                            <li>c. automatisierte Verfahren einzusetzen, die Sicherheits- oder Nutzungsbeschränkungen umgehen;</li>
                            <li>d. Sicherheitsfunktionen der Plattform zu umgehen;</li>
                            <li>e. den Nutzeraccount unbefugt Dritten zu überlassen, zu vermieten oder zu unterlizenzieren.</li>
                        </ul>
                        <p>
                            (9) Gewerbliche Verkäufer sind verpflichtet, vollständige und richtige Informationen bereitzustellen. Dazu gehören insbesondere die gesetzlich erforderlichen Angaben zur Identität und Erreichbarkeit sowie gegebenenfalls Impressum, steuerliche und registerrechtliche Angaben, eigene AGB, Widerrufsbelehrung, Datenschutzinformationen oder weitere gesetzlich vorgeschriebene Informationen. Der gewerbliche Verkäufer ist selbst verantwortlich für die Vollständigkeit, Richtigkeit und Rechtmäßigkeit dieser Angaben. Der Plattformbetreiber kann nach Maßgabe der anwendbaren gesetzlichen Vorschriften, insbesondere der Händlernachverfolgbarkeit nach Art. 30 DSA, Identitäts- und Unternehmensnachweise einholen und überprüfen. Soweit gesetzlich erforderlich, wird ein gewerbliches Angebot erst nach Abschluss der vorgeschriebenen Überprüfung freigeschaltet. Fehlende oder unzutreffende Angaben können zur Ablehnung oder Aussetzung führen.
                        </p>
                        <p>
                            (10) Nutzer sind für ihre Inhalte, Bilder, Texte, Preise und Angebote selbst verantwortlich. Nutzer müssen sicherstellen, dass sie die Rechte an hochgeladenen Bildern und Texten haben und dürfen keine rechtswidrigen Inhalte einstellen. Inserate müssen zutreffend beschrieben und einer passenden campingbezogenen Kategorie zugeordnet werden. Der Plattformbetreiber darf Inserate im Rahmen der AGB und der gesetzlichen Vorschriften prüfen, ablehnen, einschränken, deaktivieren oder entfernen. Verträge über inserierte Waren und Leistungen entstehen ausschließlich zwischen den beteiligten Nutzern.
                        </p>
                        <p>
                            (11) Der Plattformbetreiber kann bei Verstößen gegen diese Nutzungsbedingungen oder bei Vorliegen eines sachlichen Grundes nach Maßgabe der gesetzlichen Anforderungen geeignete und verhältnismäßige Maßnahmen ergreifen. Eine allgemeine Pflicht zur Überwachung sämtlicher Nutzerinhalte besteht nicht. Gesetzliche Prüf-, Melde-, Begründungs- und Beschwerdepflichten bleiben unberührt.
                        </p>
                        <p>
                            (12) Nutzer stellen den Plattformbetreiber im gesetzlich zulässigen Umfang von begründeten Ansprüchen Dritter frei, die auf einer von ihnen schuldhaft begangenen Rechtsverletzung bei Nutzung der Plattform beruhen. Hierzu gehören erforderliche und angemessene Kosten der Rechtsverteidigung. Zwingende gesetzliche Rechte und Haftungsregelungen bleiben unberührt.
                        </p>
                        <p>
                            (13) Private Nutzer können kostenlos Inserate einstellen; gewerbliche Nutzer unterliegen den in den AGB beschriebenen Free- und Business-Modellen. Bezahlte Boosts, Anbieter-Spotlights, Campuna Credits, Empfehlungsprämien und Pioneer-Auszeichnungen richten sich hinsichtlich Preisen, Laufzeiten, Voraussetzungen und Rechtsfolgen ausschließlich nach den AGB und den jeweils angezeigten Buchungsbedingungen. Manipulationen von Empfehlungs- oder Auszeichnungsbedingungen, Scheinangebote und Mehrfachkonten zur Prämienerschleichung sind untersagt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 3 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 3 Sicherheitsrichtlinien
                        </h2>
                        <p>
                            (1) Nutzer sind verpflichtet, ihre Zugangsdaten sicher zu verwahren und dürfen diese nicht unbefugt an Dritte weitergeben. Zugangsdaten sind so zu wählen und zu verwalten, dass sie nicht einfach zu erraten oder zu kompromittieren sind.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber ist berechtigt, Zugangsdaten bei konkreten Anhaltspunkten für Missbrauch oder ein Sicherheitsrisiko vorübergehend zu sperren. Betroffene Nutzer werden informiert, soweit dies möglich und rechtlich zulässig ist.
                        </p>
                        <p>
                            (3) Nutzer sind verpflichtet, angemessene Sicherheitsmaßnahmen zu ergreifen, um die Integrität und Vertraulichkeit ihrer Daten zu schützen. Hierzu gehören insbesondere sichere Passwörter und die Aktualisierung ihrer verwendeten Geräte und Software.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber setzt angemessene technische und organisatorische Maßnahmen ein, um die Sicherheit der Plattform zu gewährleisten. Dies umfasst unter anderem die Verschlüsselung von Datenübertragungen und die regelmäßige Überprüfung der Sicherheitsvorkehrungen. Einzelheiten zum Umgang mit personenbezogenen Daten enthält die Datenschutzerklärung.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 4 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 4 Anforderungen aus DSA / DDG
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber stellt einen klaren und leicht zugänglichen elektronischen Meldeweg zur Verfügung, über den Nutzer und Dritte mutmaßlich rechtswidrige Inhalte melden können. Hierfür können die bereitgestellte Meldefunktion oder die angegebenen Kontaktmöglichkeiten genutzt werden. Meldungen werden entsprechend den anwendbaren Anforderungen des Digital Services Act geprüft und bearbeitet.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber prüft Nutzerbeschwerden nach Maßgabe der anwendbaren gesetzlichen Anforderungen zeitnah, sorgfältig, objektiv und ohne willkürliche Benachteiligung. Nutzer können Beschwerden über die bereitgestellten Funktionen und, soweit vorgesehen, per E-Mail einreichen. Über das Ergebnis wird informiert, soweit gesetzlich vorgeschrieben.
                        </p>
                        <p>
                            (3) Bei Moderationsentscheidungen, wie der Ablehnung, Entfernung oder Sperrung von Inhalten oder der Einschränkung eines Nutzerkontos, wird der Plattformbetreiber den betroffenen Nutzer entsprechend Art. 17 DSA über die getroffene Entscheidung und deren wesentliche Gründe informieren, soweit diese Vorschrift anwendbar ist. Die Information erfolgt über das Nutzerkonto oder auf einem anderen geeigneten elektronischen Weg.
                        </p>
                        <p>
                            (4) Nutzer können gegen einschlägige Moderationsentscheidungen eine Überprüfung beantragen. Hierzu dient insbesondere die auf der Plattform bereitgestellte Funktion „Request Review“. Soweit die Vorschriften über ein internes Beschwerdemanagement nach Art. 20 DSA anwendbar sind, gelten die dort vorgesehenen Fristen und Rechte. Gesetzliche gerichtliche und außergerichtliche Rechtsbehelfe bleiben unberührt.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber veröffentlicht Transparenzinformationen und -berichte im gesetzlich vorgeschriebenen Umfang und innerhalb der einschlägigen Fristen, soweit die jeweiligen Vorschriften auf die Plattform anwendbar sind. Gesetzliche Ausnahmen und Erleichterungen bleiben unberührt.
                        </p>
                        <p>
                            (6) Zur Unterstützung der Moderation kann eine selbst gehostete KI (nach aktueller technischer Dokumentation Qwen3) eingesetzt werden. Inserate können automatisiert freigegeben, zur manuellen Prüfung vorgelegt oder abgelehnt werden. Die Entscheidung kann durch den Plattformbetreiber manuell überprüft und korrigiert werden. Eine vorherige menschliche Prüfung jedes Inserats wird nicht zugesagt. Die maßgeblichen Moderationsgrundsätze, mögliche Beschränkungen und eingesetzte automatisierte Mittel werden transparent erläutert; weitere Einzelheiten regeln die AGB und die Datenschutzerklärung.
                        </p>
                        <p>
                            (7) Für die Kontaktaufnahme mit dem Plattformbetreiber zu Fragen des Digital Services Act stehen die auf der Plattform veröffentlichten elektronischen Kontaktwege zur Verfügung. Soweit gesetzlich vorgeschrieben, werden besondere Kontaktstellen und Informationen hierzu ausgewiesen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 5 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 5 Durchsetzung und Folgen bei Missbrauch
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber behält sich das Recht vor, im gesetzlich zulässigen Rahmen Maßnahmen zur Erkennung und Unterbindung von Verstößen gegen diese Nutzungsbedingungen zu ergreifen. Dies kann durch automatisierte Inhaltsprüfung, Meldungen oder stichprobenartige Überprüfungen erfolgen.
                        </p>
                        <p>
                            (2) Bei Verstößen gegen diese Nutzungsbedingungen ist der Plattformbetreiber berechtigt, erforderliche und verhältnismäßige Maßnahmen zu ergreifen, um den Missbrauch zu unterbinden. Dies kann die Ablehnung oder Entfernung einzelner Inhalte, die vorübergehende Einschränkung von Funktionen oder die Sperrung von Nutzerkonten umfassen. Bei der Auswahl werden insbesondere Art, Schwere und Häufigkeit des Verstoßes sowie berechtigte Interessen der Betroffenen berücksichtigt.
                        </p>
                        <p>
                            (3) Nutzer haften für Schäden nach Maßgabe der gesetzlichen Vorschriften, soweit sie diese durch schuldhafte Pflichtverletzungen verursacht haben. Eine Freistellung von begründeten Ansprüchen Dritter erfolgt nur im gesetzlich zulässigen Umfang.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber behält sich das Recht vor, bei Rechtsverletzungen gesetzlich zulässige Maßnahmen zu ergreifen, insbesondere zivilrechtliche Ansprüche geltend zu machen oder bei konkretem Verdacht auf Straftaten zuständige Stellen zu informieren.
                        </p>
                        <p>
                            (5) Bei schwerwiegenden Verstößen kann der Plattformbetreiber das Nutzungsverhältnis nach Maßgabe der AGB und des anwendbaren Rechts außerordentlich beenden oder den Zugang vorübergehend sperren. Erforderliche Begründungen, Vorankündigungen und Beschwerdemöglichkeiten werden gewährt, soweit gesetzlich vorgeschrieben. Personenbezogene Daten werden nicht pauschal sofort gelöscht, sondern entsprechend der Datenschutzerklärung und den gesetzlichen Aufbewahrungs- und Löschungspflichten behandelt.
                        </p>
                        <p>
                            (6) Bei der Bearbeitung von Meldungen und Beschwerden kann der Plattformbetreiber offensichtlich missbräuchliche oder wiederholte Verstöße unter den Voraussetzungen des Art. 23 DSA berücksichtigen, soweit diese Vorschrift anwendbar ist.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 6 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 6 Änderungen der Nutzungsbedingungen
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber kann Änderungen dieser Nutzungsbedingungen für die Zukunft vorschlagen, soweit hierfür ein sachlicher Grund besteht, insbesondere aufgrund von Gesetzesänderungen, Sicherheitsanforderungen oder einer Weiterentwicklung der Plattform. Die Nutzer werden über wesentliche Änderungen rechtzeitig und in geeigneter Form informiert; zwingende gesetzliche Informations- und Fristvorgaben bleiben unberührt.
                        </p>
                        <p>
                            (2) Änderungen, die eine vertragliche Zustimmung erfordern, werden nur mit wirksamer Zustimmung des Nutzers Vertragsbestandteil. Ein bloßes Schweigen oder die unterlassene Ausübung eines Widerspruchsrechts gilt nicht generell als Zustimmung. Für rein redaktionelle Änderungen ohne Auswirkungen auf Rechte und Pflichten kann eine gesonderte Zustimmung entbehrlich sein.
                        </p>
                        <p>
                            (3) Soweit gesetzlich vorgesehen, können Nutzer aufgrund einer wesentlichen Änderung den Vertrag kündigen oder andere gesetzliche Rechte geltend machen. Bereits erworbene Ansprüche und bezahlte Leistungen bleiben nach Maßgabe der gesetzlichen Vorschriften geschützt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 7 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 7 Schlussbestimmungen
                        </h2>
                        <p>
                            (1) Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Anstelle unwirksamer Bestimmungen gelten die gesetzlichen Vorschriften.
                        </p>
                        <p>
                            (2) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Für Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat bleiben zwingende verbraucherschützende Vorschriften dieses Staates unberührt.
                        </p>
                        <p>
                            (3) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen Nutzungsbedingungen ist, soweit gesetzlich zulässig, der Sitz des Plattformbetreibers. Im Übrigen gelten die gesetzlichen Zuständigkeitsregeln.
                        </p>
                    </section>

                </div>
            </main>
        </div>
    );
}
