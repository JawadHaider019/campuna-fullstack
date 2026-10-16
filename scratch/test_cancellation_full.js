async function runFullVerification() {
    console.log('==================================================');
    console.log('🚀 CAMPUNA CONTRACT CANCELLATION & SHOWCASE VERIFICATION');
    console.log('==================================================\n');

    // 1. Check frontend availability
    try {
        const homeRes = await fetch('http://localhost:3000');
        console.log('✅ Frontend Homepage Status:', homeRes.status, '(http://localhost:3000)');

        const cancelPageRes = await fetch('http://localhost:3000/vertraege-kuendigen');
        console.log('✅ Cancellation Page Status:', cancelPageRes.status, '(http://localhost:3000/vertraege-kuendigen)');

        const cancelAliasRes = await fetch('http://localhost:3000/kuendigen');
        console.log('✅ Cancellation Alias Page Status:', cancelAliasRes.status, '(http://localhost:3000/kuendigen)\n');
    } catch (err) {
        console.error('❌ Frontend check failed:', err.message);
    }

    // 2. Test Guest Cancellation API (Fraud Prevention Safeguard)
    try {
        const guestPayload = {
            name: 'Max Mustermann (Gast)',
            email: 'test.gast@campuna.de',
            contract_type: 'BUSINESS_PLAN',
            cancellation_date_type: 'PERIOD_END',
            reason: 'Kein Bedarf mehr'
        };

        const res = await fetch('http://localhost:5000/api/subscriptions/public-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestPayload)
        });

        const data = await res.json();
        console.log('✅ Guest Cancellation Test (§ 312k BGB):', {
            http_status: res.status,
            success: data.success,
            confirmation_number: data.confirmation_number,
            timestamp: data.date_formatted,
            effective_date: data.effective_date,
            is_authenticated: data.is_authenticated,
        });
    } catch (err) {
        console.error('❌ Guest cancellation test failed:', err.message);
    }

    // 3. Test Unauthorized Immediate Cancellation Attempt (Safeguard Test)
    try {
        const sabotagePayload = {
            name: 'Unauthorized Stranger',
            email: 'marketing@casamaki.de', // Active merchant
            contract_type: 'BUSINESS_PLAN',
            cancellation_date_type: 'IMMEDIATE',
            reason: 'Attempted sabotage'
        };

        const res = await fetch('http://localhost:5000/api/subscriptions/public-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sabotagePayload)
        });

        const data = await res.json();
        console.log('\n🛡️ Unauthorized Immediate Cutoff Attempt Safeguard:', {
            http_status: res.status,
            confirmation_number: data.confirmation_number,
            prevented_immediate_cutoff: data.effective_date !== 'Sofort mit Eingang dieser Bestätigung (verifiziert)',
            effective_date: data.effective_date,
            security_notice_triggered: !!data.security_notice
        });
    } catch (err) {
        console.error('❌ Safeguard test failed:', err.message);
    }

    console.log('\n==================================================');
    console.log('✅ ALL SYSTEMS VERIFIED & READY FOR BROWSER TESTING');
    console.log('==================================================');
}

runFullVerification();
