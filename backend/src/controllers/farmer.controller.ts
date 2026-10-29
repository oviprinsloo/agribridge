import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getFarmerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile not found for user' });
      return;
    }

    const [farmerCrops, poolMemberships, orderItems, recentPrices, schemes] = await Promise.all([
      prisma.farmerCrop.findMany({
        where: { farmerProfileId },
        include: { crop: true, farm: true },
      }),
      prisma.supplyPoolMember.findMany({
        where: { farmerProfileId },
        include: {
          supplyPool: {
            include: { crop: true },
          },
        },
      }),
      prisma.orderItem.findMany({
        where: { farmerProfileId },
        include: {
          order: {
            include: {
              crop: true,
              buyerProfile: { include: { user: { select: { name: true, phone: true } } } },
              pickupRoute: { include: { stops: true } },
              payment: true,
            },
          },
          farm: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketPrice.findMany({
        take: 6,
        orderBy: { priceDate: 'desc' },
        include: { crop: true },
      }),
      prisma.governmentScheme.findMany({
        where: { isActive: true },
        take: 3,
      }),
    ]);

    // Metric Calculations
    const totalAvailableProduceKg = farmerCrops.reduce(
      (sum, item) => sum + Math.max(0, item.availableQuantity - item.allocatedQuantity),
      0
    );
    const activeSupplyPoolsCount = poolMemberships.filter(
      (m) => m.supplyPool.status === 'OPEN' || m.supplyPool.status === 'TARGET_REACHED'
    ).length;

    const matchedOrders = orderItems.filter((i) =>
      ['MATCHED', 'ACCEPTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(i.order.status)
    );

    const pendingPaymentAmount = orderItems
      .filter((i) => ['DELIVERED', 'PAYMENT_PENDING'].includes(i.order.status))
      .reduce((sum, item) => sum + item.subtotal, 0);

    const totalEarnedAmount = orderItems
      .filter((i) => ['PAID', 'COMPLETED'].includes(i.order.status))
      .reduce((sum, item) => sum + item.subtotal, 0);

    // Upcoming Pickups
    const upcomingPickups = orderItems
      .filter((i) => ['ACCEPTED', 'PICKUP_SCHEDULED'].includes(i.order.status) && i.order.pickupRoute)
      .map((i) => {
        const stop = i.order.pickupRoute?.stops.find((s) => s.farmId === i.farmId);
        return {
          orderId: i.orderId,
          orderNumber: i.order.orderNumber,
          cropName: i.order.crop.name,
          quantityKg: i.quantity,
          farmName: i.farm.farmName,
          stopSequence: stop?.stopSequence || 1,
          estimatedArrivalMins: stop ? (stop.stopSequence - 1) * 25 + 20 : 30,
          status: stop?.status || 'PENDING',
        };
      });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAvailableProduceKg,
          activeSupplyPoolsCount,
          matchedOrdersCount: matchedOrders.length,
          pendingPaymentAmount,
          totalEarnedAmount,
        },
        produce: farmerCrops,
        pools: poolMemberships.map((m) => m.supplyPool),
        orders: orderItems.map((i) => ({
          ...i.order,
          myQuantity: i.quantity,
          mySharePrice: i.subtotal,
        })),
        upcomingPickups,
        marketPrices: recentPrices,
        recommendedSchemes: schemes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listProduce = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    const produce = await prisma.farmerCrop.findMany({
      where: { farmerProfileId },
      include: {
        crop: true,
        farm: true,
        supplyPoolMembers: {
          include: { supplyPool: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: produce });
  } catch (error) {
    next(error);
  }
};

export const addProduce = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile required' });
      return;
    }

    const { farmId, cropId, availableQuantity, unit, expectedPricePerUnit, harvestDate, qualityGrade, notes } = req.body;

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, farmerProfileId },
    });
    if (!farm) {
      res.status(404).json({ success: false, message: 'Farm not found or does not belong to this farmer.' });
      return;
    }

    const produce = await prisma.farmerCrop.create({
      data: {
        farmerProfileId,
        farmId,
        cropId,
        availableQuantity,
        allocatedQuantity: 0,
        unit: unit || 'kg',
        expectedPricePerUnit,
        harvestDate: new Date(harvestDate),
        qualityGrade: qualityGrade || 'GRADE_A',
        status: 'AVAILABLE',
        notes,
      },
      include: { crop: true, farm: true },
    });

    res.status(201).json({
      success: true,
      message: 'Produce listed successfully.',
      data: produce,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduce = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const farmerProfileId = req.user?.farmerProfileId;

    const existing = await prisma.farmerCrop.findFirst({
      where: { id: String(id), farmerProfileId: String(farmerProfileId) },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Produce listing not found.' });
      return;
    }

    // Rule 1: A farmer cannot sell or reduce quantity below allocated quantity
    if (req.body.availableQuantity !== undefined && req.body.availableQuantity < existing.allocatedQuantity) {
      res.status(400).json({
        success: false,
        message: `Available quantity cannot be less than already allocated quantity (${existing.allocatedQuantity} kg).`,
        code: 'QUANTITY_BELOW_ALLOCATED',
      });
      return;
    }

    const updated = await prisma.farmerCrop.update({
      where: { id: String(id) },
      data: {
        ...req.body,
        harvestDate: req.body.harvestDate ? new Date(req.body.harvestDate) : undefined,
      },
      include: { crop: true, farm: true },
    });

    res.status(200).json({
      success: true,
      message: 'Produce updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduce = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const farmerProfileId = req.user?.farmerProfileId;

    const existing = await prisma.farmerCrop.findFirst({
      where: { id: String(id), farmerProfileId: String(farmerProfileId) },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Produce listing not found.' });
      return;
    }

    if (existing.allocatedQuantity > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete produce that is currently allocated in an active supply pool or order.',
        code: 'CANNOT_DELETE_ALLOCATED_PRODUCE',
      });
      return;
    }

    await prisma.farmerCrop.delete({ where: { id: String(id) } });

    res.status(200).json({
      success: true,
      message: 'Produce listing removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getFarms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    const farms = await prisma.farm.findMany({
      where: { farmerProfileId },
      include: {
        farmerCrops: {
          include: { crop: true },
        },
      },
    });

    res.status(200).json({ success: true, data: farms });
  } catch (error) {
    next(error);
  }
};

export const createFarm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile required' });
      return;
    }

    const { farmName, village, district, state, latitude, longitude, totalAreaAcres, soilType, irrigationType } = req.body;

    const farm = await prisma.farm.create({
      data: {
        farmerProfileId,
        farmName,
        village,
        district,
        state,
        latitude,
        longitude,
        totalAreaAcres: totalAreaAcres || 2.0,
        soilType,
        irrigationType,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: farm,
    });
  } catch (error) {
    next(error);
  }
};
