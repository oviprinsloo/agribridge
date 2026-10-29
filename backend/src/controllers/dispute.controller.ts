import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { notificationService } from '../services/notification.service';

export const listDisputes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.raisedById = user.userId;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        order: { include: { crop: true } },
        raisedBy: { select: { id: true, name: true, role: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

export const createDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raisedById = req.user?.userId;
    if (!raisedById) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { orderId, reasonCategory, description, evidenceUrls } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        raisedById,
        reasonCategory,
        description,
        evidenceUrlsJson: JSON.stringify(evidenceUrls || []),
        status: 'OPEN',
      },
      include: {
        order: true,
        raisedBy: { select: { name: true } },
      },
    });

    // Mark order status to DISPUTED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTED' },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await notificationService.notifyMultiple(
      admins.map((a) => a.id),
      'New Dispute Raised ⚠️',
      `Order #${order.orderNumber} has been disputed for: ${reasonCategory}. Review required.`,
      'DISPUTE',
      `/admin/disputes`
    );

    res.status(201).json({
      success: true,
      message: 'Dispute submitted. Admin team will review evidence.',
      data: dispute,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const resolvedById = req.user?.userId;
    const { status, resolutionNotes } = req.body;

    const dispute: any = await prisma.dispute.update({
      where: { id: String(id) },
      data: {
        status,
        resolutionNotes,
        resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        order: true,
      },
    });

    // Restore order status to COMPLETED or CANCELLED based on resolution
    const nextOrderStatus = status === 'RESOLVED' ? 'COMPLETED' : 'CANCELLED';
    await prisma.order.update({
      where: { id: dispute.orderId },
      data: { status: nextOrderStatus },
    });

    await notificationService.sendNotification({
      userId: dispute.raisedById,
      title: `Dispute ${status} 📋`,
      message: `Your dispute on Order #${dispute.order.orderNumber} has been ${status.toLowerCase()}: ${resolutionNotes}`,
      type: 'DISPUTE',
      actionUrl: `/farmer/orders/${dispute.orderId}`,
    });

    res.status(200).json({
      success: true,
      message: 'Dispute resolution recorded',
      data: dispute,
    });
  } catch (error) {
    next(error);
  }
};
