export const TOOLS_DATA = {
    zuladungsrechner: {
        id: 'zuladungsrechner',
        slug: 'zuladungsrechner',
        shortTitle: 'Zuladungs-Rechner',
        title: 'Wohnmobil & Wohnwagen Zuladungsrechner',
        heroSubtitle: 'Berechne die verbleibende Zuladung deines Fahrzeugs exakt. Vermeide Bußgelder und überladenes Fahren.',
        metaTitle: 'Wohnmobil Zuladungsrechner – Überladung berechnen & vermeiden | Campuna',
        metaDescription: 'Mit dem kostenlosen Campuna Zuladungsrechner berechnest du das Leergewicht, Gepäck und Gesamtzuladung für Wohnmobil & Wohnwagen.',
        canonicalPath: '/zuladungsrechner',
        calculatorType: 'payload',
        analyticsKey: 'zuladungsrechner',
        guides: [
            {
                title: 'Masse im fahrbereiten Zustand (MGO)',
                text: 'Enthält das Leergewicht inkl. Fahrer (75 kg), 90% Kraftstoff, gefülltem Frischwassertank und einer Gasflasche. Alle weiteren Dinge zählen zur Zuladung.',
                bulletPoints: [
                    '✓ Grundausstattung ist im Prospektgewicht enthalten',
                    '✓ Sonderausstattungen (Markise, Sat, Mover) zählen voll als Zuladung'
                ]
            },
            {
                title: 'Toleranzen & Bußgelder bei Überladung',
                text: 'In vielen europäischen Ländern gelten sehr strenge Grenzen. Ab 1% Überladung können bereits empfindliche Strafen drohen.',
                bulletPoints: [
                    '✓ Deutschland: Bußgelder ab 5% Überladung',
                    '✓ Schweiz & Österreich: Sehr strenge Kontrollen & Weiterfahrverbot'
                ]
            },
            {
                title: 'Richtige Verteilung der Lasten',
                text: 'Schwere Gegenstände stets nach unten und direkt über oder nahe der Achse verstauen.',
                bulletPoints: [
                    '✓ Schweres Gepäck tief im Fahrzeug lagern',
                    '✓ Hängeschränke nur mit leichten Utensilien befüllen'
                ]
            },
            {
                title: 'Achslasten berücksichtigen',
                text: 'Neben dem zulässigen Gesamtgewicht darf auch die einzelne Achslast nicht überschritten werden.',
                bulletPoints: [
                    '✓ Achslast vorne & hinten im Fahrzeugschein prüfen',
                    '✓ Heckträger belasten die Hinterachse überproportional'
                ]
            }
        ],
        faqs: [
            {
                question: 'Was zählt alles zur Zuladung?',
                answer: 'Zur Zuladung gehören Mitfahrer (außer dem Fahrer mit 75kg), Gepäck, Vorräte, Sportgeräte, Campingmöbel, Nachrüstungen (Markise, Mover, Sat-Anlage, Solaranlage) sowie zusätzlich gefüllte Frisch- oder Abwassertanks.'
            },
            {
                question: 'Wie wiege ich mein Wohnmobil am besten?',
                answer: 'Fahre vor der Urlaubsreise in komplett beladenem Zustand auf eine öffentliche Fahrzeugwaage (z.B. bei Wertstoffhöfen, Landhandelsgenossenschaften, Baustoffhändlern oder beim TÜV).'
            },
            {
                question: 'Was passiert bei Überladung im Ausland?',
                answer: 'Neben teils hohen Geldstrafen kann die örtliche Polizei die Weiterfahrt untersagen, bis das zulässige Gesamtgewicht durch Ablade- oder Umpackmaßnahmen wieder eingehalten wird.'
            }
        ]
    },
    reisekostenrechner: {
        id: 'reisekostenrechner',
        slug: 'reisekostenrechner',
        shortTitle: 'Reisekosten-Rechner',
        title: 'Camping Reisekosten-Rechner',
        heroSubtitle: 'Plane dein Urlaubsbudget vor der Abreise: Berechne Spritkosten, Stellplatzpreise, Maut und Verpflegung transparent und verlässlich.',
        metaTitle: 'Camping Reisekosten Rechner – Sprit, Stellplatz & Maut berechnen | Campuna',
        metaDescription: 'Mit dem Campuna Reisekostenrechner berechnest du die Gesamtkosten deiner Campingreise für Kraftstoff, Campingplatz und Nebenkosten.',
        canonicalPath: '/reisekostenrechner',
        calculatorType: 'budget',
        analyticsKey: 'reisekostenrechner',
        guides: [
            {
                title: 'Die 4 Haupt-Kostenblöcke einer Campingreise',
                text: 'Campingkosten setzen sich im Wesentlichen zusammen aus: Kraftstoff (Fahrt & Ausflüge), Übernachtungskosten (Campingplatz/Stellplatz), Gebühren (Maut, Vignetten, Fähren) und Verpflegung/Aktivitäten.',
                bulletPoints: [
                    '✓ Kraftstoff: 30-40% des Budgets',
                    '✓ Camping- & Stellplätze: 30-45% des Budgets'
                ]
            },
            {
                title: 'Kraftstoffkosten präzise kalkulieren',
                text: 'Verwende die Formel: (Gesamtkilometer ÷ 100) × Verbrauch × Spritpreis. Berücksichtige auch Kilometer für Ausflüge vor Ort.',
                bulletPoints: [
                    '✓ Kastenwagen: ca. 8–10 l/100km',
                    '✓ Integrierte Wohnmobile: 10–14 l/100km',
                    '✓ Gespanne: 11–15 l/100km'
                ]
            },
            {
                title: 'Maut, Vignetten & Tunnelgebühren in Europa',
                text: 'In Ländern wie Frankreich, Italien und Spanien wird streckenbezogene Maut erhoben. Österreich, Schweiz und Slowenien verlangen Vignetten.',
                bulletPoints: [
                    '✓ Vignetten vorab digital buchen',
                    '✓ Wohnmobile > 3,5t benötigen in Österreich die GO-Box'
                ]
            },
            {
                title: 'Effektive Spartipps für den Camping-Urlaub',
                text: 'Nutze Rabattkarten wie die ACSI CampingCard in der Nebensaison. Steuere kostenlose oder günstige Naturstellplätze an und fahre vorausschauend.',
                bulletPoints: [
                    '✓ Tempo 90-100 km/h spart bis zu 20% Sprit',
                    '✓ Selbst kochen statt täglich Restaurantbesuch'
                ]
            }
        ],
        faqs: [
            {
                question: 'Wie teuer sind Stellplätze in Europa im Durchschnitt?',
                answer: 'Einfache Wohnmobilstellplätze kosten meist 8 € bis 20 € pro Nacht. Komfort-Campingplätze mit Pool und Animation in Top-Lagen verlangen in der Hauptsaison zwischen 35 € und 80 € pro Nacht für ein Fahrzeug mit 2 Personen.'
            },
            {
                question: 'Lohnt sich ein Miet-Wohnmobil gegenüber dem eigenen Fahrzeug?',
                answer: 'Für Gelegenheitscamper (1–2 Wochen pro Jahr) ist Mieten meist wirtschaftlicher, da Fixkosten wie Versicherung, Steuer, Wartung und Wertverlust entfallen.'
            },
            {
                question: 'Wie hoch sind die Stromkosten auf Campingplätzen?',
                answer: 'Viele Plätze berechnen Strom pauschal (ca. 3,50 € – 6 € pro Tag) oder nach Verbrauch (ca. 0,70 € – 1,00 € pro kWh).'
            }
        ]
    }
};

export const TOOLS_LIST = Object.values(TOOLS_DATA);
