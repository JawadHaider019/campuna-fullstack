import { sendContactEmail } from '../services/email.services.js';

/**
 * POST /api/contact (or /api/kontakt)
 * Handles incoming contact form inquiries and forwards them via Brevo
 */
export const submitContactForm = async (req, res) => {
    try {
        const { name, email, topic, subject, message, phone } = req.body;

        if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Bitte fülle Name, E-Mail-Adresse und Nachricht aus.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                error: 'Bitte gib eine gültige E-Mail-Adresse ein.'
            });
        }

        await sendContactEmail({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            topic: topic || 'general',
            subject: subject ? subject.trim() : '',
            message: message.trim(),
            phone: phone ? phone.trim() : undefined,
        });

        console.log(`📬 [Contact Form] Inquiry received from ${name.trim()} (${email.trim()})`);

        return res.status(200).json({
            success: true,
            message: 'Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt. Wir melden uns zeitnah bei dir.'
        });
    } catch (error) {
        console.error('❌ Contact submission error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Beim Versenden der Nachricht ist ein Fehler aufgetreten. Bitte versuche es später erneut oder kontaktiere uns direkt per E-Mail.'
        });
    }
};
