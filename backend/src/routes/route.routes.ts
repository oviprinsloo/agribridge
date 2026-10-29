import { Router } from 'express';
import {
  getRouteByOrderId,
  calculateAdHocRoute,
  updateStopStatus,
} from '../controllers/route.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/order/:orderId', authenticate, getRouteByOrderId);
router.post('/optimize', authenticate, calculateAdHocRoute);
router.patch('/stops/:stopId', authenticate, updateStopStatus);

export default router;
