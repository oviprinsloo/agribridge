import { Router } from 'express';
import { listCrops, getCropById, createCrop, updateCrop, deleteCrop } from '../controllers/crop.controller';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/', listCrops);
router.get('/:id', getCropById);

router.post('/', authenticate, authorizeRole('ADMIN'), createCrop);
router.patch('/:id', authenticate, authorizeRole('ADMIN'), updateCrop);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), deleteCrop);

export default router;
