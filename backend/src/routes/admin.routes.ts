import { Router } from 'express';
import { getAdminMetrics, listUsers, toggleUserStatus, verifyUser } from '../controllers/admin.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

router.get('/metrics', getAdminMetrics);
router.get('/users', listUsers);
router.patch('/users/:userId/status', toggleUserStatus);
router.patch('/users/:userId/verify', verifyUser);

export default router;
