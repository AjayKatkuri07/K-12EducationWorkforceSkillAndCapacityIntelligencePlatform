import { Router } from 'express';
import { login, getMe, switchRoleDemo } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/switch-role', switchRoleDemo);

export default router;
