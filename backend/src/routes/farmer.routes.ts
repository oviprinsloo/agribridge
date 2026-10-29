import { Router } from 'express';
import {
  getFarmerDashboard,
  listProduce,
  addProduce,
  updateProduce,
  deleteProduce,
  getFarms,
  createFarm,
} from '../controllers/farmer.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFarmerCropSchema, updateFarmerCropSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorizeRole('FARMER', 'ADMIN'), getFarmerDashboard);
router.get('/produce', authorizeRole('FARMER', 'ADMIN'), listProduce);
router.post('/produce', authorizeRole('FARMER', 'ADMIN'), validate(createFarmerCropSchema), addProduce);
router.patch('/produce/:id', authorizeRole('FARMER', 'ADMIN'), validate(updateFarmerCropSchema), updateProduce);
router.delete('/produce/:id', authorizeRole('FARMER', 'ADMIN'), deleteProduce);

router.get('/farms', authorizeRole('FARMER', 'ADMIN'), getFarms);
router.post('/farms', authorizeRole('FARMER', 'ADMIN'), createFarm);

export default router;
