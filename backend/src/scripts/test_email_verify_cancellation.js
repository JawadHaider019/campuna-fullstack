import 'dotenv/config';

async function testEmailVerificationFirstFlow() {
    const API_URL = 'http://localhost:5000/api/subscriptions';

    console.log('🧪 Starting "Email First -> Verify (Das war ich) -> Show Done" Test...\n');

    const testEmail = 'marketing@casamaki.de';

    // 1. Step 1: Request Cancellation Verification
    console.log(`1️⃣ Calling POST /request-verification for: ${testEmail}`);
    const reqRes = await fetch(`${API_URL}/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'CasaMaki Inhaber',
            email: testEmail,
            contract_type: 'BUSINESS_PLAN',
            cancellation_date_type: 'PERIOD_END',
            reason: 'Test verify first flow',
        }),
    });

    const reqData = await reqRes.json();
    console.log('Request Status:', reqRes.status);
    console.log('Request Response:', JSON.stringify(reqData, null, 2));

    if (!reqData.success) {
        console.error('❌ Step 1 failed!');
        process.exit(1);
    }

    console.log('✅ Verification email dispatched! (Transaction has NOT occurred yet)');

    // 2. Generate a token or check token confirmation
    // Let's create a token with jwt to simulate user clicking "Kündigung bestätigen (Das war ich)" in their email
    const jwt = (await import('jsonwebtoken')).default;
    const testToken = jwt.sign(
        {
            name: 'CasaMaki Inhaber',
            email: testEmail,
            contract_type: 'BUSINESS_PLAN',
            contract_number: 'SUB-167',
            cancellation_date_type: 'PERIOD_END',
            reason: 'Test verify first flow',
            action: 'CONFIRM_CANCELLATION',
        },
        process.env.JWT_SECRET || 'campuna_cancellation_revocation_secret_key',
        { expiresIn: '24h' }
    );

    console.log('\n2️⃣ User clicks "Kündigung bestätigen (Das war ich)" in their email...');
    console.log('Simulating POST /confirm-cancellation with verified token...');

    const confirmRes = await fetch(`${API_URL}/confirm-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken }),
    });

    const confirmData = await confirmRes.json();
    console.log('Confirm Status:', confirmRes.status);
    console.log('Confirm Response:', JSON.stringify(confirmData, null, 2));

    if (!confirmData.success || !confirmData.confirmation_number) {
        console.error('❌ Step 2 failed!');
        process.exit(1);
    }

    console.log('\n✅ 3️⃣ TRANSACTION OFFICIALLY COMPLETED & CONFIRMED:');
    console.log('• Vorgangsnummer:', confirmData.confirmation_number);
    console.log('• Wirksamkeit:', confirmData.effective_date);
    console.log('• E-Mail:', confirmData.email);
    console.log('• Email Verified Status:', confirmData.email_verified);

    console.log('\n🎉 ALL EMAIL-FIRST VERIFICATION TESTS PASSED!');
}

testEmailVerificationFirstFlow().catch(console.error);
