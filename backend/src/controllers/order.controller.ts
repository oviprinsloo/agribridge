import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { paymentService } from '../services/payment.service';
import { notificationService } from '../services/notification.service';

export const listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { status, cropId } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (cropId) where.cropId = String(cropId);

    if (user.role === 'BUYER' && user.buyerProfileId) {
      where.buyerProfileId = user.buyerProfileId;
    } else if (user.role === 'FARMER' && user.farmerProfileId) {
      where.items = {
        some: { farmerProfileId: user.farmerProfileId },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        crop: true,
        buyerProfile: { include: { user: { select: { name: true, phone: true } } } },
        supplyPool: true,
        pickupRoute: { include: { stops: true } },
        delivery: true,
        payment: true,
        items: {
          include: {
            farmerProfile: { include: { user: { select: { name: true, phone: true } } } },
            farm: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        crop: true,
        buyerProfile: { include: { user: { select: { name: true, phone: true, email: true } } } },
        supplyPool: {
          include: {
            members: {
              include: { farmerProfile: { include: { user: { select: { name: true, phone: true } } } } },
            },
          },
        },
        pickupRoute: {
          include: {
            stops: {
              orderBy: { stopSequence: 'asc' },
              include: { farm: true },
            },
          },
        },
        delivery: true,
        payment: { include: { transactions: true } },
        transactions: true,
        items: {
          include: {
            farmerProfile: { include: { user: { select: { name: true, phone: true } } } },
            farm: true,
          },
        },
        disputes: {
          include: { raisedBy: { select: { name: true } } },
        },
        reviews: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const confirmPickupByFarmer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.id as string;
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile required.' });
      return;
    }

    const order: any = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: {
        items: true,
        pickupRoute: { include: { stops: true } },
        buyerProfile: { include: { user: true } },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Verify farmer is part of this order
    const farmerItem = order.items?.find((i: any) => i.farmerProfileId === farmerProfileId);
    if (!farmerItem && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You are not a contributor to this order.' });
      return;
    }

    // Update stop status if farm match found
    if (order.pickupRoute && farmerItem) {
      await prisma.pickupStop.updateMany({
        where: {
          pickupRouteId: order.pickupRoute.id,
          farmId: farmerItem.farmId,
        },
        data: {
          status: 'LOADED',
          collectedQuantityKg: farmerItem.quantity,
          pickupTimestamp: new Date(),
        },
      });

      await prisma.orderItem.update({
        where: { id: farmerItem.id },
        data: { status: 'PICKED_UP' },
      });
    }

    // Check if all stops have been picked up
    const remainingStops = await prisma.pickupStop.count({
      where: {
        pickupRouteId: order.pickupRoute?.id,
        status: { in: ['PENDING', 'ARRIVED'] },
      },
    });

    const isAllLoaded = remainingStops === 0;
    const newOrderStatus = isAllLoaded ? 'IN_TRANSIT' : 'PICKUP_SCHEDULED';

    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        farmerPickupConfirmed: true,
        status: newOrderStatus,
      },
      include: {
        pickupRoute: { include: { stops: true } },
        items: true,
      },
    });

    // Notify Buyer
    if (order.buyerProfile?.userId) {
      await notificationService.sendNotification({
        userId: order.buyerProfile.userId,
        title: isAllLoaded ? 'Produce In Transit 🚛' : 'Farm Pickup Confirmed',
        message: isAllLoaded
          ? `All farmer produce for Order #${order.orderNumber} is collected and on its way to your destination!`
          : `A farmer on the pickup route has confirmed dispatch for Order #${order.orderNumber}.`,
        type: 'PICKUP',
        actionUrl: `/buyer/orders/${order.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: isAllLoaded ? 'All produce collected! Vehicle is now in transit.' : 'Farm pickup confirmed.',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmDeliveryByBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.id as string;
    const buyerProfileId = req.user?.buyerProfileId;

    const order: any = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: {
        items: { include: { farmerProfile: { include: { user: true } } } },
        delivery: true,
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.buyerProfileId !== buyerProfileId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized: Order belongs to another buyer.' });
      return;
    }

    // Update Delivery status
    if (order.delivery) {
      await prisma.delivery.update({
        where: { id: order.delivery.id },
        data: {
          status: 'DELIVERED',
          actualDeliveryDate: new Date(),
        },
      });
    }

    // Determine order next status
    const isPaid = order.payment?.status === 'SUCCESS' || order.payment?.status === 'HELD_IN_ESCROW';
    const nextStatus = isPaid ? 'COMPLETED' : 'PAYMENT_PENDING';

    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        buyerDeliveryConfirmed: true,
        status: nextStatus,
      },
      include: {
        payment: true,
        delivery: true,
        items: true,
      },
    });

    // If paid, release escrow payout to farmers
    if (isPaid) {
      await paymentService.releaseEscrowPayout(order.id);
    }

    // Notify all farmers
    for (const item of (order.items || [])) {
      await notificationService.sendNotification({
        userId: item.farmerProfile?.userId || item.farmerProfile?.user?.id,
        title: 'Delivery Confirmed! 📦',
        message: `Buyer has confirmed safe receipt of Order #${order.orderNumber}. ${isPaid ? 'Payment has been released to your account.' : 'Payment is pending.'}`,
        type: 'DELIVERY',
        actionUrl: `/farmer/orders/${order.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
