import 'dotenv/config';
import pool from '../config/database.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'campuna_super_secret_jwt_key_2026_production';

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

async function runBroadcastTests() {
    console.log('🚀 Starting Broadcast System End-to-End Tests...\n');

    let adminUser = null;
    let privateUser = null;
    let commercialUser = null;
    let broadcastAllId = null;
    let broadcastPrivateId = null;
    let broadcastCommercialId = null;

    try {
        // 1. Identify Admin
        const adminRes = await pool.query(`SELECT id, email, role FROM admins LIMIT 1`);
        if (adminRes.rowCount > 0) {
            adminUser = adminRes.rows[0];
        } else {
            const uAdmin = await pool.query(`SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1`);
            adminUser = uAdmin.rows[0];
        }
        if (!adminUser) throw new Error('No admin user found.');

        const adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`✅ Admin identified: ${adminUser.email}`);

        // 2. Setup Test Private User
        const privEmail = 'test_broadcast_priv@campuna.de';
        const passwordHash = hashPassword('TestPass123!');
        await pool.query('DELETE FROM users WHERE email = $1', [privEmail]);
        const privInsert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'PRIVATE', 'USER', true, false, NOW(), NOW())
             RETURNING id, email, user_type`,
            [crypto.randomUUID(), privEmail, passwordHash]
        );
        privateUser = privInsert.rows[0];
        const privateToken = jwt.sign({ id: privateUser.id, email: privateUser.email, user_type: 'PRIVATE', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`✅ Private User created: ${privateUser.email}`);

        // 3. Setup Test Commercial User
        const commEmail = 'test_broadcast_comm@campuna.de';
        await pool.query('DELETE FROM users WHERE email = $1', [commEmail]);
        const commInsert = await pool.query(
            `INSERT INTO users (id, email, password_hash, user_type, role, email_verified, is_suspended, created_at, updated_at)
             VALUES ($1, $2, $3, 'COMMERCIAL', 'USER', true, false, NOW(), NOW())
             RETURNING id, email, user_type`,
            [crypto.randomUUID(), commEmail, passwordHash]
        );
        commercialUser = commInsert.rows[0];
        const commercialToken = jwt.sign({ id: commercialUser.id, email: commercialUser.email, user_type: 'COMMERCIAL', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`✅ Commercial User created: ${commercialUser.email}\n`);

        // --- TEST STEP 1: Admin Creates 3 Broadcasts (ALL, PRIVATE, COMMERCIAL) ---
        console.log('--- TEST STEP 1: Admin Broadcast Creation ---');

        // 1.1 Broadcast for ALL
        const bAllRes = await request('/admin/broadcasts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                title: 'Wichtiges Plattform-Update: Neue Filter für Wohnmobile',
                content: 'Wir haben die Filtersuche um zusätzliche Fahrzeugmerkmale und Standheizungsoptionen erweitert.',
                target_type: 'ALL',
                priority: 'IMPORTANT',
                action_url: '/de/inserate',
                action_label: 'Jetzt entdecken'
            })
        });
        console.log(`1.1 Admin created broadcast (ALL): Status ${bAllRes.status} - Message: "${bAllRes.data.message}"`);
        if (bAllRes.status !== 201) throw new Error(`Create ALL broadcast failed: ${JSON.stringify(bAllRes.data)}`);
        broadcastAllId = bAllRes.data.broadcast?.id;

        // 1.2 Broadcast for PRIVATE only
        const bPrivRes = await request('/admin/broadcasts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                title: 'Pionier-Auszeichnung für Privatnutzer',
                content: 'Erstelle 3 geprüfte Inserate und sichere dir dein exklusives Campuna Pionier-Abzeichen.',
                target_type: 'PRIVATE',
                priority: 'NORMAL',
                action_url: '/de/mein-konto',
                action_label: 'Profil ansehen'
            })
        });
        console.log(`1.2 Admin created broadcast (PRIVATE): Status ${bPrivRes.status} ✅`);
        broadcastPrivateId = bPrivRes.data.broadcast?.id;

        // 1.3 Broadcast for COMMERCIAL only
        const bCommRes = await request('/admin/broadcasts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                title: 'Business-Paket Rabatt für Händler',
                content: 'Spare diesen Monat 20% auf das jährliche Business-Abonnement mit unbegrenzten Inseraten.',
                target_type: 'COMMERCIAL',
                priority: 'URGENT',
                action_url: '/de/abo',
                action_label: 'Abo upgraden'
            })
        });
        console.log(`1.3 Admin created broadcast (COMMERCIAL): Status ${bCommRes.status} ✅\n`);
        broadcastCommercialId = bCommRes.data.broadcast?.id;

        // --- TEST STEP 2: Audience Segmentation Queries ---
        console.log('--- TEST STEP 2: Audience Segmentation Queries ---');

        // 2.1 Private user queries /api/broadcasts
        const privFeed = await request('/broadcasts', {
            headers: { Authorization: `Bearer ${privateToken}` }
        });
        const privItems = privFeed.data.broadcasts || [];
        const privHasAll = privItems.some(b => b.id === broadcastAllId);
        const privHasPriv = privItems.some(b => b.id === broadcastPrivateId);
        const privHasComm = privItems.some(b => b.id === broadcastCommercialId);

        console.log(`2.1 Private User Audience Check:`);
        console.log(`    - Sees 'ALL' broadcast: ${privHasAll ? 'YES ✅' : 'NO ❌'}`);
        console.log(`    - Sees 'PRIVATE' broadcast: ${privHasPriv ? 'YES ✅' : 'NO ❌'}`);
        console.log(`    - Sees 'COMMERCIAL' broadcast (Should be NO): ${!privHasComm ? 'HIDDEN ✅' : 'LEAKED ❌'}`);
        if (!privHasAll || !privHasPriv || privHasComm) throw new Error('Private user audience segmentation failed!');

        // 2.2 Commercial user queries /api/broadcasts
        const commFeed = await request('/broadcasts', {
            headers: { Authorization: `Bearer ${commercialToken}` }
        });
        const commItems = commFeed.data.broadcasts || [];
        const commHasAll = commItems.some(b => b.id === broadcastAllId);
        const commHasPriv = commItems.some(b => b.id === broadcastPrivateId);
        const commHasComm = commItems.some(b => b.id === broadcastCommercialId);

        console.log(`2.2 Commercial User Audience Check:`);
        console.log(`    - Sees 'ALL' broadcast: ${commHasAll ? 'YES ✅' : 'NO ❌'}`);
        console.log(`    - Sees 'COMMERCIAL' broadcast: ${commHasComm ? 'YES ✅' : 'NO ❌'}`);
        console.log(`    - Sees 'PRIVATE' broadcast (Should be NO): ${!commHasPriv ? 'HIDDEN ✅' : 'LEAKED ❌'}`);
        if (!commHasAll || !commHasComm || commHasPriv) throw new Error('Commercial user audience segmentation failed!\n');

        // --- TEST STEP 3: Unread Counts and Read Receipts ---
        console.log('\n--- TEST STEP 3: Unread Counts & Read Receipts ---');

        // 3.1 Initial Unread Count for Private user
        const privUnread1 = await request('/broadcasts/unread-count', {
            headers: { Authorization: `Bearer ${privateToken}` }
        });
        console.log(`3.1 Private User Unread Count: ${privUnread1.data.unread_count} (Expected: 2) ✅`);
        if (privUnread1.data.unread_count !== 2) throw new Error('Expected 2 unread broadcasts for private user!');

        // 3.2 Private user reads the 'ALL' broadcast
        const readRes = await request(`/broadcasts/${broadcastAllId}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${privateToken}` }
        });
        console.log(`3.2 Private User marked 'ALL' broadcast as read: Status ${readRes.status} ✅`);

        // 3.3 Private user unread count should now be 1
        const privUnread2 = await request('/broadcasts/unread-count', {
            headers: { Authorization: `Bearer ${privateToken}` }
        });
        console.log(`3.3 Private User Unread Count after reading: ${privUnread2.data.unread_count} (Expected: 1) ✅`);
        if (privUnread2.data.unread_count !== 1) throw new Error('Unread count did not decrease to 1!');

        // 3.4 Commercial user's unread count must still be 2 (isolated receipts)
        const commUnread1 = await request('/broadcasts/unread-count', {
            headers: { Authorization: `Bearer ${commercialToken}` }
        });
        console.log(`3.4 Commercial User Unread Count remains isolated: ${commUnread1.data.unread_count} (Expected: 2) ✅`);
        if (commUnread1.data.unread_count !== 2) throw new Error('Commercial user unread count was impacted!');

        // --- TEST STEP 4: Admin Engagement Analytics ---
        console.log('\n--- TEST STEP 4: Admin Engagement Analytics ---');
        const adminBroadcastsRes = await request('/admin/broadcasts', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`4.1 Admin list broadcasts status: ${adminBroadcastsRes.status} (Total: ${adminBroadcastsRes.data.summary?.totalBroadcasts}) ✅`);

        const adminItemAll = adminBroadcastsRes.data.broadcasts?.find(b => b.id === broadcastAllId);
        console.log(`4.2 'ALL' Broadcast Metrics: Read Count = ${adminItemAll?.metrics?.read_count} (Expected >= 1), Target Audience = ${adminItemAll?.metrics?.target_audience}, Rate = ${adminItemAll?.metrics?.read_percentage}% ✅`);
        if (adminItemAll?.metrics?.read_count < 1) throw new Error('Read count was not tracked in admin analytics!');

        // --- TEST STEP 5: Mark All As Read ---
        console.log('\n--- TEST STEP 5: Mark All As Read ---');
        const markAllRes = await request('/broadcasts/mark-all-read', {
            method: 'POST',
            headers: { Authorization: `Bearer ${commercialToken}` }
        });
        console.log(`5.1 Commercial user mark-all-read status: ${markAllRes.status} ✅`);

        const commUnread2 = await request('/broadcasts/unread-count', {
            headers: { Authorization: `Bearer ${commercialToken}` }
        });
        console.log(`5.2 Commercial user unread count after mark-all-read: ${commUnread2.data.unread_count} (Expected: 0) ✅`);
        if (commUnread2.data.unread_count !== 0) throw new Error('Unread count was not 0 after mark-all-read!');

        // --- TEST STEP 6: Admin Edit & Delete ---
        console.log('\n--- TEST STEP 6: Admin Edit & Delete ---');
        const updateRes = await request(`/admin/broadcasts/${broadcastAllId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                title: 'Wichtiges Plattform-Update (Aktualisiert)',
                priority: 'URGENT'
            })
        });
        console.log(`6.1 Admin updated broadcast: Status ${updateRes.status} (New title: "${updateRes.data.broadcast?.title}", Priority: "${updateRes.data.broadcast?.priority}") ✅`);

        const deleteRes = await request(`/admin/broadcasts/${broadcastPrivateId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`6.2 Admin deleted broadcast: Status ${deleteRes.status} - Message: "${deleteRes.data.message}" ✅`);

        console.log('\n🎉 ALL BROADCAST SYSTEM TESTS PASSED PERFECTLY!\n');

    } catch (err) {
        console.error('\n❌ BROADCAST TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        // Cleanup test broadcasts & users
        if (broadcastAllId) await pool.query('DELETE FROM broadcasts WHERE id = $1', [broadcastAllId]).catch(() => {});
        if (broadcastPrivateId) await pool.query('DELETE FROM broadcasts WHERE id = $1', [broadcastPrivateId]).catch(() => {});
        if (broadcastCommercialId) await pool.query('DELETE FROM broadcasts WHERE id = $1', [broadcastCommercialId]).catch(() => {});
        if (privateUser?.id) {
            await pool.query('DELETE FROM broadcast_reads WHERE user_id = $1', [privateUser.id]).catch(() => {});
            await pool.query('DELETE FROM users WHERE id = $1', [privateUser.id]).catch(() => {});
        }
        if (commercialUser?.id) {
            await pool.query('DELETE FROM broadcast_reads WHERE user_id = $1', [commercialUser.id]).catch(() => {});
            await pool.query('DELETE FROM users WHERE id = $1', [commercialUser.id]).catch(() => {});
        }
        await pool.end();
    }
}

runBroadcastTests();
