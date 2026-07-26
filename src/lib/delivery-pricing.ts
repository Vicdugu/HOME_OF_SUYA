import type { DeliveryType } from "@/types";

export const DISCOUNTED_POSTAGE_THRESHOLD = 25;
export const DISCOUNTED_POSTAGE_FEE = 7;

interface DeliveryPricingSettings {
  cardiffFee: number;
  postageFee: number;
}

export function getDeliveryFee(
  deliveryType: DeliveryType | null,
  subtotal: number,
  settings: DeliveryPricingSettings
) {
  if (!deliveryType || deliveryType === "PICKUP") {
    return 0;
  }

  if (deliveryType === "CARDIFF") {
    return settings.cardiffFee;
  }

  return subtotal > DISCOUNTED_POSTAGE_THRESHOLD
    ? DISCOUNTED_POSTAGE_FEE
    : settings.postageFee;
}