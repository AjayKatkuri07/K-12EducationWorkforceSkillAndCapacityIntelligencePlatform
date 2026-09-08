import { Router } from 'express';
import { getAuditLogs, getSystemConfig, updateSystemConfig } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/logs', authorizeRoles('HRAdmin', 'WorkforcePlanner'), getAuditLogs);
router.get('/config', getSystemConfig);
router.put('/config', authorizeRoles('HRAdmin'), updateSystemConfig);

export default router;
