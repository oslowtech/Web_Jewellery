export const buildProductImagePath = (productId, fileName) =>
  `/images/products/${productId}/${fileName}`;

export const buildProductImages = (productId, imageFiles = []) =>
  imageFiles.map((fileName) => buildProductImagePath(productId, fileName));
