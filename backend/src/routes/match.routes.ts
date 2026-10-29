import { Router } from 'express';
import {
  getMatchesForRequirement,
  getMatchesForSupplyPool,
  createMatchProposal,
  acceptMatchAndGenerateOrder,
} from '../controllers/match.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/requirement/:requirementId', getMatchesForRequirement);
router.get('/supply-pool/:poolId', getMatchesForSupplyPool);
router.post('/propose', createMatchProposal);
router.post('/:matchId/accept', acceptMatchAndGenerateOrder);

export default router;
