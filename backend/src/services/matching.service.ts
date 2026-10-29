import prisma from '../config/database';
import { haversineDistanceKm } from './routeOptimization.service';
import { MatchScoreResult } from '../types';

export interface MatchingWeights {
  quantityWeight: number; // 0.25
  priceWeight: number;    // 0.25
  dateWeight: number;     // 0.20
  qualityWeight: number;  // 0.15
  distanceWeight: number; // 0.15
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  quantityWeight: 0.25,
  priceWeight: 0.25,
  dateWeight: 0.20,
  qualityWeight: 0.15,
  distanceWeight: 0.15,
};

/**
 * Calculates a multi-factor compatibility score between 0 and 100
 */
export function calculateMatchScore(params: {
  cropIdA: string;
  cropIdB: string;
  supplyQuantity: number;
  demandQuantity: number;
  supplyAvgPrice: number;
  buyerMaxPrice: number;
  harvestWindowStart: Date;
  harvestWindowEnd: Date;
  requiredDeliveryDate: Date;
  supplyQualityGrade: string;
  buyerQualityGrade: string;
  supplyLat: number;
  supplyLon: number;
  buyerLat: number;
  buyerLon: number;
  weights?: MatchingWeights;
}): MatchScoreResult {
  const w = params.weights || DEFAULT_WEIGHTS;

  // 1. Mandatory Crop Match
  if (params.cropIdA !== params.cropIdB) {
    return {
      score: 0,
      cropMatched: false,
      quantityCompatibility: 0,
      priceCompatibility: 0,
      dateCompatibility: 0,
      qualityCompatibility: 0,
      distanceKm: Infinity,
      distanceScore: 0,
      isFeasible: false,
      breakdown: { reason: 'Crop types do not match' },
    };
  }

  // 2. Quantity Compatibility (0 to 100)
  // Optimal when supply is >= 90% and <= 120% of demand
  const qtyRatio = params.supplyQuantity / Math.max(1, params.demandQuantity);
  let qtyScore = 0;
  if (qtyRatio >= 0.9 && qtyRatio <= 1.25) {
    qtyScore = 100;
  } else if (qtyRatio > 1.25) {
    qtyScore = Math.max(70, 100 - (qtyRatio - 1.25) * 40);
  } else {
    // Under supply: partial fulfillment score
    qtyScore = Math.max(30, qtyRatio * 100);
  }

  // 3. Price Compatibility (0 to 100)
  // High score if farmer average price is at or below buyer's max price
  let priceScore = 0;
  if (params.supplyAvgPrice <= params.buyerMaxPrice) {
    const margin = (params.buyerMaxPrice - params.supplyAvgPrice) / params.buyerMaxPrice;
    priceScore = Math.min(100, 85 + margin * 30);
  } else {
    const overage = (params.supplyAvgPrice - params.buyerMaxPrice) / params.buyerMaxPrice;
    priceScore = Math.max(0, 85 - overage * 200);
  }

  // 4. Date Compatibility (0 to 100)
  // Delivery date should be >= harvestWindowStart and <= harvestWindowEnd + 5 days
  const deliveryTime = new Date(params.requiredDeliveryDate).getTime();
  const harvestStart = new Date(params.harvestWindowStart).getTime();
  const harvestEnd = new Date(params.harvestWindowEnd).getTime();

  let dateScore = 80;
  if (deliveryTime >= harvestStart && deliveryTime <= harvestEnd) {
    dateScore = 100;
  } else if (deliveryTime > harvestEnd) {
    const daysLate = (deliveryTime - harvestEnd) / (1000 * 60 * 60 * 24);
    dateScore = Math.max(30, 95 - daysLate * 10);
  } else {
    const daysEarly = (harvestStart - deliveryTime) / (1000 * 60 * 60 * 24);
    dateScore = Math.max(20, 80 - daysEarly * 15);
  }

  // 5. Quality Grade Compatibility (0 to 100)
  const gradeRank: Record<string, number> = { GRADE_A: 3, GRADE_B: 2, GRADE_C: 1 };
  const supplyRank = gradeRank[params.supplyQualityGrade] || 2;
  const buyerRank = gradeRank[params.buyerQualityGrade] || 2;

  let qualityScore = 100;
  if (supplyRank >= buyerRank) {
    qualityScore = 100; // Supply meets or exceeds buyer requirement
  } else if (supplyRank === buyerRank - 1) {
    qualityScore = 65; // One grade lower
  } else {
    qualityScore = 30; // Two grades lower
  }

  // 6. Geographic Proximity (0 to 100)
  const distanceKm = haversineDistanceKm(
    { latitude: params.supplyLat, longitude: params.supplyLon },
    { latitude: params.buyerLat, longitude: params.buyerLon }
  );

  // Proximity scoring: < 30km = 100, 30-100km = 90-70, 100-300km = 70-40, > 300km = drops
  let distanceScore = 100;
  if (distanceKm <= 35) {
    distanceScore = 100;
  } else if (distanceKm <= 100) {
    distanceScore = Math.max(70, 100 - (distanceKm - 35) * 0.45);
  } else if (distanceKm <= 250) {
    distanceScore = Math.max(40, 70 - (distanceKm - 100) * 0.2);
  } else {
    distanceScore = Math.max(10, 40 - (distanceKm - 250) * 0.1);
  }

  // Total weighted score
  const totalScore = Math.round(
    qtyScore * w.quantityWeight +
    priceScore * w.priceWeight +
    dateScore * w.dateWeight +
    qualityScore * w.qualityWeight +
    distanceScore * w.distanceWeight
  );

  const isFeasible = totalScore >= 60 && params.supplyAvgPrice <= params.buyerMaxPrice * 1.15;

  return {
    score: totalScore,
    cropMatched: true,
    quantityCompatibility: Math.round(qtyScore),
    priceCompatibility: Math.round(priceScore),
    dateCompatibility: Math.round(dateScore),
    qualityCompatibility: Math.round(qualityScore),
    distanceKm,
    distanceScore: Math.round(distanceScore),
    isFeasible,
    breakdown: {
      quantityRatio: Math.round(qtyRatio * 100) / 100,
      priceDiff: params.buyerMaxPrice - params.supplyAvgPrice,
      distanceKm,
      isDirectGradeMatch: supplyRank >= buyerRank,
    },
  };
}

/**
 * Finds all compatible Supply Pools for a given Purchase Requirement
 */
export async function findCompatibleSupplyPools(requirementId: string) {
  const req = await prisma.purchaseRequirement.findUnique({
    where: { id: requirementId },
    include: { crop: true, buyerProfile: true },
  });

  if (!req) throw new Error('Purchase requirement not found');

  const eligibleSupplyPools = await prisma.supplyPool.findMany({
    where: {
      cropId: req.cropId,
      status: { in: ['OPEN', 'TARGET_REACHED'] },
      currentQuantity: { gt: 0 },
    },
    include: {
      crop: true,
      members: {
        include: {
          farmerProfile: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      },
    },
  });

  const scored = eligibleSupplyPools.map((pool) => {
    const matchResult = calculateMatchScore({
      cropIdA: pool.cropId,
      cropIdB: req.cropId,
      supplyQuantity: pool.currentQuantity,
      demandQuantity: req.quantity,
      supplyAvgPrice: pool.avgPricePerUnit,
      buyerMaxPrice: req.maxPricePerUnit,
      harvestWindowStart: pool.harvestWindowStart,
      harvestWindowEnd: pool.harvestWindowEnd,
      requiredDeliveryDate: req.requiredDeliveryDate,
      supplyQualityGrade: pool.qualityGrade,
      buyerQualityGrade: req.qualityGrade,
      supplyLat: pool.centerLatitude,
      supplyLon: pool.centerLongitude,
      buyerLat: req.deliveryLatitude,
      buyerLon: req.deliveryLongitude,
    });

    return {
      supplyPool: pool,
      matchResult,
    };
  });

  // Filter feasible and sort by highest score
  return scored
    .filter((item) => item.matchResult.score >= 50)
    .sort((a, b) => b.matchResult.score - a.matchResult.score);
}

/**
 * Finds all compatible Demand Pools for a given Supply Pool
 */
export async function findCompatibleDemandPools(supplyPoolId: string) {
  const pool = await prisma.supplyPool.findUnique({
    where: { id: supplyPoolId },
    include: { crop: true },
  });

  if (!pool) throw new Error('Supply pool not found');

  const eligibleDemandPools = await prisma.demandPool.findMany({
    where: {
      cropId: pool.cropId,
      status: { in: ['OPEN', 'TARGET_REACHED'] },
      currentQuantity: { gt: 0 },
    },
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
  });

  const scored = eligibleDemandPools.map((demandPool) => {
    const matchResult = calculateMatchScore({
      cropIdA: pool.cropId,
      cropIdB: demandPool.cropId,
      supplyQuantity: pool.currentQuantity,
      demandQuantity: demandPool.currentQuantity,
      supplyAvgPrice: pool.avgPricePerUnit,
      buyerMaxPrice: demandPool.maxPricePerUnit,
      harvestWindowStart: pool.harvestWindowStart,
      harvestWindowEnd: pool.harvestWindowEnd,
      requiredDeliveryDate: demandPool.deliveryDate,
      supplyQualityGrade: pool.qualityGrade,
      buyerQualityGrade: demandPool.qualityGrade,
      supplyLat: pool.centerLatitude,
      supplyLon: pool.centerLongitude,
      buyerLat: demandPool.centerLatitude,
      buyerLon: demandPool.centerLongitude,
    });

    return {
      demandPool,
      matchResult,
    };
  });

  return scored
    .filter((item) => item.matchResult.score >= 50)
    .sort((a, b) => b.matchResult.score - a.matchResult.score);
}

/**
 * Creates a formal Match record between supply pool and demand pool / purchase requirement
 */
export async function createMatch(params: {
  supplyPoolId: string;
  demandPoolId?: string;
  purchaseRequirementId?: string;
}) {
  const { supplyPoolId, demandPoolId, purchaseRequirementId } = params;

  if (!demandPoolId && !purchaseRequirementId) {
    throw new Error('Either demandPoolId or purchaseRequirementId is required');
  }

  const pool = await prisma.supplyPool.findUnique({
    where: { id: supplyPoolId },
    include: { crop: true },
  });
  if (!pool) throw new Error('Supply pool not found');

  let matchScore = 85.0;
  let details: any = {};

  if (purchaseRequirementId) {
    const req = await prisma.purchaseRequirement.findUnique({
      where: { id: purchaseRequirementId },
    });
    if (!req) throw new Error('Purchase requirement not found');

    const result = calculateMatchScore({
      cropIdA: pool.cropId,
      cropIdB: req.cropId,
      supplyQuantity: pool.currentQuantity,
      demandQuantity: req.quantity,
      supplyAvgPrice: pool.avgPricePerUnit,
      buyerMaxPrice: req.maxPricePerUnit,
      harvestWindowStart: pool.harvestWindowStart,
      harvestWindowEnd: pool.harvestWindowEnd,
      requiredDeliveryDate: req.requiredDeliveryDate,
      supplyQualityGrade: pool.qualityGrade,
      buyerQualityGrade: req.qualityGrade,
      supplyLat: pool.centerLatitude,
      supplyLon: pool.centerLongitude,
      buyerLat: req.deliveryLatitude,
      buyerLon: req.deliveryLongitude,
    });

    matchScore = result.score;
    details = result;
  } else if (demandPoolId) {
    const dPool = await prisma.demandPool.findUnique({
      where: { id: demandPoolId },
    });
    if (!dPool) throw new Error('Demand pool not found');

    const result = calculateMatchScore({
      cropIdA: pool.cropId,
      cropIdB: dPool.cropId,
      supplyQuantity: pool.currentQuantity,
      demandQuantity: dPool.currentQuantity,
      supplyAvgPrice: pool.avgPricePerUnit,
      buyerMaxPrice: dPool.maxPricePerUnit,
      harvestWindowStart: pool.harvestWindowStart,
      harvestWindowEnd: pool.harvestWindowEnd,
      requiredDeliveryDate: dPool.deliveryDate,
      supplyQualityGrade: pool.qualityGrade,
      buyerQualityGrade: dPool.qualityGrade,
      supplyLat: pool.centerLatitude,
      supplyLon: pool.centerLongitude,
      buyerLat: dPool.centerLatitude,
      buyerLon: dPool.centerLongitude,
    });

    matchScore = result.score;
    details = result;
  }

  const match = await prisma.match.create({
    data: {
      supplyPoolId,
      demandPoolId,
      purchaseRequirementId,
      matchScore,
      compatibilityDetailsJson: JSON.stringify(details),
      status: 'PROPOSED',
    },
  });

  return match;
}
