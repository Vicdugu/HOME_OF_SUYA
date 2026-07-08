export type DeliveryType = "PICKUP" | "CARDIFF" | "POSTAGE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type DiscountType = "PERCENT" | "FIXED";

export interface CartItem {
  mealId: string;
  mealName: string;
  quantity: number;
  unitPrice: number;
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
