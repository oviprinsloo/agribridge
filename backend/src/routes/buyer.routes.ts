import { Router } from 'express';
import {
  getBuyerDashboard,
  listRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
} from '../controllers/buyer.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPurchaseRequirementSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorizeRole('BUYER', 'ADMIN'), getBuyerDashboard);
router.get('/requirements', authorizeRole('BUYER', 'ADMIN'), listRequirements);
router.post('/requirements', authorizeRole('BUYER', 'ADMIN'), validate(createPurchaseRequirementSchema), createRequirement);
router.patch('/requirements/:id', authorizeRole('BUYER', 'ADMIN'), updateRequirement);
router.delete('/requirements/:id', authorizeRole('BUYER', 'ADMIN'), deleteRequirement);

export default router;
