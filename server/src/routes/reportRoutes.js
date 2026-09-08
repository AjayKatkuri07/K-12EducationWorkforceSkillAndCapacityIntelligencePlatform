import { Router } from 'express';
import { getInventoryReport, exportCSV } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/inventory', getInventoryReport);
router.get('/export/csv', exportCSV);

export default router;
