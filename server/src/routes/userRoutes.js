import { Router } from 'express';
import { getUsers, createUser, updateUserStatus, updateUserRole } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.post('/', authorizeRoles('HRAdmin'), createUser);
router.patch('/:id/status', authorizeRoles('HRAdmin'), updateUserStatus);
router.patch('/:id/role', authorizeRoles('HRAdmin'), updateUserRole);

export default router;
