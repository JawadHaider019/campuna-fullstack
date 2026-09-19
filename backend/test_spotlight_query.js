import pool from './src/config/database.js';

async function main() {
    try {
        const query = `
            SELECT 
                u.id,
                COALESCE(cp.company_name, 'Gewerblicher Anbieter') as name,
                COALESCE(cp.logo_url, '') as logo,
                CASE 
                    WHEN cp.tier = 'BUSINESS' OR sub.id IS NOT NULL OR cp.is_strategic_partner = TRUE 
                    THEN COALESCE(cp.cover_image_url, '') 
                    ELSE '' 
                END as "coverImage",
                COALESCE(cp.bio, '') as description,
                COALESCE(cp.location, 'Deutschland') as location,
                COALESCE(cp.phone, '') as phone,
                COALESCE(cp.company_address, '') as "companyAddress",
                COALESCE(l_count.count, 0)::int as "listingsCount",
                'Gewerblich' as type,
                CASE 
                    WHEN cp.tier = 'BUSINESS' OR sub.id IS NOT NULL OR cp.is_strategic_partner = TRUE THEN TRUE
                    ELSE FALSE 
                END as "isBusiness",
                CASE 
                    WHEN ((cp.spotlight_until IS NOT NULL AND cp.spotlight_until > NOW()) OR cp.is_strategic_partner = TRUE)
                     AND u.email_verified IS TRUE
                     AND cp.logo_url IS NOT NULL AND cp.logo_url != ''
                     AND cp.cover_image_url IS NOT NULL AND cp.cover_image_url != ''
                     AND LENGTH(COALESCE(cp.bio, '')) >= 20
                     AND (cp.phone IS NOT NULL AND cp.phone != '')
                     AND (COALESCE(cp.location, '') != '' OR COALESCE(cp.company_address, '') != '')
                    THEN TRUE
                    ELSE FALSE
                END as "isSpotlightEligible"
            FROM users u
            JOIN company_profiles cp ON cp.user_id = u.id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as count 
                FROM listings 
                WHERE status = 'APPROVED' 
                GROUP BY user_id
            ) l_count ON l_count.user_id = u.id
            LEFT JOIN (
                SELECT s.user_id, s.id
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.status = 'ACTIVE' AND p.name = 'BUSINESS'
            ) sub ON sub.user_id = u.id
            WHERE (u.is_suspended IS FALSE OR u.is_suspended IS NULL) AND u.user_type = 'COMMERCIAL'
            ORDER BY "isSpotlightEligible" DESC, "isBusiness" DESC, "listingsCount" DESC, u.created_at DESC
            LIMIT 50;
        `;
        const res = await pool.query(query);
        const eligible = res.rows.filter(r => r.isSpotlightEligible);
        console.log('Total eligible dealers in DB:', eligible.length);
        console.table(eligible.map(d => ({
            name: d.name,
            location: d.location,
            phone: d.phone,
            listings: d.listingsCount,
            isSpotlight: d.isSpotlightEligible,
            logo: d.logo ? d.logo.substring(0, 30) + '...' : 'none',
            cover: d.coverImage ? d.coverImage.substring(0, 30) + '...' : 'none'
        })));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

main();
