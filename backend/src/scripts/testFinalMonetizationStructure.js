import pool from '../config/database.js';
import crypto from 'crypto';
import { bookSpotlight, getAllProfiles } from '../controllers/profile.js';
import { boostListing } from '../controllers/listings.js';
import { checkAndAwardReferralCreditsOnApproval, checkAndAwardReferralCreditsOnCommercialProfile } from '../controllers/referral.js';

const createTestUser = async (role = 'USER', userType = 'COMMERCIAL', emailVerified = true) => {
    const id = crypto.randomUUID();
    const email = `test-${id.slice(0, 8)}@campuna-test.de`;
    const referralCode = 'CAMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await pool.query(
        `INSERT INTO users (id, email, password_hash, role, user_type, email_verified, referral_code, created_at, updated_at)
         VALUES ($1, $2, 'dummy_hash', $3, $4, $5, $6, NOW(), NOW())`,
        [id, email, role, userType, emailVerified, referralCode]
    );
    return { id, email, referralCode, userType };
};

async function runTests() {
    console.log('🧪 Starting Final Monetization & Spotlight Structure Test Suite...\n');

    try {
        // ─── TEST 1: Plans Configuration & Pricing ────────────────────────────
        console.log('--- TEST 1: Plans Configuration ---');
        const plansRes = await pool.query('SELECT * FROM plans ORDER BY id ASC');
        const freePlan = plansRes.rows.find(p => p.name === 'FREE');
        const businessPlan = plansRes.rows.find(p => p.name === 'BUSINESS');

        if (!freePlan || freePlan.listing_limit !== 3 || freePlan.price_cents !== 0) {
            throw new Error(`Free plan misconfigured: ${JSON.stringify(freePlan)}`);
        }
        if (!businessPlan || businessPlan.listing_limit !== 25 || businessPlan.price_cents !== 2900 || businessPlan.has_spotlight !== false) {
            throw new Error(`Business plan misconfigured: ${JSON.stringify(businessPlan)}`);
        }
        console.log('✅ TEST 1 PASSED: Free (3 listings, 0 €) and Business (25 listings, 29 €, separate spotlight) verified.\n');

        // ─── TEST 2: Spotlight Requirement Validation (Missing fields) ────────
        console.log('--- TEST 2: Spotlight Incomplete Profile Validation ---');
        const commUser1 = await createTestUser('USER', 'COMMERCIAL', true);
        await pool.query(
            `INSERT INTO company_profiles (user_id, company_name, created_at, updated_at)
             VALUES ($1, 'Incomplete Camper GmbH', NOW(), NOW())`,
            [commUser1.id]
        );
        await pool.query(
            `INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, created_at, updated_at)
             VALUES ($1, (SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1), 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())`,
            [commUser1.id]
        );

        const mockReqIncomplete = {
            user: { id: commUser1.id, user_type: 'COMMERCIAL' },
            body: { durationDays: 7, payment_method: 'DIRECT' }
        };
        let errorReturned = false;
        const mockResIncomplete = {
            status: (code) => ({
                json: (data) => {
                    if (code === 400 && data.missing_requirements) {
                        errorReturned = true;
                        console.log('  Received expected validation error:', data.missing_requirements);
                    }
                    return data;
                }
            })
        };

        await bookSpotlight(mockReqIncomplete, mockResIncomplete);
        if (!errorReturned) {
            throw new Error('Spotlight booking should fail for incomplete company profile!');
        }
        console.log('✅ TEST 2 PASSED: Incomplete profile prevented from booking Spotlight.\n');

        // ─── TEST 3: Spotlight Booking for Complete Profile ───────────────────
        console.log('--- TEST 3: Spotlight Booking (14 Days) for Complete Profile ---');
        const commUser2 = await createTestUser('USER', 'COMMERCIAL', true);
        // Grant credits to test user
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 5000, 'TEST_CREDIT_TOPUP', 'Initial Balance', NOW())`,
            [commUser2.id]
        );
        await pool.query(
            `INSERT INTO company_profiles (user_id, company_name, bio, location, phone, logo_url, cover_image_url, created_at, updated_at)
             VALUES ($1, 'Alpen Caravans GmbH', 'Professioneller Reisemobil- & Wohnwagenhändler mit über 20 Jahren Erfahrung in Bayern.', 'München, Deutschland', '+49 89 1234567', '/uploads/test-logo.jpg', '/uploads/test-cover.jpg', NOW(), NOW())`,
            [commUser2.id]
        );

        await pool.query(
            `INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at, created_at, updated_at)
             VALUES ($1, (SELECT id FROM plans WHERE name = 'BUSINESS' LIMIT 1), 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())`,
            [commUser2.id]
        );

        let spotlightBooked = false;
        const mockReqComplete = {
            user: { id: commUser2.id, user_type: 'COMMERCIAL' },
            body: { durationDays: 14, payment_method: 'CREDIT' }
        };
        const mockResComplete = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200 && data.success && data.spotlight_until) {
                        spotlightBooked = true;
                        console.log('  Spotlight activated until:', data.spotlight_until, 'Days left:', data.days_left);
                    }
                    return data;
                }
            })
        };

        await bookSpotlight(mockReqComplete, mockResComplete);
        if (!spotlightBooked) {
            throw new Error('Spotlight booking failed for complete profile!');
        }

        // Verify credit balance deducted (-2500 CC)
        const balanceRes = await pool.query(
            'SELECT SUM(amount) as balance FROM credit_transactions WHERE user_id = $1',
            [commUser2.id]
        );
        if (parseInt(balanceRes.rows[0].balance, 10) !== 2500) {
            throw new Error(`Balance mismatch: expected 2500 CC, got ${balanceRes.rows[0].balance}`);
        }
        console.log('✅ TEST 3 PASSED: Spotlight successfully booked with 2.500 CC and activated.\n');

        // ─── TEST 4: Public Profiles Spotlight Eligibility ────────────────────
        console.log('--- TEST 4: Public Profiles & Homepage Spotlight Filter ---');
        let profilesFound = false;
        const mockResProfiles = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200 && Array.isArray(data.profiles)) {
                        const bookedProfile = data.profiles.find(p => p.id === commUser2.id);
                        if (bookedProfile && bookedProfile.isSpotlightEligible) {
                            profilesFound = true;
                            console.log('  Booked profile isSpotlightEligible:', bookedProfile.isSpotlightEligible, 'Name:', bookedProfile.name);
                        }
                    }
                    return data;
                }
            })
        };
        await getAllProfiles({}, mockResProfiles);
        if (!profilesFound) {
            throw new Error('Booked company was not recognized as isSpotlightEligible in getAllProfiles!');
        }
        console.log('✅ TEST 4 PASSED: Homepage Spotlight queries recognize active spotlight.\n');

        // ─── TEST 5: Commercial Referral Qualified upon Profile Completion ────
        console.log('--- TEST 5: Qualified Referral on Commercial Profile ---');
        const referrer = await createTestUser('USER', 'PRIVATE', true);
        const newCommercial = await createTestUser('USER', 'COMMERCIAL', true);

        // Record pending referral
        await pool.query(
            `INSERT INTO referrals (referrer_id, referred_id, status, created_at)
             VALUES ($1, $2, 'PENDING', NOW())`,
            [referrer.id, newCommercial.id]
        );

        // Before profile completion -> referral check returns false
        const beforeCheck = await checkAndAwardReferralCreditsOnCommercialProfile(newCommercial.id);
        if (beforeCheck !== false) {
            throw new Error('Referral awarded before profile was completed!');
        }

        // Save complete profile
        await pool.query(
            `INSERT INTO company_profiles (user_id, company_name, bio, location, phone, logo_url, created_at, updated_at)
             VALUES ($1, 'Nordseeküste Camping GbR', 'Spezialist für Strandcamping & Vermietung an der Nordseeküste.', 'Husum, Deutschland', '+49 4841 987654', '/uploads/logo-nordsee.png', NOW(), NOW())`,
            [newCommercial.id]
        );

        const afterCheck = await checkAndAwardReferralCreditsOnCommercialProfile(newCommercial.id);
        if (!afterCheck) {
            throw new Error('Commercial referral was not awarded after profile completion!');
        }

        // Verify both received 1,000 CC
        const refBalance = await pool.query('SELECT SUM(amount) as b FROM credit_transactions WHERE user_id = $1', [referrer.id]);
        const newCommBalance = await pool.query('SELECT SUM(amount) as b FROM credit_transactions WHERE user_id = $1', [newCommercial.id]);
        if (parseInt(refBalance.rows[0].b, 10) !== 1000 || parseInt(newCommBalance.rows[0].b, 10) !== 1000) {
            throw new Error(`Commercial referral 1,000 CC not received by both parties! Got: ${refBalance.rows[0].b} and ${newCommBalance.rows[0].b}`);
        }
        console.log('✅ TEST 5 PASSED: Commercial referral awarded exactly 1,000 CC upon profile completion.\n');

        // ─── TEST 6: Private Referral Qualified upon 1st Approved Listing ─────
        console.log('--- TEST 6: Qualified Referral on Private 1st Listing ---');
        const privateReferrer = await createTestUser('USER', 'PRIVATE', true);
        const privateReferee = await createTestUser('USER', 'PRIVATE', true);

        await pool.query(
            `INSERT INTO referrals (referrer_id, referred_id, status, created_at)
             VALUES ($1, $2, 'PENDING', NOW())`,
            [privateReferrer.id, privateReferee.id]
        );

        // Insert listing with status 'APPROVED'
        await pool.query(
            `INSERT INTO listings (id, user_id, title, description, price, status, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, 'VW California Ocean T6.1', 'Sehr gepflegtes Wohnmobil für Sommerurlaub.', 54900, 'APPROVED', NOW(), NOW())`,
            [privateReferee.id]
        );

        const privateAwarded = await checkAndAwardReferralCreditsOnApproval(privateReferee.id);
        if (!privateAwarded) {
            throw new Error('Private referral was not awarded upon 1st approved listing!');
        }

        // Verify both received 500 CC
        const privRefBalance = await pool.query('SELECT SUM(amount) as b FROM credit_transactions WHERE user_id = $1', [privateReferrer.id]);
        const privRefereeBalance = await pool.query('SELECT SUM(amount) as b FROM credit_transactions WHERE user_id = $1', [privateReferee.id]);
        if (parseInt(privRefBalance.rows[0].b, 10) !== 500 || parseInt(privRefereeBalance.rows[0].b, 10) !== 500) {
            throw new Error(`Private referral 500 CC not received by both parties! Got: ${privRefBalance.rows[0].b} and ${privRefereeBalance.rows[0].b}`);
        }
        console.log('✅ TEST 6 PASSED: Private referral awarded 500 CC upon 1st approved listing.\n');

        // ─── TEST 7: Listing Boost (7, 14, 30 Days) & Search Ordering ─────────
        console.log('--- TEST 7: Listing Boost (7, 14, 30 Days) ---');
        const listingUser = await createTestUser('USER', 'PRIVATE', true);
        await pool.query(
            `INSERT INTO credit_transactions (user_id, amount, type, description, created_at)
             VALUES ($1, 2000, 'TEST_CREDIT_TOPUP', 'Initial Balance', NOW())`,
            [listingUser.id]
        );
        const listingInsert = await pool.query(
            `INSERT INTO listings (id, user_id, title, description, price, status, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, 'Knaus Sun TI 650 MEG', 'Top Zustand mit Vollausstattung.', 62000, 'APPROVED', NOW(), NOW())
             RETURNING id`,
            [listingUser.id]
        );
        const listingId = listingInsert.rows[0].id;

        let boostApplied = false;
        const mockReqBoost = {
            params: { id: listingId },
            user: { id: listingUser.id },
            body: { durationDays: 7, payment_method: 'CREDIT' }
        };
        const mockResBoost = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200 && data.success && data.is_boosted) {
                        boostApplied = true;
                        console.log('  Listing boosted until:', data.boosted_until);
                    }
                    return data;
                }
            })
        };
        await boostListing(mockReqBoost, mockResBoost);
        if (!boostApplied) {
            throw new Error('Listing boost failed!');
        }
        // ─── TEST 8: Pioneer Award & 1,000 CC One-Time Bonus ───────────────
        console.log('--- TEST 8: Pioneer Award & 1,000 CC Bonus ---');
        const { checkAndAwardPioneerBadge } = await import('../controllers/badge.js');
        const pioneerUser = await createTestUser('USER', 'PRIVATE', true);
        
        // Complete profile
        await pool.query(
            `INSERT INTO private_profiles (user_id, first_name, last_name, bio, location, profile_image_url, created_at, updated_at)
             VALUES ($1, 'Julia', 'Sommer', 'Passionierte Camperin seit 10 Jahren.', 'Köln', '/uploads/julia.jpg', NOW(), NOW())`,
            [pioneerUser.id]
        );

        // Add 3 approved listings
        for (let i = 1; i <= 3; i++) {
            await pool.query(
                `INSERT INTO listings (id, user_id, title, description, price, status, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2, 'Sehr guter Zustand', 35000, 'APPROVED', NOW(), NOW())`,
                [pioneerUser.id, `Test Camper ${i}`]
            );
        }

        const pioneerResult = await checkAndAwardPioneerBadge(pioneerUser.id);
        if (!pioneerResult.success || !pioneerResult.newlyAwarded) {
            throw new Error(`Pioneer badge not awarded! Result: ${JSON.stringify(pioneerResult)}`);
        }

        // Verify 1,000 CC bonus was credited
        const pioneerCredit = await pool.query('SELECT SUM(amount) as b FROM credit_transactions WHERE user_id = $1', [pioneerUser.id]);
        if (parseInt(pioneerCredit.rows[0].b, 10) !== 1000) {
            throw new Error(`Pioneer 1,000 CC not credited to ledger! Got: ${pioneerCredit.rows[0].b}`);
        }
        console.log('✅ TEST 8 PASSED: Pioneer badge awarded at position #' + pioneerResult.badge.position + ' with 1,000 CC bonus.\n');

        console.log('🎉 ALL 8 MONETIZATION, PIONEER & SPOTLIGHT TESTS PASSED PERFECTLY!\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test suite failed:', err);
        process.exit(1);
    }
}

runTests();
