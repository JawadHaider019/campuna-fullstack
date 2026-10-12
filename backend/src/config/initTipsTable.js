import pool from './database.js';

export async function initTipsTable() {
    try {
        console.log('💡 Initializing camping_tips table...');

        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS camping_tips (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category VARCHAR(100) NOT NULL,
                display_date VARCHAR(50) DEFAULT 'Gestern',
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                position INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_camping_tips_is_active ON camping_tips(is_active);
            CREATE INDEX IF NOT EXISTS idx_camping_tips_category ON camping_tips(category);
            CREATE INDEX IF NOT EXISTS idx_camping_tips_position ON camping_tips(position);
        `);

        // Check if table is empty, if so, seed initial tips
        const countRes = await pool.query('SELECT COUNT(*)::int AS count FROM camping_tips');
        if (countRes.rows[0].count === 0) {
            console.log('🌱 Seeding initial camping tips into camping_tips table...');
            const seedTips = [
                {
                    category: 'Rechtliches',
                    display_date: 'Gestern',
                    title: 'Winterreifen am Wohnmobil: Was gilt wirklich?',
                    description: 'In Deutschland gilt eine situative Winterreifenpflicht bei winterlichen Straßenverhältnissen. Für Fahrzeuge bis 3,5 Tonnen sind geeignete Winterreifen grundsätzlich an allen Rädern erforderlich. Bei schwereren Wohnmobilen gelten teilweise andere Vorgaben.',
                    position: 1
                },
                {
                    category: 'Fahrsicherheit',
                    display_date: 'Vor 2 Tagen',
                    title: 'Stützlast beim Wohnwagen richtig ausnutzen',
                    description: 'Eine zu geringe Stützlast führt schnell zu gefährlichem Pendeln des Gespanns ab 80 km/h. Nutze den maximal zulässigen Wert der Anhängerkupplung deines Zugwagens möglichst voll aus und lade schwere Gegenstände tief über die Achse.',
                    position: 2
                },
                {
                    category: 'Kaufberatung',
                    display_date: 'Vor 3 Tagen',
                    title: 'Feuchtigkeits-Check vor dem Gebrauchtkauf',
                    description: 'Wasserschäden sind das teuerste Risiko beim Kauf gebrauchter Wohnmobile. Drücke Wandübergänge, Fensterrahmen und Kanten im Gaskasten mit dem Daumen ab und achte auf modrigen Geruch nach längerer Standzeit.',
                    position: 3
                },
                {
                    category: 'Technik & Solar',
                    display_date: 'Vor 4 Tagen',
                    title: 'LiFePO4-Batterien: Die 50%-Regel beachten',
                    description: 'Herkömmliche AGM-Batterien sollten maximal bis zu 50 % entladen werden, um Schäden zu vermeiden. Moderne LiFePO4-Lithiumbatterien stellen nahezu 100 % ihrer Kapazität bereit und sparen dabei bis zu 70 % Gewicht.',
                    position: 4
                },
                {
                    category: 'Gas & Heizung',
                    display_date: 'Vor 5 Tagen',
                    title: 'Heizen während der Fahrt: Was ist erlaubt?',
                    description: 'Das Heizen während der Fahrt ist in Europa nur erlaubt, wenn ein Gasdruckregler mit Crashsensor (z. B. Truma MonoControl CS) sowie Hochdruckschläuche mit Schlauchbruchsicherung verbaut sind.',
                    position: 5
                },
                {
                    category: 'Campingplatz',
                    display_date: 'Vor 6 Tagen',
                    title: 'Wohnwagen ausrichten: Erst Räder, dann Kurbelstützen',
                    description: 'Die Kurbelstützen dienen nur zur Stabilisierung und niemals zum Anheben des Wohnwagens. Gleiche Querneigungen immer zuerst über Auffahrkeile an den Rädern aus, bevor du die Stützen handfest herunterkurbelst.',
                    position: 6
                },
                {
                    category: 'Wasser & Hygiene',
                    display_date: 'Vor 1 Woche',
                    title: 'Frischwassertank keimfrei halten',
                    description: 'Nutze niemals fremde, fest montierte Schläuche an Entsorgungsstationen. Spüle dein Wassersystem zu Saisonbeginn gründlich mit Chlordioxid und entleere Tank und Boiler bei längeren Standzeiten vollständig.',
                    position: 7
                },
                {
                    category: 'Rechtliches',
                    display_date: 'Vor 1 Woche',
                    title: 'Führerschein B96: Schneller Weg zu mehr Zuggewicht',
                    description: 'Liegt das zulässige Gesamtgewicht deines Gespanns zwischen 3.500 kg und 4.250 kg, reicht der B96-Führerschein. Dieser erfordert nur eine eintägige Fahrschulung ohne theoretische oder praktische Prüfung.',
                    position: 8
                }
            ];

            for (const tip of seedTips) {
                await pool.query(
                    `INSERT INTO camping_tips (category, display_date, title, description, position, is_active)
                     VALUES ($1, $2, $3, $4, $5, TRUE)`,
                    [tip.category, tip.display_date, tip.title, tip.description, tip.position]
                );
            }
            console.log('✅ Seeded 8 initial camping tips.');
        }

        console.log('✅ camping_tips table verified.');
    } catch (err) {
        console.error('❌ Error initializing camping_tips table:', err.message);
    }
}
