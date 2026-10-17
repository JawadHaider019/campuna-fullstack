'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Scale
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AgbClient() {
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
                        Aktualisierte Fassung auf Basis der bestehenden 18 Paragraphen | Stand: 16. Oktober 2026
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
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 sm:py-16">
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
                            (2) Der Plattformbetreiber stellt eine Vermittlungsplattform zum An- und Verkauf von neuen und gebrauchten Waren sowie zur Vermittlung von Dienstleistungen, Vermietungen und weiteren campingbezogenen Angeboten bereit, auf der Verkäufer Angebote veröffentlichen und Interessenten Kontakt aufnehmen können. Verkäufer und Käufer werden folgend zusammengefasst auch als Nutzer bezeichnet, insofern keine Differenzierung erfolgt. Der Abschluss und die Abwicklung von Geschäften über inserierte Waren und Leistungen erfolgen unmittelbar zwischen den jeweiligen Nutzern; Campuna stellt hierfür keinen eigenen Kauf- oder Zahlungsabschluss zwischen Nutzern bereit.
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
                            (7) Die Nutzung der Plattform unterliegt zusätzlich den Nutzungsbedingungen, soweit solche gesondert wirksam vereinbart und auf der Plattform zugänglich gemacht werden. Zwingende gesetzliche Rechte der Nutzer bleiben unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 2 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 2 Registrierung und Ablauf
                        </h2>
                        <p>
                            (1) Für die aktive Nutzung der Plattform, insbesondere das Einstellen von Inseraten und die Kontaktaufnahme, ist eine Registrierung mit einer aktuellen E-Mail-Adresse erforderlich. Der Plattformbetreiber sendet auf die Registrierung hin per Mail an die vom Nutzer angegebene E-Mail-Adresse einen anklickbaren Link zur Freischaltung zu. Eine Nutzung der registrierungspflichtigen Funktionen ist nach Anklicken des Links möglich. Öffentlich sichtbare Angebote können ohne Registrierung eingesehen werden.
                        </p>
                        <p>
                            (2) Das Mindestalter für die Registrierung beträgt 16 Jahre. Für kostenpflichtige Verträge Minderjähriger ist, soweit gesetzlich erforderlich, die Zustimmung der gesetzlichen Vertreter notwendig.
                        </p>
                        <p>
                            (3) Jeder Nutzer kann nur ein Nutzerkonto anlegen. Die Überlassung an Dritte ist nicht gestattet. Nutzer verpflichten sich, die erforderlichen Maßnahmen zur Gewährleistung der Vertraulichkeit ihrer Account-Daten und ihres Passworts zu ergreifen und ihr Passwort geheim zu halten. Bei Missbrauch des Kontos oder einem entsprechenden Verdacht und bei Missbrauch oder Verlust des Passwortes ist dies dem Plattformbetreiber unverzüglich anzuzeigen. Der Plattformbetreiber ist in solchen Fällen berechtigt, das Konto bei Vorliegen eines sachlichen Grundes ganz oder vorübergehend zu sperren.
                        </p>
                        <p>
                            (4) Nach Freischalten der Plattform zur Nutzung können Verkäufer ein Verkäuferprofil und Käufer ein Käuferprofil anlegen. Dabei sind alle Nutzer verpflichtet, vollständige und wahrheitsgemäße Angaben zu machen. Sollten Nutzer schuldhaft irreführende oder unwahre Angaben machen, sind sie zum Schadensersatz verpflichtet, soweit dem Plattformbetreiber durch diese unwahren Angaben ein Schaden entstanden ist. Nutzer sind weiter verpflichtet, den Plattformbetreiber im gesetzlich zulässigen Umfang von begründeten Ansprüchen Dritter freizustellen, soweit diese auf einer von ihnen zu vertretenden Rechtsverletzung beruhen. Weitere gesetzliche Ansprüche bleiben unberührt.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber prüft nicht jedes Profil vor dessen Freischaltung. Der Plattformbetreiber behält sich aber vor, einzelne Angaben zu überprüfen, indem er beispielsweise von Nutzern Nachweise verlangt. Der Plattformbetreiber ist berechtigt, die Veröffentlichung von Nutzerprofilen abzulehnen, wenn das jeweilige Profil der Spezialisierung der Plattform nicht entspricht oder die Verlässlichkeit der Angaben nicht ausreichend nachgewiesen wurde. Dies gilt auch, soweit die zu veröffentlichenden Inhalte gegen gesetzliche Vorgaben, behördliche Verbote, Rechte Dritter, gegen die guten Sitten oder gegen diese AGB verstoßen. Der Plattformbetreiber übernimmt keine Garantie für die von Nutzern gemachten Angaben. Gesetzliche Informations- und Beschwerderechte bleiben unberührt.
                        </p>
                        <p>
                            (6) Nach Freischaltung des Profils haben Verkäufer die Möglichkeit, Anzeigen zu schalten. Käufer erhalten nun Zugriff auf das Verkäuferprofil und können Angebote wahrnehmen oder sonstige Leistungen vereinbaren. Käufer und Verkäufer haben sodann die Möglichkeit, nachfolgend Verträge zu schließen. Der Plattformbetreiber ist nicht Partei solcher Verträge und übernimmt keine Verantwortung für deren Durchführung, soweit nicht zwingende gesetzliche Pflichten bestehen.
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
                            (3) Der Plattformbetreiber ist berechtigt, personenbezogene Daten in Nutzerprofilen an andere Nutzer weiterzuleiten, wenn hierfür eine wirksame Einwilligung oder eine andere gesetzliche Rechtsgrundlage besteht. Eine Weitergabe erfolgt nur zu den jeweils zulässigen Zwecken. Weitere Einzelheiten enthält die Datenschutzerklärung.
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
                            (2) Private Verkäufer können Inserate dauerhaft kostenlos einstellen. Zusätzlich haben sie die Möglichkeit, einzelne Anzeigen kostenpflichtig hervorzuheben. Kostenpflichtig sind für private Verkäufer nur freiwillige Zusatzleistungen. Diese Zusatzbuchungen sind Einmalbuchungen für eine bestimmte Laufzeit und enden automatisch nach der vereinbarten Laufzeit. Es besteht kein Abonnement.
                        </p>
                        <p>
                            (3) Für gewerbliche Verkäufer (Unternehmer gem. § 14 BGB) stellt der Plattformbetreiber sowohl ein dauerhaft kostenfreies Basiskonto (mit bis zu 3 gleichzeitig aktiven Inseraten, Firmenlogo und einer Profilbeschreibung von bis zu 500 Zeichen) als auch das kostenpflichtige Campuna Business-Paket bereit.
                        </p>
                        <p>
                            (4) Das Campuna Business-Paket umfasst bis zu 25 gleichzeitig aktive Inserate, ein professionelles Firmen-Cover und Logo, erweiterte Profiltexte (bis zu 1.000 Zeichen), Performance-Statistiken sowie Präsenz im Camping-Anbieter-Verzeichnis. Anbieter-Spotlights können gesondert gebucht werden und sind nicht im Business-Preis enthalten. Folgende Laufzeiten und Preise stehen zur Verfügung:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li><strong>1 Monat:</strong> 29 € (Prepaid-Festlaufzeit)</li>
                            <li><strong>3 Monate:</strong> 79 € (Prepaid-Festlaufzeit)</li>
                            <li><strong>12 Monate:</strong> 290 € (Prepaid-Festlaufzeit)</li>
                        </ul>
                        <p>
                            (5) <strong>Feste Prepaid-Laufzeit / Kein automatisches Abonnement:</strong> Das Campuna Business-Paket wird als feste Prepaid-Laufzeit erworben und im Voraus abgerechnet. Die Mitgliedschaft endet nach Ablauf der gebuchten 1, 3 oder 12 Monate automatisch, ohne dass es einer Kündigung bedarf. Es findet keine automatische Verlängerung statt. Der Nutzer kann die Business-Mitgliedschaft vor oder nach Ablauf aktiv durch erneuten Kauf verlängern. Nach Ablauf der Frist wechselt das Profil automatisch wieder in das dauerhaft kostenlose Basiskonto.
                        </p>
                        <p>
                            (6) Private und gewerbliche Verkäufer können einzelne Inserate optional kostenpflichtig hervorheben („Boost“). Der zuletzt abgestimmte Tarif lautet: <strong>7 Tage 4,99 € oder 500 CC</strong>; <strong>14 Tage 7,99 € oder 800 CC</strong>; <strong>30 Tage 12,99 € oder 1.300 CC</strong>. Maßgeblich sind die bei Bestellung ausgewiesenen Endpreise und Credit-Beträge. Eine erneute Buchung während einer laufenden Hervorhebung verlängert deren Laufzeit nach der im Buchungsprozess ausgewiesenen Berechnung.
                        </p>
                        <p>
                            (7) Die Hervorhebung startet nach erfolgreicher Zahlung beziehungsweise wirksamer Einlösung von Credits. Die Laufzeit richtet sich nach der gewählten Option. Die Hervorhebung endet automatisch nach Ablauf der gebuchten Laufzeit. Es erfolgt keine automatische Verlängerung. Es besteht kein Abonnement. Es besteht kein Anspruch auf eine bestimmte Anzahl an Klicks, Anfragen oder Verkäufen.
                        </p>
                        <p>
                            (8) Zusätzlich können gewerbliche Verkäufer eine kostenpflichtige Zusatzoption namens „Anbieter-Spotlight“ buchen, um ihr Verkäuferprofil zeitlich begrenzt im Bereich „Ausgewählte Anbieter“ beziehungsweise in einer Anbieter-Rotation auf der Startseite erscheinen zu lassen. Die zuletzt abgestimmten Preise hierfür betragen:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li><strong>7 Tage:</strong> 14,99 €</li>
                            <li><strong>14 Tage:</strong> 24,99 €</li>
                            <li><strong>30 Tage:</strong> 39,99 €</li>
                        </ul>
                        <p>
                            Voraussetzung ist ein vollständig eingerichtetes und verifiziertes gewerbliches Profil nach den auf der Plattform ausgewiesenen Kriterien. Ein aktives Inserat ist nicht zwingend erforderlich. Die Buchung kann nach Maßgabe der Plattform auch mit Campuna Credits erfolgen.
                        </p>
                        <p>
                            (9) Die Platzierung erfolgt im Bereich „Ausgewählte Anbieter“ / Startseiten-Rotation. Die Laufzeit richtet sich nach der gewählten Option. Die Zusatzoption beginnt nach erfolgreicher Zahlung oder Credit-Einlösung und endet automatisch nach Ablauf der gebuchten Laufzeit. Es erfolgt keine automatische Verlängerung. Es besteht kein Abonnement. Es besteht kein Anspruch auf eine bestimmte Anzahl an Klicks, Anfragen, Kontakten oder Umsätzen. Bei mehreren gebuchten oder aktiven Anbieter-Spotlights kann die Darstellung rotierend erfolgen.
                        </p>
                        <p>
                            (10) Die Präsentation und Bewerbung von Optionen auf der Webseite stellen noch kein bindendes Angebot zum Abschluss eines Vertrags dar. Ein Vertrag kommt erst zustande, wenn der Plattformbetreiber die Bestellung des Nutzers durch eine Annahmeerklärung annimmt oder wenn die Leistung erbracht wird. Zwingende Vorgaben zum elektronischen Geschäftsverkehr bleiben unberührt.
                        </p>
                        <p>
                            (11) Nach Abschluss des Nutzungsvertrages kann der Nutzer für die vereinbarte Dauer die Leistungen in Anspruch nehmen. Der Nutzer ist bei der Gestaltung von Profil und Angeboten sowie deren Abwicklung frei. Der Nutzer ist allerdings für die Einhaltung der gesetzlichen Bestimmungen verantwortlich und stellt den Plattformbetreiber im gesetzlich zulässigen Umfang von Ansprüchen Dritter aufgrund von von ihm zu vertretenden Verstößen frei.
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
                            (3) Die Abrechnung für Business-Pakete erfolgt für die gesamte gewählte Laufzeit (1, 3 oder 12 Monate) einmalig im Voraus. Einzelne Zusatzoptionen und Credit-Pakete werden als Einmalzahlungen abgerechnet. Es erfolgen keine automatischen Folgebelastungen für Business-Pakete.
                        </p>
                        <p>
                            (4) Die Freischaltung der Nutzung kostenpflichtiger Leistungen erfolgt erst nach erfolgreicher Zahlung beziehungsweise bei Credit-Buchungen nach erfolgreicher Einlösung. Der Plattformbetreiber behält sich das Recht vor, die Freischaltung bis zur Bestätigung der Zahlung durch Stripe zu verzögern.
                        </p>
                        <p>
                            (5) Im Falle einer fehlgeschlagenen Zahlung wird der Nutzer über den Zahlungsstatus informiert. Die kostenpflichtige Leistung wird grundsätzlich erst nach erfolgreicher Zahlung freigeschaltet. Soweit ausnahmsweise eine fällige Forderung besteht, gelten die gesetzlichen Zahlungs- und Verzugsregelungen.
                        </p>
                        <p>
                            (6) Nutzer sind zur Aufrechnung mit unbestrittenen oder rechtskräftig festgestellten Forderungen berechtigt. Gesetzliche Aufrechnungsrechte bleiben unberührt.
                        </p>
                        <p>
                            (7) Der Plattformbetreiber behält sich das Recht vor, bei erheblichen schuldhaften Zahlungsverstößen nach Maßgabe der gesetzlichen Voraussetzungen das betroffene Vertragsverhältnis außerordentlich zu kündigen. Der Nutzer wird über eine solche Maßnahme informiert.
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
                            (2) Das Campuna Business-Paket wird für die gewählte Festlaufzeit (1, 3 oder 12 Monate) im Voraus vereinbart und verlängert sich nicht automatisch. Der Vertrag über das gebuchte Paket endet mit Ablauf des gewählten Zeitraums automatisch, ohne dass eine Kündigung erforderlich ist. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Soweit gesetzlich eine Online-Kündigungsmöglichkeit erforderlich ist, stellt der Plattformbetreiber diese unter <Link href="/vertraege-kuendigen" className="text-forest font-semibold underline hover:text-forest/80">/vertraege-kuendigen</Link> bereit.
                        </p>
                        <p>
                            (3) Ein kostenfreier Nutzungsvertrag kann jederzeit ohne Angabe von Gründen in Textform von beiden Parteien gekündigt werden, wobei für eine Kündigung durch den Plattformbetreiber gesetzliche Informations-, Frist- und Begründungspflichten unberührt bleiben.
                        </p>
                        <p>
                            (4) Kündigungen können in Textform oder über eine bereitgestellte Online-Kündigungsfunktion erklärt werden. Gesetzlich vorgeschriebene Kündigungswege dürfen nicht von einer Anmeldung oder zusätzlichen, unzulässigen Hürden abhängig gemacht werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt davon unberührt.
                        </p>
                        <p>
                            (5) Nach Ablauf des Business-Pakets endet die kostenpflichtige Nutzung zum Ende der bezahlten Laufzeit. Das Nutzerprofil wechselt automatisch in das kostenlose Basiskonto zurück (bis zu 3 aktive Inserate). Etwaige überzählige Inserate werden vorübergehend pausiert, bleiben jedoch im Nutzerkonto erhalten.
                        </p>
                        <p>
                            (6) Wird das gesamte Nutzerkonto beendet, werden personenbezogene Daten nach Maßgabe der Datenschutzerklärung gelöscht oder für gesetzlich zulässige Zwecke aufbewahrt. Gesetzliche Aufbewahrungspflichten, berechtigte Rechtsverfolgung und die Rechte betroffener Personen bleiben unberührt. Eine pauschale Löschung sämtlicher Daten nach sechs Monaten wird nicht zugesagt.
                        </p>
                        <p>
                            (7) Mit Wirksamwerden der Beendigung des gesamten Nutzerkontos endet das Nutzungsverhältnis und der Nutzer kann seinen Zugang nicht mehr nutzen. Der Plattformbetreiber behält sich vor, den Benutzernamen sowie das Passwort mit Wirksamwerden der Beendigung zu sperren. Die Beendigung lediglich des Business-Pakets führt nicht zur Sperrung des kostenlosen Kontos.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 7 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 7 Vermittlungstätigkeit
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber erbringt keine eigenen Dienstleistungen in Bezug auf die von Nutzern inserierten Waren und Leistungen. Bei dem Dienst auf der Plattform handelt es sich um eine reine Vermittlung von Kontakten zwischen Verkäufern und Käufern und das Zurverfügungstellen der Plattform. Davon unberührt bleiben die eigenen kostenpflichtigen Plattformleistungen. Der Plattformbetreiber kann nicht gewährleisten, dass Verkäufer und deren Dienste für die Käufer auch tatsächlich verfügbar sind. Es besteht für Nutzer kein Anspruch auf eine erfolgreiche Vermittlung und kein Anspruch auf die Bereitstellung einer bestimmten Anzahl von Vertragsabschlüssen.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber handelt lediglich als Vermittler und ist nicht verantwortlich für die Inhalte der Angebote der Verkäufer, soweit nicht eigene gesetzliche Pflichten bestehen. Der Plattformbetreiber übernimmt keine Gewährleistung für die Richtigkeit, Qualität, Verfügbarkeit oder rechtliche Zulässigkeit der von Nutzern angebotenen Leistungen. Jeder Vertrag kommt ausschließlich zwischen dem Käufer und dem jeweiligen Verkäufer zustande. Vertragliche Ansprüche aus diesen Geschäften sind grundsätzlich gegenüber dem jeweiligen Vertragspartner geltend zu machen. Zwingende gesetzliche Ansprüche gegen den Plattformbetreiber bleiben unberührt.
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
                            (2) Nutzer sichern zu, dass sie alle Rechte an den von ihnen auf die Plattform hochgeladenen Inhalten haben oder über eine Lizenz für die Inhalte verfügen, um dem Plattformbetreiber die Rechte gemäß dieser Klausel einzuräumen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 9 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 9 Pflichten des Plattformbetreibers
                        </h2>
                        <p>
                            (1) Die vom Plattformbetreiber auf der Plattform angebotenen Dienste unterliegen einer kontinuierlichen Weiterentwicklung, die sich von Zeit zu Zeit in zumutbarem Umfang ändern. Der Plattformbetreiber behält sich vor, die Bereitstellung der Dienste (oder Funktionen innerhalb der Dienste) im gesetzlich zulässigen Rahmen für einzelne oder alle Nutzer zeitweise oder dauerhaft einzustellen. Änderungen oder Einschränkungen der Dienste teilt der Plattformbetreiber den Nutzern mit angemessenem Vorlauf mit, soweit dies rechtlich erforderlich ist.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber haftet für Datenverluste aufgrund technischer Störungen oder der Einstellung von Diensten nach Maßgabe der gesetzlichen Bestimmungen und der Haftungsregelungen in § 11.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber strebt eine hohe Verfügbarkeit der Plattform an. Vorübergehende Einschränkungen können insbesondere durch Wartung, Sicherheitsmaßnahmen oder Störungen außerhalb seines Einflussbereichs entstehen. Eine garantierte Verfügbarkeitsquote von 98 % wird nicht vereinbart, sofern sie nicht ausdrücklich im jeweiligen Vertrag zugesagt ist.
                        </p>
                        <p>
                            (4) Der Plattformbetreiber ist bemüht, die Software aktuell zu halten. Gesetzliche Pflichten zur Bereitstellung von Aktualisierungen, insbesondere bei entgeltlichen digitalen Leistungen, bleiben unberührt. Der Plattformbetreiber kann den Funktionsumfang im gesetzlich zulässigen Rahmen einschränken oder erweitern.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 10 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 10 Bewertungs- und Reputationssystem
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber stellt den Nutzern, soweit die Funktion auf der Plattform freigeschaltet ist, ein Bewertungs- und Reputationssystem zur Verfügung, über das Nutzer die Möglichkeit haben, sich gegenseitig zu bewerten. Dieses System dient der Förderung von Transparenz und Vertrauen innerhalb der Plattform.
                        </p>
                        <p>
                            (2) Bewertungen können nur von registrierten Nutzern abgegeben werden und müssen den tatsächlichen Erfahrungen des bewertenden Nutzers entsprechen. Unwahre, beleidigende oder unsachliche Bewertungen sind unzulässig.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber behält sich das Recht vor, Bewertungen, die gegen die Plattformrichtlinien oder gesetzliche Bestimmungen verstoßen, zu entfernen oder zu moderieren. Nutzer, deren Bewertungen entfernt oder eingeschränkt wurden, werden darüber informiert, soweit gesetzlich erforderlich, und haben die Möglichkeit, Einspruch gegen diese Entscheidung einzulegen. Der Einspruch kann über die bereitgestellten Melde- und Beschwerdewege eingelegt werden und wird nach Maßgabe der gesetzlichen Anforderungen überprüft.
                        </p>
                        <p>
                            (4) Nutzer, die Bewertungen abgeben, sind verpflichtet, dabei die allgemeinen Sitten und den respektvollen Umgang zu wahren. Insbesondere sind diskriminierende, rassistische, sexistische oder anderweitig unangemessene Bewertungen untersagt.
                        </p>
                        <p>
                            (5) Der Plattformbetreiber übernimmt keine Gewähr für die Richtigkeit und Vollständigkeit der abgegebenen Bewertungen, soweit gesetzlich zulässig. Die Bewertungen spiegeln ausschließlich die Meinungen der jeweiligen Nutzer wider und stellen keine Meinungen des Plattformbetreibers dar.
                        </p>
                        <p>
                            (6) Der Plattformbetreiber ist berechtigt, die Kriterien und Funktionsweise des Bewertungs- und Reputationssystems im gesetzlich zulässigen Rahmen zu ändern, zu erweitern oder einzustellen. Die Nutzer werden über wesentliche Änderungen in geeigneter Weise informiert.
                        </p>
                        <p>
                            (7) Nutzer, die sich durch eine Bewertung in ihren Rechten verletzt sehen, können dies dem Plattformbetreiber melden. Der Plattformbetreiber wird die Beschwerde prüfen und gegebenenfalls Maßnahmen ergreifen, um die beanstandete Bewertung zu entfernen oder zu ändern.
                        </p>
                        <p>
                            (8) Der Nutzer stellt den Plattformbetreiber im gesetzlich zulässigen Umfang von begründeten Ansprüchen Dritter frei, die aufgrund von Bewertungen geltend gemacht werden, die der Nutzer abgegeben hat, sofern die Bewertungen schuldhaft gegen gesetzliche Bestimmungen oder Rechte Dritter verstoßen.
                        </p>
                        <p>
                            (9) Für Schäden im Zusammenhang mit dem Bewertungs- und Reputationssystem gelten die Haftungsregeln des § 11.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 11 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 11 Haftung
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber übernimmt für angeliefertes Datenmaterial, Anzeigentexte oder diesbezügliche Speichermedien keine über gesetzliche Pflichten hinausgehende Aufbewahrungspflicht. Eine Löschung nach Vertragsende erfolgt nach den gesetzlichen Vorgaben.
                        </p>
                        <p>
                            (2) Der Plattformbetreiber haftet für Sach- oder Rechtsmängel nach den vorhandenen geltenden gesetzlichen Vorschriften.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber haftet Nutzern gegenüber in allen Fällen vertraglicher und außervertraglicher Haftung bei Vorsatz und grober Fahrlässigkeit nach Maßgabe der gesetzlichen Bestimmungen auf Schadensersatz oder Ersatz vergeblicher Aufwendungen.
                        </p>
                        <p>
                            (4) In sonstigen Fällen haftet der Plattformbetreiber – soweit nicht abweichend geregelt – nur bei Verletzung einer Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung die Nutzer regelmäßig vertrauen dürfen (sogenannte Kardinalpflicht), und zwar beschränkt auf den Ersatz des vorhersehbaren und typischen Schadens. In allen übrigen Fällen ist die Haftung des Plattformbetreibers vorbehaltlich abweichender Regelungen ausgeschlossen.
                        </p>
                        <p>
                            (5) Eine Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit und nach dem Produkthaftungsgesetz bleibt von den vorstehenden Haftungsbeschränkungen und -ausschlüssen unberührt.
                        </p>
                        <p>
                            (6) Die Haftungsbeschränkungen gelten zugunsten der Mitarbeiter, Beauftragten und Erfüllungsgehilfen des Plattformbetreibers entsprechend.
                        </p>
                        <p>
                            (7) Der Plattformbetreiber ist ausschließlich als Plattformbetreiber tätig und übernimmt keine vertragliche Verantwortung für die Durchführung von Verträgen zwischen den Nutzern, die Gewährleistung für die von Nutzern angebotenen Produkte oder Dienstleistungen sowie für Streitigkeiten, die zwischen den Nutzern entstehen. Die Nutzer sind selbst dafür verantwortlich, dass ihre Inhalte keine Rechte Dritter verletzen und den gesetzlichen Bestimmungen entsprechen. Eigene gesetzliche Pflichten des Plattformbetreibers bleiben unberührt.
                        </p>
                        <p>
                            (8) Die Nutzer stellen den Plattformbetreiber sowie dessen Mitarbeiter, Beauftragte und Erfüllungsgehilfen im gesetzlich zulässigen Umfang von begründeten Ansprüchen Dritter frei, die auf schuldhaften Rechtsverletzungen durch die von ihnen eingestellten Inhalte oder von ihnen angebotenen Produkte und Dienstleistungen beruhen.
                        </p>
                        <p>
                            (9) Für die KI-gestützte Inhaltsprüfung und darauf beruhende Maßnahmen gelten die vorstehenden Haftungsregelungen. Zwingende gesetzliche Ansprüche und Rechte bleiben unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 12 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 12 KI-gestützte Inhaltsprüfung
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber behält sich das Recht vor, Inhalte, die von Nutzern auf der Plattform eingestellt werden, durch den Einsatz von Künstlicher Intelligenz (KI) zu prüfen. Nach der aktuellen technischen Dokumentation erfolgt diese Prüfung mit einem selbst gehosteten KI-Modell (Qwen3) und nicht über die zuvor in den AGB genannte OpenAI API. Die KI-gestützte Inhaltsprüfung dient der Unterstützung der Moderation der eingestellten Inhalte, um Verstöße gegen gesetzliche Bestimmungen und die Richtlinien der Plattform zu erkennen.
                        </p>
                        <p>
                            (2) Die KI-gestützte Inhaltsprüfung kann folgende Maßnahmen ergreifen: a. Anzeigen freigeben, b. Anzeigen automatisiert ablehnen, c. Anzeigen zur manuellen Prüfung markieren. Eine anschließende manuelle Prüfung und Korrektur ist möglich.
                        </p>
                        <p>
                            (3) Der Plattformbetreiber behält die Befugnis, KI-Entscheidungen manuell zu überprüfen, zu bestätigen oder zu korrigieren. Eine vorherige menschliche Prüfung jedes Einzelfalls ist nicht zugesagt.
                        </p>
                        <p>
                            (4) Die automatisierte Inhaltsprüfung dient der Beurteilung eingestellter Inhalte. Einzelheiten zu einer etwaigen Verarbeitung personenbezogener Daten und zu den Rechten betroffener Personen ergeben sich aus der Datenschutzerklärung und den gesetzlichen Vorschriften.
                        </p>
                        <p>
                            (5) Die Nutzer werden bei Ablehnung oder Sperrung ihrer Inhalte über die wesentlichen Gründe informiert, soweit gesetzlich vorgeschrieben. Über die in der Plattform angebotene Funktion „Request Review“ können sie eine manuelle Überprüfung beantragen. Weitere gesetzlich vorgeschriebene Melde-, Beschwerde- und Rechtsbehelfswege bleiben unberührt.
                        </p>
                        <p>
                            (6) Die Nutzung der KI-gestützten Inhaltsprüfung entbindet die Nutzer nicht von ihrer Verantwortung, nur rechtmäßige und den Plattformrichtlinien entsprechende Inhalte einzustellen. Die Nutzer sind weiterhin verpflichtet, sicherzustellen, dass ihre Inhalte keine Rechte Dritter verletzen und keine illegalen, beleidigenden oder anderweitig unangemessenen Inhalte enthalten.
                        </p>
                        <p>
                            (7) Für Schäden im Zusammenhang mit der automatisierten Inhaltsprüfung gelten die Haftungsregelungen des § 11.
                        </p>
                        <p>
                            (8) Die Nutzer stellen den Plattformbetreiber im gesetzlich zulässigen Umfang von begründeten Ansprüchen Dritter frei, die auf von ihnen zu vertretenden Rechtsverletzungen durch eingestellte Inhalte beruhen.
                        </p>
                        <p>
                            (9) Der Plattformbetreiber ist berechtigt, die KI-gestützte Inhaltsprüfung im gesetzlich zulässigen Rahmen zu ändern, zu erweitern oder einzustellen. Die Nutzer werden über wesentliche Änderungen in geeigneter Weise informiert.
                        </p>
                        <p>
                            (10) Der Einsatz der KI-Moderation sowie gegebenenfalls weiterer technischer Dienstleister wird in der Datenschutzerklärung entsprechend der tatsächlichen Verarbeitung erläutert.
                        </p>
                        <p>
                            (11) Nutzer und sonstige berechtigte Personen können mutmaßlich rechtswidrige Inhalte über die bereitgestellte Meldefunktion melden. Entscheidungen über Einschränkungen von Inhalten werden nach Maßgabe der einschlägigen Vorschriften, insbesondere des Digital Services Act, begründet und überprüfbar gemacht, soweit diese Vorschriften anwendbar sind.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 13 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 13 Verschwiegenheit
                        </h2>
                        <p>
                            Nutzer verpflichten sich, über alle im Rahmen der Vermittlungstätigkeit erhaltenen nicht öffentlichen, erkennbar vertraulichen geschäftlichen Informationen während der Vertragslaufzeit und nach Beendigung dieses Vertrags gegenüber unberechtigten Dritten Stillschweigen zu bewahren. Gesetzliche Offenlegungspflichten und die zulässige Weitergabe zur Durchführung eigener Geschäfte bleiben unberührt.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 14 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 14 Urheberrechte
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber hält die Urheberrechte an allen Bildern, Filmen und Texten, die von ihm auf der Plattform veröffentlicht werden, soweit diese Rechte bei ihm liegen. Eine Verwendung dieser Bilder, Filme und Texte ist ohne ausdrückliche Zustimmung des Plattformbetreibers oder eine andere gesetzliche Berechtigung nicht gestattet.
                        </p>
                        <p>
                            (2) Die Urheberrechte und Nutzungsrechte an Bildern, Filmen und Texten, die vom Verkäufer auf die Plattform hochgeladen werden, verbleiben beim Verkäufer beziehungsweise dem jeweiligen Rechteinhaber. Der Verkäufer räumt dem Plattformbetreiber jedoch das Recht ein, diese Inhalte im Rahmen der Plattform zu nutzen, zu vervielfältigen und zu veröffentlichen, soweit dies für den Betrieb und die Bewerbung der Plattform notwendig ist. Eine darüberhinausgehende Nutzung durch den Plattformbetreiber bedarf der ausdrücklichen Zustimmung des Verkäufers oder einer anderen Rechtsgrundlage.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 15 */}
                    <section className="space-y-3">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 15 Datenschutz
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber verarbeitet personenbezogene Daten im Rahmen der gesetzlichen Vorschriften, soweit hierfür eine Rechtsgrundlage besteht. Dies umfasst insbesondere die Durchführung des Nutzungsverhältnisses, die Vermittlungsfunktionen, die Zahlungsabwicklung und die Erfüllung gesetzlicher Pflichten.
                        </p>
                        <p>
                            (2) Weitere Informationen zum Datenschutz finden die Nutzer in der Datenschutzerklärung des Plattformbetreibers auf der Plattform. Diese erläutert insbesondere die eingesetzten technischen Dienstleister und die jeweiligen Datenverarbeitungen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 16 */}
                    <section id="widerrufsbelehrung" className="space-y-5">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 16 Gesetzliches Widerrufsrecht für Verbraucher
                        </h2>
                        <p>
                            (1) Verbrauchern steht bei Abschluss eines entgeltlichen Nutzungsvertrages im Fernabsatz grundsätzlich ein gesetzliches Widerrufsrecht zu, soweit dieses nicht nach den gesetzlichen Vorschriften ausgeschlossen ist oder erlischt. Hierzu verweist der Plattformbetreiber auf die nachfolgende Widerrufsbelehrung.
                        </p>
                        <p>
                            (2) Unternehmern im Sinne von § 14 BGB steht bei einem Vertragsschluss in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit grundsätzlich kein gesetzliches Verbraucherwiderrufsrecht zu.
                        </p>
                        <p>
                            (3) Für digitale Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden, kann das Widerrufsrecht unter den Voraussetzungen des § 356 Abs. 5 BGB vorzeitig erlöschen. Ob Campuna Credits im jeweiligen Vertragsmodell als solche digitalen Inhalte einzuordnen sind, richtet sich nach der rechtlichen Natur der Leistung; die bloße technische Gutschrift oder eine Checkbox allein begründet kein automatisches Erlöschen.
                        </p>
                        <p>
                            (4) Bei Dienstleistungen, insbesondere zeitlich begrenzten Boost- und Spotlight-Leistungen, kann das Widerrufsrecht unter den Voraussetzungen des § 356 Abs. 4 BGB erst nach vollständiger Erbringung erlöschen. Bei einem wirksamen Widerruf nach Beginn der Dienstleistung kann unter den gesetzlichen Voraussetzungen Wertersatz nach § 357a BGB anfallen. Zwingende Verbraucherrechte bleiben unberührt.
                        </p>
                        <p>
                            (5) Soweit § 312k BGB anwendbar ist, stellt der Plattformbetreiber unter <Link href="/vertraege-kuendigen" className="text-forest font-semibold underline hover:text-forest/80">/vertraege-kuendigen</Link> eine unmittelbar zugängliche Online-Kündigungsfunktion bereit. Eine gesetzlich wirksame Kündigung darf nicht von einer vorherigen Anmeldung oder einer zusätzlichen, gesetzlich unzulässigen Bestätigung abhängig gemacht werden. Die Kündigung wird entsprechend den gesetzlichen Anforderungen elektronisch bestätigt.
                        </p>

                        {/* WIDERRUFSBELEHRUNG CALLOUT */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-forest/15 shadow-sm space-y-5 my-6">
                            <h3 className="font-display text-lg sm:text-xl font-bold text-forest uppercase tracking-wider border-b border-forest/10 pb-3">
                                Widerrufsbelehrung
                            </h3>

                            <div className="space-y-3">
                                <h4 className="font-bold text-forest">Widerrufsrecht</h4>
                                <p>
                                    Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
                                </p>
                                <p>
                                    Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, <strong>LMR Solutions Ronny Voigt</strong>, Inhaber: Ronny Voigt, Premnitzer Straße 8, 99091 Erfurt, E-Mail: <a href="mailto:kontakt@campuna.de" className="text-forest font-semibold underline">kontakt@campuna.de</a>, mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
                                </p>
                                <p>
                                    Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="font-bold text-forest">Folgen des Widerrufs</h4>
                                <p>
                                    Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen für den widerrufenen Vertrag erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
                                </p>
                                <p>
                                    Haben Sie ausdrücklich verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns unter den gesetzlichen Voraussetzungen einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
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
                                    <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung / die folgende digitale Leistung (*):</p>
                                    <p>– Bestellt am (*)</p>
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
                            (1) Der Plattformbetreiber nimmt an keinem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes teil, soweit keine gesetzliche Verpflichtung besteht.
                        </p>
                        <p>
                            (2) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Wenn der Nutzer die Bestellung als Verbraucher abgegeben hat und zum Zeitpunkt der Bestellung seinen gewöhnlichen Aufenthalt in einem anderen Land hat, bleibt die Anwendung zwingender Rechtsvorschriften dieses Landes von der in Satz 1 getroffenen Rechtswahl unberührt.
                        </p>
                        <p>
                            (3) Wenn der Nutzer Kaufmann ist, ist ausschließlicher Gerichtsstand der Geschäftssitz des Plattformbetreibers. Im Übrigen gelten für die örtliche und die internationale Zuständigkeit die anwendbaren gesetzlichen Bestimmungen.
                        </p>
                    </section>

                    <hr className="border-forest/10" />

                    {/* § 18 */}
                    <section id="empfehlungen" className="space-y-4 pt-2">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
                            § 18 Campuna Credits, Empfehlungsprogramm und Pioneer Award
                        </h2>
                        <p>
                            (1) Der Plattformbetreiber stellt registrierten Nutzern ein Empfehlungsprogramm zur Verfügung. Nutzer können über ihren persönlichen Empfehlungslink beziehungsweise Empfehlungscode neue Nutzer werben und hierfür zweckgebundene Plattform-Credits („Campuna Credits“ oder „CC“) erhalten.
                        </p>
                        <p>
                            (2) <strong>Gegenwert &amp; Zweckbindung:</strong> Campuna Credits sind ausschließlich für interne, entsprechend gekennzeichnete Plattform-Zusatzleistungen (z. B. Inserat-Boosts und Anbieter-Spotlight-Buchungen) einsetzbar. Als unverbindliche Orientierung entsprechen 100 CC ungefähr 1 € Plattform-Gegenwert; die tatsächlichen Credit-Preise und Einlösekonditionen ergeben sich aus dem jeweiligen Angebot. Campuna Credits sind kein gesetzliches Zahlungsmittel. Eine Barauszahlung oder Übertragung auf Drittkonten ist grundsätzlich ausgeschlossen. Gesetzliche Widerrufs-, Erstattungs- und Rückabwicklungsansprüche für entgeltlich erworbene Credits bleiben unberührt.
                        </p>
                        <p>
                            (3) <strong>Erwerb und Verwaltung:</strong> Campuna Credits können entgeltlich erworben oder unentgeltlich als Aktions-, Empfehlungs- oder Pioneer-Prämie gewährt werden. Derzeit vorgesehene Kaufpakete sind 500 CC für 4,99 €, 800 CC für 7,99 €, 1.300 CC für 12,99 € und 2.500 CC für 24,99 €. Maßgeblich sind die im Checkout angezeigten Preise. Gekaufte und unentgeltlich gewährte Credits werden getrennt verbucht. Credits verfallen nicht automatisch durch Zeitablauf. Bei berechtigten Rückerstattungen werden zugehörige noch ungenutzte Credits korrigiert; gesetzliche Rechte bleiben unberührt.
                        </p>
                        <p>
                            (4) <strong>Einseitige Belohnung:</strong> Die Gutschrift von Campuna Credits erfolgt ausschließlich zugunsten des werbenden Nutzers (Referrer). Geworbene Neukunden erhalten durch die reine Vermittlung keine gesonderten Credits.
                        </p>
                        <p>
                            (5) <strong>Qualifikationsvoraussetzungen:</strong> Die Gutschrift an den Werber erfolgt vollautomatisiert, sobald der geworbene Nutzer die jeweils geltenden Voraussetzungen kumulativ erfüllt hat:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 font-normal text-forest">
                            <li>
                                <strong>Privatkunden (500 CC):</strong> Der geworbene private Nutzer hat sich über den Empfehlungslink/Code registriert, seine E-Mail-Adresse verifiziert und sein erstes Inserat erfolgreich veröffentlicht (Status: geprüft und freigeschaltet).
                            </li>
                            <li>
                                <strong>Gewerbliche Partner – Free (1.000 CC):</strong> Der geworbene gewerbliche Nutzer hat sich über den Empfehlungslink/Code registriert, seine E-Mail-Adresse verifiziert, ein vollständiges Firmenprofil angelegt und mindestens ein Inserat erfolgreich freigeschaltet.
                            </li>
                            <li>
                                <strong>Gewerbliche Partner – Business (1.000 CC):</strong> Der geworbene gewerbliche Nutzer hat sich über den Empfehlungslink/Code registriert, seine E-Mail-Adresse verifiziert, ein vollständiges Firmenprofil angelegt und ein kostenpflichtiges Campuna Business-Paket gebucht sowie die erste Zahlung erfolgreich abgeschlossen. Die Veröffentlichung eines Inserats ist in diesem Fall nicht erforderlich.
                            </li>
                        </ul>
                        <p>
                            (6) <strong>Einmaligkeit:</strong> Pro geworbenem Nutzer beziehungsweise Unternehmen kann maximal eine Empfehlungsprämie generiert werden. Die Qualifikation über Free und Business schließt Mehrfachvergütungen für denselben geworbenen Nutzer aus.
                        </p>
                        <p>
                            (7) <strong>Missbrauchsschutz &amp; Ausschluss:</strong> Eigenwerbung (Self-Referrals), Mehrfachanmeldungen derselben Person/Firma, Schein-Inserate sowie betrügerische Manipulationen sind untersagt. Bei nachgewiesenem Missbrauch ist der Plattformbetreiber berechtigt, unberechtigt gutgeschriebene Aktions-Credits nach angemessener Prüfung zu stornieren und betreffende Nutzerkonten nach Maßgabe der gesetzlichen Vorschriften einzuschränken. Berechtigte Ansprüche auf entgeltlich erworbene Credits bleiben unberührt.
                        </p>
                        <p>
                            (8) <strong>Campuna Pioneer-Programm:</strong> Insgesamt dreihundert (300) Nutzer (Verbraucher und gewerbliche Unternehmer zusammen), die die jeweiligen Qualifikationsanforderungen vollständig erfüllen, können einen Pioneer Award erhalten. Maßgeblich ist die Reihenfolge der vollständigen Qualifikation, nicht der Registrierung.
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 font-normal text-forest">
                            <li>
                                <strong>Private Nutzer:</strong> verifizierte E-Mail-Adresse, vollständiges Profil mit Vorname, Nachname und Standort sowie drei geprüfte und freigeschaltete aktive Inserate.
                            </li>
                            <li>
                                <strong>Gewerbliche Nutzer:</strong> verifizierte E-Mail-Adresse, Firmenlogo, Unternehmensbeschreibung von mindestens 20 Zeichen, vollständige Unternehmens- und Kontaktdaten einschließlich Name, Anschrift und Telefonnummer sowie drei geprüfte und freigeschaltete aktive Inserate.
                            </li>
                        </ul>
                        <p>
                            (9) Qualifizierte Nutzer erhalten ein dauerhaftes goldenes Pioneer-Abzeichen auf ihrem Profil und ihren Inseraten sowie einmalig 1.000 Campuna Credits. Pro Person beziehungsweise Unternehmen wird höchstens eine Pioneer-Auszeichnung vergeben. Ein Anspruch auf eine dauerhafte algorithmische Bevorzugung im Such- oder Rankingalgorithmus ist mit dem Pioneer-Status nicht verbunden. Bei nachgewiesenem Missbrauch kann eine unberechtigte Auszeichnung nach angemessener Prüfung widerrufen werden.
                        </p>
                        <p>
                            (10) Die Nutzung von Credits für Zusatzleistungen erfolgt nach den für diese Zusatzleistungen geltenden Bestimmungen. Bei vorzeitiger Entfernung oder Pausierung eines Inserats werden gesetzliche Ansprüche geprüft; darüber hinaus kann der Plattformbetreiber im Einzelfall freiwillig eine Kulanzlösung anbieten. Eine pauschale Erstattungsgarantie besteht nicht.
                        </p>
                    </section>

                </div>
            </main>
        </div>
    );
}
