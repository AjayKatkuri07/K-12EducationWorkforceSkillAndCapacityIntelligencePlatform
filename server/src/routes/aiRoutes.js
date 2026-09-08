import { Router } from 'express';
import {
  extractSkills,
  forecastCapacityEndpoint,
  matchCandidatesEndpoint,
  calculateBurnoutSignals
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/extract-skills', extractSkills);
router.post('/forecast', forecastCapacityEndpoint);
router.post('/match-candidates', matchCandidatesEndpoint);
router.get('/burnout-signals', calculateBurnoutSignals);

export default router;
