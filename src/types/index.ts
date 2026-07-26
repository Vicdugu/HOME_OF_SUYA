export type DeliveryType = "PICKUP" | "CARDIFF" | "POSTAGE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type DiscountType = "PERCENT" | "FIXED";
export type VariationSelectionType = "SINGLE" | "MULTIPLE";

/** Extended AdminUser type including fields added after initial migration */
export interface AdminUserFull {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  passwordHash: string | null;
  isVerified: boolean;
  role: string;
  status: string;
  verificationToken: string | null;
  verificationTokenExpiry: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
}

export interface CartItem {
  cartItemId: string;
  mealId: string;
  mealName: string;
  quantity: number;
  unitPrice: number;
  selections: CartItemSelection[];
}

export type MealVariationSelection = Record<string, string[]>;

export interface MealVariationOptionDTO {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface MealVariationGroupDTO {
  id: string;
  name: string;
  selectionType: VariationSelectionType;
  sortOrder: number;
  options: MealVariationOptionDTO[];
}

export interface CartItemSelection {
  groupId: string;
  groupName: string;
  selectionType: VariationSelectionType;
  optionIds: string[];
  optionNames: string[];
}

export interface Cart {
  items: CartItem[];
  deliveryType: DeliveryType | null;
  bookingDate: string | null; // ISO date string
  timeSlot: string | null;
  promoCode: string | null;
}

export interface MealDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  sortOrder: number;
  variationGroups: MealVariationGroupDTO[];
}

export interface DeliverySettingsDTO {
  cardiffFee: number;
  postageFee: number;
  postageAvailable: boolean;
  minOrderCardiff: number;
  minOrderPostage: number;
}

export interface BookingDTO {
  id: string;
  reference: string;
  customerName: string;
  whatsapp: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  deliveryType: DeliveryType;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  bookingDate: string;
  timeSlot: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  items: CartItem[];
  createdAt: string;
}

export interface PromoCodeDTO {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}
