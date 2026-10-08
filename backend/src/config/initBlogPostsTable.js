import pool from './database.js';

export async function initBlogPostsTable() {
    try {
        console.log('📝 Initializing blog_posts table...');
        
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS blog_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                category VARCHAR(100) DEFAULT 'Campuna blogs',
                tags TEXT[] DEFAULT ARRAY[]::TEXT[],
                image_url TEXT,
                images TEXT[] DEFAULT ARRAY[]::TEXT[],
                author_name VARCHAR(100) DEFAULT 'Campuna Club',
                author_avatar TEXT DEFAULT '/logo.webp',
                read_time VARCHAR(50) DEFAULT '5 Min.',
                featured BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'published',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
            CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
        `);

        console.log('✅ blog_posts table verified.');
    } catch (err) {
        console.error('❌ Error initializing blog_posts table:', err.message);
    }
}

