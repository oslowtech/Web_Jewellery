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
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    if (meta.maxPrice > 0) {
      setFilters((prev) => ({
        ...prev,
        priceRange: [meta.minPrice, meta.maxPrice],
      }));
    }
  }, [meta.maxPrice, meta.minPrice]);

  const filtered = useMemo(() => {
    return applyFilters(products, {
      ...filters,
      query: debouncedQuery,
    });
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
        /* 1. For native HTML5 input[type="range"] elements */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          /* Pulls the thumb up to perfectly center it on the track */
          margin-top: -6px !important; 
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
        }
        
        /* 2. For custom div-based dual-thumb sliders (if you used a library) */
        .slider-thumb, .thumb, [role="slider"], .rc-slider-handle {
          /* Centers the marker exactly on its calculated value percentage */
          transform: translateX(-50%) !important; 
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

      {filtered.length === 0 && !loading ? (
        <EmptyState
          title="No results"
          description="Try adjusting your search or filters to find the perfect piece."
          action={
            <button
              className="rounded-full bg-onyx px-4 py-2 text-sm text-white"
              onClick={() =>
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
                }))
              }
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
