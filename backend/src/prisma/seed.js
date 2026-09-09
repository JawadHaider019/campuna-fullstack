import { db } from './db.js';

async function seed() {
  console.log('🌱 Seeding plans...');
  try {
    const plans = [
      {
        name: 'FREE',
        price_cents: 0,
        listing_limit: 3,
        has_cover_image: true,
        has_spotlight: false,
        has_statistics: false,
        has_csv_import: false,
        description_limit: 500,
        is_active: true,
        description: 'Kostenloser Basiszugang – bis zu 3 aktive Anzeigen, 500 Zeichen Unternehmensbeschreibung.',
      },
      {
        name: 'BUSINESS',
        price_cents: 2900,
        listing_limit: -1,   // -1 = unlimited
        has_cover_image: true,
        has_spotlight: true,
        has_statistics: true,
        has_csv_import: true,
        description_limit: 1000,
        is_active: true,
        description: 'Professionelles Unternehmensprofil mit unbegrenzten Anzeigen, Spotlight, Statistiken und mehr.',
      },
    ];

    for (const plan of plans) {
      const existing = await db.orm.public.Plan
        .where((p) => p.name.eq(plan.name))
        .first();

      if (!existing) {
        await db.orm.public.Plan.create(plan);
        console.log(`  ✅ Plan "${plan.name}" created.`);
      } else {
        // Update feature flags in case they changed
        await db.orm.public.Plan
          .where((p) => p.name.eq(plan.name))
          .update({
            price_cents: plan.price_cents,
            listing_limit: plan.listing_limit,
            has_cover_image: plan.has_cover_image,
            has_spotlight: plan.has_spotlight,
            has_statistics: plan.has_statistics,
            has_csv_import: plan.has_csv_import,
            description_limit: plan.description_limit,
            description: plan.description,
          });
        console.log(`  ♻️  Plan "${plan.name}" already exists — updated.`);
      }
    }

    console.log('✅ Seeding finished.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
