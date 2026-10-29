import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { notificationService } from '../services/notification.service';

export const listDemandPools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cropId, status, district } = req.query;

    const where: any = {};
    if (cropId) where.cropId = String(cropId);
    if (status) where.status = String(status);
    if (district) where.deliveryDistrict = { contains: String(district) };

    const pools = await prisma.demandPool.findMany({
      where,
      include: {
        crop: true,
        members: {
          include: {
            buyerProfile: {
              include: { user: { select: { name: true, phone: true } } },
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

export const getDemandPoolById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const pool = await prisma.demandPool.findUnique({
      where: { id: String(id) },
      include: {
        crop: true,
        members: {
          include: {
            buyerProfile: {
              include: { user: { select: { name: true, phone: true } } },
            },
            purchaseRequirement: true,
          },
        },
        matches: {
          include: { supplyPool: { include: { crop: true, members: true } } },
        },
      },
    });

    if (!pool) {
      res.status(404).json({ success: false, message: 'Demand pool not found.' });
      return;
    }

    res.status(200).json({ success: true, data: pool });
  } catch (error) {
    next(error);
  }
};

export const createDemandPool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerProfileId = req.user?.buyerProfileId;
    if (!buyerProfileId) {
      res.status(403).json({ success: false, message: 'Buyer profile required.' });
      return;
    }

    const {
      cropId,
      poolName,
      targetQuantity,
      maxPricePerUnit,
      qualityGrade,
      deliveryDate,
      deliveryDistrict,
      deliveryState,
      centerLatitude,
      centerLongitude,
      initialRequirementId,
      initialRequestedQuantity,
      initialOfferedPrice,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.demandPool.create({
        data: {
          cropId,
          poolName,
          targetQuantity,
          currentQuantity: 0,
          maxPricePerUnit,
          qualityGrade: qualityGrade || 'GRADE_A',
          deliveryDate: new Date(deliveryDate),
          deliveryDistrict,
          deliveryState,
          centerLatitude,
          centerLongitude,
          status: 'OPEN',
        },
        include: { crop: true },
      });

      if (initialRequestedQuantity && initialRequestedQuantity > 0) {
        await tx.demandPoolMember.create({
          data: {
            demandPoolId: pool.id,
            buyerProfileId,
            purchaseRequirementId: initialRequirementId,
            requestedQuantity: initialRequestedQuantity,
            offeredPricePerUnit: initialOfferedPrice || maxPricePerUnit,
            status: 'COMMITTED',
          },
        });

        if (initialRequirementId) {
          await tx.purchaseRequirement.update({
            where: { id: initialRequirementId },
            data: { status: 'PARTIALLY_POOLED' },
          });
        }

        const newPoolStatus = initialRequestedQuantity >= targetQuantity ? 'TARGET_REACHED' : 'OPEN';

        const updatedPool = await tx.demandPool.update({
          where: { id: pool.id },
          data: {
            currentQuantity: initialRequestedQuantity,
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
      message: 'Demand pool created successfully',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const joinDemandPool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demandPoolId = req.params.id as string;
    const buyerProfileId = req.user?.buyerProfileId;
    if (!buyerProfileId) {
      res.status(403).json({ success: false, message: 'Buyer profile required.' });
      return;
    }

    const { purchaseRequirementId, requestedQuantity, offeredPricePerUnit } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const pool: any = await tx.demandPool.findUnique({
        where: { id: String(demandPoolId) },
        include: { members: true, crop: true },
      });

      if (!pool) throw new Error('Demand pool not found.');
      if (['COMPLETED', 'CANCELLED', 'MATCHED'].includes(pool.status)) {
        throw new Error(`Cannot join demand pool in '${pool.status}' status.`);
      }

      const member = await tx.demandPoolMember.create({
        data: {
          demandPoolId: String(demandPoolId),
          buyerProfileId,
          purchaseRequirementId,
          requestedQuantity,
          offeredPricePerUnit,
          status: 'COMMITTED',
        },
      });

      if (purchaseRequirementId) {
        await tx.purchaseRequirement.update({
          where: { id: purchaseRequirementId },
          data: { status: 'PARTIALLY_POOLED' },
        });
      }

      const newCurrentQty = pool.currentQuantity + requestedQuantity;
      const isTargetReached = newCurrentQty >= pool.targetQuantity;
      const newStatus = isTargetReached ? 'TARGET_REACHED' : 'OPEN';

      const updatedPool: any = await tx.demandPool.update({
        where: { id: String(demandPoolId) },
        data: {
          currentQuantity: newCurrentQty,
          status: newStatus,
        },
        include: {
          crop: true,
          members: {
            include: { buyerProfile: { include: { user: true } } },
          },
        },
      });

      if (isTargetReached && updatedPool.members) {
        await notificationService.notifyMultiple(
          updatedPool.members.map((m: any) => m.buyerProfile?.user?.id).filter(Boolean),
          'Demand Pool Target Reached! 🚀',
          `Your pooled bulk order for ${updatedPool.crop?.name || 'crop'} (${newCurrentQty} kg) has reached target volume! Matching with farmer pools is underway.`,
          'POOL',
          `/buyer/pools/${updatedPool.id}`
        );
      }

      return updatedPool;
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined demand pool.',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to join demand pool',
      code: 'JOIN_DEMAND_POOL_FAILED',
    });
  }
};
