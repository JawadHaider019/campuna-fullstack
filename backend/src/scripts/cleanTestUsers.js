import pool from '../config/database.js';

async function main() {
    try {
        const delAchievements = await pool.query(`DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delCredits = await pool.query(`DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delListings = await pool.query(`DELETE FROM listings WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delProfiles = await pool.query(`DELETE FROM private_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delCompany = await pool.query(`DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delReferrals = await pool.query(`DELETE FROM referrals WHERE referrer_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de') OR referred_id IN (SELECT id FROM users WHERE email LIKE '%@campuna-test.de')`);
        const delUsers = await pool.query(`DELETE FROM users WHERE email LIKE '%@campuna-test.de'`);
        
        console.log(`Cleaned up: ${delUsers.rowCount} test users and related records.`);
        process.exit(0);
    } catch (err) {
        console.error('Error cleaning test users:', err);
        process.exit(1);
    }
}

main();
