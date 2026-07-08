"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { CartItem, DeliveryType, MealDTO } from "@/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  deliveryType: DeliveryType | null;
  bookingDate: string | null;
  timeSlot: string | null;
  promoCode: string | null;
  promoDiscount: number;
  // Customer details (Phase 4)
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  customerAddress: string;
  customerNotes: string;
}

const initialState: CartState = {
  items: [],
  deliveryType: null,
  bookingDate: null,
  timeSlot: null,
  promoCode: null,
  promoDiscount: 0,
  customerName: "",
  customerWhatsapp: "",
  customerEmail: "",
  customerAddress: "",
  customerNotes: "",
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_ITEM"; meal: MealDTO }
  | { type: "REMOVE_ITEM"; mealId: string }
  | { type: "SET_QUANTITY"; mealId: string; quantity: number }
  | { type: "SET_DELIVERY"; deliveryType: DeliveryType }
  | { type: "SET_DATE"; bookingDate: string }
  | { type: "SET_TIME_SLOT"; timeSlot: string }
  | { type: "SET_PROMO"; promoCode: string; discount: number }
  | { type: "CLEAR_PROMO" }
  | { type: "CLEAR_CART" }
  | {
      type: "SET_CUSTOMER_DETAILS";
      details: {
        name: string;
        whatsapp: string;
        email: string;
        address: string;
        notes: string;
      };
    };

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.mealId === action.meal.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.mealId === action.meal.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            mealId: action.meal.id,
            mealName: action.meal.name,
            quantity: 1,
            unitPrice: action.meal.price,
          },
        ],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.mealId !== action.mealId),
      };

    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.mealId !== action.mealId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.mealId === action.mealId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "SET_DELIVERY":
      return { ...state, deliveryType: action.deliveryType };

    case "SET_DATE":
      return { ...state, bookingDate: action.bookingDate, timeSlot: null };

    case "SET_TIME_SLOT":
      return { ...state, timeSlot: action.timeSlot };

    case "SET_PROMO":
      return {
        ...state,
        promoCode: action.promoCode,
        promoDiscount: action.discount,
      };

    case "CLEAR_PROMO":
      return { ...state, promoCode: null, promoDiscount: 0 };

    case "CLEAR_CART":
      return initialState;

    case "SET_CUSTOMER_DETAILS":
      return {
        ...state,
        customerName: action.details.name,
        customerWhatsapp: action.details.whatsapp,
        customerEmail: action.details.email,
        customerAddress: action.details.address,
        customerNotes: action.details.notes,
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  state: CartState;
  addItem: (meal: MealDTO) => void;
  removeItem: (mealId: string) => void;
  setQuantity: (mealId: string, quantity: number) => void;
  setDelivery: (deliveryType: DeliveryType) => void;
  setDate: (date: string) => void;
  setTimeSlot: (slot: string) => void;
  setPromo: (code: string, discount: number) => void;
  clearPromo: () => void;
  clearCart: () => void;
  setCustomerDetails: (details: {
    name: string;
    whatsapp: string;
    email: string;
    address: string;
    notes: string;
  }) => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(
    (meal: MealDTO) => dispatch({ type: "ADD_ITEM", meal }),
    []
  );
  const removeItem = useCallback(
    (mealId: string) => dispatch({ type: "REMOVE_ITEM", mealId }),
    []
  );
  const setQuantity = useCallback(
    (mealId: string, quantity: number) =>
      dispatch({ type: "SET_QUANTITY", mealId, quantity }),
    []
  );
  const setDelivery = useCallback(
    (deliveryType: DeliveryType) =>
      dispatch({ type: "SET_DELIVERY", deliveryType }),
    []
  );
  const setDate = useCallback(
    (bookingDate: string) => dispatch({ type: "SET_DATE", bookingDate }),
    []
  );
  const setTimeSlot = useCallback(
    (timeSlot: string) => dispatch({ type: "SET_TIME_SLOT", timeSlot }),
    []
  );
  const setPromo = useCallback(
    (promoCode: string, discount: number) =>
      dispatch({ type: "SET_PROMO", promoCode, discount }),
    []
  );
  const clearPromo = useCallback(() => dispatch({ type: "CLEAR_PROMO" }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const setCustomerDetails = useCallback(
    (details: {
      name: string;
      whatsapp: string;
      email: string;
      address: string;
      notes: string;
    }) => dispatch({ type: "SET_CUSTOMER_DETAILS", details }),
    []
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        setQuantity,
        setDelivery,
        setDate,
        setTimeSlot,
        setPromo,
        clearPromo,
        clearCart,
        setCustomerDetails,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
