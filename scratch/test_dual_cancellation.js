async function testDualModeCancellation() {
    console.log('🧪 Testing Dual-Mode Cancellation API...');

    // 1. Test unauthenticated guest submission with IMMEDIATE
    try {
        const guestRes = await fetch('http://localhost:5000/api/subscriptions/public-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Unauthenticated Guest',
                email: 'guest.test@campuna.de',
                contract_type: 'BUSINESS_PLAN',
                cancellation_date_type: 'IMMEDIATE',
                reason: 'Test safety rule'
            })
        });

        const data = await guestRes.json();
        console.log('✅ Guest cancellation response:', {
            success: data.success,
            confirmation_number: data.confirmation_number,
            is_authenticated: data.is_authenticated,
            effective_date: data.effective_date,
            security_notice: data.security_notice ? 'Present (Fraud safeguard active)' : 'None'
        });
    } catch (err) {
        console.error('❌ Guest test error:', err.message);
    }
}

testDualModeCancellation();
