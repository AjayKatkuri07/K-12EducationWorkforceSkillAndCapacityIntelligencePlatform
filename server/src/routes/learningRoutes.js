import { Router } from 'express';
import { getLearningPaths, enrollWorker, updateProgress } from '../controllers/learningController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/paths', getLearningPaths);
router.post('/paths/enroll', enrollWorker);
router.patch('/paths/:id/progress', updateProgress);

export default router;
