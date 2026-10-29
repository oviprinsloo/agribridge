import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { paymentService } from '../services/payment.service';

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.body;
    const buyerProfileId = req.user?.buyerProfileId;

    if (!buyerProfileId) {
      res.status(403).json({ success: false, message: 'Buyer profile required to initiate payment.' });
      return;
    }

    const intent = await paymentService.createPaymentIntent(orderId, buyerProfileId);
    res.status(200).json({ success: true, data: intent });
  } catch (error: any) {
    next(error);
  }
};

export const processMockPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId, paymentMethod, upiId } = req.body;
    const buyerUserId = req.user?.userId;

    if (!buyerUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await paymentService.processMockPayment({
      orderId,
      buyerUserId,
      paymentMethod,
      upiId,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and held in platform escrow.',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.OR = [
        { fromUserId: user.userId },
        { toUserId: user.userId },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        order: {
          include: { crop: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};
