import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.js';

const router = Router();

// POST /api/contact
router.post('/contact', submitContactForm);
// POST /api/kontakt (German alias)
router.post('/kontakt', submitContactForm);

export default router;
