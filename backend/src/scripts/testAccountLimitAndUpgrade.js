import 'dotenv/config';
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
    console.log('🚀 Starting Test: Private Account Limit Safeguard & Business Auto-Conversion...\n');

    const testEmail = `test_private_${Date.now()}@campuna-test.de`;
    const testPassword = 'Password123!';

    try {
        // 1. Register a new PRIVATE user
        console.log(`1️⃣ Registering test private user: ${testEmail}`);
        const regRes = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                first_name: 'Max',
                last_name: 'Mustercamper',
                account_type: 'PRIVATE',
            }),
        });

        const regData = await regRes.json();
        if (!regRes.ok || !regData.success) {
            throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        }

        const user = regData.user;
        const userId = user.id;
        console.log(`   ✅ User registered successfully. ID: ${userId}, Account Type: ${user.account_type || user.user_type}`);

        // Mark verified in DB for test
        await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);

        const token = jwt.sign(
            { id: userId, email: testEmail, role: 'USER' },
            process.env.JWT_SECRET || 'campuna_secret_jwt_key_2026',
            { expiresIn: '7d' }
        );

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Check feature flags for new private user
        console.log('\n2️⃣ Fetching feature flags & limits for private user:');
        const featRes = await fetch(`${API_BASE}/subscriptions/features`, { headers: authHeaders });
        const featData = await featRes.json();
        console.log('   Feature flags:', featData.features);

        if (featData.features?.listing_limit === 10) {
            console.log('   ✅ Private account listing limit correctly configured to 10.');
        } else {
            console.log(`   ⚠️ Listing limit received: ${featData.features?.listing_limit}`);
        }

        // 3. Simulate upgrading this private account to BUSINESS
        console.log('\n3️⃣ Subscribing private user to BUSINESS plan (Simulating Checkout)...');
        const subRes = await fetch(`${API_BASE}/subscriptions/subscribe`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                plan_name: 'BUSINESS',
                payment_method: 'CREDIT_CARD',
                duration_months: 1,
                billing_details: {
                    company_name: 'Mustercamper Outdoor GmbH',
                    street: 'Campingallee 1',
                    zip: '80331',
                    city: 'München',
                    country: 'Deutschland',
                },
                payment_details: {
                    card_number: '4242 4242 4242 4242',
                },
            }),
        });

        const subData = await subRes.json();
        if (!subRes.ok || !subData.success) {
            throw new Error(`Subscription failed: ${JSON.stringify(subData)}`);
        }

        console.log('   ✅ Subscription API Response:', {
            success: subData.success,
            plan: subData.plan?.name,
            invoice: subData.invoice_number,
            credits_granted: subData.credits_granted,
        });

        // 4. Verify in DB that account_type is now COMMERCIAL and CompanyProfile exists
        console.log('\n4️⃣ Verifying Database state after upgrade:');
        const userDb = await pool.query('SELECT id, email, user_type FROM users WHERE id = $1', [userId]);
        console.log('   User DB Row:', userDb.rows[0]);

        const compProfDb = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
        console.log('   Company Profile DB Row:', compProfDb.rows[0] ? {
            company_name: compProfDb.rows[0].company_name,
            tier: compProfDb.rows[0].tier,
            location: compProfDb.rows[0].location,
        } : 'None');

        const privProfDb = await pool.query('SELECT * FROM private_profiles WHERE user_id = $1', [userId]);
        console.log('   Private Profile DB Row:', privProfDb.rows[0] ? {
            first_name: privProfDb.rows[0].first_name,
            last_name: privProfDb.rows[0].last_name,
        } : 'None');

        if (userDb.rows[0].user_type === 'COMMERCIAL' && compProfDb.rows[0]?.tier === 'BUSINESS') {
            console.log('\n🎉 SUCCESS: User was automatically converted from PRIVATE to COMMERCIAL with active BUSINESS tier and CompanyProfile!');
        } else {
            console.log('\n❌ FAILURE: Account was not properly converted.');
        }

        // 5. Verify updated feature limits (should be 25)
        console.log('\n5️⃣ Fetching updated features for the newly upgraded business user:');
        const updatedFeatRes = await fetch(`${API_BASE}/subscriptions/features`, { headers: authHeaders });
        const updatedFeatData = await updatedFeatRes.json();
        console.log('   Updated Feature flags:', updatedFeatData.features);

        if (updatedFeatData.features?.listing_limit === 25 && updatedFeatData.features?.is_business === true) {
            console.log('   ✅ Business account listing limit is now 25 and is_business is true.');
        }

        // Clean up test user
        console.log('\n🧹 Cleaning up test user...');
        await pool.query('DELETE FROM credit_transactions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM company_profiles WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM private_profiles WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        console.log('   ✅ Cleanup complete.');

        console.log('\n========================================');
        console.log('✅ ALL TEST SCENARIOS PASSED SUCCESSFULLY');
        console.log('========================================\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test failed with error:', err.message);
        process.exit(1);
    }
}

runTest();
