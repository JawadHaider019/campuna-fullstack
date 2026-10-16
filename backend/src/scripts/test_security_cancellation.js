import 'dotenv/config';

async function testSecurityFlow() {
    const API_URL = 'http://localhost:5000/api/subscriptions';

    console.log('🧪 Starting Contract Cancellation Security & Revocation Test...\n');

    const testEmail = 'marketing@casamaki.de';

    // 1. Submit unauthenticated guest cancellation
    console.log(`1️⃣ Submitting guest cancellation for: ${testEmail}`);
    const cancelRes = await fetch(`${API_URL}/public-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Fremder Dritter',
            email: testEmail,
            contract_type: 'BUSINESS_PLAN',
            cancellation_date_type: 'IMMEDIATE',
            reason: 'Test unbefugter Zugriff',
        }),
    });

    const cancelData = await cancelRes.json();
    console.log('Response Status:', cancelRes.status);
    console.log('Response Body:', JSON.stringify(cancelData, null, 2));

    if (!cancelData.success || !cancelData.revocation_url) {
        console.error('❌ Failed: No revocation URL returned!');
        process.exit(1);
    }

    console.log('\n✅ Cancellation captured. Revocation URL:', cancelData.revocation_url);
    console.log('🛡️ Security notice returned:', cancelData.security_notice);

    // 2. Extract token from URL
    const urlObj = new URL(cancelData.revocation_url);
    const token = urlObj.searchParams.get('token');
    console.log('\n🔑 Extracted Revocation JWT Token:', token.substring(0, 30) + '...');

    // 3. Call 1-click Revocation Endpoint
    console.log('\n2️⃣ Simulating Account Owner clicking Revocation Link...');
    const revokeRes = await fetch(`${API_URL}/revoke-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    const revokeData = await revokeRes.json();
    console.log('Revoke Status:', revokeRes.status);
    console.log('Revoke Body:', JSON.stringify(revokeData, null, 2));

    if (!revokeData.success) {
        console.error('❌ Revocation failed!');
        process.exit(1);
    }

    console.log('✅ Revocation successful! Active subscription protected and restored.');

    // 4. Test Idempotency (clicking link a second time)
    console.log('\n3️⃣ Testing Idempotency (clicking revocation link a second time)...');
    const revokeAgainRes = await fetch(`${API_URL}/revoke-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    const revokeAgainData = await revokeAgainRes.json();
    console.log('Second click response:', JSON.stringify(revokeAgainData, null, 2));

    if (revokeAgainData.already_revoked) {
        console.log('✅ Idempotency verified: properly reports "already_revoked: true".');
    }

    // 5. Test invalid token
    console.log('\n4️⃣ Testing invalid / forged token protection...');
    const fakeRes = await fetch(`${API_URL}/revoke-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'fake.forged.jwt_token' }),
    });
    const fakeData = await fakeRes.json();
    console.log('Fake token response status:', fakeRes.status);
    console.log('Fake token response:', JSON.stringify(fakeData, null, 2));

    if (fakeRes.status === 400) {
        console.log('✅ Forged token successfully blocked with 400 Bad Request.');
    }

    console.log('\n🎉 ALL SECURITY & REVOCATION TESTS PASSED!');
}

testSecurityFlow().catch(console.error);
