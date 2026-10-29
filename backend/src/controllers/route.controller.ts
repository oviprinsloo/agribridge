import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { optimizePickupRoute } from '../services/routeOptimization.service';
import { RouteStopInput } from '../types';

export const getRouteByOrderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;

    const route = await prisma.pickupRoute.findUnique({
      where: { orderId: String(orderId) },
      include: {
        order: {
          include: {
            crop: true,
            delivery: true,
            buyerProfile: { include: { user: true } },
          },
        },
        stops: {
          orderBy: { stopSequence: 'asc' },
          include: {
            farm: {
              include: {
                farmerProfile: { include: { user: { select: { name: true, phone: true } } } },
              },
            },
          },
        },
      },
    });

    if (!route) {
      res.status(404).json({ success: false, message: 'Pickup route not found for this order.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...route,
        disclaimer: 'Route shown is an optimization estimate (heuristic) and may differ from actual road conditions.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const calculateAdHocRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { farmStops, destination, vehicleCapacityKg, vehicleType } = req.body;

    if (!farmStops || !destination) {
      res.status(400).json({ success: false, message: 'farmStops and destination are required' });
      return;
    }

    const result = optimizePickupRoute(
      farmStops as RouteStopInput[],
      destination,
      vehicleCapacityKg || 1500,
      vehicleType || 'Tata Ace (Mini Truck)'
    );

    res.status(200).json({
      success: true,
      data: {
        ...result,
        disclaimer: 'Route shown is an optimization estimate (heuristic) and may differ from actual road conditions.',
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateStopStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stopId = req.params.stopId as string;
    const { status, collectedQuantityKg } = req.body;

    const stop = await prisma.pickupStop.update({
      where: { id: String(stopId) },
      data: {
        status,
        collectedQuantityKg: collectedQuantityKg !== undefined ? collectedQuantityKg : undefined,
        pickupTimestamp: status === 'LOADED' ? new Date() : undefined,
      },
    });

    res.status(200).json({ success: true, message: 'Stop status updated', data: stop });
  } catch (error) {
    next(error);
  }
};
