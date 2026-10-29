import { Router } from 'express';
import {
  listOrders,
  getOrderById,
  confirmPickupByFarmer,
  confirmDeliveryByBuyer,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.post('/:id/confirm-pickup', confirmPickupByFarmer);
router.post('/:id/confirm-delivery', confirmDeliveryByBuyer);

export default router;
