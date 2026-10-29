import { describe, it, expect } from 'vitest';
import {
  haversineDistanceKm,
  calculateTravelTimeMinutes,
  calculateTransportCost,
  optimizePickupRoute,
} from '../services/routeOptimization.service';
import { calculateMatchScore } from '../services/matching.service';
import { SchemeEligibilityService } from '../services/schemeEligibility.service';

describe('Route Optimization Service', () => {
  it('calculates accurate Haversine distance between two coordinates', () => {
    // Distance between Chennai (13.0827, 80.2707) and Bengaluru (12.9716, 77.5946) ~ 290 km
    const chennai = { latitude: 13.0827, longitude: 80.2707 };
    const bengaluru = { latitude: 12.9716, longitude: 77.5946 };

    const distance = haversineDistanceKm(chennai, bengaluru);
    expect(distance).toBeGreaterThan(280);
    expect(distance).toBeLessThan(305);
  });

  it('estimates travel time with driving and loading time', () => {
    // 76 km at 38 km/h = 120 mins driving + 2 stops * 15 mins loading = 150 mins
    const mins = calculateTravelTimeMinutes(76, 2);
    expect(mins).toBe(150);
  });

  it('calculates transport cost based on base rate + km + weight', () => {
    const cost = calculateTransportCost(100, 1000);
    expect(cost).toBeGreaterThan(2000);
    expect(cost).toBeLessThan(3500);
  });

  it('optimizes multi-stop route connecting Farm A, B, C to Buyer destination', () => {
    const farmStops = [
      { farmId: 'farm-1', farmName: 'Farm A', village: 'Mohanur', latitude: 11.0825, longitude: 78.1432, quantityKg: 100 },
      { farmId: 'farm-2', farmName: 'Farm B', village: 'Rasipuram', latitude: 11.4037, longitude: 78.1678, quantityKg: 150 },
      { farmId: 'farm-3', farmName: 'Farm C', village: 'Paramathi', latitude: 11.0456, longitude: 77.9942, quantityKg: 250 },
    ];

    const destination = {
      name: 'Central Warehouse',
      address: 'Ambattur, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
    };

    const route = optimizePickupRoute(farmStops, destination, 1500, 'Tata Ace');

    expect(route.orderedStops).toHaveLength(3);
    expect(route.totalQuantityKg).toBe(500);
    expect(route.totalDistanceKm).toBeGreaterThan(300);
    expect(route.isMultiTripNeeded).toBe(false);
    expect(route.orderedStops[0].stopSequence).toBe(1);
    expect(route.orderedStops[1].stopSequence).toBe(2);
    expect(route.orderedStops[2].stopSequence).toBe(3);
  });
});

describe('Matching Engine Service', () => {
  it('returns 0 score when crops do not match (mandatory requirement)', () => {
    const result = calculateMatchScore({
      cropIdA: 'crop-tomato',
      cropIdB: 'crop-onion',
      supplyQuantity: 500,
      demandQuantity: 500,
      supplyAvgPrice: 30,
      buyerMaxPrice: 35,
      harvestWindowStart: new Date(),
      harvestWindowEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      requiredDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      supplyQualityGrade: 'GRADE_A',
      buyerQualityGrade: 'GRADE_A',
      supplyLat: 11.2,
      supplyLon: 78.1,
      buyerLat: 13.0,
      buyerLon: 80.2,
    });

    expect(result.cropMatched).toBe(false);
    expect(result.score).toBe(0);
    expect(result.isFeasible).toBe(false);
  });

  it('calculates high compatibility score for matching crops with compatible price & quantity', () => {
    const result = calculateMatchScore({
      cropIdA: 'crop-tomato',
      cropIdB: 'crop-tomato',
      supplyQuantity: 500,
      demandQuantity: 500,
      supplyAvgPrice: 31,
      buyerMaxPrice: 35,
      harvestWindowStart: new Date(),
      harvestWindowEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      requiredDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      supplyQualityGrade: 'GRADE_A',
      buyerQualityGrade: 'GRADE_A',
      supplyLat: 11.2,
      supplyLon: 78.1,
      buyerLat: 11.4,
      buyerLon: 78.3, // close proximity ~ 30km
    });

    expect(result.cropMatched).toBe(true);
    expect(result.score).toBeGreaterThan(85);
    expect(result.isFeasible).toBe(true);
  });
});
