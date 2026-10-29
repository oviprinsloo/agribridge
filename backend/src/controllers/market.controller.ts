import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getMarketPrices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cropId, state, district } = req.query;

    const where: any = {};
    if (cropId) where.cropId = String(cropId);
    if (state) where.state = String(state);
    if (district) where.district = { contains: String(district) };

    const prices = await prisma.marketPrice.findMany({
      where,
      include: { crop: true },
      orderBy: { priceDate: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: prices,
      disclaimer: 'Market information shown in this demo is sample data and should not be treated as live market pricing.',
      dataSource: 'Simulated APMC Mandi Real-Time Benchmark',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getMarketTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cropName = 'Tomato' } = req.query;

    const crop = await prisma.crop.findFirst({
      where: { name: { contains: String(cropName) } },
    });

    // Provide structured 30-day realistic trend data points for chart
    const baseModal = 32;
    const historyData = [
      { date: 'Sep 01', modalPrice: baseModal - 4, minPrice: baseModal - 8, maxPrice: baseModal + 2, volumeTon: 180 },
      { date: 'Sep 05', modalPrice: baseModal - 2, minPrice: baseModal - 6, maxPrice: baseModal + 4, volumeTon: 195 },
      { date: 'Sep 10', modalPrice: baseModal + 1, minPrice: baseModal - 3, maxPrice: baseModal + 6, volumeTon: 220 },
      { date: 'Sep 15', modalPrice: baseModal + 5, minPrice: baseModal, maxPrice: baseModal + 9, volumeTon: 250 },
      { date: 'Sep 20', modalPrice: baseModal + 2, minPrice: baseModal - 2, maxPrice: baseModal + 7, volumeTon: 235 },
      { date: 'Sep 24', modalPrice: baseModal + 4, minPrice: baseModal - 1, maxPrice: baseModal + 8, volumeTon: 270 },
      { date: 'Sep 26', modalPrice: baseModal + 6, minPrice: baseModal + 1, maxPrice: baseModal + 11, volumeTon: 290 },
    ];

    res.status(200).json({
      success: true,
      data: {
        crop: crop || { name: cropName },
        history: historyData,
        summary: {
          currentModalPrice: 38,
          weeklyChangePercent: +6.5,
          trend: 'UPWARD',
          highestState: 'Tamil Nadu (₹42/kg)',
          lowestState: 'Karnataka (₹34/kg)',
        },
      },
      disclaimer: 'Market information shown in this demo is sample data and should not be treated as live market pricing.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMarketDemand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demands = await prisma.marketDemand.findMany({
      include: { crop: true },
      orderBy: { requiredQuantity: 'desc' },
    });

    const regionalDemands = [
      { region: 'Chennai Metropolitan', totalDemandKg: 45000, activeBuyers: 34, primaryCrop: 'Tomato' },
      { region: 'Coimbatore Hub', totalDemandKg: 32000, activeBuyers: 22, primaryCrop: 'Onion' },
      { region: 'Bengaluru South', totalDemandKg: 58000, activeBuyers: 46, primaryCrop: 'Potato' },
      { region: 'Madurai & South TN', totalDemandKg: 24000, activeBuyers: 18, primaryCrop: 'Carrot' },
      { region: 'Hyderabad Cluster', totalDemandKg: 39000, activeBuyers: 29, primaryCrop: 'Cabbage' },
    ];

    res.status(200).json({
      success: true,
      data: {
        demands,
        regionalDemands,
      },
      disclaimer: 'Market information shown in this demo is sample data and should not be treated as live market pricing.',
    });
  } catch (error) {
    next(error);
  }
};
