import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getBuyerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerProfileId = req.user?.buyerProfileId;
    if (!buyerProfileId) {
      res.status(403).json({ success: false, message: 'Buyer profile not found for user' });
      return;
    }

    const [requirements, orders, demandPools, prices, topFarmerPools] = await Promise.all([
      prisma.purchaseRequirement.findMany({
        where: { buyerProfileId },
        include: { crop: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { buyerProfileId },
        include: {
          crop: true,
          supplyPool: true,
          pickupRoute: { include: { stops: true } },
          delivery: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.demandPoolMember.findMany({
        where: { buyerProfileId },
        include: {
          demandPool: { include: { crop: true } },
        },
      }),
      prisma.marketPrice.findMany({
        take: 6,
        orderBy: { priceDate: 'desc' },
        include: { crop: true },
      }),
      prisma.supplyPool.findMany({
        where: { status: { in: ['OPEN', 'TARGET_REACHED'] } },
        take: 4,
        include: { crop: true, members: true },
      }),
    ]);

    const activeRequirementsCount = requirements.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_POOLED').length;
    const pooledOrdersCount = demandPools.length;
    const matchedSupplyOrders = orders.filter((o) => ['MATCHED', 'ACCEPTED', 'PICKUP_SCHEDULED'].includes(o.status));
    const pendingDeliveries = orders.filter((o) => ['PICKED_UP', 'IN_TRANSIT'].includes(o.status));
    const completedOrders = orders.filter((o) => ['DELIVERED', 'PAID', 'COMPLETED'].includes(o.status));

    const totalSpent = orders
      .filter((o) => ['PAID', 'COMPLETED'].includes(o.status))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const totalVolumeKg = completedOrders.reduce((sum, o) => sum + o.totalQuantity, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeRequirementsCount,
          pooledOrdersCount,
          matchedSupplyCount: matchedSupplyOrders.length,
          pendingDeliveriesCount: pendingDeliveries.length,
          totalSpent,
          totalVolumeKg,
        },
        requirements,
        orders,
        demandPools: demandPools.map((d) => d.demandPool),
        recommendedSupplyPools: topFarmerPools,
        marketPrices: prices,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerProfileId = req.user?.buyerProfileId;
    const requirements = await prisma.purchaseRequirement.findMany({
      where: { buyerProfileId },
      include: {
        crop: true,
        demandPoolMembers: { include: { demandPool: true } },
        matches: { include: { supplyPool: { include: { crop: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: requirements });
  } catch (error) {
    next(error);
  }
};

export const createRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerProfileId = req.user?.buyerProfileId;
    if (!buyerProfileId) {
      res.status(403).json({ success: false, message: 'Buyer profile required' });
      return;
    }

    const {
      cropId,
      quantity,
      unit,
      qualityGrade,
      maxPricePerUnit,
      deliveryAddress,
      deliveryDistrict,
      deliveryState,
      deliveryLatitude,
      deliveryLongitude,
      requiredDeliveryDate,
    } = req.body;

    const requirement = await prisma.purchaseRequirement.create({
      data: {
        buyerProfileId,
        cropId,
        quantity,
        unit: unit || 'kg',
        qualityGrade: qualityGrade || 'GRADE_A',
        maxPricePerUnit,
        deliveryAddress,
        deliveryDistrict,
        deliveryState,
        deliveryLatitude,
        deliveryLongitude,
        requiredDeliveryDate: new Date(requiredDeliveryDate),
        status: 'OPEN',
      },
      include: { crop: true },
    });

    res.status(201).json({
      success: true,
      message: 'Purchase requirement posted successfully.',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const buyerProfileId = req.user?.buyerProfileId;

    const existing = await prisma.purchaseRequirement.findFirst({
      where: { id: String(id), buyerProfileId: String(buyerProfileId) },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Requirement not found.' });
      return;
    }

    if (['MATCHED', 'FULFILLED'].includes(existing.status)) {
      res.status(400).json({
        success: false,
        message: 'Cannot modify requirement that is already matched or fulfilled.',
      });
      return;
    }

    const updated = await prisma.purchaseRequirement.update({
      where: { id: String(id) },
      data: {
        ...req.body,
        requiredDeliveryDate: req.body.requiredDeliveryDate ? new Date(req.body.requiredDeliveryDate) : undefined,
      },
      include: { crop: true },
    });

    res.status(200).json({
      success: true,
      message: 'Purchase requirement updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const buyerProfileId = req.user?.buyerProfileId;

    const existing = await prisma.purchaseRequirement.findFirst({
      where: { id: String(id), buyerProfileId: String(buyerProfileId) },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Requirement not found.' });
      return;
    }

    if (['MATCHED', 'FULFILLED'].includes(existing.status)) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete requirement that is already in progress or fulfilled.',
      });
      return;
    }

    await prisma.purchaseRequirement.delete({ where: { id: String(id) } });

    res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
