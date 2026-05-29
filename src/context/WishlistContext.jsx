import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

const WishlistContext = createContext(null);

const KEY = "wishlist_items";

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(readStorage(KEY, [], localStorage));
  }, []);

  useEffect(() => {
    writeStorage(KEY, items, localStorage);
  }, [items]);

  const toggle = (product) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const value = useMemo(
    () => ({
      wishlist: items,
      toggle,
      isWished: (id) => items.some((item) => item.id === id),
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
