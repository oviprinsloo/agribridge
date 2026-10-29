import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { notificationService } from '../services/notification.service';

export const listSupplyPools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cropId, district, status, qualityGrade } = req.query;

    const where: any = {};
    if (cropId) where.cropId = String(cropId);
    if (district) where.district = { contains: String(district) };
    if (status) where.status = String(status);
    if (qualityGrade) where.qualityGrade = String(qualityGrade);

    const pools = await prisma.supplyPool.findMany({
      where,
      include: {
        crop: true,
        members: {
          include: {
            farmerProfile: {
              include: { user: { select: { name: true, phone: true } } },
            },
            farmerCrop: {
              include: { farm: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: pools });
  } catch (error) {
    next(error);
  }
};

export const getSupplyPoolById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const pool = await prisma.supplyPool.findUnique({
      where: { id: String(id) },
      include: {
        crop: true,
        members: {
          include: {
            farmerProfile: {
              include: { user: { select: { name: true, phone: true } } },
            },
            farmerCrop: {
              include: { farm: true },
            },
          },
        },
        matches: {
          include: {
            demandPool: true,
            purchaseRequirement: { include: { buyerProfile: { include: { user: true } } } },
          },
        },
        orders: {
          include: { pickupRoute: { include: { stops: true } } },
        },
      },
    });

    if (!pool) {
      res.status(404).json({ success: false, message: 'Supply pool not found.' });
      return;
    }

    res.status(200).json({ success: true, data: pool });
  } catch (error) {
    next(error);
  }
};

export const createSupplyPool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile required.' });
      return;
    }

    const {
      cropId,
      poolName,
      targetQuantity,
      minPricePerUnit,
      maxPricePerUnit,
      avgPricePerUnit,
      qualityGrade,
      harvestWindowStart,
      harvestWindowEnd,
      district,
      state,
      centerLatitude,
      centerLongitude,
      initialFarmerCropId,
      initialContributedQuantity,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the pool
      const pool = await tx.supplyPool.create({
        data: {
          cropId,
          poolName,
          targetQuantity,
          currentQuantity: 0,
          minPricePerUnit: minPricePerUnit || avgPricePerUnit,
          maxPricePerUnit: maxPricePerUnit || avgPricePerUnit,
          avgPricePerUnit,
          qualityGrade: qualityGrade || 'GRADE_A',
          harvestWindowStart: new Date(harvestWindowStart),
          harvestWindowEnd: new Date(harvestWindowEnd),
          district,
          state,
          centerLatitude,
          centerLongitude,
          status: 'OPEN',
        },
        include: { crop: true },
      });

      // 2. If initial produce contribution provided, allocate it
      if (initialFarmerCropId && initialContributedQuantity) {
        const crop = await tx.farmerCrop.findFirst({
          where: { id: initialFarmerCropId, farmerProfileId },
        });

        if (!crop) throw new Error('Farmer produce listing not found.');

        const available = crop.availableQuantity - crop.allocatedQuantity;
        if (initialContributedQuantity > available) {
          throw new Error(`Contributed quantity (${initialContributedQuantity} kg) exceeds your unallocated quantity (${available} kg).`);
        }

        // Add member
        await tx.supplyPoolMember.create({
          data: {
            supplyPoolId: pool.id,
            farmerProfileId,
            farmerCropId: crop.id,
            contributedQuantity: initialContributedQuantity,
            expectedPricePerUnit: crop.expectedPricePerUnit,
            status: 'COMMITTED',
          },
        });

        // Update allocated quantity on produce
        const newAllocated = crop.allocatedQuantity + initialContributedQuantity;
        const newCropStatus = newAllocated >= crop.availableQuantity ? 'FULLY_ALLOCATED' : 'PARTIALLY_ALLOCATED';

        await tx.farmerCrop.update({
          where: { id: crop.id },
          data: {
            allocatedQuantity: newAllocated,
            status: newCropStatus,
          },
        });

        // Update pool currentQuantity
        const newPoolQty = initialContributedQuantity;
        const newPoolStatus = newPoolQty >= targetQuantity ? 'TARGET_REACHED' : 'OPEN';

        const updatedPool = await tx.supplyPool.update({
          where: { id: pool.id },
          data: {
            currentQuantity: newPoolQty,
            status: newPoolStatus,
          },
          include: { crop: true, members: true },
        });

        return updatedPool;
      }

      return pool;
    });

    res.status(201).json({
      success: true,
      message: 'Supply pool created successfully.',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const joinSupplyPool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplyPoolId = req.params.id as string;
    const farmerProfileId = req.user?.farmerProfileId;
    if (!farmerProfileId) {
      res.status(403).json({ success: false, message: 'Farmer profile required.' });
      return;
    }

    const { farmerCropId, contributedQuantity, expectedPricePerUnit } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const pool: any = await tx.supplyPool.findUnique({
        where: { id: String(supplyPoolId) },
        include: { members: true },
      });

      if (!pool) throw new Error('Supply pool not found.');
      if (['COMPLETED', 'CANCELLED', 'MATCHED'].includes(pool.status)) {
        throw new Error(`Cannot join pool in '${pool.status}' status.`);
      }

      // Check produce
      const farmerCrop = await tx.farmerCrop.findFirst({
        where: { id: farmerCropId, farmerProfileId },
      });

      if (!farmerCrop) throw new Error('Your produce listing was not found.');
      if (farmerCrop.cropId !== pool.cropId) {
        throw new Error('Produce crop does not match the pool crop type.');
      }

      const availableQty = farmerCrop.availableQuantity - farmerCrop.allocatedQuantity;
      if (contributedQuantity > availableQty) {
        throw new Error(`Contributed quantity (${contributedQuantity} kg) exceeds available unallocated stock (${availableQty} kg).`);
      }

      // Check if already in pool
      const existingMember = await tx.supplyPoolMember.findUnique({
        where: {
          supplyPoolId_farmerCropId: {
            supplyPoolId: String(supplyPoolId),
            farmerCropId: String(farmerCropId),
          },
        },
      });

      if (existingMember) {
        throw new Error('This produce listing is already committed to this pool.');
      }

      // Add pool member
      const member = await tx.supplyPoolMember.create({
        data: {
          supplyPoolId: String(supplyPoolId),
          farmerProfileId,
          farmerCropId,
          contributedQuantity,
          expectedPricePerUnit: expectedPricePerUnit || farmerCrop.expectedPricePerUnit,
          status: 'COMMITTED',
        },
      });

      // Update farmerCrop allocated quantity
      const newAllocated = farmerCrop.allocatedQuantity + contributedQuantity;
      await tx.farmerCrop.update({
        where: { id: farmerCropId },
        data: {
          allocatedQuantity: newAllocated,
          status: newAllocated >= farmerCrop.availableQuantity ? 'FULLY_ALLOCATED' : 'PARTIALLY_ALLOCATED',
        },
      });

      // Recalculate pool metrics
      const newCurrentQty = pool.currentQuantity + contributedQuantity;
      const allMembers = [...(pool.members || []), member];
      const totalCost = allMembers.reduce((sum: number, m: any) => sum + m.contributedQuantity * m.expectedPricePerUnit, 0);
      const newAvgPrice = Math.round((totalCost / newCurrentQty) * 100) / 100;

      const isTargetReached = newCurrentQty >= pool.targetQuantity;
      const newStatus = isTargetReached ? 'TARGET_REACHED' : 'OPEN';

      const updatedPool: any = await tx.supplyPool.update({
        where: { id: String(supplyPoolId) },
        data: {
          currentQuantity: newCurrentQty,
          avgPricePerUnit: newAvgPrice,
          status: newStatus,
        },
        include: {
          crop: true,
          members: {
            include: { farmerProfile: { include: { user: true } } },
          },
        },
      });

      // Send notification if target reached
      if (isTargetReached && updatedPool.members) {
        await notificationService.notifyMultiple(
          updatedPool.members.map((m: any) => m.farmerProfile?.user?.id).filter(Boolean),
          'Supply Pool Target Reached! 🎉',
          `Your pool "${updatedPool.poolName}" reached ${newCurrentQty} kg! Matching with buyers is now active.`,
          'POOL',
          `/farmer/pools/${updatedPool.id}`
        );
      }

      return updatedPool;
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined supply pool.',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to join supply pool',
      code: 'JOIN_POOL_FAILED',
    });
  }
};
