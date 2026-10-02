import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
    submitUserFeedback,
    getUserFeedbackList,
    getUserFeedbackDetail,
    replyToFeedbackUser
} from '../controllers/feedback.js';

const router = express.Router();

// User feedback endpoints (require authenticated user)
router.use(authenticate);

router.post('/feedback', submitUserFeedback);
router.get('/feedback', getUserFeedbackList);
router.get('/feedback/:id', getUserFeedbackDetail);
router.post('/feedback/:id/reply', replyToFeedbackUser);

export default router;
