import { Router } from 'express';
import { createPaymentIntent, processMockPayment, getTransactions } from '../controllers/payment.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { mockPaymentCheckoutSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.post('/intent', authorizeRole('BUYER', 'ADMIN'), createPaymentIntent);
router.post('/mock-checkout', authorizeRole('BUYER', 'ADMIN'), validate(mockPaymentCheckoutSchema), processMockPayment);
router.get('/transactions', getTransactions);

export default router;
