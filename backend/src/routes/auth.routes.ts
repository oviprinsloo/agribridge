import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, updateLanguage } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
router.patch('/language', authenticate, updateLanguage);

export default router;
