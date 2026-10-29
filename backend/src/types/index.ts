export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type CropCategory = 'VEGETABLE' | 'FRUIT' | 'GRAIN' | 'PULSE' | 'SPICE';

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

export type FarmerCropStatus = 'AVAILABLE' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'EXPIRED' | 'CANCELLED';

export type SupplyPoolStatus = 'OPEN' | 'TARGET_REACHED' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type DemandPoolStatus = 'OPEN' | 'TARGET_REACHED' | 'MATCHED' | 'DELIVERY_PENDING' | 'COMPLETED' | 'CANCELLED';

export type PurchaseRequirementStatus = 'OPEN' | 'PARTIALLY_POOLED' | 'FULLY_POOLED' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';

export type OrderStatus =
  | 'CREATED'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  farmerProfileId?: string;
  buyerProfileId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: any[];
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStopInput {
  farmId: string;
  farmName: string;
  village: string;
  latitude: number;
  longitude: number;
  quantityKg: number;
}

export interface OptimizedStopOutput extends RouteStopInput {
  stopSequence: number;
  stopDistanceKm: number;
  cumulativeDistanceKm: number;
  estimatedArrivalMins: number;
}

export interface OptimizedRouteResult {
  orderedStops: OptimizedStopOutput[];
  destination: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  totalDistanceKm: number;
  estimatedDurationMins: number;
  estimatedTransportCost: number;
  totalQuantityKg: number;
  vehicleCapacityKg: number;
  vehicleType: string;
  optimizationMethod: string;
  isMultiTripNeeded: boolean;
}

export interface MatchScoreResult {
  score: number;
  cropMatched: boolean;
  quantityCompatibility: number;
  priceCompatibility: number;
  dateCompatibility: number;
  qualityCompatibility: number;
  distanceKm: number;
  distanceScore: number;
  isFeasible: boolean;
  breakdown: Record<string, any>;
}

export interface SchemeEligibilityResult {
  schemeId: string;
  schemeName: string;
  shortCode: string;
  ministry: string;
  status: 'ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  benefitAmount?: number;
  benefitsDescription: string;
  applicationUrl: string;
  reasons: string[];
}
