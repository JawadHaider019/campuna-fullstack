import pool from '../config/database.js';

async function updateAuthors() {
    try {
        const res = await pool.query("UPDATE blog_posts SET author_name = 'Campuna Club'");
        console.log(`Successfully updated ${res.rowCount} blog posts to author_name = 'Campuna Club'`);
        process.exit(0);
    } catch (err) {
        console.error('Error updating authors:', err);
        process.exit(1);
    }
}

updateAuthors();
