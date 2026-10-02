import pool from './database.js';

export const initFeedbackTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'FEATURE', 'SUPPORT', 'ISSUE', 'COMMERCIAL'
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'REPLIED', 'RESOLVED'
                admin_note TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
            CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

            CREATE TABLE IF NOT EXISTS user_feedback_replies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                feedback_id UUID NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                sender_role VARCHAR(20) NOT NULL DEFAULT 'ADMIN', -- 'ADMIN', 'USER'
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_feedback_replies_feedback ON user_feedback_replies(feedback_id, created_at ASC);
            CREATE INDEX IF NOT EXISTS idx_feedback_replies_read ON user_feedback_replies(feedback_id, sender_role, is_read);

            -- Ensure is_favorite and priority columns exist for feature roadmap management
            ALTER TABLE user_feedback ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
            ALTER TABLE user_feedback ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
        `);
        console.log('✅ user_feedback and user_feedback_replies tables initialized successfully in PostgreSQL');
    } catch (err) {
        console.error('❌ Error initializing feedback tables:', err.message);
    }
};
