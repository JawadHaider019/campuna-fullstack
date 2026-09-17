import pool from './database.js';

export const initBroadcastsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS broadcasts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                target_type VARCHAR(20) NOT NULL DEFAULT 'ALL', -- 'ALL', 'PRIVATE', 'COMMERCIAL'
                priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'IMPORTANT', 'URGENT'
                action_url TEXT,
                action_label VARCHAR(100),
                created_by UUID,
                is_active BOOLEAN DEFAULT TRUE,
                published_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_broadcasts_target_active ON broadcasts(target_type, is_active, published_at);
            CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);

            CREATE TABLE IF NOT EXISTS broadcast_reads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                read_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(broadcast_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_broadcast_reads_user ON broadcast_reads(user_id, broadcast_id);
            CREATE INDEX IF NOT EXISTS idx_broadcast_reads_broadcast ON broadcast_reads(broadcast_id);
        `);
        console.log('✅ Broadcasts & broadcast_reads tables initialized successfully in PostgreSQL');
    } catch (err) {
        console.error('❌ Error initializing broadcasts tables:', err.message);
    }
};
