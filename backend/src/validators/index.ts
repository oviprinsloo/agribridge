import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  role: z.enum(['FARMER', 'BUYER']),
  // Farmer specific fields
  preferredLanguage: z.string().optional(),
  farmName: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  totalAreaAcres: z.number().positive().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  upiId: z.string().optional(),
  // Buyer specific fields
  businessName: z.string().optional(),
  businessType: z.enum(['RETAILER', 'WHOLESALER', 'HOTEL', 'RESTAURANT', 'FOOD_PROCESSOR', 'EXPORTER', 'OTHER']).optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createFarmerCropSchema = z.object({
  farmId: z.string().uuid('Valid farm ID required'),
  cropId: z.string().uuid('Valid crop ID required'),
  availableQuantity: z.number().positive('Available quantity must be greater than 0'),
  unit: z.string().default('kg'),
  expectedPricePerUnit: z.number().nonnegative('Expected price must be positive'),
  harvestDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  qualityGrade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C']).default('GRADE_A'),
  notes: z.string().optional(),
});

export const updateFarmerCropSchema = z.object({
  availableQuantity: z.number().positive().optional(),
  expectedPricePerUnit: z.number().nonnegative().optional(),
  qualityGrade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C']).optional(),
  status: z.enum(['AVAILABLE', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'EXPIRED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

export const createSupplyPoolSchema = z.object({
  cropId: z.string().uuid(),
  poolName: z.string().min(3),
  targetQuantity: z.number().positive('Target quantity must be greater than 0'),
  minPricePerUnit: z.number().nonnegative(),
  maxPricePerUnit: z.number().nonnegative(),
  avgPricePerUnit: z.number().nonnegative(),
  qualityGrade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C']).default('GRADE_A'),
  harvestWindowStart: z.string(),
  harvestWindowEnd: z.string(),
  district: z.string(),
  state: z.string(),
  centerLatitude: z.number(),
  centerLongitude: z.number(),
  initialFarmerCropId: z.string().uuid().optional(),
  initialContributedQuantity: z.number().positive().optional(),
});

export const joinSupplyPoolSchema = z.object({
  farmerCropId: z.string().uuid(),
  contributedQuantity: z.number().positive('Contributed quantity must be greater than 0'),
  expectedPricePerUnit: z.number().nonnegative('Price must be greater than or equal to 0'),
});

export const createPurchaseRequirementSchema = z.object({
  cropId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('kg'),
  qualityGrade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C']).default('GRADE_A'),
  maxPricePerUnit: z.number().positive('Maximum price must be positive'),
  deliveryAddress: z.string().min(5),
  deliveryDistrict: z.string().min(2),
  deliveryState: z.string().min(2),
  deliveryLatitude: z.number(),
  deliveryLongitude: z.number(),
  requiredDeliveryDate: z.string(),
});

export const createDemandPoolSchema = z.object({
  cropId: z.string().uuid(),
  poolName: z.string().min(3),
  targetQuantity: z.number().positive('Target quantity must be greater than 0'),
  maxPricePerUnit: z.number().positive(),
  qualityGrade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C']).default('GRADE_A'),
  deliveryDate: z.string(),
  deliveryDistrict: z.string(),
  deliveryState: z.string(),
  centerLatitude: z.number(),
  centerLongitude: z.number(),
  initialRequirementId: z.string().uuid().optional(),
  initialRequestedQuantity: z.number().positive().optional(),
  initialOfferedPrice: z.number().positive().optional(),
});

export const joinDemandPoolSchema = z.object({
  purchaseRequirementId: z.string().uuid().optional(),
  requestedQuantity: z.number().positive('Requested quantity must be positive'),
  offeredPricePerUnit: z.number().positive('Offered price must be positive'),
});

export const createMatchSchema = z.object({
  supplyPoolId: z.string().uuid().optional(),
  demandPoolId: z.string().uuid().optional(),
  purchaseRequirementId: z.string().uuid().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'CREATED',
    'MATCHED',
    'ACCEPTED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'PAYMENT_PENDING',
    'PAID',
    'COMPLETED',
    'DISPUTED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export const createDisputeSchema = z.object({
  orderId: z.string().uuid(),
  reasonCategory: z.enum(['QUANTITY_MISMATCH', 'QUALITY_ISSUE', 'LATE_DELIVERY', 'PAYMENT_ISSUE', 'DAMAGED_PRODUCE', 'OTHER']),
  description: z.string().min(10, 'Detailed description is required'),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const resolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  resolutionNotes: z.string().min(5),
});

export const schemeEligibilityCheckSchema = z.object({
  state: z.string(),
  totalLandAcres: z.number().nonnegative(),
  cropsGrown: z.array(z.string()).optional(),
  farmerCategory: z.enum(['Marginal (Under 2.5 acres)', 'Small (2.5 to 5 acres)', 'Medium (5 to 10 acres)', 'Large (>10 acres)']).optional(),
  annualIncome: z.number().nonnegative().optional(),
  hasIrrigation: z.boolean().optional(),
});

export const mockPaymentCheckoutSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(['UPI', 'NET_BANKING', 'CARD', 'ESCROW_WALLET']),
  upiId: z.string().optional(),
});

export const aiAssistantQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
});
