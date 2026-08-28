import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Use explicit credentials with fallback to ensure password is always a valid string for pg SCRAM auth
const pool = new Pool({
    user: String(process.env.DB_USER || 'postgres'),
    host: String(process.env.DB_HOST || 'localhost'),
    database: String(process.env.DB_NAME || 'Campuna'),
    password: String(process.env.DB_PASSWORD || ''),
    port: Number(process.env.DB_PORT) || 5432,
});

// Test database connection and log status
pool.connect()
    .then((client) => {
        console.log('✅ Database connected successfully');
        client.release();
    })
    .catch((err) => {
        console.error('❌ Database connection failure:', err.message);
    });

export default pool;