import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../services/productService.js";
import { readStorage, writeStorage } from "../utils/storage.js";

const CACHE_KEY = "products_cache";

const useProducts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const cached = readStorage(CACHE_KEY, null, sessionStorage);
    if (cached?.length) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts()
        .then((data) => {
          setProducts(data);
          writeStorage(CACHE_KEY, data, sessionStorage);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load products", error);
          setLoading(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  const meta = useMemo(() => {
    const categories = [...new Set(products.map((p) => p.category))];
    const subCategories = [...new Set(products.map((p) => p.subCategory))];
    const prices = products.map((p) => p.discountPrice || p.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return { categories, subCategories, minPrice, maxPrice };
  }, [products]);

  return { products, loading, meta };
};

export default useProducts;
