import fetch from 'node-fetch';
import { db } from './src/prisma/db.js';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
    console.log('🧪 Starting Stripe & Benefits Test Suite...\n');
    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, details = '') => {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
            failed++;
        }
    };

    try {
        // ----------------------------------------------------
        // 1. Health check
        // ----------------------------------------------------
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        assert(healthData.success === true, 'Backend Health Endpoint');

        // ----------------------------------------------------
        // 2. Admin Login
        // ----------------------------------------------------
        const adminLoginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@campuna.com',
                password: 'AdminCampuna',
            }),
        });
        const adminLoginData = await adminLoginRes.json();
        const adminToken = adminLoginData.access_token;
        assert(adminLoginData.success === true && !!adminToken, 'Admin Authentication');

        // ----------------------------------------------------
        // 3. Find or Create a Commercial Test User & Private Test User
        // ----------------------------------------------------
        let commercialUser = await db.orm.public.User
            .where({ user_type: 'COMMERCIAL' })
            .include('company_profile')
            .first();

        if (!commercialUser) {
            const tempEmail = `test_comm_${Date.now()}@example.com`;
            commercialUser = await db.orm.public.User.create({
                email: tempEmail,
                password_hash: 'hashedpassword123',
                role: 'USER',
                user_type: 'COMMERCIAL',
                account_type: 'COMMERCIAL',
                email_verified: true,
            });
            await db.orm.public.CompanyProfile.create({
                user_id: commercialUser.id,
                company_name: 'Test Camping Handels GmbH',
                tier: 'FREE',
            });
            commercialUser = await db.orm.public.User
                .where({ id: commercialUser.id })
                .include('company_profile')
                .first();
        }
        assert(!!commercialUser, `Found Commercial Test User (ID: ${commercialUser.id})`);

        let privateUser = await db.orm.public.User
            .where({ user_type: 'PRIVATE' })
            .include('private_profile')
            .first();

        if (!privateUser) {
            const tempEmail = `test_priv_${Date.now()}@example.com`;
            privateUser = await db.orm.public.User.create({
                email: tempEmail,
                password_hash: 'hashedpassword123',
                role: 'USER',
                user_type: 'PRIVATE',
                account_type: 'PRIVATE',
                email_verified: true,
            });
            await db.orm.public.PrivateProfile.create({
                user_id: privateUser.id,
                first_name: 'Max',
                last_name: 'Mustermann',
            });
            privateUser = await db.orm.public.User
                .where({ id: privateUser.id })
                .include('private_profile')
                .first();
        }
        assert(!!privateUser, `Found Private Test User (ID: ${privateUser.id})`);

        // Ensure user has at least one listing to test listing boosts
        let testListing = await db.orm.public.Listing
            .where({ user_id: commercialUser.id })
            .first();

        if (!testListing) {
            testListing = await db.orm.public.Listing.create({
                user_id: commercialUser.id,
                title: 'Test Wohnmobil Hymer B-Klasse 2024',
                description: 'Neuwertiges Test-Wohnmobil mit Voll-Ausstattung.',
                price: 85000,
                negotiable: false,
                category: 'CAMPERS',
                status: 'ACTIVE',
            });
        }
        assert(!!testListing, `Found Test Listing (ID: ${testListing.id})`);

        // ----------------------------------------------------
        // 4. Test Admin Benefits Endpoints
        // ----------------------------------------------------
        console.log('\n--- Testing Admin Benefits API ---');

        // 4a. Get user listings for modal
        const listingsModalRes = await fetch(`${API_BASE}/admin/benefits/user-listings/${commercialUser.id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const listingsModalData = await listingsModalRes.json();
        assert(listingsModalData.success === true && Array.isArray(listingsModalData.listings), 'Admin Get User Listings for Modal');

        // 4b. Grant Admin Credits Benefit
        const creditsGrantRes = await fetch(`${API_BASE}/admin/benefits/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                user_id: commercialUser.id,
                benefit_type: 'CREDITS',
                credits_amount: 750,
                admin_note: 'Automated Test Credit Grant',
            }),
        });
        const creditsGrantData = await creditsGrantRes.json();
        assert(creditsGrantData.success === true, 'Admin Grant Credits Benefit');

        // 4c. Grant Admin Free Business Subscription Benefit
        const subGrantRes = await fetch(`${API_BASE}/admin/benefits/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                user_id: commercialUser.id,
                benefit_type: 'BUSINESS_SUBSCRIPTION',
                duration_days: 45,
                admin_note: 'Automated Test Free Business Subscription Grant',
            }),
        });
        const subGrantData = await subGrantRes.json();
        assert(subGrantData.success === true, 'Admin Grant Complimentary Business Subscription');

        // Check if company profile tier was updated to BUSINESS
        const updatedCompProfile = await db.orm.public.CompanyProfile
            .where({ user_id: commercialUser.id })
            .first();
        assert(updatedCompProfile?.tier === 'BUSINESS', 'Company Profile Tier updated to BUSINESS');

        // 4d. Grant Listing Boost Benefit
        const boostGrantRes = await fetch(`${API_BASE}/admin/benefits/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                user_id: commercialUser.id,
                benefit_type: 'LISTING_BOOST',
                listing_id: testListing.id,
                duration_days: 14,
                admin_note: 'Automated Test Listing Boost',
            }),
        });
        const boostGrantData = await boostGrantRes.json();
        assert(boostGrantData.success === true, 'Admin Grant Listing Boost Benefit');

        const updatedListing = await db.orm.public.Listing
            .where({ id: testListing.id })
            .first();
        assert(updatedListing?.featured === true && !!updatedListing?.boosted_until, 'Listing Featured & Boosted Until set in DB');

        // 4e. Grant Homepage Spotlight Benefit
        const spotlightGrantRes = await fetch(`${API_BASE}/admin/benefits/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                user_id: commercialUser.id,
                benefit_type: 'SPOTLIGHT',
                duration_days: 7,
                admin_note: 'Automated Test Spotlight Grant',
            }),
        });
        const spotlightGrantData = await spotlightGrantRes.json();
        assert(spotlightGrantData.success === true, 'Admin Grant Spotlight Benefit');

        // 4f. Check Private User restriction for Commercial-only benefits
        const invalidGrantRes = await fetch(`${API_BASE}/admin/benefits/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                user_id: privateUser.id,
                benefit_type: 'BUSINESS_SUBSCRIPTION',
                duration_days: 30,
            }),
        });
        const invalidGrantData = await invalidGrantRes.json();
        assert(invalidGrantData.success === false, 'Restriction: Private user rejected from Business Subscription');

        // 4g. Transition Period Endpoint
        const transitionRes = await fetch(`${API_BASE}/admin/benefits/apply-transition-period`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
        });
        const transitionData = await transitionRes.json();
        assert(transitionData.success === true, 'Apply 3-month Transition Period Endpoint');

        // ----------------------------------------------------
        // 5. Test Stripe Checkout Creation & Verification
        // ----------------------------------------------------
        console.log('\n--- Testing Stripe API & Fulfillment ---');

        // Generate user auth token for commercial user
        const jwt = (await import('jsonwebtoken')).default;
        const userToken = jwt.sign(
            { id: commercialUser.id, email: commercialUser.email, role: 'USER', user_type: 'COMMERCIAL' },
            process.env.JWT_SECRET || 'campuna_fullstack_2026',
            { expiresIn: '1h' }
        );

        // 5a. Create Subscription Checkout Session (1 month)
        const subSessionRes = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                type: 'SUBSCRIPTION',
                plan_name: 'BUSINESS',
                duration_months: 1,
                return_url: 'http://localhost:3000/mein-konto',
            }),
        });
        const subSessionData = await subSessionRes.json();
        assert(subSessionData.success === true && !!subSessionData.url && !!subSessionData.sessionId, 'Create Stripe Subscription Checkout Session');

        // 5b. Create Credit Purchase Checkout Session
        const creditSessionRes = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                type: 'CREDIT_PURCHASE',
                package_credits: 1500,
                return_url: 'http://localhost:3000/mein-konto',
            }),
        });
        const creditSessionData = await creditSessionRes.json();
        assert(creditSessionData.success === true && !!creditSessionData.sessionId, 'Create Stripe Credit Purchase Checkout Session');

        // 5c. Create Spotlight Purchase Checkout Session
        const spotlightSessionRes = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                type: 'SPOTLIGHT_PURCHASE',
                duration_days: 14,
                return_url: 'http://localhost:3000/mein-konto',
            }),
        });
        const spotlightSessionData = await spotlightSessionRes.json();
        assert(spotlightSessionData.success === true && !!spotlightSessionData.sessionId, 'Create Stripe Spotlight Purchase Checkout Session');

        // 5d. Test Fulfillment Engine (Mocking paid Stripe Session)
        const { fulfillSession } = await import('./src/controllers/stripe.js');
        const mockStripeSession = {
            id: `cs_test_mock_${Date.now()}`,
            payment_status: 'paid',
            customer: 'cus_mock_123',
            payment_intent: 'pi_mock_123',
            metadata: {
                type: 'CREDIT_PURCHASE',
                userId: commercialUser.id,
                userEmail: commercialUser.email,
                credits: '2000',
                priceCents: '1799',
            },
        };

        const fulfillResult = await fulfillSession(mockStripeSession);
        assert(fulfillResult.success === true && fulfillResult.type === 'CREDIT_PURCHASE', 'Fulfill Stripe Credit Purchase Session');

        // Test Idempotency: Repeating same session should not duplicate credits
        const idempotentResult = await fulfillSession(mockStripeSession);
        assert(idempotentResult.success === true && idempotentResult.alreadyProcessed === true, 'Stripe Session Fulfillment Idempotency Check');

        // 5e. Test Subscription Fulfillment
        const mockSubSession = {
            id: `cs_test_sub_${Date.now()}`,
            payment_status: 'paid',
            customer: 'cus_mock_456',
            payment_intent: 'pi_mock_456',
            metadata: {
                type: 'SUBSCRIPTION',
                userId: commercialUser.id,
                userEmail: commercialUser.email,
                planName: 'BUSINESS',
                durationMonths: '1',
                totalPriceCents: '2900',
                creditsGranted: '1000',
            },
        };

        const subFulfillResult = await fulfillSession(mockSubSession);
        assert(subFulfillResult.success === true && subFulfillResult.type === 'SUBSCRIPTION' && !!subFulfillResult.invoiceNumber, 'Fulfill Stripe Subscription Session with Invoice');

        // Subscription Idempotency
        const subIdempotentResult = await fulfillSession(mockSubSession);
        assert(subIdempotentResult.success === true && subIdempotentResult.alreadyProcessed === true, 'Stripe Subscription Fulfillment Idempotency Check');

    } catch (err) {
        console.error('💥 Unexpected Test Exception:', err);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
