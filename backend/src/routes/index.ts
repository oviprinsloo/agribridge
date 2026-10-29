import { Router } from 'express';
import authRoutes from './auth.routes';
import farmerRoutes from './farmer.routes';
import buyerRoutes from './buyer.routes';
import cropRoutes from './crop.routes';
import supplyPoolRoutes from './supplyPool.routes';
import demandPoolRoutes from './demandPool.routes';
import matchRoutes from './match.routes';
import orderRoutes from './order.routes';
import routeRoutes from './route.routes';
import marketRoutes from './market.routes';
import schemeRoutes from './scheme.routes';
import paymentRoutes from './payment.routes';
import disputeRoutes from './dispute.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/buyers', buyerRoutes);
router.use('/crops', cropRoutes);
router.use('/supply-pools', supplyPoolRoutes);
router.use('/demand-pools', demandPoolRoutes);
router.use('/matches', matchRoutes);
router.use('/orders', orderRoutes);
router.use('/routes', routeRoutes);
router.use('/market', marketRoutes);
router.use('/schemes', schemeRoutes);
router.use('/payments', paymentRoutes);
router.use('/disputes', disputeRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    message: 'AgriBridge API operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Database readiness check endpoint
router.get('/health/ready', async (req, res) => {
  try {
    const prisma = (await import('../config/database')).default;
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
