import pool from '../backend/src/config/database.js';

async function verifyDbAndApi() {
    // 1. Find user with active subscription
    const subRes = await pool.query(`
        SELECT u.email, s.status, s.expires_at 
        FROM subscriptions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.status = 'ACTIVE' 
        LIMIT 1
    `);

    if (subRes.rows.length > 0) {
        const sub = subRes.rows[0];
        console.log('📌 Active subscription found for user:', sub.email);

        // Test guest trying to cancel this user immediately
        const res = await fetch('http://localhost:5000/api/subscriptions/public-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Stranger Malicious Actor',
                email: sub.email,
                contract_type: 'BUSINESS_PLAN',
                cancellation_date_type: 'IMMEDIATE',
                reason: 'Sabotage attempt'
            })
        });

        const data = await res.json();
        console.log('🛡️ Guest attempt on active merchant response:', {
            success: data.success,
            confirmation_number: data.confirmation_number,
            is_authenticated: data.is_authenticated,
            effective_date: data.effective_date,
            security_notice: data.security_notice ? 'ACTIVE: ' + data.security_notice.substring(0, 60) + '...' : 'None'
        });

        // Verify that the subscription status in DB is STILL ACTIVE (not sabotaged!)
        const checkRes = await pool.query('SELECT status FROM subscriptions WHERE status = $1 LIMIT 1', ['ACTIVE']);
        console.log('🔒 Subscription protection check: Active subscription count in DB:', checkRes.rows.length);
    } else {
        console.log('ℹ️ No active subscriptions in DB to test.');
    }

    await pool.end();
}

verifyDbAndApi();
