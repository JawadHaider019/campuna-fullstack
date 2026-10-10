import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanDuplicates() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find duplicates by title and user_id
    const dupsQuery = `
      SELECT id, title, user_id, created_at,
             ROW_NUMBER() OVER (
               PARTITION BY title, user_id 
               ORDER BY 
                 CASE WHEN EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = listings.id) THEN 0 ELSE 1 END,
                 created_at ASC, 
                 id ASC
             ) as rn
      FROM listings
    `;

    const allListings = await client.query(dupsQuery);
    const toDelete = allListings.rows.filter(r => r.rn > 1).map(r => r.id);
    const toKeep = allListings.rows.filter(r => r.rn == 1);

    console.log('Total listings before:', allListings.rows.length);
    console.log('Unique listings to keep:', toKeep.length);
    console.log('Duplicate listings to remove:', toDelete.length);

    if (toDelete.length > 0) {
      // 1. Delete associated listing_moderation records for duplicate listings
      const delMod = await client.query('DELETE FROM listing_moderation WHERE listing_id = ANY($1::uuid[])', [toDelete]);
      console.log('Deleted listing_moderation rows:', delMod.rowCount);

      // 2. Delete duplicate favorites if any
      try {
        await client.query('DELETE FROM favorites WHERE listing_id = ANY($1::uuid[])', [toDelete]);
      } catch (e) {}

      // 3. Delete the duplicate listings
      const delListings = await client.query('DELETE FROM listings WHERE id = ANY($1::uuid[])', [toDelete]);
      console.log('Deleted duplicate listings rows:', delListings.rowCount);
    }

    await client.query('COMMIT');

    const finalCount = await client.query('SELECT COUNT(*) FROM listings');
    console.log('Final total listings in DB:', finalCount.rows[0].count);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanDuplicates();
