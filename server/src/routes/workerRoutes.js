import { Router } from 'express';
import {
  getWorkers,
  getWorkerById,
  updateWorker,
  addCertification,
  getSkillTaxonomy
} from '../controllers/workerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getWorkers);
router.get('/taxonomy', getSkillTaxonomy);
router.get('/:id', getWorkerById);
router.put('/:id', updateWorker);
router.post('/:id/certifications', addCertification);

export default router;
