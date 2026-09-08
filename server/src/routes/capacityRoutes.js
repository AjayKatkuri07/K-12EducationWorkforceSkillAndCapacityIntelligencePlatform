import { Router } from 'express';
import { getCapacityOverview, getForecasts, generateForecast } from '../controllers/capacityController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getCapacityOverview);
router.get('/forecasts', getForecasts);
router.post('/forecasts/generate', generateForecast);

export default router;
