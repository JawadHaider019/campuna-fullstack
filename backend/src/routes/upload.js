import { Router } from 'express';
import { uploadSingle } from '../middleware/upload.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// POST /api/upload/image
// Multi-part form-data: key must be 'image'
router.post('/image', authenticate, uploadSingle, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen.' });
        }

        // Generate full URL
        const PORT = process.env.PORT || 5000;
        const host = req.protocol + '://' + req.hostname + (PORT ? `:${PORT}` : '');
        const fileUrl = `${host}/uploads/${req.file.filename}`;

        return res.status(200).json({
            success: true,
            message: 'Bild erfolgreich hochgeladen.',
            url: fileUrl
        });
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        return res.status(500).json({ success: false, error: 'Upload fehlgeschlagen.' });
    }
});

export default router;
