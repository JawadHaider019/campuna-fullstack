import { db } from './db.js';

async function seed() {
  console.log('Seeding plans...');
  try {
    const plans = [
      { name: 'FREE', price_monthly: 0, description: 'Permanently free listing tier' },
      { name: 'BUSINESS', price_monthly: 2900, description: 'Professional tier with spotlight and cover images' }
    ];

    for (const plan of plans) {
      const existing = await db.orm.public.Plan.where(p => p.name.eq(plan.name)).first();
      if (!existing) {
        await db.orm.public.Plan.create(plan);
        console.log(`Plan ${plan.name} created.`);
      } else {
        console.log(`Plan ${plan.name} already exists.`);
      }
    }
    console.log('Seeding finished.');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

seed();
