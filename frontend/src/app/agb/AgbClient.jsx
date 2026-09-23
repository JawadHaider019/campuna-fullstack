'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    FileText,
    Shield,
    Scale,
    AlertCircle,
    Info
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AgbClient() {
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
                            alt="AGB Campuna"
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
                        <Scale className="w-3.5 h-3.5 text-gold" />
                        Rechtliches
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-lg leading-tight"
                    >
                        Allgemeine Geschäftsbedingungen
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-sans text-sm sm:text-base md:text-lg text-sand/90 leading-relaxed max-w-2xl mx-auto font-light drop-shadow-md"
                    >
                        AGB für die Nutzung der Plattform Campuna
                    </motion.p>
                </div>
            </section>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-0">
                <Breadcrumbs
                    items={[{ label: 'AGB' }]}
                    variant="light"
                />
            </div>

            {/* 2. LEGAL DOCUMENT CONTENT */}
            <main className="max-w-5xl mx-auto px-6 md:px-12 py-10 sm:py-16">
                <div className="bg-sand/30 rounded-[32px] p-6 sm:p-12 border border-forest/10 space-y-10 text-charcoal/85 leading-relaxed font-sans text-sm sm:text-base font-light">
                    
                    {/* § 1 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 1 Allgemeines
                        </h2>
                        <p>
                            (1) Diese Allgemeinen Geschäftsbedingungen (AGB) sind die verbindlichen Regeln, die zwischen <strong>LMR Solutions Ronny Voigt</strong>, Premnitzer Straße 8, 99091 Erfurt, Telefon: +49 163 1516518, E-Mail: <a href="mailto:kontakt@campuna.de" className="text-forest font-medium underline">kontakt@campuna.de</a> (im Folgenden „Plattformbetreiber“ genannt) und den Nutzern (im Folgenden „Nutzer“) bei der Nutzung der Plattform Campuna (im Folgenden „Plattform“) gelten.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber stellt eine Vermittlungsplattform zum An- und Verkauf von neuen und gebrauchten Waren sowie Dienstleistungen im Camping-Bereich bereit, auf der Verkäufer diese anbieten und Käufer diese erwerben können. Verkäufer und Käufer werden folgend zusammengefasst auch als Nutzer bezeichnet, insofern keine Differenzierung erfolgt.
                        </p>
                        <p>
                            (3) Sowohl Verkäufer als auch Käufer können dabei sowohl Verbraucher gem. § 13 BGB als auch Unternehmer gem. § 14 BGB sein.
                        </p>
                        <p>
                            (4) Diese AGB gelten für alle Nutzer, unabhängig davon, ob sie Unternehmer oder Verbraucher sind, bei der Nutzung der Plattform.
                        </p>
                        <p>
                            (5) Die AGB gelten ausschließlich. Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen der Nutzer werden nur dann und insoweit Vertragsbestandteil, als der Plattformbetreiber ihrer Geltung ausdrücklich zugestimmt hat. Dieses Zustimmungserfordernis gilt in jedem Fall.
                        </p>
                        <p>
                            (6) Der Plattformbetreiber behält sich vor, den Vertragsschluss abzulehnen, sofern wichtige Gründe vorliegen. Ein solcher kann für den Plattformbetreiber insbesondere dann gegeben sein, wenn eine Interessenskollision besteht oder entstehen kann oder sonstige rechtliche oder gesetzliche Gründe entgegenstehen.
                        </p>
                        <p>
                            (7) Die Nutzung der Plattform unterliegt zusätzlich den Nutzungsbedingungen, die detaillierte Regelungen zur Nutzung der Plattform, den Rechten und Pflichten der Nutzer sowie zu weiteren wichtigen Aspekten enthalten. Diese Nutzungsbedingungen sind ebenfalls verbindlich und ergänzen die vorliegenden AGB. Die Nutzer verpflichten sich, die Nutzungsbedingungen der Plattform zu beachten und einzuhalten. Die Nutzungsbedingungen sind auf der Plattform einsehbar und werden den Nutzern bei der Registrierung zur Verfügung gestellt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 2 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 2 Registrierung und Ablauf
                        </h2>
                        <p>
                            (1) Für die Nutzung der Plattform ist eine Registrierung mit einer aktuellen E-Mail-Adresse erforderlich. Der Plattformbetreiber sendet auf die Registrierung hin per Mail an die vom Nutzer angegebene E-Mail-Adresse einen anklickbaren Link zur Freischaltung zu. Eine Nutzung der Plattform ist nach Anklicken des Linkes möglich.
                        </p>
                        <p>
                            (2) Das Mindestalter für die Registrierung beträgt 16 Jahre.
                        </p>
                        <p>
                            (3) Jeder Nutzer kann nur ein Nutzerkonto anlegen. Die Überlassung an Dritte ist nicht gestattet. Nutzer verpflichten sich, die erforderlichen Maßnahmen zur Gewährleistung der Vertraulichkeit ihrer Account-Daten und ihres Passworts zu ergreifen und ihr Passwort geheim zu halten. Bei Missbrauch des Kontos oder einem entsprechenden Verdacht und bei Missbrauch oder Verlust des Passwortes, ist dies dem Plattformbetreiber unverzüglich anzuzeigen. Der Plattformbetreiber ist in solchen Fällen berechtigt, das Konto ganz oder vorübergehend zu sperren.
                        </p>
                        <p>
                            (4) Nach Freischalten der Plattform zur Nutzung können Verkäufer ein Verkäuferprofil und Käufer ein Käuferprofil anlegen. Dabei sind alle Nutzer verpflichtet, vollständige und wahrheitsgemäße Angaben zu machen. Sollten Nutzer schuldhaft irreführende oder unwahre Angaben machen, sind sie zum Schadensersatz verpflichtet, soweit dem Plattformbetreiber durch diese unwahren Angaben ein Schaden entstanden ist. Nutzer sind weiter verpflichtet, den Plattformbetreiber von Ansprüchen Dritter freizustellen. Weitere Ansprüche, insbesondere Schadensersatzansprüche Dritter oder Schadensersatzansprüche von potenziellen Vertragspartnern, bleiben unberührt.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber prüft nicht jedes Profil vor dessen Freischaltung. Der Plattformbetreiber behält sich aber vor, einzelne Angaben zu überprüfen, indem er beispielsweise von Nutzern Nachweise verlangt. Der Plattformbetreiber ist berechtigt, die Veröffentlichung von Nutzerprofilen abzulehnen, wenn das jeweilige Profil der Spezialisierung der Plattform nicht entspricht oder die Verlässlichkeit der Angaben nicht ausreichend nachgewiesen wurde. Dies gilt auch, soweit die zu veröffentlichenden Inhalte gegen gesetzliche Vorgaben, behördliche Verbote, Rechte Dritter, gegen die guten Sitten oder gegen diese AGB verstoßen. Der Plattformbetreiber übernimmt keine Garantie für die von Nutzern gemachte Angaben.
                        </p>
                        <p>
                            (6) Nach Freischaltung des Profils haben Verkäufer die Möglichkeit, Anzeigen zu schalten. Käufer erhalten nun Zugriff auf das Verkäuferprofil und können Angebote wahrnehmen oder sonstige Leistungen vereinbaren. Käufer und Verkäufer haben sodann die Möglichkeit, nachfolgend Verträge zu schließen. Der Plattformbetreiber steht mit den angebotenen Leistungen oder geschlossenen Verträgen nicht in Verbindung und haftet dafür und daraus nicht, genauso für Inhalte und Erfolge der Angebote der Verkäufer.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 3 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 3 Nutzerprofil
                        </h2>
                        <p>
                            (1) Wenn sich ein Nutzer auf der Plattform registriert, um die angebotenen Leistungen zu nutzen, werden Teile seiner Angaben und Informationen seines Nutzerprofils auf der Plattform für andere Nutzer sichtbar sein.
                        </p>
                        <p>
                            (2) Das Profil und inserierte Angebote sind öffentlich auch für nicht registrierte Nutzer einsehbar. Kontaktaufnahmen sind jedoch nur mit registrierten Nutzern möglich.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber ist berechtigt, personenbezogen Daten in Nutzerprofilen an andere Nutzer weiterzuleiten, wenn der Nutzer hierzu seine Einwilligung erteilt hat. Die Weitergabe der personenbezogenen Daten erfolgt nur zu dem in der Einwilligung angegeben Zweck.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 4 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 4 Mitgliedschaftsmodelle
                        </h2>
                        <p>
                            (1) Um Leistungen auf der Plattform anbieten zu können, ist für Nutzer der Abschluss eines Vertrages über eine Mitgliedschaft zur Nutzung der Plattform erforderlich. Hierbei kann zwischen kostenlosen und kostenpflichtigen Nutzungsmodellen unterschieden werden.
                        </p>
                        <p>
                            (2) Private Verkäufer können Inserate kostenlos einstellen. Zusätzlich haben sie die Möglichkeit, einzelne Anzeigen kostenpflichtig hervorzuheben. Kostenpflichtig sind für private Verkäufer nur optionale Zusatzleistungen wie Premium, Premium Plus oder Booster für einzelne Anzeigen. Diese Zusatzbuchungen sind Einmalbuchungen für eine bestimmte Laufzeit und enden automatisch nach der vereinbarten Laufzeit. Es besteht kein Abonnement.
                        </p>
                        <p>
                            (3) Gewerbliche Verkäufer erhalten ab Registrierung eine kostenlose Einführungsphase von zwei Monaten. Die Einführungsphase beginnt mit dem Registrierungsdatum des gewerblichen Accounts. Während dieser Einführungsphase können gewerbliche Verkäufer die Plattform kostenlos gewerblich nutzen und Inserate erstellen. Nach Ablauf der Einführungsphase ist für die weitere gewerbliche Nutzung ein kostenpflichtiges Business-Paket erforderlich. Es gibt keine dauerhaft kostenlosen Einzelinserate für gewerbliche Verkäufer.
                        </p>
                        <p>
                            (4) Gewerbliche Verkäufer können nach Ablauf der Einführungsphase folgende Business-Pakete buchen:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li>a. Business Basic: 39 € / Monat, bis zu 10 aktive Inserate</li>
                            <li>b. Business Plus: 69 € / Monat, bis zu 25 aktive Inserate</li>
                            <li>c. Business Pro: 99 € / Monat, bis zu 50 aktive Inserate</li>
                        </ul>
                        <p>
                            (5) Business-Pakete gelten nur für gewerbliche Verkäufer. Die Anzahl bezieht sich auf aktive Inserate. Die Abrechnung erfolgt monatlich im Voraus. Die Laufzeit beträgt jeweils einen Monat. Das Paket ist monatlich kündbar. Bei Kündigung endet die kostenpflichtige Nutzung zum Ende des jeweiligen Abrechnungszeitraums. Nach Ablauf bzw. Kündigung können gewerbliche Verkäufer ohne aktives Business-Paket keine weiteren gewerblichen Inserate veröffentlichen bzw. bestehende gewerbliche Inserate können deaktiviert/ausgeblendet werden.
                        </p>
                        <p>
                            (6) Private und gewerbliche Verkäufer können einzelne Inserate optional kostenpflichtig hervorheben. Diese Zusatzoptionen sind unabhängig von den Business-Paketen. Hierbei bestehen die folgenden Optionen:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li>a. Premium: 7 Tage: 7,99 €, 14 Tage: 12,99 €, 30 Tage: 19,99 €</li>
                            <li>b. Premium Plus: 7 Tage: 14,99 €, 14 Tage: 24,99 €, 30 Tage: 39,99 €</li>
                        </ul>
                        <p>
                            (7) Die Hervorhebung startet nach erfolgreicher Zahlung. Die Laufzeit richtet sich nach der gewählten Option. Die Hervorhebung endet automatisch nach Ablauf der gebuchten Laufzeit. Es erfolgt keine automatische Verlängerung. Es besteht kein Abonnement. Es besteht kein Anspruch auf eine bestimmte Anzahl an Klicks, Anfragen oder Verkäufen.
                        </p>
                        <p>
                            (8) Zusätzlich können gewerbliche Verkäufer eine kostenpflichtige Zusatzoption namens "Anbieter-Spotlight" buchen, um ihr Verkäuferprofil zeitlich begrenzt im Bereich „Ausgewählte Anbieter“ bzw. in einer Anbieter-Rotation auf der Startseite erscheinen zu lassen. Die Preise hierfür betragen:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li>a. Für 7 Tage: 19 €</li>
                            <li>b. Für 14 Tage: 29 €</li>
                            <li>c. Für 30 Tage: 49 €</li>
                        </ul>
                        <p>
                            (9) Die Platzierung erfolgt im Bereich „Ausgewählte Anbieter“ / Startseiten-Rotation. Die Laufzeit richtet sich nach der gewählten Option. Die Zusatzoption beginnt nach erfolgreicher Zahlung und endet automatisch nach Ablauf der gebuchten Laufzeit. Es erfolgt keine automatische Verlängerung. Es besteht kein Abonnement. Es besteht kein Anspruch auf eine bestimmte Anzahl an Klicks, Anfragen, Kontakten oder Umsätzen. Bei mehreren gebuchten oder aktiven Anbieter-Spotlights kann die Darstellung rotierend erfolgen.
                        </p>
                        <p>
                            (10) Die Präsentation und Bewerbung von Optionen auf der Webseite stellen noch kein bindendes Angebot zum Abschluss eines Vertrags dar. Ein Vertrag kommt erst zustande, wenn der Plattformbetreiber die Bestellung des Nutzers durch eine Annahmeerklärung annimmt oder wenn die Leistung erbracht wird.
                        </p>
                        <p>
                            (11) Nach Abschluss des Nutzungsvertrages kann der Nutzer für die vereinbarte Dauer die Leistungen in Anspruch nehmen. Der Nutzer ist bei der Gestaltung von Profil und Angeboten sowie deren Abwicklung frei. Der Nutzer ist allerdings für die Einhaltung der gesetzlichen Bestimmungen verantwortlich und stellt den Plattformbetreiber von allen Schäden oder Ansprüchen Dritter aufgrund von Verstößen frei.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 5 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 5 Preise und Zahlungen
                        </h2>
                        <p>
                            (1) Als Kleinunternehmer im Sinne von § 19 UStG erhebt und weist der Plattformbetreiber keine Umsatzsteuer aus.
                        </p>
                        <p>
                            (2) Die Zahlung für kostenpflichtige Leistungen erfolgt über den Zahlungsdienstleister Stripe.
                        </p>
                        <p>
                            (3) Die Abrechnung für Business-Pakete erfolgt monatlich im Voraus. Einzelne Zusatzoptionen werden als Einmalzahlungen abgerechnet.
                        </p>
                        <p>
                            (4) Die Freischaltung der Nutzung kostenpflichtiger Leistungen erfolgt erst nach erfolgreicher Zahlung. Der Plattformbetreiber behält sich das Recht vor, die Freischaltung bis zur Bestätigung der Zahlung durch Stripe zu verzögern.
                        </p>
                        <p>
                            (5) Im Falle einer fehlgeschlagenen Zahlung wird der Nutzer per E-Mail benachrichtigt und aufgefordert, die Zahlung innerhalb von 7 Tagen zu begleichen. Erfolgt keine Zahlung innerhalb dieser Frist, behält sich der Plattformbetreiber das Recht vor, die kostenpflichtigen Leistungen zu sperren oder zu deaktivieren, bis die Zahlung erfolgreich abgeschlossen wurde.
                        </p>
                        <p>
                            (6) Nutzer sind nicht berechtigt, gegenüber Forderungen des Plattformbetreibers aufzurechnen, es sei denn, die Gegenansprüche sind rechtskräftig festgestellt oder unbestritten.
                        </p>
                        <p>
                            (7) Der Plattformbetreiber behält sich das Recht vor, bei wiederholt fehlgeschlagenen Zahlungen das Vertragsverhältnis mit dem Nutzer außerordentlich zu kündigen. Der Nutzer wird in einem solchen Fall per E-Mail über die Kündigung informiert.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 6 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 6 Laufzeit, Kündigung und Beendigung des Nutzungsvertrages
                        </h2>
                        <p>
                            (1) Eine kostenpflichtige Mitgliedschaft wird für die vereinbarte Dauer abgeschlossen. Die genaue Laufzeit ergibt sich aus dem jeweiligen Paket. Einzelne Anzeigen-Upgrades und Zusatzoptionen enden automatisch nach Ablauf der gewählten Laufzeit und bedürfen keiner Kündigung.
                        </p>
                        <p>
                            (2) Business-Pakete sind monatlich buchbar und monatlich kündbar. Beide Seiten sind berechtigt, das Business-Paket zum Ende des laufenden Abrechnungszeitraums zu kündigen. Erfolgt eine Kündigung nicht, verlängert sich die Mitgliedschaft jeweils um einen weiteren Monat.
                        </p>
                        <p>
                            (3) Ein kostenfreier Nutzungsvertrag kann jederzeit ohne Angabe von Gründen in Textform von beiden Parteien gekündigt werden.
                        </p>
                        <p>
                            (4) Jede Kündigung bedarf der Textform. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt davon unberührt.
                        </p>
                        <p>
                            (5) Nach Kündigung eines Pakets endet die kostenpflichtige Nutzung zum Ende des jeweiligen Abrechnungszeitraums. Nach Ablauf bzw. Kündigung können Verkäufer ohne aktives Paket keine weiteren Inserate veröffentlichen bzw. bestehende Inserate können deaktiviert oder ausgeblendet werden.
                        </p>
                        <p>
                            (6) Wird der Vertrag durch den Nutzer oder durch den Plattformbetreiber gekündigt, werden die personenbezogenen Nutzerdaten (u.a. Name, E-Mail, Telefonnummer, Nachrichten, hochgeladene Dateien) vom Plattformbetreiber archiviert. Spätestens nach Ablauf von sechs (6) Monaten ab Vertragsbeendigung wird der Nutzeraccount endgültig gelöscht. Dies gilt nicht, soweit der Plattformbetreiber die betreffenden Daten zur Durchsetzung von Ansprüchen Nutzern gegenüber benötigt oder gesetzliche Aufbewahrungspflichten bestehen.
                        </p>
                        <p>
                            (7) Mit Wirksamwerden der Kündigung endet das Vertragsverhältnis und der Nutzer kann seinen Zugang nicht mehr nutzen. Der Plattformbetreiber behält sich vor, den Benutzernamen sowie das Passwort mit Wirksamwerden der Kündigung zu sperren.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 7 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 7 Vermittlungstätigkeit
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber erbringt keine eigenen Dienstleistungen. Bei dem Dienst auf der Plattform handelt es sich um eine reine Vermittlung von Kontakten zwischen Verkäufern und Käufern und das Zurverfügungstellen der Plattform. Der Plattformbetreiber kann nicht gewährleisten, dass Verkäufer und deren Dienste für die Käufer auch tatsächlich verfügbar sind. Es besteht für Nutzer kein Anspruch auf eine erfolgreiche Vermittlung und kein Anspruch auf die Bereitstellung einer bestimmten Anzahl von Vertragsabschlüssen.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber handelt lediglich als Vermittler und ist nicht verantwortlich für die Inhalte der Angebote der Verkäufer. Der Plattformbetreiber übernimmt keine Gewährleistung oder Haftung für die Richtigkeit, Qualität, Verfügbarkeit oder rechtliche Zulässigkeit der angebotenen Leistungen. Jeder Vertrag kommt ausschließlich zwischen dem Käufer und dem jeweiligen Verkäufer zustande. Jegliche Ansprüche, die sich aus oder im Zusammenhang mit den Angeboten ergeben, sind ausschließlich gegenüber den Verkäufern geltend zu machen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 8 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 8 Lizenz für die Inhalte der Nutzer
                        </h2>
                        <p>
                            (1) Wenn die Nutzer Inhalte auf der Plattform bereitstellen, beauftragen sie den Plattformbetreiber damit, diese zu speichern, zu hosten und wenn dies vereinbart ist, Dritten zugänglich zu machen. Der Plattformbetreiber verwendet Nutzerinhalte im Einklang mit der zwischen Nutzern und dem Plattformbetreiber bestehenden Vereinbarung. Indem die Nutzer ihre Inhalte bereitstellen, räumen sie dem Plattformbetreiber für die Dauer der Vereinbarung eine nicht ausschließliche, räumlich unbegrenzte Lizenz ein, diese Inhalte für die Zwecke der Erbringung der Dienstleistungen im Rahmen der Vereinbarung zu nutzen. Dazu gehört auch das Recht, die Inhalte zu speichern, zu reproduzieren, zu formatieren, (technisch) zu bearbeiten, zu übertragen, zugänglich zu machen und selbst oder durch Dritte zu analysieren und auszuwerten. Der Plattformbetreiber ist auch berechtigt, die Daten in einem Ausfallsystem bzw. separaten Ausfallrechenzentrum vorzuhalten. Zur Beseitigung von Störungen ist der Plattformbetreiber ferner berechtigt, Änderungen an der Struktur der Daten oder dem Datenformat vorzunehmen. Der Plattformbetreiber wird die von den Nutzern in der Plattform hochgeladenen Inhalte nur insoweit veröffentlichen und Dritten zugänglich machen, wie dies für den Vertragszweck erforderlich ist.
                        </p>
                        <p>
                            (2) Nutzer sichern zu, dass sie alle Rechte, an den von ihnen auf die Plattform hochgeladenen Inhalten haben oder über eine Lizenz für die Inhalte verfügen, um dem Plattformbetreiber die Rechte gemäß dieser Klausel einzuräumen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 9 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 9 Pflichten des Plattformbetreibers
                        </h2>
                        <p>
                            (1) Die vom Plattformbetreiber auf der Plattform angebotenen Dienste unterliegen einer kontinuierlichen Weiterentwicklung, die sich von Zeit zu Zeit in zumutbarem Umfang ändern. Der Plattformbetreiber behält sich vor, die Bereitstellung der Dienste (oder Funktionen innerhalb der Dienste) für einzelne oder alle Nutzer zeitweise oder dauerhaft einzustellen. Änderungen oder Einschränkungen der Dienste teilt der Plattformbetreiber den Nutzern mit angemessenem Vorlauf mit.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber haftet nicht für den Datenverlust aufgrund einer etwaigen technischen Störung oder einer Einstellung von Diensten.
                        </p>
                        <p>
                            (3) Die Verfügbarkeit der Plattform beträgt 98 % im Jahresmittel. Ausgenommen sind Zeiten, in denen die Server wegen routinemäßiger und zuvor angekündigter Wartungsarbeiten oder Störungen außerhalb des Einflussbereiches des Plattformbetreibers nicht verfügbar sind.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber ist bemüht die Software aktuell zu halten, ohne dass jedoch ein Rechtsanspruch hierauf besteht. Der Plattformbetreiber kann den Funktionsumfang der Plattform jederzeit einschränken oder erweitern.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 10 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 10 Bewertungs- und Reputationssystem
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber stellt den Nutzern ein Bewertungs- und Reputationssystem zur Verfügung, über das Nutzer die Möglichkeit haben, sich gegenseitig zu bewerten. Dieses System dient der Förderung von Transparenz und Vertrauen innerhalb der Plattform.
                        </p>
                        <p>
                            (2) Bewertungen können nur von registrierten Nutzern abgegeben werden und müssen den tatsächlichen Erfahrungen des bewertenden Nutzers entsprechen. Unwahre, beleidigende oder unsachliche Bewertungen sind unzulässig.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber behält sich das Recht vor, Bewertungen, die gegen die Plattformrichtlinien oder gesetzliche Bestimmungen verstoßen, zu löschen oder zu ändern. Nutzer, deren Bewertungen entfernt oder geändert wurden, werden darüber informiert und haben die Möglichkeit, Einspruch gegen diese Entscheidung einzulegen. Der Einspruch ist schriftlich an den Plattformbetreiber zu richten und wird manuell von einem Mitarbeiter überprüft.
                        </p>
                        <p>
                            (4) Nutzer, die Bewertungen abgeben, sind verpflichtet, dabei die allgemeinen Sitten und den respektvollen Umgang zu wahren. Insbesondere sind diskriminierende, rassistische, sexistische oder anderweitig unangemessene Bewertungen untersagt.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber übernimmt keine Haftung für die Richtigkeit und Vollständigkeit der abgegebenen Bewertungen. Die Bewertungen spiegeln ausschließlich die Meinungen der jeweiligen Nutzer wider und stellen keine Meinungen des Plattformbetreibers dar.
                        </p>
                        <p>
                            (6) Der Plattformbetreiber ist berechtigt, die Kriterien und Funktionsweise des Bewertungs- und Reputationssystems jederzeit zu ändern, zu erweitern oder einzustellen. Die Nutzer werden über wesentliche Änderungen in geeigneter Weise informiert.
                        </p>
                        <p>
                            (7) Nutzer, die sich durch eine Bewertung in ihren Rechten verletzt sehen, können dies dem Plattformbetreiber melden. Der Plattformbetreiber wird die Beschwerde prüfen und gegebenenfalls Maßnahmen ergreifen, um die beanstandete Bewertung zu entfernen oder zu ändern.
                        </p>
                        <p>
                            (8) Der Nutzer stellt den Plattformbetreiber von allen Ansprüchen Dritter frei, die aufgrund von Bewertungen geltend gemacht werden, die der Nutzer abgegeben hat, sofern die Bewertungen gegen gesetzliche Bestimmungen oder Rechte Dritter verstoßen.
                        </p>
                        <p>
                            (9) Der Plattformbetreiber haftet nicht für Schäden, die durch das Bewertungs- und Reputationssystem entstehen, es sei denn, der Plattformbetreiber handelt vorsätzlich oder grob fahrlässig.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 11 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 11 Haftung
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber übernimmt für angeliefertes Datenmaterial, Anzeigentexte oder diesbezügliche Speichermedien keine Verantwortung und ist insbesondere nicht verpflichtet, diese aufzubewahren oder zurückzugeben. Eine Löschung nach Vertragsende erfolgt nach den gesetzlichen Vorgaben.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber haftet für Sach- oder Rechtsmängel nach den vorhandenen geltenden gesetzlichen Vorschriften.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber haftet Nutzern gegenüber in allen Fällen vertraglicher und außervertraglicher Haftung bei Vorsatz und grober Fahrlässigkeit nach Maßgabe der gesetzlichen Bestimmungen auf Schadensersatz oder Ersatz vergeblicher Aufwendungen.
                        </p>
                        <p>
                            (4) In sonstigen Fällen haftet der Plattformbetreiber - soweit nicht abweichend geregelt – nur bei Verletzung einer Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung die Nutzer regelmäßig vertrauen dürfen (sogenannte Kardinalpflicht), und zwar beschränkt auf den Ersatz des vorhersehbaren und typischen Schadens. In allen übrigen Fällen ist die Haftung des Plattformbetreibers vorbehaltlich abweichender Regelungen ausgeschlossen.
                        </p>
                        <p>
                            (5) Eine Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit und nach dem Produkthaftungsgesetz bleibt von den vorstehenden Haftungsbeschränkungen und -ausschlüssen unberührt.
                        </p>
                        <p>
                            (6) Die Haftungsbeschränkungen gelten zugunsten der Mitarbeiter, Beauftragten und Erfüllungsgehilfen des Plattformbetreibers entsprechend.
                        </p>
                        <p>
                            (7) Der Plattformbetreiber ist ausschließlich als Plattformbetreiber tätig und übernimmt keine Haftung für die von Nutzern eingestellten Inhalte, die Durchführung von Verträgen zwischen den Nutzern, die Gewährleistung für die von Nutzern angebotenen Produkte oder Dienstleistungen sowie für Streitigkeiten, die zwischen den Nutzern entstehen. Die Nutzer sind selbst dafür verantwortlich, dass ihre Inhalte keine Rechte Dritter verletzen und den gesetzlichen Bestimmungen entsprechen.
                        </p>
                        <p>
                            (8) Die Nutzer stellen den Plattformbetreiber sowie dessen Mitarbeiter, Beauftragte und Erfüllungsgehilfen von allen Ansprüchen Dritter frei, die aufgrund der von den Nutzern eingestellten Inhalte, der Durchführung von Verträgen oder der angebotenen Produkte und Dienstleistungen geltend gemacht werden. Dies umfasst insbesondere Ansprüche aufgrund von Rechtsverletzungen oder Streitigkeiten zwischen den Nutzern.
                        </p>
                        <p>
                            (9) Die vorstehenden Haftungsbeschränkungen und Freistellungsklauseln gelten auch für die Nutzung der Plattform im Rahmen der KI-gestützten Inhaltsprüfung. Der Plattformbetreiber haftet nicht für Schäden, die durch die automatisierte Prüfung oder die daraus resultierenden Maßnahmen entstehen, es sei denn, der Plattformbetreiber handelt vorsätzlich oder grob fahrlässig.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 12 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 12 KI-gestützte Inhaltsprüfung
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber behält sich das Recht vor, Inhalte, die von Nutzern auf der Plattform eingestellt werden, durch den Einsatz von Künstlicher Intelligenz (KI) zu prüfen. Hierfür wird die OpenAI API als externer Anbieter genutzt. Diese KI-gestützte Inhaltsprüfung dient ausschließlich der Unterstützung der Moderation der eingestellten Inhalte, um sicherzustellen, dass diese den gesetzlichen Bestimmungen, den Richtlinien der Plattform und den allgemeinen Sitten entsprechen.
                        </p>
                        <p>
                            (2) Die KI-gestützte Inhaltsprüfung kann folgende Maßnahmen ergreifen: a. Anzeigen freigeben, b. Anzeigen ablehnen, c. Anzeigen zur manuellen Prüfung markieren.
                        </p>
                        <p>
                            (3) Die endgültige Entscheidungsgewalt über die Freigabe, Ablehnung oder Änderung von Inhalten liegt beim Plattformbetreiber. Es werden keine endgültigen vollautomatisierten rechtlichen Entscheidungen ohne menschliche Prüfung getroffen.
                        </p>
                        <p>
                            (4) Die KI-gestützte Inhaltsprüfung erfolgt automatisiert, jedoch wird keine Profilbildung oder Verhaltensanalyse der Nutzer durchgeführt. Eine automatisierte Sperrung von Inhalten ohne menschliche Überprüfung findet nicht statt.
                        </p>
                        <p>
                            (5) Die Nutzer werden über die Ablehnung oder Markierung ihrer Inhalte zur manuellen Prüfung informiert und haben die Möglichkeit, Einspruch gegen die Entscheidung einzulegen. Der Einspruch ist schriftlich an den Plattformbetreiber zu richten und wird manuell von einem Mitarbeiter überprüft.
                        </p>
                        <p>
                            (6) Die Nutzung der KI-gestützten Inhaltsprüfung entbindet die Nutzer nicht von ihrer Verantwortung, nur rechtmäßige und den Plattformrichtlinien entsprechende Inhalte einzustellen. Die Nutzer sind weiterhin verpflichtet, sicherzustellen, dass ihre Inhalte keine Rechte Dritter verletzen und keine illegalen, beleidigenden oder anderweitig unangemessenen Inhalte enthalten.
                        </p>
                        <p>
                            (7) Der Plattformbetreiber haftet nicht für Schäden, die durch die automatisierte KI-gestützte Inhaltsprüfung entstehen, es sei denn, der Plattformbetreiber handelt vorsätzlich oder grob fahrlässig.
                        </p>
                        <p>
                            (8) Die Nutzer stellen den Plattformbetreiber von allen Ansprüchen Dritter frei, die aufgrund der von ihnen eingestellten Inhalte geltend gemacht werden, sofern die Inhalte trotz der KIgestützten Inhaltsprüfung gegen gesetzliche Bestimmungen oder Rechte Dritter verstoßen.
                        </p>
                        <p>
                            (9) Der Plattformbetreiber ist berechtigt, die KI-gestützte Inhaltsprüfung jederzeit zu ändern, zu erweitern oder einzustellen. Die Nutzer werden über wesentliche Änderungen in geeigneter Weise informiert.
                        </p>
                        <p>
                            (10) Die Nutzung der OpenAI API und anderer externer Anbieter im Rahmen der KI-gestützten Inhaltsprüfung erfolgt in Übereinstimmung mit der Datenschutzerklärung der Plattform.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 13 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 13 Verschwiegenheit
                        </h2>
                        <p>
                            Nutzer verpflichten sich, über alle im Rahmen der Vermittlungstätigkeit erhaltenen geschäftlichen Informationen während der Vertragslaufzeit und nach Beendigung dieses Vertrags gegenüber Dritten Stillschweigen zu bewahren.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 14 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 14 Urheberrechte
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber hält die Urheberrechte an allen Bildern, Filmen und Texten, die von ihm auf der Plattform veröffentlicht werden. Eine Verwendung dieser Bilder, Filme und Texte ist ohne ausdrückliche Zustimmung des Plattformbetreibers nicht gestattet.
                        </p>
                        <p>
                            (2) Die Urheberrechte und Nutzungsrechte an Bildern, Filmen und Texten, die vom Verkäufer auf die Plattform hochgeladen werden, verbleiben beim Verkäufer. Der Verkäufer räumt dem Plattformbetreiber jedoch das Recht ein, diese Inhalte im Rahmen der Plattform zu nutzen, zu vervielfältigen und zu veröffentlichen, soweit dies für den Betrieb und die Bewerbung der Plattform notwendig ist. Eine darüberhinausgehende Nutzung durch den Plattformbetreiber bedarf der ausdrücklichen Zustimmung des Verkäufers.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 15 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 15 Datenschutz
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber darf die Nutzerdaten, die Nutzer in ihrem Nutzerprofil hochladen, verarbeiten und speichern und an Dritte weitergeben, soweit dies für die Ausführung der Vermittlung erforderlich ist und solange er zur Aufbewahrung dieser Daten aufgrund gesetzlicher Vorschriften verpflichtet ist.
                        </p>
                        <p>
                            (2) Weitere Informationen zum Datenschutz finden die Nutzer in der Datenschutzerklärung des Plattformbetreibers unter{' '}
                            <Link href="/datenschutzerkl_rung" className="text-forest font-medium underline">
                                Datenschutzerklärung
                            </Link>.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 16 */}
                    <section className="space-y-4">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 16 Gesetzliches Widerrufsrecht für Verbraucher
                        </h2>
                        <p>
                            (1) Verbrauchern steht bei Abschluss eines entgeltlichen Nutzungsvertrages ein gesetzliches Widerrufsrecht vom Nutzungsvertrag zu. Hierzu verweist der Plattformbetreiber auf die nachfolgende Widerrufsbelehrung.
                        </p>
                        <p>
                            (2) Unternehmern steht kein Widerrufsrecht zu.
                        </p>

                        {/* Widerrufsbelehrung Card */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-forest/15 shadow-xs space-y-4">
                            <h3 className="font-display text-lg font-bold text-forest uppercase tracking-wide">
                                Widerrufsbelehrung
                            </h3>
                            <p className="text-xs text-charcoal/60">
                                Widerrufsbelehrung nach EGBGB Anlage 1 zu Art. 246a § 1 Abs. 2 Satz 2. Fundstelle: BGBl. I 2013, 3642 - 3670
                            </p>

                            <div className="space-y-3">
                                <h4 className="font-bold text-forest">Widerrufsrecht</h4>
                                <p>
                                    Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
                                </p>
                                <p>
                                    Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, <strong>LMR Solutions Ronny Voigt</strong>, Inhaber: Ronny Voigt, Premnitzer Straße 8, 99091 Erfurt, mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail an <a href="mailto:kontakt@campuna.de" className="text-forest underline font-medium">kontakt@campuna.de</a>) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
                                </p>
                                <p>
                                    Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="font-bold text-forest">Folgen des Widerrufs</h4>
                                <p>
                                    Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
                                </p>
                                <p>
                                    Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
                                </p>
                            </div>

                            {/* Muster-Formular */}
                            <div className="bg-sand/40 rounded-xl p-5 border border-forest/10 space-y-3 mt-4">
                                <h4 className="font-bold text-forest text-sm">Muster-Widerrufsformular</h4>
                                <p className="text-xs text-charcoal/70">
                                    (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
                                </p>
                                <div className="text-xs sm:text-sm space-y-1.5 font-mono text-charcoal/80 bg-white p-4 rounded-lg border border-forest/10">
                                    <p>An LMR Solutions Ronny Voigt, Inhaber: Ronny Voigt, Premnitzer Straße 8, 99091 Erfurt (E-Mail: kontakt@campuna.de):</p>
                                    <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*):</p>
                                    <p>– Bestellt am (*)/erhalten am (*)</p>
                                    <p>– Name des/der Verbraucher(s)</p>
                                    <p>– Anschrift des/der Verbraucher(s)</p>
                                    <p>– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
                                    <p>– Datum</p>
                                    <p className="text-[11px] text-charcoal/50 italic pt-1">(*) Unzutreffendes streichen</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 17 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 17 Streitschlichtung, Anwendbares Recht und Gerichtsstand
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber nimmt an keinem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes teil.
                        </p>
                        <p>
                            (2) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Wenn der Nutzer die Bestellung als Verbraucher abgegeben hat und zum Zeitpunkt der Bestellung seinen gewöhnlichen Aufenthalt in einem anderen Land hat, bleibt die Anwendung zwingender Rechtsvorschriften dieses Landes von der in Satz 1 getroffenen Rechtswahl unberührt.
                        </p>
                        <p>
                            (3) Wenn der Nutzer Kaufmann ist, ist ausschließlicher Gerichtsstand der Geschäftssitz des Plattformbetreibers. Im Übrigen gelten für die örtliche und die internationale Zuständigkeit die anwendbaren gesetzlichen Bestimmungen.
                        </p>
                    </section>

                </div>
            </main>
        </div>
    );
}
