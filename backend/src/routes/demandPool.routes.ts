import { Router } from 'express';
import {
  listDemandPools,
  getDemandPoolById,
  createDemandPool,
  joinDemandPool,
} from '../controllers/demandPool.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDemandPoolSchema, joinDemandPoolSchema } from '../validators';

const router = Router();

router.get('/', listDemandPools);
router.get('/:id', getDemandPoolById);

router.post('/', authenticate, authorizeRole('BUYER', 'ADMIN'), validate(createDemandPoolSchema), createDemandPool);
router.post('/:id/join', authenticate, authorizeRole('BUYER', 'ADMIN'), validate(joinDemandPoolSchema), joinDemandPool);

export default router;
