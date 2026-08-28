import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres({
  contractJson,
  url: process.env['DATABASE_URL'],
});

// Verify database connection at startup
db.orm.public.User.first()
  .then(() => {
    console.log('✅ Database connected successfully (via Prisma)');
  })
  .catch((err) => {
    console.error('❌ Database connection failure (via Prisma):', err.message);
  });

