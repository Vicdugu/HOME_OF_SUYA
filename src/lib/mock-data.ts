/**
 * TEMPORARY mock data — used during Phase 2/3 before the Neon DB is connected.
 * This file will be removed once the DB is live and API routes return real data.
 */
import type { MealDTO } from "@/types";

export const MOCK_MEALS: MealDTO[] = [
  {
    id: "meal-1",
    name: "Suya Stick (Beef)",
    description:
      "Thinly sliced marinated beef skewers grilled over open flame with our signature yaji spice blend.",
    price: 8.0,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: true,
    sortOrder: 1,
  },
  {
    id: "meal-2",
    name: "Suya Stick (Chicken)",
    description:
      "Tender chicken breast strips marinated overnight in yaji spice, flame-grilled to perfection.",
    price: 7.5,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: true,
    sortOrder: 2,
  },
  {
    id: "meal-3",
    name: "Suya Stick (Lamb)",
    description:
      "Juicy lamb strips with a rich smoky flavour, marinated in our special Hausa spice mix.",
    price: 9.0,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: true,
    sortOrder: 3,
  },
  {
    id: "meal-4",
    name: "Suya Wrap",
    description:
      "Warm flatbread filled with suya beef, fresh tomatoes, onions, suya seasoning and house sauce.",
    price: 10.0,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: true,
    sortOrder: 4,
  },
  {
    id: "meal-5",
    name: "Suya Platter (Mixed)",
    description:
      "A generous platter of beef, chicken, and lamb suya sticks served with peppered onions and tomatoes.",
    price: 22.0,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: true,
    sortOrder: 5,
  },
  {
    id: "meal-6",
    name: "Kilishi",
    description:
      "Crispy dried spiced beef — a Nigerian jerky classic. Perfect as a snack or side.",
    price: 6.5,
    imageUrl: "/images/meals/placeholder.jpg",
    isAvailable: false,
    sortOrder: 6,
  },
];

/**
 * Blocked dates as YYYY-MM-DD strings.
 * Replace with real DB data once Neon is connected.
 */
export const MOCK_BLOCKED_DATES: string[] = [
  // Example: block one upcoming Friday for illustration
  // "2026-07-11",
];

/** Default delivery settings used before DB is connected. */
export const MOCK_DELIVERY_SETTINGS = {
  cardiffFee: 5.0,
  postageFee: 8.0,
  postageAvailable: true,
  minOrderCardiff: 0,
  minOrderPostage: 0,
};
