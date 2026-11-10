export interface DeliverySettingsSnapshot {
  cardiffFee: number;
  postageFee: number;
  postageAvailable: boolean;
  cardiffDeliveryEnabled: boolean;
  minOrderCardiff: number;
  minOrderPostage: number;
  logoUrl: string | null;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettingsSnapshot = {
  cardiffFee: 5,
  postageFee: 8,
  postageAvailable: true,
  cardiffDeliveryEnabled: true,
  minOrderCardiff: 0,
  minOrderPostage: 0,
  logoUrl: null,
};