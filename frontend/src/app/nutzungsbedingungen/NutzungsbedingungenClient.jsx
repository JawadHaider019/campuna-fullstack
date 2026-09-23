'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    FileCheck,
    Shield,
    Scale,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function NutzungsbedingungenClient() {
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
                        Plattformregeln für die Nutzung der Plattform „Campuna“
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
            <main className="max-w-5xl mx-auto px-6 md:px-12 py-10 sm:py-16">
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
                            (4) Durch die Nutzung der Plattform bestätigen die Nutzer, dass sie die Bestimmungen dieser Nutzungsbedingungen gelesen und verstanden haben und sich mit deren Inhalt einverstanden erklären.
                        </p>
                        <p>
                            (5) Im Übrigen gelten außerdem die Regelungen der AGB der Plattform. Die AGB enthalten verbindliche Regeln und ergänzen diese Nutzungsbedingungen. Die Nutzer verpflichten sich, sowohl die AGB als auch die Nutzungsbedingungen der Plattform zu beachten und einzuhalten. Die AGB sind auf der Plattform einsehbar und werden den Nutzern bei der Registrierung zur Verfügung gestellt.
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
                            <li>a. Verbreitung von rechtswidrigen, obszönen, beleidigenden, verleumderischen oder anderweitig anstößigen Inhalten.</li>
                            <li>b. Nutzung der Plattform zur Begehung von Straftaten oder zur Unterstützung von Straftaten.</li>
                        </ul>
                        <p>
                            (3) Es ist den Nutzern untersagt, die Plattform für Aktivitäten zu verwenden, die die Sicherheit, Integrität oder Verfügbarkeit der Plattform oder der Daten anderer Nutzer gefährden könnten.
                        </p>
                        <p>
                            (4) Reverse Engineering, Dekompilierung oder andere Versuche, den Quellcode der Plattform zu rekonstruieren, sind strengstens untersagt.
                        </p>
                        <p>
                            (5) Jegliche Manipulation der Plattform oder ihrer Komponenten, die nicht ausdrücklich vom Plattformbetreiber genehmigt wurde, ist verboten.
                        </p>
                        <p>
                            (6) Die Nutzung der Plattform zur Versendung von Spam, Kettenbriefen oder unerwünschten Massen-E-Mails ist verboten.
                        </p>
                        <p>
                            (7) Nutzer dürfen keine automatisierten Systeme oder Bots einsetzen, um übermäßige Anfragen an die Plattform zu senden oder sonstige störende Aktivitäten durchzuführen.
                        </p>
                        <p>
                            (8) Nutzern ist es verboten, die Software der Plattform und die Dienstleistungen ohne ausdrückliche Genehmigung des Plattformbetreibers zu anderen Zwecken als zu ihren eigenen, persönlichen oder beruflichen/gewerblichen Zwecken zu nutzen, insbesondere nicht zu sonstigen gewerblichen Zwecken. Insbesondere ist es den Nutzern untersagt:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>a. Viren, Trojaner, Würmer oder sonstigen Schadcode auf die Plattform zu schleusen oder dies zu versuchen,</li>
                            <li>b. die Software der Plattform zu hacken, zu manipulieren oder dies zu versuchen,</li>
                            <li>c. Scripts und andere automatisierbare oder teilautomatisierbare Verfahren zur Nutzung der Plattform einzusetzen,</li>
                            <li>d. Sicherheitsfunktionen der Plattform zu umgehen oder dies zu versuchen,</li>
                            <li>e. den Nutzeraccount zu vermieten oder anderweitig gewerblich zu nutzen, zu unterlizenzieren oder in anderer Weise Dritten zur Verfügung zu stellen, es sei denn, dies wurde vom Plattformbetreiber ausdrücklich erlaubt.</li>
                        </ul>
                        <p>
                            (9) Gewerbliche Verkäufer sind verpflichtet, vollständige und richtige Informationen bereitzustellen. Dazu gehört insbesondere ein Impressum bzw. ein Link zum Impressum. Je nach Art des Angebots können auch eigene Allgemeine Geschäftsbedingungen (AGB), Widerrufsbelehrung, Datenschutzinformationen oder weitere gesetzlich erforderliche Informationen erforderlich sein. Der gewerbliche Verkäufer ist selbst verantwortlich für die Vollständigkeit, Richtigkeit und Rechtmäßigkeit dieser Angaben. Der Plattformbetreiber prüft diese Angaben nicht umfassend. Der Plattformbetreiber kann gewerbliche Profile oder Inserate sperren, ausblenden oder ablehnen, wenn rechtliche Angaben fehlen oder offensichtlich unvollständig oder rechtswidrig sind.
                        </p>
                        <p>
                            (10) Nutzer sind für ihre Inhalte, Bilder, Texte, Preise und Angebote selbst verantwortlich. Nutzer müssen sicherstellen, dass sie die Rechte an hochgeladenen Bildern und Texten haben und dürfen keine rechtswidrigen Inhalte einstellen. Der Plattformbetreiber darf Inserate prüfen, ablehnen, bearbeiten, deaktivieren oder löschen, wenn sie gegen AGB, Plattformregeln oder gesetzliche Vorgaben verstoßen. Der Plattformbetreiber übernimmt keine Gewähr für die Richtigkeit, Qualität, Verfügbarkeit oder Rechtmäßigkeit der Angebote. Verträge entstehen ausschließlich zwischen den Nutzern.
                        </p>
                        <p>
                            (11) Der Plattformbetreiber behält sich das Recht vor, Nutzer bei Verstoß gegen diese AGB oder bei Vorliegen eines wichtigen Grundes zu sperren. Der Plattformbetreiber ist jedoch nicht verpflichtet, die Angebote oder Aktivitäten der Nutzer zu überwachen und übernimmt keine Haftung für etwaige Schäden, die durch die Sperrung eines Nutzers entstehen.
                        </p>
                        <p>
                            (12) Nutzer stellen den Plattformbetreiber von sämtlichen Ansprüchen Dritter frei, die auf einer rechtswidrigen Verwendung der Plattform durch den Nutzer beruhen oder mit dessen Billigung erfolgen. Der Nutzer erkennt an, dass der Plattformbetreiber bei Inanspruchnahme durch Dritte aufgrund rechtswidriger Inhalte des Nutzers berechtigt ist, die entsprechenden Inhalte zu löschen und den Nutzer sofort zu sperren. Der Nutzer ist verpflichtet, dem Plattformbetreiber alle durch die rechtswidrige Verwendung der Plattform entstehenden Schäden zu ersetzen, einschließlich der Kosten der Rechtsverteidigung.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 3 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 3 Sicherheitsrichtlinien
                        </h2>
                        <p>
                            (1) Nutzer sind verpflichtet, ihre Zugangsdaten sicher zu verwahren und dürfen diese nicht an Dritte weitergeben. Zugangsdaten sind so zu wählen und zu verwalten, dass sie nicht einfach zu erraten oder zu kompromittieren sind.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber ist berechtigt, Zugangsdaten zu sperren, wenn der Verdacht besteht, dass diese missbräuchlich verwendet werden oder ein Sicherheitsrisiko darstellen.
                        </p>
                        <p>
                            (3) Nutzer sind verpflichtet, angemessene Sicherheitsmaßnahmen zu ergreifen, um die Integrität und Vertraulichkeit ihrer Daten zu schützen. Dazu gehören insbesondere die regelmäßige Aktualisierung von Passwörtern und die Nutzung von Sicherheitssoftware.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber setzt angemessene technische und organisatorische Maßnahmen ein, um die Sicherheit der Plattform zu gewährleisten. Dies umfasst unter anderem die Verschlüsselung von Datenübertragungen und die regelmäßige Überprüfung der Sicherheitsvorkehrungen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 4 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 4 Anforderungen aus DSA / DDG
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber stellt einen klaren und leicht zugänglichen Meldeweg zur Verfügung, über den Nutzer rechtswidrige Inhalte melden können. Hierfür können Nutzer das bereitgestellte Online-Formular oder die angegebenen Kontaktmöglichkeiten (E-Mail-Adresse, Telefonnummer) nutzen. Eingehende Meldungen werden vom Plattformbetreiber unverzüglich geprüft und bei Bestätigung der Rechtswidrigkeit entsprechende Maßnahmen ergriffen, um die Inhalte zu entfernen oder den Zugang zu ihnen zu sperren.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber verpflichtet sich, Nutzerbeschwerden zeitnah und sorgfältig zu prüfen. Nutzer können Beschwerden über die Plattform oder per E-Mail einreichen. Der Plattformbetreiber wird die Beschwerde innerhalb einer angemessenen Frist bearbeiten und den Nutzer über das Ergebnis der Prüfung und die getroffenen Maßnahmen informieren.
                        </p>
                        <p>
                            (3) Bei Moderationsentscheidungen, wie der Löschung oder Sperrung von Inhalten, wird der Plattformbetreiber den betroffenen Nutzer über die getroffene Entscheidung informieren und eine Begründung dafür liefern. Die Information erfolgt in der Regel per E-Mail oder über das Nachrichtensystem der Plattform. Der Nutzer wird über die Art des Verstoßes und die Grundlage der Entscheidung aufgeklärt.
                        </p>
                        <p>
                            (4) Nutzer haben das Recht, Einspruch gegen Entscheidungen des Plattformbetreibers bezüglich der Sperrung, Löschung oder Ablehnung von Inhalten einzulegen. Der Einspruch kann über das dafür vorgesehene Formular auf der Plattform oder per E-Mail eingereicht werden. Der Plattformbetreiber verpflichtet sich, den Einspruch innerhalb einer angemessenen Frist zu prüfen und dem Nutzer das Ergebnis der Prüfung mitzuteilen. Wird dem Einspruch stattgegeben, werden die betroffenen Inhalte wiederhergestellt und etwaige Sperrungen aufgehoben.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber veröffentlicht regelmäßig einen Transparenzbericht, der Informationen über die Anzahl und Art der eingegangenen Meldungen und Beschwerden, die getroffenen Maßnahmen sowie die Ergebnisse von Einsprüchen enthält. Der Bericht ist für alle Nutzer der Plattform zugänglich und soll zur Transparenz und Vertrauensbildung beitragen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 5 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 5 Durchsetzung und Folgen bei Missbrauch
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber behält sich das Recht vor, die Nutzung der Plattform zu überwachen, um die Einhaltung dieser Nutzungsbedingungen sicherzustellen. Dies kann durch technische Maßnahmen oder stichprobenartige Überprüfungen erfolgen.
                        </p>
                        <p>
                            (2) Bei Verstößen gegen diese Nutzungsbedingungen ist der Plattformbetreiber berechtigt, Maßnahmen zu ergreifen, um den Missbrauch zu unterbinden. Dies kann die Sperrung von Nutzerkonten, die Einschränkung des Zugriffs auf die Plattform oder die Löschung von rechtswidrigen Inhalten umfassen.
                        </p>
                        <p>
                            (3) Nutzer, die gegen diese Nutzungsbedingungen verstoßen, haften für alle daraus entstehenden Schäden und halten den Plattformbetreiber von sämtlichen Ansprüchen Dritter frei, die aufgrund des Missbrauchs geltend gemacht werden.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber behält sich das Recht vor, rechtliche Schritte gegen Nutzer einzuleiten, die gegen diese Nutzungsbedingungen verstoßen. Dies umfasst insbesondere die Geltendmachung von Schadensersatzansprüchen und die Einleitung strafrechtlicher Maßnahmen.
                        </p>
                        <p>
                            (5) Im Falle eines schwerwiegenden Verstoßes gegen die Vertragsbedingungen oder bei sonstigem schwerwiegenden Fehlverhalten des Kunden, erlöschen alle Nutzungsrechte des Kunden an der Plattform mit sofortiger Wirkung. Der Plattformbetreiber behält sich in einem solchen Fall das Recht vor, den Zugang des Nutzers zur Plattform ohne vorherige Ankündigung zu sperren und alle gespeicherten Daten des Nutzers zu löschen, soweit diese nicht aus gesetzlichen Gründen aufbewahrt werden müssen. Der Nutzer ist verpflichtet, alle ihm zur Verfügung gestellten Zugangsdaten unverzüglich an den Plattformbetreiber zurückzugeben und jede weitere Nutzung der Plattform zu unterlassen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 6 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 6 Änderungen der Nutzungsbedingungen
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber behält sich das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden dem Nutzer rechtzeitig bekannt gegeben.
                        </p>
                        <p>
                            (2) Widerspricht der Nutzer den geänderten Nutzungsbedingungen nicht innerhalb von vier Wochen nach Bekanntgabe, gelten die Änderungen als akzeptiert. Der Plattformbetreiber wird den Nutzer in der Änderungsmitteilung auf die Bedeutung der Frist und das Widerspruchsrecht hinweisen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 7 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 7 Schlussbestimmungen
                        </h2>
                        <p>
                            (1) Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                        </p>
                        <p>
                            (2) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                        </p>
                        <p>
                            (3) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen Nutzungsbedingungen ist, soweit gesetzlich zulässig, der Sitz des Plattformbetreibers.
                        </p>
                    </section>

                </div>
            </main>
        </div>
    );
}
