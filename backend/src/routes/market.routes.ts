import { Router } from 'express';
import { getMarketPrices, getMarketTrends, getMarketDemand } from '../controllers/market.controller';

const router = Router();

router.get('/prices', getMarketPrices);
router.get('/trends', getMarketTrends);
router.get('/demand', getMarketDemand);

export default router;
