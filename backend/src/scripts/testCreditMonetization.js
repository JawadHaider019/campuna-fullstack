import pool from '../config/database.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'campuna-secret-key-12345';
const API_BASE = 'http://localhost:5000/api';

const createTestUser = async (email, role = 'USER', userType = 'PRIVATE') => {
    const id = crypto.randomUUID();
    const referralCode = 'TEST-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const res = await pool.query(
        `INSERT INTO users (id, email, password_hash, role, user_type, email_verified, referral_code, created_at, updated_at)
         VALUES ($1, $2, 'hash_placeholder', $3, $4, true, $5, NOW(), NOW())
         RETURNING *`,
        [id, email, role, userType, referralCode]
    );
    const user = res.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, user_type: user.user_type }, JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
};

const createTestListing = async (userId, title, status = 'APPROVED') => {
    const id = crypto.randomUUID();
    const res = await pool.query(
        `INSERT INTO listings (id, user_id, title, description, price, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'Testbeschreibung für Inserat mit mindestens 50 Zeichen...', 19500, $4, NOW(), NOW())
         RETURNING *`,
        [id, userId, title, status]
    );
    return res.rows[0];
};

const runTests = async () => {
    console.log('🧪 Starting Credit Monetization & Referral (100 CC) Test Suite...\n');

    try {
        // ─── TEST 1: Referral awards exactly 100 CC ──────────────────────────
        console.log('--- TEST 1: Referral Bonus (100 CC) ---');
        const referrer = await createTestUser(`ref_referrer_${Date.now()}@test.com`);
        const referee = await createTestUser(`ref_referee_${Date.now()}@test.com`);

        // Create PENDING referral
        await pool.query(
            `INSERT INTO referrals (referrer_id, referred_id, status, created_at)
             VALUES ($1, $2, 'PENDING', NOW())`,
            [referrer.user.id, referee.user.id]
        );

        // Referee creates an APPROVED listing
        const listing1 = await createTestListing(referee.user.id, 'Erster Camper');

        // Trigger referral check via backend referral controller
        const { checkAndAwardReferralCreditsOnApproval } = await import('../controllers/referral.js');
        const awarded = await checkAndAwardReferralCreditsOnApproval(referee.user.id);

        if (!awarded) {
            throw new Error('Referral credits were not awarded!');
        }

        // Check referrer balance
        const referrerBalRes = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM credit_transactions WHERE user_id = $1',
            [referrer.user.id]
        );
        const referrerBal = parseInt(referrerBalRes.rows[0]?.balance || 0, 10);

        // Check referee balance
        const refereeBalRes = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM credit_transactions WHERE user_id = $1',
            [referee.user.id]
        );
        const refereeBal = parseInt(refereeBalRes.rows[0]?.balance || 0, 10);

        console.log(`Referrer Balance: ${referrerBal} CC (Expected: 100)`);
        console.log(`Referee Balance: ${refereeBal} CC (Expected: 100)`);

        if (referrerBal !== 100 || refereeBal !== 100) {
            throw new Error(`Expected 100 CC each, got referrer: ${referrerBal}, referee: ${refereeBal}`);
        }
        console.log('✅ TEST 1 PASSED: Referral awards exactly 100 CC to both users.\n');

        // ─── TEST 2: Direct Boost Payment (Card / Direct) ────────────────────
        console.log('--- TEST 2: Direct Boost Payment (Card) ---');
        const directUser = await createTestUser(`direct_user_${Date.now()}@test.com`);
        const directListing = await createTestListing(directUser.user.id, 'Direktzahlung Camper');

        const directRes = await fetch(`${API_BASE}/listings/${directListing.id}/boost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directUser.token}`
            },
            body: JSON.stringify({
                durationDays: 7,
                payment_method: 'CREDIT_CARD'
            })
        });

        const directData = await directRes.json();
        console.log('Direct Boost Response:', directData);

        if (!directData.success || !directData.is_boosted || !directData.boosted_until) {
            throw new Error('Direct boost failed: ' + JSON.stringify(directData));
        }

        // Verify credit balance is still 0 (no deduction)
        const directBalRes = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM credit_transactions WHERE user_id = $1',
            [directUser.user.id]
        );
        const directBal = parseInt(directBalRes.rows[0]?.balance || 0, 10);
        console.log(`Direct User Balance: ${directBal} CC (Expected: 0)`);

        if (directBal !== 0) {
            throw new Error('Direct boost incorrectly altered wallet balance!');
        }
        console.log('✅ TEST 2 PASSED: Direct payment boosted listing with 0 wallet balance.\n');

        // ─── TEST 3: Credit Purchase Package (POST /api/credits/buy) ─────────
        console.log('--- TEST 3: Credit Purchase Package (500 CC) ---');
        const buyRes = await fetch(`${API_BASE}/credits/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directUser.token}`
            },
            body: JSON.stringify({
                packageCredits: 500,
                payment_method: 'CREDIT_CARD'
            })
        });

        const buyData = await buyRes.json();
        console.log('Buy Credits Response:', buyData);

        if (!buyData.success || buyData.new_balance !== 500) {
            throw new Error('Buy credits failed: ' + JSON.stringify(buyData));
        }
        console.log('✅ TEST 3 PASSED: Purchased 500 CC successfully, new balance is 500 CC.\n');

        // ─── TEST 4: Boost with Credits (Deduction from Wallet) ───────────────
        console.log('--- TEST 4: Boost Listing using Credits (500 CC deduction) ---');
        const creditBoostRes = await fetch(`${API_BASE}/listings/${directListing.id}/boost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directUser.token}`
            },
            body: JSON.stringify({
                durationDays: 7,
                payment_method: 'CREDIT'
            })
        });

        const creditBoostData = await creditBoostRes.json();
        console.log('Credit Boost Response:', creditBoostData);

        if (!creditBoostData.success || creditBoostData.new_balance !== 0 || creditBoostData.spent_credits !== 500) {
            throw new Error('Credit boost deduction failed: ' + JSON.stringify(creditBoostData));
        }
        console.log('✅ TEST 4 PASSED: Successfully boosted with 500 CC, remaining balance is 0 CC.\n');

        console.log('🎉 ALL CREDIT MONETIZATION & REFERRAL TESTS PASSED PERFECTLY!\n');
    } catch (err) {
        console.error('❌ Test Suite Failed:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

runTests();
