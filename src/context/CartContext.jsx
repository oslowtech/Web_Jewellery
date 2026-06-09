import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const CartContext = createContext(null);

const CART_KEY = "cart_items";
const SESSION_KEY = "cart_session";
const PINCODE_KEY = "shipping_pincode";

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    case "UPDATE":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case "SET":
      return { ...state, items: action.payload };
    case "CLEAR":
      return { ...state, items: [] };
    case "SET_PINCODE":
      return { ...state, pincode: action.payload };
    case "SET_COUPON":
      return { ...state, coupon: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, dispatch] = useReducer(cartReducer, { items: [], pincode: "", coupon: null });
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "SIGNED_OUT") {
        dispatch({ type: "CLEAR" });
        setDbLoaded(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const sessionCart = readStorage(SESSION_KEY, null, sessionStorage);
    const localCart = readStorage(CART_KEY, [], localStorage);
    const pincode = readStorage(PINCODE_KEY, "", localStorage);

    if (sessionCart?.length) {
      dispatch({ type: "SET", payload: sessionCart });
    } else if (localCart?.length) {
      dispatch({ type: "SET", payload: localCart });
    }

    if (pincode) {
      dispatch({ type: "SET_PINCODE", payload: pincode });
    }

    setInitialized(true);
  }, []);

  // Load and merge cart from DB when user logs in
  useEffect(() => {
    if (!initialized || !isSupabaseConfigured || !supabase) return;

    if (!user) {
      setDbLoaded(false);
      return;
    }

    const loadDbCart = async () => {
      try {
        const { data, error } = await supabase
          .from("user_carts")
          .select("cart_items")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching cart from DB:", error);
          setDbLoaded(true);
          return;
        }

        if (data?.cart_items) {
          const remoteCart = data.cart_items;
          const localCart = state.items;

          // Merge DB items with existing local items (if user shopped before logging in)
          const merged = [...remoteCart];
          localCart.forEach((localItem) => {
            const existing = merged.find((r) => r.id === localItem.id);
            if (existing) {
              existing.quantity = Math.max(existing.quantity, localItem.quantity);
            } else {
              merged.push(localItem);
            }
          });

          dispatch({ type: "SET", payload: merged });
        }
      } catch (err) {
        console.error("Unexpected error loading DB cart:", err);
      } finally {
        setDbLoaded(true);
      }
    };

    loadDbCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, initialized]);

  useEffect(() => {
    if (!initialized) return;

    writeStorage(CART_KEY, state.items, localStorage);
    writeStorage(SESSION_KEY, state.items, sessionStorage);
    writeStorage(PINCODE_KEY, state.pincode, localStorage);

    // Sync to DB if logged in
    if (user && isSupabaseConfigured && supabase && dbLoaded) {
      supabase
        .from("user_carts")
        .upsert({
          user_id: user.id,
          cart_items: state.items,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("Error syncing cart to DB:", error);
        });
    }
  }, [state, initialized, user, dbLoaded]);

  const total = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
        0
      ),
    [state.items]
  );

  // Extremely robust logic to maximize the bundle/coupon discount
  const discountAmount = useMemo(() => {
    if (!state.coupon) return 0;
    const { discount_type, discount_value, required_quantity, valid_product_ids } = state.coupon;
    
    if (discount_type === 'fixed_amount') {
      return Math.min(total, discount_value);
    }
    if (discount_type === 'percentage') {
      return total * (discount_value / 100);
    }
    if (discount_type === 'bundle') {
      const validItems = state.items.flatMap(item => {
        const baseId = item.id.split('-')[0];
        if (!valid_product_ids || valid_product_ids.length === 0 || valid_product_ids.includes(baseId)) {
          return Array(item.quantity).fill(item.discountPrice || item.price);
        }
        return [];
      });
      
      if (validItems.length >= required_quantity) {
        validItems.sort((a, b) => b - a); // Group the highest priced eligible items into the bundle to maximize their savings
        let bundleDiscount = 0;
        const numberOfBundles = Math.floor(validItems.length / required_quantity);
        for (let i = 0; i < numberOfBundles; i++) {
          let bundleOriginalPrice = 0;
          for (let j = 0; j < required_quantity; j++) {
            bundleOriginalPrice += validItems[i * required_quantity + j];
          }
          bundleDiscount += Math.max(0, bundleOriginalPrice - discount_value);
        }
        return bundleDiscount;
      }
    }
    return 0;
  }, [state.coupon, state.items, total]);

  const value = {
    cart: state.items,
    pincode: state.pincode,
    coupon: state.coupon,
    total,
    discountAmount,
    finalTotal: total - discountAmount,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((prev) => !prev),
    addItem: (item) => dispatch({ type: "ADD", payload: item }),
    removeItem: (id) => dispatch({ type: "REMOVE", payload: id }),
    updateItem: (id, quantity) => dispatch({ type: "UPDATE", payload: { id, quantity } }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    setPincode: (pincode) => dispatch({ type: "SET_PINCODE", payload: pincode }),
    applyCoupon: async (code) => {
      if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single();
      if (error || !data) throw new Error("Invalid or expired coupon code.");
      dispatch({ type: "SET_COUPON", payload: data });
      return data;
    },
    removeCoupon: () => dispatch({ type: "SET_COUPON", payload: null }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
