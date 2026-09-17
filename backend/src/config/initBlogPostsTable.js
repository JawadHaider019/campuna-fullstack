import pool from './database.js';

export async function initBlogPostsTable() {
    try {
        console.log('📝 Initializing blog_posts table...');
        
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS blog_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                category VARCHAR(100) DEFAULT 'Campuna blogs',
                tags TEXT[] DEFAULT ARRAY[]::TEXT[],
                image_url TEXT,
                images TEXT[] DEFAULT ARRAY[]::TEXT[],
                author_name VARCHAR(100) DEFAULT 'Campuna Redaktion',
                author_avatar TEXT DEFAULT '/logo.webp',
                read_time VARCHAR(50) DEFAULT '5 Min.',
                featured BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'published',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
        `);

        // Check if we need to seed initial articles
        const check = await pool.query('SELECT COUNT(*) FROM blog_posts');
        const count = parseInt(check.rows[0].count, 10);

        if (count === 0) {
            console.log('🌱 Seeding initial Campuna Ratgeber articles...');
            
            const initialPosts = [
                {
                    title: 'Was ist Campuna? | Der Camping-Marktplatz für Deutschland',
                    slug: 'was-ist-campuna',
                    excerpt: 'Campuna ist der spezialisierte Camping-Marktplatz für private und gewerbliche Angebote in Deutschland.',
                    category: 'Campuna blogs',
                    tags: ['Campuna', 'Marktplatz', 'Camping', 'Community', 'Ratgeber'],
                    image_url: '/blogs/Was ist Campuna blog.avif',
                    images: ['/blogs/Was ist Campuna blog.avif', '/collection/camping-zubehoer-hero.png'],
                    author_name: 'Campuna Team',
                    author_avatar: '/logo.webp',
                    read_time: '6 Min.',
                    featured: true,
                    status: 'published',
                    content: `# Was ist Campuna? Der Camping-Marktplatz für Deutschland

Campuna ist der moderne, spezialisierte Online-Marktplatz für alles rund um Camping, Wohnmobile, Caravaning und Outdoor-Abenteuer. Egal ob du ein gebrauchtes Wohnmobil suchst, Campingzubehör verkaufen möchtest oder den idealen Stellplatz für deinen nächsten Urlaub finden willst – bei Campuna bist du genau richtig.

---

## 🌟 Unsere Mission

Camping ist mehr als nur eine Urlaubsform – es ist ein Lebensgefühl von Freiheit, Naturverbundenheit und Gemeinschaft. Wir möchten privaten Campern und gewerblichen Fachhändlern eine moderne, faire und sichere Plattform bieten, auf der Angebot und Nachfrage transparent zusammenfinden.

### Was macht Campuna besonders?

- **Spezialisierung auf Camping:** Keine störenden Kategorien fremder Branchen – bei uns dreht sich 100% alles um Camping & Caravaning.
- **Transparente Inserate:** Detaillierte Ausstattungsmerkmale, hochauflösende Bilder und direkte Kommunikationskanäle zwischen Käufern und Verkäufern.
- **KI-unterstützte Sicherheit:** Unser intelligentes Sicherheitssystem schützt dich zuverlässig vor betrügerischen Angeboten und Fake-Inseraten.
- **Kostenlose Basisinserate:** Private Nutzer können bis zu 3 Inserate gleichzeitig vollkommen kostenlos veröffentlichen!

---

## 🏕️ Die wichtigsten Kategorien im Überblick

Auf Campuna findest du ein vielseitiges Angebot in 9 maßgeschneiderten Hauptkategorien:

| Kategorie | Typische Angebote |
| --- | --- |
| **Wohnmobile & Camper** | Kastenwagen, Alkoven, Teilintegrierte, Vollintegrierte & Bullis |
| **Camping Zubehör** | Vorzelte, Markisen, Campingmöbel, Geschirr & Solaranlagen |
| **Zelte & Dachzelte** | Trekkingzelte, Familienzelte, Dachzelte für PKW & Van |
| **Fahrräder & Träger** | Heckträger, Deichselträger, E-Bikes & Zubehör |
| **Stellplätze & Campingplätze** | Private Stellplätze, Bauernhof-Camping & Ferienparks |
| **Camping Services** | Wohnmobil-Werkstätten, Aufbereitung, Gasprüfungen & Vermietung |

---

## 💡 So einfach funktioniert Campuna

1. **Kostenlos registrieren:** Erstelle in unter einer Minute dein persönliches Benutzerkonto.
2. **Inserat aufgeben:** Beschreibe dein Fahrzeug oder Zubehör, lade ansprechende Fotos hoch und lege deinen Wunschpreis fest.
3. **Direkt kontaktieren:** Interessenten können dir direkt über das sichere Campuna-Nachrichtensystem schreiben.
4. **Erfolgreich verkaufen:** Vereinbart eine Besichtigung vor Ort und schließt das Geschäft sicher ab.

Entdecke jetzt die Vielfalt von Campuna und werde Teil unserer wachsenden Camping-Community!`
                },
                {
                    title: 'Wohnmobil richtig beladen – Zuladung berechnen & Überladung vermeiden',
                    slug: 'wohnmobil-richtig-beladen-zuladung-berechnen',
                    excerpt: 'Erfahre, wie du dein Wohnmobil oder deinen Wohnwagen richtig belädst, die Zuladung korrekt berechnest und gefährliche Überladung im Camping-Urlaub vermeidest.',
                    category: 'Camping Ratgeber',
                    tags: ['Zuladung', 'Sicherheit', 'Wohnmobil', 'Gewicht', 'Tipps'],
                    image_url: '/blogs/Titelbild cover image.webp',
                    images: ['/blogs/Titelbild cover image.webp'],
                    author_name: 'Campuna Redaktion',
                    author_avatar: '/logo.webp',
                    read_time: '5 Min.',
                    featured: false,
                    status: 'published',
                    content: `# Wohnmobil richtig beladen – Zuladung berechnen & Überladung vermeiden

Eine der größten Herausforderungen vor dem Start in den Campingurlaub ist das richtige Packen. Ein überladenes Wohnmobil ist nicht nur ein erhebliches Sicherheitsrisiko bei Bremsmanövern und Kurvenfahrten, sondern führt bei Polizeikontrollen im In- und Ausland zu saftigen Bußgeldern.

---

## ⚖️ Die Grundlagen: Begriffe rund um das Gewicht

Um die tatsächliche Zuladung deines Wohnmobils zu ermitteln, musst du die folgenden Kennzahlen im Fahrzeugschein (Zulassungsbescheinigung Teil I) kennen:

- **Zulässige Gesamtmasse (zGM, Feld F.1 / F.2):** Das maximale Gesamtgewicht, das das Fahrzeug inklusive aller Insassen, Gepäck und Betriebsmittel wiegen darf (z.B. 3.500 kg).
- **Masse im fahrbereiten Zustand (Feld G):** Das Leergewicht des Fahrzeugs ab Werk, inklusive Fahrer (pauschal 75 kg), 90% gefülltem Kraftstofftank und Bordwerkzeug.
- **Reale Zuladung = zGM - Masse im fahrbereiten Zustand**

> **Achtung:** Nachträglich montiertes Zubehör wie Markisen, Solaranlagen, Anhängerkupplungen, Sat-Antennen oder Wechselrichter reduzieren die nutzbare Zuladung oft drastisch um 100 bis 250 kg!

---

## 📋 Checkliste: Gewichtsverteilung beim Beladen

Beachte die physikalischen Hebelgesetze, um ein optimales Fahrverhalten zu gewährleisten:

1. **Schwere Gegenstände nach unten:** Konserven, Getränkekisten, Werkzeug und Batterien gehören immer in Bodennähe und direkt über oder zwischen die Achsen.
2. **Mittelschwere Gegenstände:** Kleidung und Küchenutensilien finden in den mittleren Schränken und Staufächern Platz.
3. **Leichte Gegenstände nach oben:** In den Dachstaukästen sollten ausschließlich leichte Textilien wie Handtücher, Schlafsäcke oder Jacken verstaut werden.
4. **Ladungssicherung:** Verwende Antirutschmatten, Spanngurte und Klemmen in der Heckgarage, damit nichts verrutscht.

---

## 🛠️ Nutze den kostenlosen Campuna Zuladungsrechner

Mit unserem interaktiven [Zuladungsrechner](/zuladungsrechner) kannst du dein Fahrzeuggewicht, Zubehör, Frischwasser und Urlaubsgepäck bequem vorab kalkulieren und eine mögliche Überladung rechtzeitig erkennen!`
                },
                {
                    title: 'Dachzelt kaufen: Worauf Anfänger wirklich achten sollten',
                    slug: 'dachzelt-kaufen-tipps',
                    excerpt: 'Dachzelte liegen voll im Trend. Aber worauf kommt es beim Kauf wirklich an? Von der Dachlast über Zeltarten bis zum Fahrverhalten.',
                    category: 'Zelte & Ausrüstung',
                    tags: ['Dachzelt', 'Outdoor', 'Camping', 'Ausrüstung', 'Ratgeber'],
                    image_url: '/blogs/Dachzelt kaufen blog.webp',
                    images: ['/blogs/Dachzelt kaufen blog.webp'],
                    author_name: 'Campuna Guide',
                    author_avatar: '/logo.webp',
                    read_time: '7 Min.',
                    featured: false,
                    status: 'published',
                    content: `# Dachzelt kaufen: Worauf Anfänger wirklich achten sollten

Dachzelte verwandeln fast jedes normale Auto – vom Kleinwagen über den Kombi bis zum SUV – im Handumdrehen in ein flexibles Camping-Fahrzeug. Doch vor dem Kauf stellen sich viele Einsteiger wichtige Fragen zur Montage, Dachlast und Alltagstauglichkeit.

---

## 🚗 Die wichtigste Hürde: Die zulässige Dachlast deines Autos

Bevor du dich für ein bestimmtes Dachzeltmodell entscheidest, musst du in der Betriebsanleitung deines PKW die **zulässige dynamische Dachlast** prüfen (liegt bei den meisten PKW zwischen 50 kg und 100 kg).

- **Dynamische Dachlast:** Gilt während der Fahrt (Auto in Bewegung). Dachzelt + Dachträger dürfen dieses Gewicht nicht überschreiten.
- **Statische Dachlast:** Gilt im stehenden Zustand. Diese ist um ein Vielfaches höher (meist mehrere hundert Kilogramm), da das Fahrzeuggewicht im Stand direkt über die Holme und Karosserie getragen wird. Zwei Erwachsene können also problemlos im Dachzelt übernachten!

---

## ⛺ Die verschiedenen Dachzelt-Bauarten

| Zeltart | Vorteile | Nachteile |
| --- | --- | --- |
| **Klappdachzelt** | Kompaktes Packmaß auf dem Dach, riesige Liegefläche nach dem Aufklappen, integriertes Vordach | Benötigt 5-10 Minuten Aufbauzeit, feuchte Plane muss getrocknet werden |
| **Hartschalenzelt** | Sekundenschneller Aufbau durch Gasdruckfedern, sehr aerodynamisch, robust gegen Wind & Wetter | Höheres Eigengewicht, Liegefläche auf Dachgröße begrenzt |
| **Hybridzelt** | Kombiniert Hartschalenschutz mit Klappmechanismus für extra Raum | Oft im höheren Preissegment |

---

## 💡 Praktische Kauftipps für Einsteiger

- **Matratzendicke & Kondensschutz:** Achte auf eine hochwertige Kaltschaummatratze mit mindestens 6 cm Dicke und eine atmungsaktive 3D-Mesh-Meshunterlage gegen Kondensfeuchtigkeit.
- **Leiter:** Teleskopleitern lassen sich stufenlos an jede Fahrzeughöhe anpassen.
- **Dachträger:** Investiere in solide Markenträger (z.B. Thule oder Yakima), die für dein spezifisches Fahrzeugmodell freigegeben sind.`
                },
                {
                    title: 'Wohnwagen gebraucht kaufen: Die wichtigste Checkliste für Käufer',
                    slug: 'wohnwagen-gebraucht-kaufen',
                    excerpt: 'Du möchtest einen Wohnwagen gebraucht kaufen? Beachte diese 10 essentiellen Tipps zu Feuchtigkeitsschäden, Gasprüfung, Fahrwerk und Zulassung.',
                    category: 'Camping Ratgeber',
                    tags: ['Wohnwagen', 'Gebrauchtkauf', 'Checkliste', 'Ratgeber', 'Tipps'],
                    image_url: '/blogs/Wohnwagen gebraucht Die blog.webp',
                    images: ['/blogs/Wohnwagen gebraucht Die blog.webp'],
                    author_name: 'Campuna Redaktion',
                    author_avatar: '/logo.webp',
                    read_time: '8 Min.',
                    featured: false,
                    status: 'published',
                    content: `# Wohnwagen gebraucht kaufen: Die wichtigste Checkliste für Käufer

Ein gebrauchter Wohnwagen ist eine hervorragende und kostengünstige Möglichkeit, in das mobile Reisen einzusteigen. Allerdings lauern beim Gebrauchtkauf einige versteckte Mängel, die im Nachhinein teure Reparaturen verursachen können. Mit unserer Checkliste bist du bei der Besichtigung bestens vorbereitet.

---

## 🔍 Die 5 wichtigsten Prüfpunkte bei der Besichtigung

### 1. Dichtigkeit & Feuchtigkeit (Der größte Feind!)
Feuchtigkeitsschäden im Holzständerwerk können den Totalschaden eines Caravans bedeuten.
- **Geruchsprobe:** Riecht es im Wohnwagen muffig, modrig oder übermäßig nach Parfüm/Duftbäumen?
- **Ecken & Staukästen abtasten:** Drücke mit den Fingern in alle Ecken, um die Dachluken und Fenster. Weiche Wände oder Wasserflecken sind ein klares Warnsignal.
- **Feuchtigkeitsmessgerät mitnehmen:** Ein zerstörungsfreies kapazitives Messgerät verschafft schnell Gewissheit.

### 2. Fahrgestell, Bremsen & Reifen
- **Reifenalter:** Reifen dürfen für die begehrte 100-km/h-Zulassung maximal 6 Jahre alt sein (DOT-Nummer prüfen!).
- **Auflaufbremse & Kupplung:** Die Manschette der Auflaufeinrichtung sollte intakt sein, die Antischlingerkupplung (sofern vorhanden) saubere Reibbeläge aufweisen.
- **Unterboden:** Liegt der Holzunterboden frei, ist er morsch oder blättert der Schutzlack ab?

### 3. Gasanlage & Bordtechnik
- Liegt ein aktuelles Gasprüfbuch (G 607) vor?
- Funktionieren Gasherd, Kühlschrank (sowohl auf Gas als auch auf 230V/12V) und die Heizung einwandfrei?

---

## 📑 Papiere & Formalitäten

Vergewissere dich vor dem Kauf, dass alle Unterlagen vollständig vorhanden sind:

- Zulassungsbescheinigung Teil I und Teil II (Fahrzeugschein & Fahrzeugbrief)
- Gültiger TÜV-Prüfbericht (Hauptuntersuchung)
- Gasprüfbescheinigung
- Bedienungsanleitungen für eingebaute Geräte (Truma, Thetford, Dometic)`
                }
            ];

            for (const post of initialPosts) {
                await pool.query(
                    `INSERT INTO blog_posts (
                        title, slug, excerpt, content, category, tags, image_url, images,
                        author_name, author_avatar, read_time, featured, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (slug) DO NOTHING`,
                    [
                        post.title,
                        post.slug,
                        post.excerpt,
                        post.content,
                        post.category,
                        post.tags,
                        post.image_url,
                        post.images,
                        post.author_name,
                        post.author_avatar,
                        post.read_time,
                        post.featured,
                        post.status
                    ]
                );
            }
            console.log(`✅ ${initialPosts.length} initial Campuna Ratgeber articles seeded successfully!`);
        } else {
            console.log(`✅ blog_posts table verified (${count} posts present).`);
        }
    } catch (err) {
        console.error('❌ Error initializing blog_posts table:', err.message);
    }
}
