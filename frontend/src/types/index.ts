export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  isVerified: boolean;
  language?: string;
  farmerProfile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
  unreadNotificationsCount?: number;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  preferredLanguage: string;
  totalAcres: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  upiId?: string;
  farms: Farm[];
}

export interface BuyerProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface Farm {
  id: string;
  farmName: string;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  totalAreaAcres: number;
  soilType?: string;
  irrigationType?: string;
}

export interface Crop {
  id: string;
  name: string;
  localNamesJson: string;
  category: string;
  unit: string;
  perishability: string;
  typicalShelfLifeDays: number;
  imageUrl?: string;
}

export interface FarmerCrop {
  id: string;
  farmerProfileId: string;
  farmId: string;
  cropId: string;
  availableQuantity: number;
  allocatedQuantity: number;
  unit: string;
  expectedPricePerUnit: number;
  harvestDate: string;
  qualityGrade: string;
  status: string;
  notes?: string;
  crop: Crop;
  farm: Farm;
}

export interface SupplyPool {
  id: string;
  cropId: string;
  crop: Crop;
  poolName: string;
  targetQuantity: number;
  currentQuantity: number;
  minPricePerUnit: number;
  maxPricePerUnit: number;
  avgPricePerUnit: number;
  qualityGrade: string;
  harvestWindowStart: string;
  harvestWindowEnd: string;
  district: string;
  state: string;
  centerLatitude: number;
  centerLongitude: number;
  status: string;
  members?: SupplyPoolMember[];
}

export interface SupplyPoolMember {
  id: string;
  supplyPoolId: string;
  farmerProfileId: string;
  farmerCropId: string;
  contributedQuantity: number;
  expectedPricePerUnit: number;
  status: string;
  farmerProfile?: {
    user: {
      name: string;
      phone: string;
    };
  };
  farmerCrop?: FarmerCrop;
}

export interface DemandPool {
  id: string;
  cropId: string;
  crop: Crop;
  poolName: string;
  targetQuantity: number;
  currentQuantity: number;
  maxPricePerUnit: number;
  qualityGrade: string;
  deliveryDate: string;
  deliveryDistrict: string;
  deliveryState: string;
  centerLatitude: number;
  centerLongitude: number;
  status: string;
  members?: DemandPoolMember[];
}

export interface DemandPoolMember {
  id: string;
  demandPoolId: string;
  buyerProfileId: string;
  requestedQuantity: number;
  offeredPricePerUnit: number;
  status: string;
  buyerProfile?: {
    businessName: string;
    user: { name: string; phone: string };
  };
}

export interface PurchaseRequirement {
  id: string;
  buyerProfileId: string;
  cropId: string;
  crop: Crop;
  quantity: number;
  unit: string;
  qualityGrade: string;
  maxPricePerUnit: number;
  deliveryAddress: string;
  deliveryDistrict: string;
  deliveryState: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  requiredDeliveryDate: string;
  status: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  cropId: string;
  crop: Crop;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
  platformFee: number;
  status: string;
  farmerPickupConfirmed: boolean;
  buyerDeliveryConfirmed: boolean;
  notes?: string;
  createdAt: string;
  buyerProfile?: BuyerProfile & { user?: { name: string; phone: string; email?: string } };
  pickupRoute?: PickupRoute;
  delivery?: Delivery;
  payment?: Payment;
  items?: OrderItem[];
  myQuantity?: number;
  mySharePrice?: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  farm: Farm;
  farmerProfile?: {
    user: { name: string; phone: string };
  };
}

export interface PickupRoute {
  id: string;
  orderId: string;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  estimatedTransportCost: number;
  vehicleCapacityKg: number;
  vehicleType: string;
  optimizationMethod: string;
  status: string;
  stops: PickupStop[];
}

export interface PickupStop {
  id: string;
  stopSequence: number;
  farmName: string;
  village: string;
  latitude: number;
  longitude: number;
  quantityToCollectKg: number;
  collectedQuantityKg: number;
  stopDistanceKm: number;
  status: string;
  pickupTimestamp?: string;
}

export interface Delivery {
  id: string;
  destinationName: string;
  destinationAddress: string;
  latitude: number;
  longitude: number;
  scheduledDeliveryDate: string;
  actualDeliveryDate?: string;
  recipientName: string;
  recipientPhone: string;
  status: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  providerPaymentId?: string;
  paidAt?: string;
}

export interface MarketPrice {
  id: string;
  cropId: string;
  crop: Crop;
  marketName: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
  trendDirection: string;
  source: string;
  isDemoData: boolean;
}

export interface GovernmentScheme {
  id: string;
  schemeName: string;
  shortCode: string;
  ministry: string;
  description: string;
  state: string;
  targetFarmerType: string;
  applicableCropsJson: string;
  benefitsDescription: string;
  benefitAmount?: number;
  applicationUrl: string;
  deadline?: string;
  status?: 'ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  reasons?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
