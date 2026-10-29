import { Router } from 'express';
import { askAssistant } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiAssistantQuerySchema } from '../validators';

const router = Router();

// Allow authenticated users to get tailored responses, or public visitors with session
router.post('/assistant', validate(aiAssistantQuerySchema), (req, res, next) => {
  // Optional auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authenticate(req, res, () => askAssistant(req, res, next));
  } else {
    askAssistant(req, res, next);
  }
});

export default router;
