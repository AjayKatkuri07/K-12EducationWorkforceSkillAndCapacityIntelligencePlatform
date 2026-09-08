import { Router } from 'express';
import {
  getAssignments,
  getAssignmentById,
  compareCandidates,
  assignWorker,
  overrideAssignment
} from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/:id/compare', compareCandidates);
router.post('/:id/assign', assignWorker);
router.post('/:id/override', overrideAssignment);

export default router;
