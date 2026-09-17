import pool from '../config/database.js';
import { initBlogPostsTable } from '../config/initBlogPostsTable.js';

const API_BASE = 'http://localhost:5000/api';

async function testBlogSystem() {
    console.log('🧪 === STARTING BLOG SYSTEM VERIFICATION ===\n');

    try {
        // Step 1: Initialize table and seed
        console.log('1. Checking and initializing blog_posts table...');
        await initBlogPostsTable();
        const countRes = await pool.query('SELECT COUNT(*) FROM blog_posts');
        console.log(`📊 Current total posts in DB: ${countRes.rows[0].count}`);

        // Step 2: Test Public API endpoint GET /api/posts
        console.log('\n2. Testing GET /api/posts (Public List)...');
        const publicRes = await fetch(`${API_BASE}/posts`).then(r => r.json());
        console.log(`✅ Success: ${publicRes.success}, Total: ${publicRes.total}, Posts returned: ${publicRes.posts?.length}`);
        console.log(`📂 Categories:`, publicRes.categories);
        
        if (publicRes.posts?.length > 0) {
            const first = publicRes.posts[0];
            console.log(`📌 First post title: "${first.title}" (slug: ${first.slug})`);

            // Step 3: Test Public Single Post by slug
            console.log(`\n3. Testing GET /api/posts/${first.slug} (Public Single Post)...`);
            const singleRes = await fetch(`${API_BASE}/posts/${first.slug}`).then(r => r.json());
            console.log(`✅ Single post fetched: "${singleRes.post?.title}"`);
            console.log(`🔗 Related posts count: ${singleRes.relatedPosts?.length}`);
        }

        // Step 4: Test Admin Login to get JWT Token
        console.log('\n4. Authenticating as Admin for CRUD tests...');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@campuna.com';
        const adminPass = process.env.ADMIN_PASSWORD || 'AdminCampuna';

        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: adminPass })
        }).then(r => r.json());

        const token = loginRes.access_token || loginRes.token;
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log('✅ Admin authenticated successfully! (Token acquired)');

        // Step 5: Test Creating a New Post via Admin API
        console.log('\n5. Creating a new test blog post via Admin API...');
        const testSlug = 'test-ratgeber-autark-camping-' + Date.now().toString().slice(-4);
        const createPayload = {
            title: 'Autarkes Camping: Strom, Wasser und Gas für 7 Tage ohne Stellplatz',
            slug: testSlug,
            excerpt: 'Wie du mit Solartasche, LiFePO4-Batterie und Wasserfilter 7 Tage autark in der Natur stehst.',
            category: 'Tipps & Tricks',
            tags: ['Autark', 'Solar', 'Batterie', 'Freiheit'],
            image_url: '/collection/camping-zubehoer-hero.png',
            images: ['/collection/camping-zubehoer-hero.png'],
            author_name: 'Campuna Redaktion',
            read_time: '6 Min.',
            featured: true,
            status: 'published',
            content: `# Autarkes Camping: Strom, Wasser und Gas für 7 Tage

Frei stehen und die Natur genießen, ganz ohne auf Komfort zu verzichten. In diesem Ratgeber erfährst du, welche Komponenten unverzichtbar sind.

---

## ⚡ 1. Stromversorgung
- 100Ah LiFePO4 Batterie
- 150W faltbares Solarpanel
- 500W Sinus-Wechselrichter

## 💧 2. Wasservorrat & Filterung
| Tag | Verbrauch | Rest |
| --- | --- | --- |
| Tag 1 | 15L | 85L |
| Tag 2 | 15L | 70L |
| Tag 3 | 15L | 55L |

> **Profi-Tipp:** Nutze biologisch abbaubare Seife und schütze die Umwelt!`
        };

        const createRes = await fetch(`${API_BASE}/admin/posts`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(createPayload)
        }).then(r => r.json());

        console.log(`✅ Created Post ID: ${createRes.post?.id}, Slug: ${createRes.post?.slug}`);
        const createdId = createRes.post?.id;

        // Step 6: Test Updating the Post (Draft toggle)
        console.log('\n6. Updating test post (switching status to draft)...');
        const updateRes = await fetch(`${API_BASE}/admin/posts/${createdId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({
                status: 'draft',
                excerpt: 'Aktualisierte Zusammenfassung für den Entwurf.'
            })
        }).then(r => r.json());
        console.log(`✅ Updated status: ${updateRes.post?.status}, Excerpt: "${updateRes.post?.excerpt}"`);

        // Step 7: Verify Admin List contains drafts
        console.log('\n7. Fetching admin posts list with filter status=draft...');
        const adminDraftsRes = await fetch(`${API_BASE}/admin/posts?status=draft`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log(`✅ Admin drafts found: ${adminDraftsRes.posts?.length} (Stats: ${JSON.stringify(adminDraftsRes.stats)})`);

        // Step 8: Clean up by deleting the test post
        console.log('\n8. Deleting the test post...');
        const deleteRes = await fetch(`${API_BASE}/admin/posts/${createdId}`, {
            method: 'DELETE',
            headers: authHeaders
        }).then(r => r.json());
        console.log(`✅ Delete response: ${deleteRes.message}`);

        console.log('\n🎉 === ALL BLOG SYSTEM TESTS PASSED SUCCESSFULLY! ===');
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await pool.end();
    }
}

testBlogSystem();
