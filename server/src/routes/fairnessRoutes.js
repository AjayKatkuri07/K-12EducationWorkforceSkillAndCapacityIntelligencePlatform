import { Router } from 'express';
import { getFairnessReviews, submitFairnessDecision } from '../controllers/fairnessController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/reviews', getFairnessReviews);
router.post('/reviews/:id/decision', submitFairnessDecision);

export default router;
