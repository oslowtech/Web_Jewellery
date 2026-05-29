export const applyFilters = (products, filters) => {
  const {
    query = "",
    genders = [],
    categories = [],
    subCategories = [],
    priceRange = [0, Infinity],
    featuredOnly = false,
    newOnly = false,
    sort = "",
  } = filters;

  const normalizedQuery = query.trim().toLowerCase();

  let filtered = products.filter((product) => {
    const effectivePrice = product.discountPrice || product.price;
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.id.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    const matchesGender =
      genders.length === 0 || genders.includes(product.gender);
    const matchesCategory =
      categories.length === 0 || categories.includes(product.category);
    const matchesSubCategory =
      subCategories.length === 0 || subCategories.includes(product.subCategory);
    const matchesPrice =
      effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
    const matchesFeatured = !featuredOnly || product.featured;
    const matchesNew = !newOnly || product.isNew;

    return (
      matchesQuery &&
      matchesGender &&
      matchesCategory &&
      matchesSubCategory &&
      matchesPrice &&
      matchesFeatured &&
      matchesNew
    );
  });

  switch (sort) {
    case "price-asc":
      filtered = [...filtered].sort(
        (a, b) =>
          (a.discountPrice || a.price) - (b.discountPrice || b.price)
      );
      break;
    case "price-desc":
      filtered = [...filtered].sort(
        (a, b) =>
          (b.discountPrice || b.price) - (a.discountPrice || a.price)
      );
      break;
    case "new":
      filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    case "featured":
      filtered = [...filtered].sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      );
      break;
    default:
      break;
  }

  return filtered;
};
