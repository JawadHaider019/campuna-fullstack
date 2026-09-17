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

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function runListingBlockingTests() {
    console.log('🚀 Starting Comprehensive Listing Blocking Tests (Without Report & After Report)...\n');

    let adminUser = null;
    let sellerUser = null;
    let buyer1User = null;
    let buyer2User = null;
    let testListing1 = null;
    let testListing2 = null;

    try {
        // 1. Setup Admin Token
        const adminRes = await pool.query(`SELECT id, email, role FROM admins LIMIT 1`);
        if (adminRes.rowCount > 0) {
            adminUser = adminRes.rows[0];
        } else {
            const uAdmin = await pool.query(`SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1`);
            adminUser = uAdmin.rows[0];
        }

        if (!adminUser) {
            throw new Error('No admin user found in database.');
        }

        const adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`✅ Admin identified: ${adminUser.email}`);

        // 2. Setup Seller User (Active, not suspended)
        const testSellerEmail = 'seller_listing_block_test@campuna.de';
        const rawPassword = 'TestPassword123!';
        const passwordHash = hashPassword(rawPassword);

        await pool.query(`DELETE FROM users WHERE email = $1`, [testSellerEmail]);
        const sellerInsert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email`,
            [crypto.randomUUID(), testSellerEmail, passwordHash]
        );
        sellerUser = sellerInsert.rows[0];

        await pool.query(
            `INSERT INTO private_profiles (user_id, first_name, last_name, location, created_at, updated_at)
             VALUES ($1, 'Klaus', 'Verkäufer', 'Stuttgart', NOW(), NOW())`,
            [sellerUser.id]
        );
        const sellerToken = jwt.sign(
            { id: sellerUser.id, email: sellerUser.email, role: 'USER' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`✅ Test Seller created: ${sellerUser.email} (ID: ${sellerUser.id})`);

        // 3. Setup Buyer 1 and Buyer 2
        const testBuyer1Email = 'buyer1_block_test@campuna.de';
        const testBuyer2Email = 'buyer2_block_test@campuna.de';
        await pool.query(`DELETE FROM users WHERE email IN ($1, $2)`, [testBuyer1Email, testBuyer2Email]);

        const buyer1Insert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email`,
            [crypto.randomUUID(), testBuyer1Email, passwordHash]
        );
        buyer1User = buyer1Insert.rows[0];
        const buyer1Token = jwt.sign({ id: buyer1User.id, email: buyer1User.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

        const buyer2Insert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email`,
            [crypto.randomUUID(), testBuyer2Email, passwordHash]
        );
        buyer2User = buyer2Insert.rows[0];
        const buyer2Token = jwt.sign({ id: buyer2User.id, email: buyer2User.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

        console.log(`✅ Buyers created: ${buyer1User.email}, ${buyer2User.email}`);

        // 4. Create Listing 1 (For testing direct block without report)
        const listing1Id = crypto.randomUUID();
        const l1Res = await pool.query(
            `INSERT INTO listings (
                id, user_id, title, slug, description, price, negotiable, location,
                condition, category, subcategory, status, featured, images, created_at, updated_at
            ) VALUES (
                $1, $2, 'Hymer Grand Canyon Direct Block Test', 'hymer-grand-canyon-direct-block-test',
                'Schönes Reisemobil mit Vollausstattung', 59000, false, 'Stuttgart',
                'Gebraucht', 'Wohnmobile', 'Kastenwagen', 'APPROVED', false, ARRAY['https://example.com/hymer.jpg'],
                NOW(), NOW()
            ) RETURNING *`,
            [listing1Id, sellerUser.id]
        );
        testListing1 = l1Res.rows[0];
        console.log(`✅ Listing 1 (Direct Block Test) created & APPROVED: "${testListing1.title}" (ID: ${testListing1.id})`);

        // 5. Create Listing 2 (For testing block after user reports)
        const listing2Id = crypto.randomUUID();
        const l2Res = await pool.query(
            `INSERT INTO listings (
                id, user_id, title, slug, description, price, negotiable, location,
                condition, category, subcategory, status, featured, images, created_at, updated_at
            ) VALUES (
                $1, $2, 'Pössl 2Win Report Block Test', 'poessl-2win-report-block-test',
                'Kompakter Camper mit Standheizung', 38000, true, 'Stuttgart',
                'Gebraucht', 'Wohnmobile', 'Kastenwagen', 'APPROVED', false, ARRAY['https://example.com/poessl.jpg'],
                NOW(), NOW()
            ) RETURNING *`,
            [listing2Id, sellerUser.id]
        );
        testListing2 = l2Res.rows[0];
        console.log(`✅ Listing 2 (Report Block Test) created & APPROVED: "${testListing2.title}" (ID: ${testListing2.id})\n`);

        // =========================================================================
        // PART 1: DIRECT LISTING BLOCKING WITHOUT REPORT (ADMIN MODERATION / DECISIONS)
        // =========================================================================
        console.log('================================================================');
        console.log('🔹 PART 1: Direct Listing Blocking Without Report');
        console.log('================================================================');

        // 1.1 Verify Listing 1 is currently visible in public marketplace
        const publicFeed1 = await request('/listings');
        const isL1PublicBefore = publicFeed1.data.listings?.some(l => l.id === testListing1.id);
        console.log(`1.1 Listing 1 visible in public marketplace: ${isL1PublicBefore ? 'YES ✅' : 'NO ❌'}`);
        if (!isL1PublicBefore) throw new Error('Listing 1 was not visible in public feed!');

        // 1.2 Admin directly blocks/rejects Listing 1 via /api/admin/listings/:id/status
        console.log('\n--> Admin directly blocking Listing 1 via /api/admin/listings/:id/status (status: REJECTED)...');
        const blockListingRes = await request(`/admin/listings/${testListing1.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                status: 'REJECTED',
                reason: 'Irreführende Preisangaben und falsche Kategorie'
            })
        });
        console.log(`1.2 Admin block response: Status ${blockListingRes.status} - Message: "${blockListingRes.data.message}"`);
        if (blockListingRes.status !== 200 || blockListingRes.data.listing?.status !== 'REJECTED') {
            throw new Error(`Failed to directly block listing: ${JSON.stringify(blockListingRes.data)}`);
        }

        // 1.3 Verify DB status
        const dbListing1 = await pool.query('SELECT status FROM listings WHERE id = $1', [testListing1.id]);
        console.log(`1.3 Listing 1 database status: "${dbListing1.rows[0].status}" ✅`);

        // 1.4 Verify Listing 1 is now HIDDEN from public marketplace feed
        const publicFeed2 = await request('/listings');
        const isL1PublicAfter = publicFeed2.data.listings?.some(l => l.id === testListing1.id);
        console.log(`1.4 Blocked listing hidden from public /api/listings: ${!isL1PublicAfter ? 'HIDDEN ✅' : 'STILL VISIBLE ❌'}`);
        if (isL1PublicAfter) throw new Error('Blocked listing is still visible in public marketplace!');

        // 1.5 Anonymous / Buyer access to blocked listing detail should return 404
        const buyerDetailRes1 = await request(`/listings/${testListing1.id}`, {
            headers: { Authorization: `Bearer ${buyer1Token}` }
        });
        console.log(`1.5 Buyer access to blocked listing detail: Status ${buyerDetailRes1.status} (Expected: 404) - Error: "${buyerDetailRes1.data.error}" ✅`);
        if (buyerDetailRes1.status !== 404) throw new Error(`Buyer was able to see blocked listing detail! Status: ${buyerDetailRes1.status}`);

        const anonDetailRes1 = await request(`/listings/${testListing1.id}`);
        console.log(`1.6 Anonymous access to blocked listing detail: Status ${anonDetailRes1.status} (Expected: 404) ✅`);
        if (anonDetailRes1.status !== 404) throw new Error(`Anonymous user was able to see blocked listing!`);

        // 1.7 Seller (Owner) CAN still view their blocked listing with REJECTED status
        const sellerDetailRes1 = await request(`/listings/${testListing1.id}`, {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        console.log(`1.7 Seller access to own blocked listing: Status ${sellerDetailRes1.status} (Status: "${sellerDetailRes1.data.listing?.status}") ✅`);
        if (sellerDetailRes1.status !== 200 || sellerDetailRes1.data.listing?.status !== 'REJECTED') {
            throw new Error('Seller could not view own blocked listing!');
        }

        // 1.8 Seller sees REJECTED status in their dashboard (/api/listings/my)
        const mySellerListings = await request('/listings/my', {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        const myL1 = mySellerListings.data.listings?.find(l => l.id === testListing1.id);
        console.log(`1.8 Seller dashboard (/api/listings/my) status for Listing 1: "${myL1?.status}" ✅`);
        if (myL1?.status !== 'REJECTED') throw new Error('Listing status was not REJECTED in seller dashboard!');

        // 1.9 Admin can still inspect the blocked listing detail
        const adminDetailRes1 = await request(`/listings/${testListing1.id}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`1.9 Admin inspection of blocked listing: Status ${adminDetailRes1.status} (Title: "${adminDetailRes1.data.listing?.title}") ✅`);

        // 1.10 Buyer attempting to start a conversation for the blocked listing
        const blockedConvRes = await request('/conversations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyer1Token}` },
            body: JSON.stringify({
                listing_id: testListing1.id,
                initial_message: 'Ich interessiere mich für das Wohnmobil'
            })
        });
        console.log(`1.10 Buyer conversation attempt on blocked listing: Status ${blockedConvRes.status} (Expected: 400) - Error: "${blockedConvRes.data.error}" ✅`);
        if (blockedConvRes.status !== 400) throw new Error('Buyer was able to open a chat on a blocked listing!');

        // 1.11 Admin re-approves / unblocks Listing 1
        console.log('\n--> Admin unblocking / re-approving Listing 1...');
        const unblockListingRes = await request(`/admin/listings/${testListing1.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ status: 'APPROVED' })
        });
        console.log(`1.11 Admin unblock status: ${unblockListingRes.status} (New status: "${unblockListingRes.data.listing?.status}") ✅`);

        // 1.12 Listing 1 is restored in public feed
        const publicFeed3 = await request('/listings');
        const isL1PublicRestored = publicFeed3.data.listings?.some(l => l.id === testListing1.id);
        console.log(`1.12 Listing 1 restored in public marketplace: ${isL1PublicRestored ? 'RESTORED ✅' : 'NOT RESTORED ❌'}\n`);
        if (!isL1PublicRestored) throw new Error('Listing 1 was not restored in public marketplace!');

        // 1.13 Also test manual admin decision via /api/admin/decisions/:id/admin-decision
        console.log('--> Testing AI / Decisions direct reject via /api/admin/decisions/:id/admin-decision...');
        const decisionRejectRes = await request(`/admin/decisions/${testListing1.id}/admin-decision`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                decision: 'REJECTED',
                notes: 'Abgelehnt durch KI-Moderations-Entscheidung'
            })
        });
        console.log(`1.13 Decision reject API status: ${decisionRejectRes.status} (Listing status: "${decisionRejectRes.data.listing?.status}") ✅`);
        if (decisionRejectRes.data.listing?.status !== 'REJECTED') throw new Error('Decision reject failed!');

        // Re-approve again
        await request(`/admin/decisions/${testListing1.id}/admin-decision`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ decision: 'APPROVED', notes: 'Wieder freigegeben' })
        });
        console.log('1.14 Decision re-approve API status: 200 ✅\n');


        // =========================================================================
        // PART 2: LISTING BLOCKING AFTER USER REPORT
        // =========================================================================
        console.log('================================================================');
        console.log('🔹 PART 2: Listing Blocking After User Report');
        console.log('================================================================');

        // 2.1 Verify Listing 2 is currently approved and live
        const publicFeedL2_1 = await request('/listings');
        const isL2LiveBefore = publicFeedL2_1.data.listings?.some(l => l.id === testListing2.id);
        console.log(`2.1 Listing 2 visible in marketplace: ${isL2LiveBefore ? 'YES ✅' : 'NO ❌'}`);
        if (!isL2LiveBefore) throw new Error('Listing 2 was not live!');

        // 2.2 Buyer 1 submits Report 1 on Listing 2
        console.log('\n--> Buyer 1 filing a report for "SCAM"...');
        const report1Res = await request(`/listings/${testListing2.id}/reports`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyer1Token}` },
            body: JSON.stringify({
                reason: 'SCAM',
                description: 'Verkäufer verlangt Vorauszahlung auf ausländisches Konto.'
            })
        });
        console.log(`2.2 Report 1 submitted: Status ${report1Res.status} - Message: "${report1Res.data.message}" ✅`);
        const report1Id = report1Res.data.report?.id;

        // 2.3 Buyer 2 submits Report 2 on Listing 2
        console.log('--> Buyer 2 filing a report for "PROHIBITED_CONTENT"...');
        const report2Res = await request(`/listings/${testListing2.id}/reports`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyer2Token}` },
            body: JSON.stringify({
                reason: 'PROHIBITED_CONTENT',
                description: 'Unzulässige Kontaktangaben in der Beschreibung.'
            })
        });
        console.log(`2.3 Report 2 submitted: Status ${report2Res.status} ✅`);
        const report2Id = report2Res.data.report?.id;

        // 2.4 Verify both reports appear in Admin Reports Queue as PENDING
        const adminReportsRes = await request('/admin/reports?status=PENDING', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const foundReport1 = adminReportsRes.data.reports?.some(r => r.id === report1Id);
        const foundReport2 = adminReportsRes.data.reports?.some(r => r.id === report2Id);
        console.log(`2.4 Both reports in Admin PENDING queue: Report 1 (${foundReport1 ? 'FOUND ✅' : 'MISSING ❌'}), Report 2 (${foundReport2 ? 'FOUND ✅' : 'MISSING ❌'})`);

        // 2.5 Admin reviews Report 1 and executes listing_action = 'REJECT' (without suspending the seller)
        console.log('\n--> Admin resolving Report 1 with listing_action = "REJECT" (Listing Sperrung)...');
        const resolveReportRes = await request(`/admin/reports/${report1Id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                status: 'REVIEWED',
                listing_action: 'REJECT',
                suspend_seller: false,
                admin_note: 'Inserat nach Prüfung gesperrt. Betrugsverdacht bestätigt.'
            })
        });
        console.log(`2.5 Admin resolved Report 1: Status ${resolveReportRes.status} - Message: "${resolveReportRes.data.message}" ✅`);
        if (resolveReportRes.status !== 200) throw new Error('Failed to resolve report with listing_action REJECT!');

        // 2.6 Verify Listing 2 status in DB is now REJECTED
        const dbListing2 = await pool.query('SELECT status FROM listings WHERE id = $1', [testListing2.id]);
        console.log(`2.6 Listing 2 status in DB: "${dbListing2.rows[0].status}" (Expected: "REJECTED") ✅`);
        if (dbListing2.rows[0].status !== 'REJECTED') throw new Error('Listing status was not updated to REJECTED!');

        // 2.7 Verify Report 2 (other pending report on same listing) was automatically closed/reviewed
        const dbReport2 = await pool.query('SELECT status, admin_note FROM listing_reports WHERE id = $1', [report2Id]);
        console.log(`2.7 Report 2 auto-resolved status: "${dbReport2.rows[0].status}" (Note: "${dbReport2.rows[0].admin_note}") ✅`);
        if (dbReport2.rows[0].status !== 'REVIEWED') {
            throw new Error(`Report 2 was not automatically marked as REVIEWED! Status: ${dbReport2.rows[0].status}`);
        }

        // 2.8 Verify Listing 2 is now HIDDEN from public marketplace feed
        const publicFeedL2_2 = await request('/listings');
        const isL2LiveAfter = publicFeedL2_2.data.listings?.some(l => l.id === testListing2.id);
        console.log(`2.8 Reported & blocked listing hidden from public /api/listings: ${!isL2LiveAfter ? 'HIDDEN ✅' : 'STILL VISIBLE ❌'}`);
        if (isL2LiveAfter) throw new Error('Reported blocked listing is still visible in public marketplace!');

        // 2.9 Verify anonymous / buyer access returns 404
        const buyerDetailRes2 = await request(`/listings/${testListing2.id}`, {
            headers: { Authorization: `Bearer ${buyer1Token}` }
        });
        console.log(`2.9 Buyer access to reported blocked listing: Status ${buyerDetailRes2.status} (Expected: 404) ✅`);
        if (buyerDetailRes2.status !== 404) throw new Error('Buyer could access reported blocked listing!');

        // 2.10 Seller is NOT suspended and can still access their dashboard and account
        const sellerUserCheck = await pool.query('SELECT is_suspended FROM users WHERE id = $1', [sellerUser.id]);
        console.log(`2.10 Seller account suspended: ${sellerUserCheck.rows[0].is_suspended ? 'YES (Suspended)' : 'NO (Active) ✅'}`);
        if (sellerUserCheck.rows[0].is_suspended) throw new Error('Seller was unexpectedly suspended when suspend_seller=false!');

        // 2.11 Seller sees their reported listing as REJECTED in /api/listings/my
        const mySellerListings2 = await request('/listings/my', {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        const myL2 = mySellerListings2.data.listings?.find(l => l.id === testListing2.id);
        console.log(`2.11 Seller dashboard status for reported Listing 2: "${myL2?.status}" ✅`);
        if (myL2?.status !== 'REJECTED') throw new Error('Reported listing status not reflected in seller dashboard!');

        // 2.12 Buyer cannot message about the reported blocked listing
        const convAttemptRes = await request('/conversations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${buyer1Token}` },
            body: JSON.stringify({
                listing_id: testListing2.id,
                initial_message: 'Hallo, ist das Fahrzeug noch zu haben?'
            })
        });
        console.log(`2.12 Buyer conversation attempt on reported blocked listing: Status ${convAttemptRes.status} (Expected: 400) - Error: "${convAttemptRes.data.error}" ✅`);
        if (convAttemptRes.status !== 400) throw new Error('Buyer was able to open conversation on reported blocked listing!');

        console.log('\n🎉 ALL LISTING BLOCKING TESTS (WITHOUT REPORT & AFTER REPORT) PASSED PERFECTLY!\n');

    } catch (err) {
        console.error('\n❌ LISTING BLOCKING TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        // Clean up test records
        if (testListing1?.id) await pool.query('DELETE FROM listing_moderation WHERE listing_id = $1', [testListing1.id]).catch(() => {});
        if (testListing2?.id) {
            await pool.query('DELETE FROM listing_reports WHERE listing_id = $1', [testListing2.id]).catch(() => {});
            await pool.query('DELETE FROM listing_moderation WHERE listing_id = $1', [testListing2.id]).catch(() => {});
        }
        if (sellerUser?.id) {
            await pool.query('DELETE FROM listings WHERE user_id = $1', [sellerUser.id]).catch(() => {});
            await pool.query('DELETE FROM private_profiles WHERE user_id = $1', [sellerUser.id]).catch(() => {});
            await pool.query('DELETE FROM users WHERE id = $1', [sellerUser.id]).catch(() => {});
        }
        if (buyer1User?.id) await pool.query('DELETE FROM users WHERE id = $1', [buyer1User.id]).catch(() => {});
        if (buyer2User?.id) await pool.query('DELETE FROM users WHERE id = $1', [buyer2User.id]).catch(() => {});
        await pool.end();
    }
}

runListingBlockingTests();
