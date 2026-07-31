import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "orange_spa_cart";

const emptyCart = {
  services: [],   // { serviceId, durationId, name, durationMinutes, price }
  mocktails: [],  // { mocktailId, name, price, qty }
  timeSlotId: null,
  timeSlotLabel: null, // display only, e.g. "10:00 AM"
  couponCode: "",
};

const loadInitialCart = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : emptyCart;
  } catch {
    return emptyCart; // corrupted/old data — don't crash the app, just start fresh
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(loadInitialCart);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addService = (service) => {
    setCart((prev) => {
      const exists = prev.services.some(
        (s) => s.serviceId === service.serviceId && s.durationId === service.durationId
      );
      if (exists) return prev; // same service+duration already in cart, don't duplicate
      return { ...prev, services: [...prev.services, service] };
    });
  };

  const removeService = (serviceId, durationId) => {
    setCart((prev) => ({
      ...prev,
      services: prev.services.filter(
        (s) => !(s.serviceId === serviceId && s.durationId === durationId)
      ),
    }));
  };

  const addMocktail = (mocktail) => {
    setCart((prev) => {
      const existing = prev.mocktails.find((m) => m.mocktailId === mocktail.mocktailId);
      if (existing) {
        return {
          ...prev,
          mocktails: prev.mocktails.map((m) =>
            m.mocktailId === mocktail.mocktailId ? { ...m, qty: m.qty + 1 } : m
          ),
        };
      }
      return { ...prev, mocktails: [...prev.mocktails, { ...mocktail, qty: 1 }] };
    });
  };

  const updateMocktailQty = (mocktailId, qty) => {
    setCart((prev) => {
      if (qty <= 0) {
        return { ...prev, mocktails: prev.mocktails.filter((m) => m.mocktailId !== mocktailId) };
      }
      return {
        ...prev,
        mocktails: prev.mocktails.map((m) =>
          m.mocktailId === mocktailId ? { ...m, qty } : m
        ),
      };
    });
  };

  const removeMocktail = (mocktailId) => {
    setCart((prev) => ({
      ...prev,
      mocktails: prev.mocktails.filter((m) => m.mocktailId !== mocktailId),
    }));
  };

  const setTimeSlot = (timeSlotId, timeSlotLabel) => {
    setCart((prev) => ({ ...prev, timeSlotId, timeSlotLabel }));
  };

  const setCouponCode = (couponCode) => {
    setCart((prev) => ({ ...prev, couponCode }));
  };

  const clearCart = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setCart(emptyCart);
  };

  // Strips display-only fields (name, price, durationMinutes, timeSlotLabel) down to
  // exactly what the backend schemas expect. This is the ONLY place this mapping happens —
  // every API call (/bookings/calculate and /bookings) must go through this, never build
  // the payload inline in a page component, or the shapes will drift apart over time.
  const toBookingPayload = () => ({
    services: cart.services.map(({ serviceId, durationId }) => ({ serviceId, durationId })),
    mocktails: cart.mocktails.map(({ mocktailId, qty }) => ({ mocktailId, qty })),
    ...(cart.couponCode ? { couponCode: cart.couponCode } : {}),
  });

  const isEmpty = cart.services.length === 0 && cart.mocktails.length === 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addService,
        removeService,
        addMocktail,
        updateMocktailQty,
        removeMocktail,
        setTimeSlot,
        setCouponCode,
        clearCart,
        toBookingPayload,
        isEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};