import { Coordinate, RouteStopInput, OptimizedStopOutput, OptimizedRouteResult } from '../types';

/**
 * Calculates Great-Circle distance using Haversine formula (km)
 */
export function haversineDistanceKm(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculates estimated travel time in minutes based on distance and loading time
 * Average rural/semi-urban transport speed: 38 km/h + 15 mins loading per stop
 */
export function calculateTravelTimeMinutes(distanceKm: number, numberOfStops: number): number {
  const averageSpeedKmH = 38;
  const drivingMinutes = (distanceKm / averageSpeedKmH) * 60;
  const loadingMinutes = numberOfStops * 15;
  return Math.round(drivingMinutes + loadingMinutes);
}

/**
 * Estimates transport cost in INR based on base charge + per km rate + cargo weight factor
 */
export function calculateTransportCost(distanceKm: number, totalWeightKg: number): number {
  const baseCost = 450; // Base vehicle callout charge
  const perKmRate = 18.5; // Commercial mini-truck rate per km
  const cargoWeightRate = 0.15; // Cargo loading per kg-km

  const totalCost = baseCost + (distanceKm * perKmRate) + (distanceKm * (totalWeightKg / 1000) * cargoWeightRate * 50);
  return Math.round(totalCost);
}

/**
 * 2-Opt heuristic optimization to eliminate crossing routes
 */
function applyTwoOptOptimization(
  route: RouteStopInput[],
  destination: Coordinate
): RouteStopInput[] {
  if (route.length <= 2) return route;

  let bestRoute = [...route];
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  const calculateTourLength = (r: RouteStopInput[]): number => {
    let d = 0;
    for (let i = 0; i < r.length - 1; i++) {
      d += haversineDistanceKm(r[i], r[i + 1]);
    }
    // Plus distance from last farm stop to final buyer destination
    d += haversineDistanceKm(r[r.length - 1], destination);
    return d;
  };

  let bestDist = calculateTourLength(bestRoute);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        // Reverse sub-array between i and k
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1),
        ];

        const newDist = calculateTourLength(newRoute);
        if (newDist < bestDist - 0.05) {
          bestRoute = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Optimizes the multi-stop farm collection route to a final buyer destination
 * Using Nearest-Neighbor TSP construction + 2-Opt local refinement
 */
export function optimizePickupRoute(
  farmStops: RouteStopInput[],
  destination: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  },
  vehicleCapacityKg: number = 1500,
  vehicleType: string = 'Tata Ace (Mini Truck)'
): OptimizedRouteResult {
  if (!farmStops || farmStops.length === 0) {
    throw new Error('At least one farm stop is required for route optimization.');
  }

  const totalQuantityKg = farmStops.reduce((sum, stop) => sum + stop.quantityKg, 0);
  const isMultiTripNeeded = totalQuantityKg > vehicleCapacityKg;

  // Single stop edge-case
  if (farmStops.length === 1) {
    const singleFarm = farmStops[0];
    const dist = haversineDistanceKm(singleFarm, destination);
    const durationMins = calculateTravelTimeMinutes(dist, 1);
    const cost = calculateTransportCost(dist, totalQuantityKg);

    const orderedStops: OptimizedStopOutput[] = [
      {
        ...singleFarm,
        stopSequence: 1,
        stopDistanceKm: dist,
        cumulativeDistanceKm: dist,
        estimatedArrivalMins: Math.round((dist / 38) * 60),
      },
    ];

    return {
      orderedStops,
      destination,
      totalDistanceKm: dist,
      estimatedDurationMins: durationMins,
      estimatedTransportCost: cost,
      totalQuantityKg,
      vehicleCapacityKg,
      vehicleType,
      optimizationMethod: 'Direct Route (Single Stop)',
      isMultiTripNeeded,
    };
  }

  // 1. Nearest Neighbor Route Construction
  // Find farm furthest from destination or start at first cluster edge
  // Standard practice: Start at the farm furthest from destination to collect inward toward the warehouse
  let unvisited = [...farmStops];
  let currentStop = unvisited.reduce((furthest, stop) => {
    const dStop = haversineDistanceKm(stop, destination);
    const dFurthest = haversineDistanceKm(furthest, destination);
    return dStop > dFurthest ? stop : furthest;
  }, unvisited[0]);

  const orderedInitial: RouteStopInput[] = [currentStop];
  unvisited = unvisited.filter((s) => s.farmId !== currentStop.farmId);

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistanceKm(currentStop, unvisited[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    currentStop = unvisited[nearestIdx];
    orderedInitial.push(currentStop);
    unvisited.splice(nearestIdx, 1);
  }

  // 2. Refine route with 2-Opt heuristic
  const optimizedFarms = applyTwoOptOptimization(orderedInitial, destination);

  // 3. Assemble sequential metrics
  const orderedStops: OptimizedStopOutput[] = [];
  let cumulativeDist = 0;
  let cumulativeMins = 0;

  for (let i = 0; i < optimizedFarms.length; i++) {
    const current = optimizedFarms[i];
    let legDist = 0;

    if (i === 0) {
      // Distance from depot / starting farm (0 reference)
      legDist = 0;
    } else {
      legDist = haversineDistanceKm(optimizedFarms[i - 1], current);
    }

    cumulativeDist += legDist;
    const drivingTime = (legDist / 38) * 60;
    cumulativeMins += Math.round(drivingTime + (i > 0 ? 15 : 0));

    orderedStops.push({
      ...current,
      stopSequence: i + 1,
      stopDistanceKm: legDist,
      cumulativeDistanceKm: Math.round(cumulativeDist * 100) / 100,
      estimatedArrivalMins: cumulativeMins,
    });
  }

  // Final leg: from last farm to buyer destination
  const lastFarm = optimizedFarms[optimizedFarms.length - 1];
  const finalLegDist = haversineDistanceKm(lastFarm, destination);
  cumulativeDist += finalLegDist;
  const finalDrivingTime = (finalLegDist / 38) * 60;
  cumulativeMins += Math.round(finalDrivingTime);

  const roundedTotalDist = Math.round(cumulativeDist * 100) / 100;
  const estimatedTransportCost = calculateTransportCost(roundedTotalDist, totalQuantityKg);

  return {
    orderedStops,
    destination,
    totalDistanceKm: roundedTotalDist,
    estimatedDurationMins: cumulativeMins,
    estimatedTransportCost,
    totalQuantityKg,
    vehicleCapacityKg,
    vehicleType,
    optimizationMethod: 'Nearest-Neighbor + 2-Opt Heuristic',
    isMultiTripNeeded,
  };
}
