import { Router } from 'express';
import { listSchemes, checkEligibility, createScheme, updateScheme } from '../controllers/scheme.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { schemeEligibilityCheckSchema } from '../validators';

const router = Router();

router.get('/', listSchemes);
router.post('/check-eligibility', validate(schemeEligibilityCheckSchema), checkEligibility);
router.post('/', authenticate, authorizeRole('ADMIN'), createScheme);
router.patch('/:id', authenticate, authorizeRole('ADMIN'), updateScheme);

export default router;
