import { db } from '../prisma/db.js';

/**
 * Checks if a user is eligible for the Campuna Pioneer Badge and awards it if so.
 * Conditions: Email is verified AND user has >= 3 APPROVED listings.
 * Capped at the first 300 qualified users.
 *
 * @param {string} userId - The UUID of the user
 * @returns {Promise<{success: boolean, badge?: object, newlyAwarded?: boolean, alreadyAwarded?: boolean, error?: string}>}
 */
export const checkAndAwardPioneerBadge = async (userId) => {
    try {
        // 1. Fetch user and check if profile is complete
        const user = await db.orm.public.User
            .where({ id: userId })
            .first();

        if (!user) {
            console.log(`[Badge] User ${userId} not found`);
            return { success: false, error: 'Benutzer nicht gefunden.' };
        }

        if (!user.email_verified) {
            return { success: false, error: 'Die E-Mail-Adresse muss vor der Pioneer-Auszeichnung verifiziert sein.' };
        }

        let isProfileComplete = false;
        if (user.user_type === 'PRIVATE') {
            const profile = await db.orm.public.PrivateProfile
                .where({ user_id: userId })
                .first();
            if (profile && 
                profile.first_name && profile.first_name.trim() !== '' &&
                profile.last_name && profile.last_name.trim() !== '' &&
                profile.bio && profile.bio.trim() !== '' &&
                profile.location && profile.location.trim() !== ''
            ) {
                isProfileComplete = true;
            }
        } else if (user.user_type === 'COMMERCIAL') {
            const profile = await db.orm.public.CompanyProfile
                .where({ user_id: userId })
                .first();
            if (profile && 
                profile.company_name && profile.company_name.trim() !== '' &&
                profile.bio && profile.bio.trim().length >= 20 &&
                (profile.location?.trim() || profile.company_address?.trim()) &&
                profile.logo_url && profile.logo_url.trim() !== '' &&
                profile.phone && profile.phone.trim() !== ''
            ) {
                isProfileComplete = true;
            }
        }

        if (!isProfileComplete) {
            return { 
                success: false, 
                error: user.user_type === 'COMMERCIAL'
                    ? 'Unternehmensprofil ist unvollständig (Firmenname, Logo, Beschreibung ab 20 Zeichen, Telefon und Standort erforderlich).'
                    : 'Profil ist unvollständig. Bitte Vorname, Nachname, Info und Standort ausfüllen.' 
            };
        }

        // 2. Count active approved listings owned by the user (status = 'APPROVED')
        const approvedListings = await db.orm.public.Listing
            .where({ user_id: userId, status: 'APPROVED' })
            .all();
        const approvedListingsCount = approvedListings.length;

        if (approvedListingsCount < 3) {
            return { success: false, error: 'Nicht genügend freigegebene Inserate (mindestens 3 erforderlich).' };
        }

        // 3. Check if user already has the CAMPUNA_PIONEER badge
        const existingAchievement = await db.orm.public.UserAchievement
            .where({ user_id: userId, badge_key: 'CAMPUNA_PIONEER' })
            .first();

        if (existingAchievement) {
            return { success: true, badge: existingAchievement, alreadyAwarded: true };
        }

        // 4. Check global limit (first 300 users)
        const existingPioneers = await db.orm.public.UserAchievement
            .where({ badge_key: 'CAMPUNA_PIONEER' })
            .all();
        const totalPioneersCount = existingPioneers.length;

        if (totalPioneersCount >= 300) {
            return { success: false, error: 'Das Limit von 300 Pioneer-Auszeichnungen wurde bereits erreicht.' };
        }

        // 5. Award the badge + 1,000 CC one-time reward!
        const position = totalPioneersCount + 1;
        const newAchievement = await db.orm.public.UserAchievement.create({
            user_id: userId,
            badge_key: 'CAMPUNA_PIONEER',
            position
        });

        // Award 1,000 Campuna Credits one-time reward into the ledger
        await db.orm.public.CreditTransaction.create({
            user_id: userId,
            amount: 1000,
            type: 'PIONEER_REWARD',
            description: `Campuna Pioneer Auszeichnung Einmal-Bonus (#${position}) (+1.000 CC)`,
        }).catch((txErr) => {
            console.error('⚠️ [Badge] Could not record pioneer CC reward:', txErr.message);
        });

        console.log(`🏆 [Badge] CAMPUNA_PIONEER badge successfully awarded to user ${userId} at position #${position} with 1,000 CC bonus!`);
        return { success: true, badge: newAchievement, newlyAwarded: true };

    } catch (err) {
        console.error('❌ checkAndAwardPioneerBadge error:', err.message);
        return { success: false, error: err.message };
    }
};

