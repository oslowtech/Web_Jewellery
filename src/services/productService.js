import productsData from "../data/products.json";
import { buildProductImages } from "../utils/productImages.js";

export const fetchProducts = async () => {
  return productsData.map((product) => ({
    ...product,
    images: product.imageFiles?.length
      ? buildProductImages(product.id, product.imageFiles)
      : product.images ?? [],
  }));
};

