export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const buildProductSlug = (product) =>
  `${slugify(product.name)}-${product.id}`.toLowerCase();

export const getIdFromSlug = (slug) => {
  if (!slug) return "";
  const parts = slug.split("-");
  return parts[parts.length - 1]?.toUpperCase() || "";
};
