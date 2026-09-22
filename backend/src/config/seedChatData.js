import pool from './database.js';
import crypto from 'crypto';

/**
 * Seeds rich, realistic demo chat conversations and message threads between
 * Admin, Commercial Dealers, Private Pioneers, and Test Buyers.
 */
export async function seedChatData() {
    try {
        // 1. Fetch Key Users
        const usersRes = await pool.query(`
            SELECT id, email, role, user_type 
            FROM users 
            WHERE email IN (
                'admin@campuna.com',
                'caravan-bayern@campuna.de',
                'info@campingwelt-nord.de',
                'kontakt@camper-nrw.de',
                'alpencamper@campuna.de',
                'julia.sommer@campuna-user.de',
                'markus.weber@campuna-user.de',
                'testing@gmail.com',
                'jawadd@gmail.com'
            )
        `);

        const userMap = {};
        usersRes.rows.forEach(u => {
            userMap[u.email] = u.id;
        });

        // If admin or test users are missing, skip seeding
        if (!userMap['admin@campuna.com'] || !userMap['testing@gmail.com']) {
            console.log('ℹ️ Chat seed: Key users not yet in DB, skipping chat seeding.');
            return;
        }

        // Fetch some approved listings to attach to chats
        const listingsRes = await pool.query(`
            SELECT id, user_id, title 
            FROM listings 
            WHERE status = 'APPROVED'
            LIMIT 20
        `);

        const listingMap = {};
        listingsRes.rows.forEach(l => {
            listingMap[l.user_id] = l.id;
        });

        const testBuyerId = userMap['testing@gmail.com'];
        const jawadBuyerId = userMap['jawadd@gmail.com'] || testBuyerId;
        const adminId = userMap['admin@campuna.com'];
        const caravanBayernId = userMap['caravan-bayern@campuna.de'];
        const campingweltNordId = userMap['info@campingwelt-nord.de'];
        const camperNrwId = userMap['kontakt@camper-nrw.de'];
        const markusWeberId = userMap['markus.weber@campuna-user.de'];
        const juliaSommerId = userMap['julia.sommer@campuna-user.de'];

        const demoConversations = [
            // 1. Admin <-> Test Buyer (Campuna Support & Welcome)
            {
                buyer_id: testBuyerId,
                seller_id: adminId,
                listing_id: null,
                messages: [
                    {
                        sender_id: testBuyerId,
                        content: 'Hallo Campuna Support-Team, ich habe eine Frage zu den neuen Boost-Funktionen für meine Inserate.',
                        minutesAgo: 120
                    },
                    {
                        sender_id: adminId,
                        content: 'Hallo! Vielen Dank für deine Nachricht. Mit Campuna Credits kannst du deine Inserate jederzeit mit 7-Tage-Boosts oder Spotlight-Platzierungen hervorheben.',
                        minutesAgo: 110
                    },
                    {
                        sender_id: testBuyerId,
                        content: 'Klasse, danke für die schnelle Rückmeldung! Das probiere ich direkt aus.',
                        minutesAgo: 95
                    }
                ]
            },
            // 2. Test Buyer <-> Caravan Center Bayern
            caravanBayernId ? {
                buyer_id: testBuyerId,
                seller_id: caravanBayernId,
                listing_id: listingMap[caravanBayernId] || null,
                messages: [
                    {
                        sender_id: testBuyerId,
                        content: 'Guten Tag, ist das Fahrzeug noch verfügbar und kann am Wochenende besichtigt werden?',
                        minutesAgo: 240
                    },
                    {
                        sender_id: caravanBayernId,
                        content: 'Guten Tag! Ja, das Fahrzeug steht bei uns im Showroom in München bereit. Samstag zwischen 10:00 und 15:00 Uhr passt hervorragend.',
                        minutesAgo: 210
                    },
                    {
                        sender_id: testBuyerId,
                        content: 'Perfekt, ich werde Samstag gegen 11:30 Uhr vorbeikommen. Vielen Dank!',
                        minutesAgo: 180
                    }
                ]
            } : null,
            // 3. Jawad Buyer <-> Campingwelt Nord
            campingweltNordId ? {
                buyer_id: jawadBuyerId,
                seller_id: campingweltNordId,
                listing_id: listingMap[campingweltNordId] || null,
                messages: [
                    {
                        sender_id: jawadBuyerId,
                        content: 'Moin! Sind im Preis für das Vorzelt die originalen Sturmbänder und das Gestänge enthalten?',
                        minutesAgo: 360
                    },
                    {
                        sender_id: campingweltNordId,
                        content: 'Moin Moin! Ja, das komplette CarbonX-Gestänge und das original Isabella Sturmbandset liegen bei.',
                        minutesAgo: 320
                    }
                ]
            } : null,
            // 4. Test Buyer <-> Markus Weber (Private Seller)
            markusWeberId ? {
                buyer_id: testBuyerId,
                seller_id: markusWeberId,
                listing_id: listingMap[markusWeberId] || null,
                messages: [
                    {
                        sender_id: testBuyerId,
                        content: 'Hallo Herr Weber, wann wurde die letzte Gasprüfung beim Wohnwagen durchgeführt?',
                        minutesAgo: 480
                    },
                    {
                        sender_id: markusWeberId,
                        content: 'Hallo! Die Gasprüfung und TÜV wurden im Mai 2026 frisch ohne Mängel erneuert. Alle Nachweise liegen vor.',
                        minutesAgo: 450
                    }
                ]
            } : null,
            // 5. Test Buyer <-> Julia Sommer (Pioneer Community)
            juliaSommerId ? {
                buyer_id: testBuyerId,
                seller_id: juliaSommerId,
                listing_id: listingMap[juliaSommerId] || null,
                messages: [
                    {
                        sender_id: testBuyerId,
                        content: 'Hallo Julia, herzlichen Glückwunsch zum Pioneer-Status! Hast du Tipps für Camping-Einsteiger in Skandinavien?',
                        minutesAgo: 600
                    },
                    {
                        sender_id: juliaSommerId,
                        content: 'Hallo! Vielen Dank! In Schweden und Norwegen ist das Jedermannsrecht fantastisch, wichtig ist nur eine gute Mückenausrüstung und warme Schlafsäcke. 😊',
                        minutesAgo: 570
                    }
                ]
            } : null
        ].filter(Boolean);

        for (const item of demoConversations) {
            // Check if conversation already exists
            let existingConv;
            if (item.listing_id) {
                existingConv = await pool.query(
                    `SELECT id FROM conversations WHERE listing_id = $1 AND buyer_id = $2`,
                    [item.listing_id, item.buyer_id]
                );
            } else {
                existingConv = await pool.query(
                    `SELECT id FROM conversations WHERE seller_id = $1 AND buyer_id = $2 AND listing_id IS NULL`,
                    [item.seller_id, item.buyer_id]
                );
            }

            let convId;
            if (existingConv.rowCount > 0) {
                convId = existingConv.rows[0].id;
            } else {
                convId = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 day', NOW())`,
                    [convId, item.listing_id, item.buyer_id, item.seller_id]
                );
            }

            // Insert messages
            for (const msg of item.messages) {
                const existingMsg = await pool.query(
                    `SELECT id FROM messages WHERE conversation_id = $1 AND content = $2`,
                    [convId, msg.content]
                );

                if (existingMsg.rowCount === 0) {
                    const msgId = crypto.randomUUID();
                    await pool.query(
                        `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
                         VALUES ($1, $2, $3, $4, true, NOW() - ($5 || ' minutes')::interval)`,
                        [msgId, convId, msg.sender_id, msg.content, msg.minutesAgo]
                    );
                }
            }

            // Update conversation updated_at
            await pool.query(
                `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
                [convId]
            );
        }

        console.log('✅ Demo Chat Conversations and Messages verified in database');
    } catch (err) {
        console.error('⚠️ Chat seed notice:', err.message);
    }
}
