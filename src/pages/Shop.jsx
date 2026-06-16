import { useEffect, useMemo, useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useProducts from "../hooks/useProducts.js";
import useDebounce from "../hooks/useDebounce.js";
import usePageMeta from "../hooks/usePageMeta.js";
import { applyFilters } from "../utils/filters.js";
import { buildProductSlug } from "../utils/slug.js";
import ProductGrid from "../components/product/ProductGrid.jsx";
import FilterDrawer from "../components/filters/FilterDrawer.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import EmptyState from "../components/common/EmptyState.jsx";

const Shop = () => {
  usePageMeta({
    title: "Shop Artificial Jewellery | Nagneshwari Jewels",
    description: "Browse premium artificial jewellery with refined filters and search.",
  });

  const { products, loading, meta } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get("category");

  const [filters, setFilters] = useState({
    query: "",
    genders: [],
    categories: initialCategory ? [initialCategory] : [],
    subCategories: [],
    priceRange: [0, 0],
    sort: "",
    featuredOnly: false,
    newOnly: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const debouncedQuery = useDebounce(filters.query, 300);

  const categoriesList = useMemo(() => {
    if (!products) return ["All"];
    return ["All", ...new Set(products.map((p) => p.category))].filter(Boolean);
  }, [products]);

  const currentCategory = filters.categories.length === 1 ? filters.categories[0] : "All";

  const handleCategoryClick = (category) => {
    if (category === "All") {
      setFilters((prev) => ({ ...prev, categories: [] }));
      searchParams.delete("category");
    } else {
      setFilters((prev) => ({ ...prev, categories: [category] }));
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
    setVisibleCount(8);
  };

  useEffect(() => {
    if (meta.maxPrice > 0) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [meta.minPrice, meta.maxPrice],
      }));
    }
  }, [meta.maxPrice, meta.minPrice]);

  const filtered = useMemo(() => {
    const result = [...applyFilters(products, {
      ...filters,
      query: debouncedQuery,
    })];
    // Only apply the custom sort order if the user hasn't selected a specific manual sort option
    if (!filters.sort) {
      result.sort((a, b) => {
        const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
        const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
        if (orderA !== orderB) return orderA - orderB;
        return String(a.name).localeCompare(String(b.name));
      });
    }
    return result;
  }, [products, filters, debouncedQuery]);

  useEffect(() => {
    setVisibleCount(8);
  }, [
    debouncedQuery,
    filters.genders,
    filters.categories,
    filters.subCategories,
    filters.priceRange,
    filters.sort,
    filters.featuredOnly,
    filters.newOnly,
  ]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    return products
      .filter((product) => {
        const q = debouncedQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.id.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 6);
  }, [debouncedQuery, products]);

  const visibleProducts = filtered.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Injected CSS to fix the price slider thumb alignment */}
      <style>{`
        /* 1. Fix overlapping dual sliders so BOTH thumbs can be dragged */
        input[type="range"] {
          pointer-events: none; /* Let clicks pass through the track */
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          margin: 0;
          width: 100%;
        }

        /* 2. Pull the second input UP by exactly its own height so it overlaps perfectly! */
        input[type="range"] + input[type="range"] {
          transform: translateY(-100%) !important;
        }

        input[type="range"]::-webkit-slider-thumb {
          pointer-events: auto; /* Re-enable clicks ONLY on the thumbs */
          -webkit-appearance: none;
          appearance: none;
          /* Pull the thumb slightly up to perfectly center it on your track line */
          /* If it is STILL slightly below the line, change this to -4px or -6px */
          transform: translateY(-2px); 
        }
        
        input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          transform: translateY(-2px);
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          query={filters.query}
          onChange={(value) => setFilters((prev) => ({ ...prev, query: value }))}
          suggestions={suggestions}
          onSelect={(product) => {
            setFilters((prev) => ({ ...prev, query: "" }));
            navigate(`/product/${buildProductSlug(product)}`);
          }}
        />
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-onyx/20 px-4 py-2 text-sm"
            onClick={() => setDrawerOpen(true)}
          >
            <Filter size={16} />
            Filters
          </button>
          <div className="relative">
            <SlidersHorizontal
              size={16}
              className="pointer-events-none absolute left-3 top-3 text-stone"
            />
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, sort: event.target.value }))
              }
              className="rounded-full border border-onyx/20 bg-white/80 py-2 pl-9 pr-8 text-sm"
            >
              <option value="">Sort</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="new">New arrivals</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categoriesList.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              currentCategory === category
                ? "bg-onyx text-white shadow-md"
                : "border border-white/70 bg-white/80 text-onyx hover:bg-stone/10"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          title="No results"
          description="Try adjusting your search or filters to find the perfect piece."
          action={
            <button
              className="rounded-full bg-onyx px-4 py-2 text-sm text-white"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  query: "",
                  genders: [],
                  categories: [],
                  subCategories: [],
                  featuredOnly: false,
                  newOnly: false,
                  priceRange: [meta.minPrice, meta.maxPrice],
                  sort: "",
                }));
                searchParams.delete("category");
                setSearchParams(searchParams);
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <ProductGrid products={visibleProducts} loading={loading} />
      )}

      {filtered.length > visibleCount ? (
        <div className="flex justify-center">
          <button
            className="rounded-full border border-onyx/20 px-5 py-2 text-sm"
            onClick={() => setVisibleCount((prev) => prev + 8)}
          >
            Load more
          </button>
        </div>
      ) : null}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        meta={meta}
      />
    </div>
  );
};

export default Shop;
