import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const listCrops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category) where.category = String(category);

    const crops = await prisma.crop.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, data: crops });
  } catch (error) {
    next(error);
  }
};

export const getCropById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const crop = await prisma.crop.findUnique({
      where: { id: String(id) },
      include: {
        marketPrices: { take: 5, orderBy: { priceDate: 'desc' } },
        supplyPools: { where: { status: 'OPEN' } },
      },
    });

    if (!crop) {
      res.status(404).json({ success: false, message: 'Crop not found' });
      return;
    }

    res.status(200).json({ success: true, data: crop });
  } catch (error) {
    next(error);
  }
};

export const createCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const crop = await prisma.crop.create({
      data: req.body,
    });
    res.status(201).json({ success: true, message: 'Crop added to catalogue', data: crop });
  } catch (error) {
    next(error);
  }
};

export const updateCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const crop = await prisma.crop.update({
      where: { id: String(id) },
      data: req.body,
    });
    res.status(200).json({ success: true, message: 'Crop updated', data: crop });
  } catch (error) {
    next(error);
  }
};

export const deleteCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.crop.delete({ where: { id: String(id) } });
    res.status(200).json({ success: true, message: 'Crop deleted from catalogue' });
  } catch (error) {
    next(error);
  }
};
