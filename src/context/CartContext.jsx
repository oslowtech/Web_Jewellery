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
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, dispatch] = useReducer(cartReducer, { items: [], pincode: "" });
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

  const value = {
    cart: state.items,
    pincode: state.pincode,
    total,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((prev) => !prev),
    addItem: (item) => dispatch({ type: "ADD", payload: item }),
    removeItem: (id) => dispatch({ type: "REMOVE", payload: id }),
    updateItem: (id, quantity) => dispatch({ type: "UPDATE", payload: { id, quantity } }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    setPincode: (pincode) => dispatch({ type: "SET_PINCODE", payload: pincode }),
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
