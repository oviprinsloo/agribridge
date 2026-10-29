import { Router } from 'express';
import {
  listSupplyPools,
  getSupplyPoolById,
  createSupplyPool,
  joinSupplyPool,
} from '../controllers/supplyPool.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSupplyPoolSchema, joinSupplyPoolSchema } from '../validators';

const router = Router();

// Publicly readable or authenticated
router.get('/', listSupplyPools);
router.get('/:id', getSupplyPoolById);

router.post('/', authenticate, authorizeRole('FARMER', 'ADMIN'), validate(createSupplyPoolSchema), createSupplyPool);
router.post('/:id/join', authenticate, authorizeRole('FARMER', 'ADMIN'), validate(joinSupplyPoolSchema), joinSupplyPool);

export default router;
