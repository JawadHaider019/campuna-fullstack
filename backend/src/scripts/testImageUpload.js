import pool from '../config/database.js';

const API_BASE = 'http://localhost:5000/api';

async function testImageUpload() {
    console.log('🧪 Testing Admin Image Upload endpoint...');

    try {
        // Authenticate
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@campuna.com';
        const adminPass = process.env.ADMIN_PASSWORD || 'AdminCampuna';

        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: adminPass })
        }).then(r => r.json());

        const token = loginRes.access_token || loginRes.token;

        // Create dummy png file buffer in memory
        const pngHeader = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
            0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
            0x42, 0x60, 0x82
        ]);

        const blob = new Blob([pngHeader], { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', blob, 'test-sample.png');

        const uploadRes = await fetch(`${API_BASE}/admin/posts/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        }).then(r => r.json());

        console.log('✅ Image Upload Response:', uploadRes);
        if (uploadRes.success && uploadRes.imageUrl) {
            console.log('🎉 Upload successfully generated URL:', uploadRes.imageUrl);
        } else {
            console.error('❌ Upload failed:', uploadRes);
        }
    } catch (err) {
        console.error('❌ Upload error:', err.message);
    } finally {
        await pool.end();
    }
}

testImageUpload();
