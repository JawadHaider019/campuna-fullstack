import { Router } from 'express';
import { moderateListingAI, generateListingDescriptionAI } from '../services/aiService.js';
import { optionalAuthenticate } from '../middleware/authenticate.js';

const router = Router();

/**
 * POST /api/ai/improve
 * Requires: title, category, condition, price, location, description (raw text)
 * Flow:
 * 1. Validate all required fields
 * 2. Moderate the raw description and attributes first
 * 3. If safe -> call Qwen3 AI (/nothink) to improve using ALL fields
 * 4. Return the professional German description
 */
router.post('/improve', optionalAuthenticate, async (req, res) => {
    try {
        const {
            title = '',
            category = '',
            subcategory = '',
            condition = '',
            price = '',
            location = '',
            description = '',
            rawDescription = '',
            existingDescription = ''
        } = req.body;

        const rawText = (description || rawDescription || existingDescription || '').trim();
        const cleanTitle = (title || '').trim();
        const cleanCategory = (category || '').trim();
        const cleanCondition = (condition || '').trim();
        const cleanLocation = (location || '').trim();
        const cleanPrice = price !== undefined && price !== null && String(price).trim() !== '' ? String(price).trim() : '';

        // Validation: All listed fields are required
        const missingFields = [];
        if (!cleanTitle) missingFields.push('Titel');
        if (!cleanCategory) missingFields.push('Kategorie');
        if (!cleanCondition) missingFields.push('Zustand');
        if (!cleanPrice) missingFields.push('Preis');
        if (!cleanLocation) missingFields.push('Standort');
        if (!rawText) missingFields.push('Beschreibung (Entwurf / Notizen)');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Bitte fülle zuerst alle erforderlichen Felder aus: ${missingFields.join(', ')}.`
            });
        }

        // 1. Moderate the raw description and fields first
        const moderationResult = await moderateListingAI({
            title: cleanTitle,
            category: cleanCategory,
            subcategory,
            condition: cleanCondition,
            price: cleanPrice,
            location: cleanLocation,
            description: rawText
        });

        if (!moderationResult.safe) {
            return res.status(422).json({
                success: false,
                error: moderationResult.reason || 'Die eingegebene Beschreibung verstößt gegen die Richtlinien und kann nicht verbessert werden.',
                moderation: moderationResult
            });
        }

        // 2. If safe -> Qwen3 improves it using ALL fields
        const aiResult = await generateListingDescriptionAI({
            title: cleanTitle,
            category: cleanCategory,
            subcategory,
            condition: cleanCondition,
            price: cleanPrice,
            location: cleanLocation,
            existingDescription: rawText
        });

        if (aiResult.success && aiResult.description) {
            return res.status(200).json({
                success: true,
                description: aiResult.description,
                source: 'QWEN3_AI'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Fehler bei der KI-Textverbesserung. Bitte versuche es erneut.'
        });
    } catch (error) {
        console.error('❌ /api/ai/improve error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Ein interner Fehler ist bei der Textverbesserung aufgetreten.'
        });
    }
});

export default router;
