import pool from './database.js';

/**
 * Initializes and verifies the relational chat tables in PostgreSQL:
 * - conversations (listing-based conversations between buyer and seller)
 * - messages (individual messages within a conversation)
 */
export const initChatTables = async () => {
    try {
        await pool.query(`
            -- 1. Create conversations table
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
                buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_different_users CHECK (buyer_id <> seller_id),
                CONSTRAINT unique_listing_buyer_conversation UNIQUE (listing_id, buyer_id)
            );

            -- 2. Create indexes for conversations
            CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

            -- 3. Create messages table
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_message_content CHECK (length(trim(content)) > 0)
            );

            -- 4. Create indexes for messages
            CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
        `);
        console.log('✅ Conversations and Messages tables verified in PostgreSQL');
    } catch (err) {
        console.error('⚠️ Chat tables initialization notice:', err.message);
    }
};

// Auto-run on import
initChatTables();
