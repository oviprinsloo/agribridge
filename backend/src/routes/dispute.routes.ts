import { Router } from 'express';
import { listDisputes, createDispute, resolveDispute } from '../controllers/dispute.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDisputeSchema, resolveDisputeSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', listDisputes);
router.post('/', validate(createDisputeSchema), createDispute);
router.patch('/:id/resolve', authorizeRole('ADMIN'), validate(resolveDisputeSchema), resolveDispute);

export default router;
