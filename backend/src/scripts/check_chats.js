import pool from '../config/database.js';

async function main() {
    try {
        const convs = await pool.query(`
            SELECT 
                c.id, 
                c.buyer_id, 
                u_b.email as buyer_email, 
                c.seller_id, 
                u_s.email as seller_email, 
                l.title as listing_title, 
                count(m.id) as msg_count
            FROM conversations c
            LEFT JOIN users u_b ON c.buyer_id = u_b.id
            LEFT JOIN users u_s ON c.seller_id = u_s.id
            LEFT JOIN listings l ON c.listing_id = l.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id, c.buyer_id, u_b.email, c.seller_id, u_s.email, l.title
        `);
        console.log('Conversations:', JSON.stringify(convs.rows, null, 2));

        const listings = await pool.query(`
            SELECT l.id, l.title, l.slug, l.price, l.user_id, u.email, u.user_type
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'APPROVED'
            LIMIT 10
        `);
        console.log('Listings in DB:', listings.rows);

        const keyUsers = await pool.query(`
            SELECT u.id, u.email, u.role, u.user_type, 
                   COALESCE(cp.company_name, pp.first_name || ' ' || pp.last_name) as name
            FROM users u
            LEFT JOIN company_profiles cp ON u.id = cp.user_id
            LEFT JOIN private_profiles pp ON u.id = pp.user_id
            WHERE u.email IN ('admin@campuna.com', 'julia.sommer@campuna-user.de', 'markus.weber@campuna-user.de', 'caravan-bayern@campuna.de', 'info@campingwelt-nord.de', 'kontakt@camper-nrw.de', 'testing@gmail.com', 'jawadd@gmail.com')
        `);
        console.log('Key Users with Profiles:', keyUsers.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

main();
