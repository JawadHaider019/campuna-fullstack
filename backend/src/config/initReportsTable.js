import pool from './database.js';

/**
 * Initializes and verifies the listing_reports table in PostgreSQL.
 * Used for storing user reports against listings with full moderation audit trail.
 */
export const initReportsTable = async () => {
    try {
        await pool.query(`
            -- 1. Create listing_reports table
            CREATE TABLE IF NOT EXISTS listing_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
                reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reason VARCHAR(50) NOT NULL,
                description TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
                reviewed_at TIMESTAMPTZ,
                admin_note TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_report_status CHECK (
                    status IN ('PENDING', 'REVIEWED', 'DISMISSED')
                ),
                CONSTRAINT chk_report_reason CHECK (
                    reason IN (
                        'SCAM',
                        'FALSE_INFORMATION',
                        'PROHIBITED_CONTENT',
                        'INAPPROPRIATE_IMAGE',
                        'WRONG_CATEGORY',
                        'NO_LONGER_AVAILABLE',
                        'OTHER'
                    )
                )
            );

            -- 2. Create unique index to prevent duplicate reports per user per listing
            CREATE UNIQUE INDEX IF NOT EXISTS unique_user_listing_report
                ON listing_reports(listing_id, reporter_id);

            -- 3. Create performance indexes
            CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON listing_reports(listing_id);
            CREATE INDEX IF NOT EXISTS idx_listing_reports_reporter_id ON listing_reports(reporter_id);
            CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);
            CREATE INDEX IF NOT EXISTS idx_listing_reports_created_at ON listing_reports(created_at DESC);
        `);
        console.log('✅ listing_reports table verified in PostgreSQL');
    } catch (err) {
        console.error('⚠️ listing_reports table initialization notice:', err.message);
    }
};

// Auto-run on import
initReportsTable();
