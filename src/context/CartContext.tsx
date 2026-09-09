"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
} from "react";
import type { CartItem, DeliveryType } from "@/types";

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
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; cartItemId: string }
  | { type: "SET_QUANTITY"; cartItemId: string; quantity: number }
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
      const existing = state.items.find((i) => i.cartItemId === action.item.cartItemId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.cartItemId === action.item.cartItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, action.item],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.cartItemId !== action.cartItemId),
      };

    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.cartItemId !== action.cartItemId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartItemId === action.cartItemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "SET_DELIVERY":
      return { ...state, deliveryType: action.deliveryType, timeSlot: null };

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
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
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
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [cartOpen, setCartOpenState] = useState(false);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((item: CartItem) => dispatch({ type: "ADD_ITEM", item }), []);
  const removeItem = useCallback(
    (cartItemId: string) => dispatch({ type: "REMOVE_ITEM", cartItemId }),
    []
  );
  const setQuantity = useCallback(
    (cartItemId: string, quantity: number) =>
      dispatch({ type: "SET_QUANTITY", cartItemId, quantity }),
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
  const setCartOpen = useCallback((open: boolean) => setCartOpenState(open), []);

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
        cartOpen,
        setCartOpen,
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
