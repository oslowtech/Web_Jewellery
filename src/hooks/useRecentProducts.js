import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

const KEY = "recent_products";
const LIMIT = 6;

const useRecentProducts = (currentProduct) => {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const stored = readStorage(KEY, [], sessionStorage);
    setRecent(stored);
  }, []);

  useEffect(() => {
    if (!currentProduct) return;
    setRecent((prev) => {
      const next = [currentProduct, ...prev.filter((p) => p.id !== currentProduct.id)];
      const trimmed = next.slice(0, LIMIT);
      writeStorage(KEY, trimmed, sessionStorage);
      return trimmed;
    });
  }, [currentProduct]);

  return recent;
};

export default useRecentProducts;
