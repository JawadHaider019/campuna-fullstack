import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from './contract.json' with { type: 'json' };

let dbInstance = null;

try {
  dbInstance = postgres({
    contractJson,
    url: process.env['DATABASE_URL'],
  });

  // Verify database connection at startup
  if (dbInstance?.orm?.public?.User) {
    dbInstance.orm.public.User.first()
      .then(() => {
        console.log('✅ Database connected successfully (via Prisma)');
      })
      .catch((err) => {
        console.error('❌ Database connection failure (via Prisma):', err.message);
      });
  }
} catch (err) {
  console.error('⚠️ Warning: Prisma ORM initialization failed:', err.message);
  // Provide a safe fallback mock to avoid crashing startup
  dbInstance = {
    orm: { public: {} },
    transaction: async (cb) => {
      console.warn('Prisma transaction fallback invoked.');
      return cb(dbInstance);
    }
  };
}

export const db = dbInstance;
