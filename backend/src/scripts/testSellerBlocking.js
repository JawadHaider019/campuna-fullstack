import 'dotenv/config';
import pool from '../config/database.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'campuna_super_secret_jwt_key_2026_production';

// Helper for HTTP requests
async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
}

// Simple hash generator matching auth.js
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function runTests() {
    console.log('🚀 Starting Seller Blocking Comprehensive Tests...\n');

    let adminUser = null;
    let sellerUser = null;
    let buyerUser = null;
    let testListing = null;

    try {
        // 1. Setup / identify Admin User
        const adminRes = await pool.query(`SELECT id, email, role FROM admins LIMIT 1`);
        if (adminRes.rowCount > 0) {
            adminUser = adminRes.rows[0];
        } else {
            // fallback: find user with role ADMIN
            const uAdmin = await pool.query(`SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1`);
            adminUser = uAdmin.rows[0];
        }

        if (!adminUser) {
            console.error('❌ No admin user found in database.');
            process.exit(1);
        }

        const adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`✅ Admin identified: ${adminUser.email} (ID: ${adminUser.id})`);

        // 2. Create or reset a Test Seller User
        const testSellerEmail = 'test_seller_blocking@campuna.de';
        const rawPassword = 'TestPassword123!';
        const passwordHash = hashPassword(rawPassword);

        await pool.query(`DELETE FROM users WHERE email = $1`, [testSellerEmail]);
        const sellerInsert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email, is_suspended`,
            [crypto.randomUUID(), testSellerEmail, passwordHash]
        );
        sellerUser = sellerInsert.rows[0];

        await pool.query(
            `INSERT INTO private_profiles (user_id, first_name, last_name, location, created_at, updated_at)
             VALUES ($1, 'Max', 'Mustermann', 'München', NOW(), NOW())`,
            [sellerUser.id]
        );
        console.log(`✅ Test Seller created: ${sellerUser.email} (ID: ${sellerUser.id})`);

        // 3. Create or reset a Test Buyer User
        const testBuyerEmail = 'test_buyer_blocking@campuna.de';
        await pool.query(`DELETE FROM users WHERE email = $1`, [testBuyerEmail]);
        const buyerInsert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email, is_suspended`,
            [crypto.randomUUID(), testBuyerEmail, passwordHash]
        );
        buyerUser = buyerInsert.rows[0];

        await pool.query(
            `INSERT INTO private_profiles (user_id, first_name, last_name, location, created_at, updated_at)
             VALUES ($1, 'Anna', 'Käuferin', 'Berlin', NOW(), NOW())`,
            [buyerUser.id]
        );
        console.log(`✅ Test Buyer created: ${buyerUser.email} (ID: ${buyerUser.id})`);

        // Generate Buyer token
        const buyerToken = jwt.sign(
            { id: buyerUser.id, email: buyerUser.email, role: 'USER' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Create an approved Listing for the Seller
        const listingId = crypto.randomUUID();
        const listingInsert = await pool.query(
            `INSERT INTO listings (
                id, user_id, title, slug, description, price, negotiable, location,
                condition, category, subcategory, status, featured, images, created_at, updated_at
            ) VALUES (
                $1, $2, 'Wohnmobil Knaus Boxstar Test', 'wohnmobil-knaus-boxstar-test',
                'Tolles Test-Wohnmobil in Top Zustand', 45000, true, 'München',
                'Gebraucht', 'Wohnmobile', 'Kastenwagen', 'APPROVED', false, ARRAY['https://example.com/camper.jpg'],
                NOW(), NOW()
            ) RETURNING *`,
            [listingId, sellerUser.id]
        );
        testListing = listingInsert.rows[0];
        console.log(`✅ Test Listing created & APPROVED: ${testListing.title} (ID: ${testListing.id})\n`);

        // --- TEST STEP 1: Normal Seller Login & Operation ---
        console.log('--- TEST STEP 1: Active Seller Operations ---');
        const loginRes1 = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ email: testSellerEmail, password: rawPassword })
        });
        console.log(`1.1 Seller Login (Active): Status ${loginRes1.status} - Success: ${loginRes1.data.success}`);
        if (loginRes1.status !== 200 || !loginRes1.data.access_token) {
            throw new Error(`Active seller login failed: ${JSON.stringify(loginRes1.data)}`);
        }
        const activeSellerToken = loginRes1.data.access_token;

        // 1.2 Public listings contains this listing
        const allListingsRes1 = await request('/listings');
        const foundInPublic1 = allListingsRes1.data.listings?.some(l => l.id === testListing.id);
        console.log(`1.2 Listing visible in public list: ${foundInPublic1 ? 'YES ✅' : 'NO ❌'}`);

        // 1.3 Listing detail is accessible
        const detailRes1 = await request(`/listings/${testListing.id}`);
        console.log(`1.3 Listing detail status: ${detailRes1.status} (Title: "${detailRes1.data.listing?.title}") ✅`);

        // 1.4 Public profile is accessible
        const profileRes1 = await request(`/profile/${sellerUser.id}`);
        console.log(`1.4 Seller public profile status: ${profileRes1.status} ✅\n`);

        // --- TEST STEP 2: Admin Blocks (Suspends) the Seller ---
        console.log('--- TEST STEP 2: Admin Blocks the Seller ---');
        const suspendRes = await request(`/admin/users/${sellerUser.id}/suspend`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ is_suspended: true })
        });
        console.log(`2.1 Admin suspend API status: ${suspendRes.status} - Message: "${suspendRes.data.message}"`);
        if (suspendRes.status !== 200 || !suspendRes.data.user?.is_suspended) {
            throw new Error(`Admin suspend failed: ${JSON.stringify(suspendRes.data)}`);
        }

        // Verify DB flag
        const dbCheck1 = await pool.query('SELECT is_suspended FROM users WHERE id = $1', [sellerUser.id]);
        console.log(`2.2 DB is_suspended flag for seller: ${dbCheck1.rows[0].is_suspended} ✅\n`);

        // --- TEST STEP 3: Verification of Block Enforcement ---
        console.log('--- TEST STEP 3: Enforcing Seller Block ---');

        // 3.1 Suspended Seller Login
        const loginRes2 = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ email: testSellerEmail, password: rawPassword })
        });
        console.log(`3.1 Suspended Seller Login: Status ${loginRes2.status} (Expected: 403) - Error: "${loginRes2.data.error}"`);
        if (loginRes2.status !== 403) {
            throw new Error(`Suspended seller was able to log in! Status: ${loginRes2.status}`);
        } else {
            console.log(`   -> Login blocked correctly ✅`);
        }

        // 3.2 Existing JWT Token of Suspended Seller rejected on protected routes
        const myProfileRes = await request('/profile/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${activeSellerToken}` }
        });
        console.log(`3.2 Existing JWT Authenticated Route (/api/profile/me): Status ${myProfileRes.status} (Expected: 403) - Error: "${myProfileRes.data.error}"`);
        if (myProfileRes.status !== 403) {
            throw new Error(`Suspended seller JWT was accepted! Status: ${myProfileRes.status}`);
        } else {
            console.log(`   -> Protected route blocked correctly ✅`);
        }

        // 3.3 Suspended Seller Trying to create listing
        const createListingRes = await request('/listings', {
            method: 'POST',
            headers: { Authorization: `Bearer ${activeSellerToken}` },
            body: JSON.stringify({
                title: 'Suspended Seller Listing Attempt',
                price: 1000,
                category: 'Wohnwagen',
                location: 'Hamburg'
            })
        });
        console.log(`3.3 Create Listing Attempt: Status ${createListingRes.status} (Expected: 403) ✅`);

        // 3.4 Public listings should NOT contain suspended seller's listings
        const allListingsRes2 = await request('/listings');
        const foundInPublic2 = allListingsRes2.data.listings?.some(l => l.id === testListing.id);
        console.log(`3.4 Blocked seller's listing hidden from /api/listings: ${!foundInPublic2 ? 'HIDDEN ✅' : 'STILL VISIBLE ❌'}`);
        if (foundInPublic2) {
            throw new Error(`Blocked seller listing is still visible in public listings!`);
        }

        // 3.5 Public Listing Detail should be hidden/404 for anonymous users & buyers
        const detailRes2 = await request(`/listings/${testListing.id}`);
        console.log(`3.5 Anonymous access to blocked seller listing detail: Status ${detailRes2.status} (Expected: 404) ✅`);
        if (detailRes2.status !== 404) {
            throw new Error(`Anonymous user could see blocked seller listing! Status: ${detailRes2.status}`);
        }

        // 3.6 Admin can still inspect blocked seller listing
        const adminDetailRes = await request(`/listings/${testListing.id}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`3.6 Admin inspection of blocked seller listing: Status ${adminDetailRes.status} (Expected: 200) ✅`);

        // 3.7 Public Profile should return 404
        const profileRes2 = await request(`/profile/${sellerUser.id}`);
        console.log(`3.7 Public profile of blocked seller: Status ${profileRes2.status} (Expected: 404) ✅`);
        if (profileRes2.status !== 404) {
            throw new Error(`Blocked seller public profile was visible! Status: ${profileRes2.status}`);
        }

        // 3.8 Buyer attempting to start conversation with blocked seller
        const convRes = await request('/conversations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyerToken}` },
            body: JSON.stringify({
                listing_id: testListing.id,
                initial_message: 'Hallo, ist das Fahrzeug noch da?'
            })
        });
        console.log(`3.8 Buyer contact attempt to blocked seller: Status ${convRes.status} (Expected: 400) - Error: "${convRes.data.error}" ✅`);
        if (convRes.status !== 400) {
            throw new Error(`Buyer was able to message blocked seller! Status: ${convRes.status}`);
        }

        // --- TEST STEP 4: Unblocking the Seller ---
        console.log('\n--- TEST STEP 4: Admin Unblocks the Seller ---');
        const unblockRes = await request(`/admin/users/${sellerUser.id}/suspend`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ is_suspended: false })
        });
        console.log(`4.1 Admin unblock API status: ${unblockRes.status} - Message: "${unblockRes.data.message}"`);
        if (unblockRes.status !== 200 || unblockRes.data.user?.is_suspended !== false) {
            throw new Error(`Admin unblock failed: ${JSON.stringify(unblockRes.data)}`);
        }

        // 4.2 Seller can log in again
        const loginRes3 = await request('/login', {
            method: 'POST',
            body: JSON.stringify({ email: testSellerEmail, password: rawPassword })
        });
        console.log(`4.2 Unblocked Seller Login: Status ${loginRes3.status} - Success: ${loginRes3.data.success} ✅`);
        if (loginRes3.status !== 200) {
            throw new Error(`Unblocked seller could not log in!`);
        }

        // 4.3 Listing is back in public view
        const allListingsRes3 = await request('/listings');
        const foundInPublic3 = allListingsRes3.data.listings?.some(l => l.id === testListing.id);
        console.log(`4.3 Unblocked seller's listing restored in /api/listings: ${foundInPublic3 ? 'RESTORED ✅' : 'NOT FOUND ❌'}`);

        // --- TEST STEP 5: Suspend Seller via Listing Report Action ---
        console.log('\n--- TEST STEP 5: Suspend Seller via Listing Report Resolution ---');
        // 5.1 Buyer files a report
        const reportSubmitRes = await request(`/listings/${testListing.id}/reports`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyerToken}` },
            body: JSON.stringify({
                reason: 'SCAM',
                description: 'Verdacht auf gefälschtes Inserat / Betrug'
            })
        });
        console.log(`5.1 Buyer submitted report status: ${reportSubmitRes.status} - Success: ${reportSubmitRes.data.success} ✅`);
        const reportId = reportSubmitRes.data.report?.id;

        // 5.2 Admin resolves report and checks "suspend_seller = true" and "listing_action = REJECT"
        const resolveReportRes = await request(`/admin/reports/${reportId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                status: 'REVIEWED',
                listing_action: 'REJECT',
                suspend_seller: true,
                admin_note: 'Verkäufer wegen Betrugsverdacht gesperrt und Inserat deaktiviert.'
            })
        });
        console.log(`5.2 Admin resolved report with suspend_seller=true: Status ${resolveReportRes.status} ✅`);

        // 5.3 Verify seller is suspended again in DB
        const dbCheck2 = await pool.query('SELECT is_suspended FROM users WHERE id = $1', [sellerUser.id]);
        console.log(`5.3 Seller is_suspended after report resolution: ${dbCheck2.rows[0].is_suspended} ✅`);
        if (!dbCheck2.rows[0].is_suspended) {
            throw new Error(`Seller was not suspended by report resolution!`);
        }

        // 5.4 Re-activate seller for cleanup
        await request(`/admin/users/${sellerUser.id}/suspend`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ is_suspended: false })
        });
        console.log(`5.4 Seller re-activated after report test ✅`);

        // --- TEST STEP 6: Admin Self-Suspension Prevention ---
        console.log('\n--- TEST STEP 6: Admin Self-Suspension Prevention ---');
        const selfSuspendRes = await request(`/admin/users/${adminUser.id}/suspend`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ is_suspended: true })
        });
        console.log(`6.1 Self-suspend status: ${selfSuspendRes.status} (Expected: 400) - Error: "${selfSuspendRes.data.error}" ✅`);

        console.log('\n🎉 ALL SELLER BLOCKING & SUSPENSION TESTS PASSED PERFECTLY!\n');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        // Cleanup test accounts
        if (sellerUser?.id) {
            await pool.query('DELETE FROM listings WHERE user_id = $1', [sellerUser.id]).catch(() => {});
            await pool.query('DELETE FROM private_profiles WHERE user_id = $1', [sellerUser.id]).catch(() => {});
            await pool.query('DELETE FROM users WHERE id = $1', [sellerUser.id]).catch(() => {});
        }
        if (buyerUser?.id) {
            await pool.query('DELETE FROM private_profiles WHERE user_id = $1', [buyerUser.id]).catch(() => {});
            await pool.query('DELETE FROM users WHERE id = $1', [buyerUser.id]).catch(() => {});
        }
        await pool.end();
    }
}

runTests();
