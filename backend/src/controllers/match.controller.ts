import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import {
  findCompatibleSupplyPools,
  findCompatibleDemandPools,
  createMatch,
} from '../services/matching.service';
import { optimizePickupRoute } from '../services/routeOptimization.service';
import { notificationService } from '../services/notification.service';
import { RouteStopInput } from '../types';

export const getMatchesForRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requirementId = req.params.requirementId as string;
    const matches = await findCompatibleSupplyPools(String(requirementId));
    res.status(200).json({ success: true, data: matches });
  } catch (error: any) {
    next(error);
  }
};

export const getMatchesForSupplyPool = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const poolId = req.params.poolId as string;
    const matches = await findCompatibleDemandPools(String(poolId));
    res.status(200).json({ success: true, data: matches });
  } catch (error: any) {
    next(error);
  }
};

export const createMatchProposal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplyPoolId, demandPoolId, purchaseRequirementId } = req.body;
    const match = await createMatch({ supplyPoolId, demandPoolId, purchaseRequirementId });
    res.status(201).json({ success: true, message: 'Match proposed successfully', data: match });
  } catch (error: any) {
    next(error);
  }
};

export const acceptMatchAndGenerateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matchId = req.params.matchId as string;
    const buyerProfileId = req.user?.buyerProfileId;

    const match: any = await prisma.match.findUnique({
      where: { id: String(matchId) },
      include: {
        supplyPool: {
          include: {
            crop: true,
            members: {
              include: {
                farmerProfile: { include: { user: true } },
                farmerCrop: { include: { farm: true } },
              },
            },
          },
        },
        demandPool: {
          include: {
            members: {
              include: { buyerProfile: { include: { user: true } } },
            },
          },
        },
        purchaseRequirement: {
          include: { buyerProfile: { include: { user: true } } },
        },
      },
    });

    if (!match) {
      res.status(404).json({ success: false, message: 'Match record not found.' });
      return;
    }

    if (match.status === 'ACCEPTED') {
      res.status(400).json({ success: false, message: 'This match has already been accepted.' });
      return;
    }

    const supplyPool = match.supplyPool;
    if (!supplyPool) {
      res.status(400).json({ success: false, message: 'Supply pool missing from match.' });
      return;
    }

    // Determine target buyer profile & delivery info
    let targetBuyerId = buyerProfileId;
    let deliveryAddress = 'AgriBridge Regional Logistics Hub, Namakkal';
    let deliveryDistrict = supplyPool.district;
    let deliveryState = supplyPool.state;
    let deliveryLat = supplyPool.centerLatitude + 0.12;
    let deliveryLon = supplyPool.centerLongitude + 0.15;
    let recipientName = 'Bulk Buyer Warehouse';
    let recipientPhone = '9876543210';
    let totalQuantity = supplyPool.currentQuantity;
    let unitPrice = supplyPool.avgPricePerUnit;

    if (match.purchaseRequirement) {
      targetBuyerId = match.purchaseRequirement.buyerProfileId;
      deliveryAddress = match.purchaseRequirement.deliveryAddress;
      deliveryDistrict = match.purchaseRequirement.deliveryDistrict;
      deliveryState = match.purchaseRequirement.deliveryState;
      deliveryLat = match.purchaseRequirement.deliveryLatitude;
      deliveryLon = match.purchaseRequirement.deliveryLongitude;
      recipientName = match.purchaseRequirement.buyerProfile.user.name;
      recipientPhone = match.purchaseRequirement.buyerProfile.user.phone;
      totalQuantity = Math.min(supplyPool.currentQuantity, match.purchaseRequirement.quantity);
      unitPrice = supplyPool.avgPricePerUnit;
    } else if ((match as any).demandPool && (match as any).demandPool.members?.length > 0) {
      const dp = (match as any).demandPool;
      targetBuyerId = dp.members[0].buyerProfileId;
      deliveryAddress = `Consolidated Hub: ${dp.deliveryDistrict}`;
      deliveryDistrict = dp.deliveryDistrict;
      deliveryState = dp.deliveryState;
      deliveryLat = dp.centerLatitude;
      deliveryLon = dp.centerLongitude;
      recipientName = dp.members[0].buyerProfile.businessName;
      recipientPhone = dp.members[0].buyerProfile.user.phone;
      totalQuantity = Math.min(supplyPool.currentQuantity, dp.currentQuantity);
    }

    if (!targetBuyerId) {
      res.status(400).json({ success: false, message: 'Unable to resolve buyer profile for order creation.' });
      return;
    }

    const orderNumber = `AGRI-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const totalPrice = Math.round(totalQuantity * unitPrice);
    const platformFee = Math.round(totalPrice * 0.02); // 2% fair trade platform fee

    // Execute order creation + route generation in a database transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerProfileId: targetBuyerId!,
          supplyPoolId: supplyPool.id,
          demandPoolId: match.demandPoolId,
          purchaseRequirementId: match.purchaseRequirementId,
          cropId: supplyPool.cropId,
          totalQuantity,
          unitPrice,
          totalPrice,
          platformFee,
          status: 'ACCEPTED',
          farmerPickupConfirmed: false,
          buyerDeliveryConfirmed: false,
        },
      });

      // 2. Create OrderItems for each participating farmer
      const farmStopsInput: RouteStopInput[] = [];

      for (const member of supplyPool.members) {
        const farm = member.farmerCrop.farm;
        const subtotal = Math.round(member.contributedQuantity * member.expectedPricePerUnit);

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            farmerProfileId: member.farmerProfileId,
            farmerCropId: member.farmerCropId,
            farmId: farm.id,
            quantity: member.contributedQuantity,
            unitPrice: member.expectedPricePerUnit,
            subtotal,
            status: 'ALLOCATED',
          },
        });

        farmStopsInput.push({
          farmId: farm.id,
          farmName: farm.farmName,
          village: farm.village,
          latitude: farm.latitude,
          longitude: farm.longitude,
          quantityKg: member.contributedQuantity,
        });
      }

      // 3. Optimize Pickup Route
      const routeResult = optimizePickupRoute(
        farmStopsInput,
        {
          name: recipientName,
          address: deliveryAddress,
          latitude: deliveryLat,
          longitude: deliveryLon,
        },
        1500, // Tata Ace capacity
        'Tata Ace (Mini Truck)'
      );

      // 4. Save PickupRoute
      const pickupRoute = await tx.pickupRoute.create({
        data: {
          orderId: newOrder.id,
          totalDistanceKm: routeResult.totalDistanceKm,
          estimatedDurationMins: routeResult.estimatedDurationMins,
          estimatedTransportCost: routeResult.estimatedTransportCost,
          vehicleCapacityKg: routeResult.vehicleCapacityKg,
          vehicleType: routeResult.vehicleType,
          optimizationMethod: routeResult.optimizationMethod,
          status: 'OPTIMIZED',
        },
      });

      // 5. Save PickupStops in sequential order
      for (const stop of routeResult.orderedStops) {
        await tx.pickupStop.create({
          data: {
            pickupRouteId: pickupRoute.id,
            farmId: stop.farmId,
            stopSequence: stop.stopSequence,
            farmName: stop.farmName,
            village: stop.village,
            latitude: stop.latitude,
            longitude: stop.longitude,
            quantityToCollectKg: stop.quantityKg,
            stopDistanceKm: stop.stopDistanceKm,
            status: 'PENDING',
          },
        });
      }

      // 6. Create Delivery Record
      await tx.delivery.create({
        data: {
          orderId: newOrder.id,
          destinationName: recipientName,
          destinationAddress: deliveryAddress,
          latitude: deliveryLat,
          longitude: deliveryLon,
          scheduledDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
          recipientName,
          recipientPhone,
          status: 'PENDING',
        },
      });

      // 7. Update Match and Pools
      await tx.match.update({
        where: { id: match.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.supplyPool.update({
        where: { id: supplyPool.id },
        data: { status: 'MATCHED' },
      });

      if (match.demandPoolId) {
        await tx.demandPool.update({
          where: { id: match.demandPoolId },
          data: { status: 'MATCHED' },
        });
      }

      if (match.purchaseRequirementId) {
        await tx.purchaseRequirement.update({
          where: { id: match.purchaseRequirementId },
          data: { status: 'MATCHED' },
        });
      }

      return newOrder;
    });

    // Notify farmers about match and scheduled pickup
    const farmerUserIds = (supplyPool.members as any[]).map((m: any) => m.farmerProfile.user.id);
    await notificationService.notifyMultiple(
      farmerUserIds,
      'Match Accepted! Pickup Scheduled 🚚',
      `Bulk order #${order.orderNumber} for ${supplyPool.crop.name} has been confirmed. Collection route is optimized.`,
      'PICKUP',
      `/farmer/orders/${order.id}`
    );

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        crop: true,
        pickupRoute: { include: { stops: true } },
        delivery: true,
        items: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Match accepted! Order and optimized pickup route successfully generated.',
      data: fullOrder,
    });
  } catch (error: any) {
    next(error);
  }
};
