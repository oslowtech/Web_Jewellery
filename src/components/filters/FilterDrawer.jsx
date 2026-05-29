import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PriceSlider from "./PriceSlider.jsx";

const FilterDrawer = ({ open, onClose, filters, setFilters, meta }) => {
  const toggleValue = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      genders: [],
      categories: [],
      subCategories: [],
      featuredOnly: false,
      newOnly: false,
      priceRange: [meta.minPrice, meta.maxPrice],
      sort: "",
    }));
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-cream px-6 py-6 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">Filters</p>
              <button onClick={onClose} aria-label="Close filters">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 space-y-6 overflow-y-auto">
              <div>
                <p className="text-sm font-medium">Collection</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Women", "Men"].map((gender) => (
                    <button
                      key={gender}
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        filters.genders.includes(gender.toLowerCase())
                          ? "bg-onyx text-white"
                          : "bg-white/80 text-onyx"
                      }`}
                      onClick={() => toggleValue("genders", gender.toLowerCase())}
                    >
                      {gender}'s
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Price Range</p>
                <div className="mt-3">
                  <PriceSlider
                    min={meta.minPrice}
                    max={meta.maxPrice}
                    value={filters.priceRange}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, priceRange: value }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meta.categories.map((category) => (
                    <button
                      key={category}
                      className={`rounded-full px-3 py-1 text-xs ${
                        filters.categories.includes(category)
                          ? "bg-onyx text-white"
                          : "bg-white/80 text-onyx"
                      }`}
                      onClick={() => toggleValue("categories", category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Sub-categories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meta.subCategories.map((sub) => (
                    <button
                      key={sub}
                      className={`rounded-full px-3 py-1 text-xs ${
                        filters.subCategories.includes(sub)
                          ? "bg-onyx text-white"
                          : "bg-white/80 text-onyx"
                      }`}
                      onClick={() => toggleValue("subCategories", sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Sort by</p>
                <div className="mt-2 grid gap-2">
                  {[
                    { label: "Price: Low to High", value: "price-asc" },
                    { label: "Price: High to Low", value: "price-desc" },
                    { label: "New Arrivals", value: "new" },
                    { label: "Featured", value: "featured" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                        filters.sort === option.value
                          ? "border-onyx bg-onyx text-white"
                          : "border-onyx/10 bg-white/80 text-onyx"
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, sort: option.value }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.featuredOnly}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        featuredOnly: event.target.checked,
                      }))
                    }
                  />
                  Featured products
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.newOnly}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        newOnly: event.target.checked,
                      }))
                    }
                  />
                  New arrivals
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full border border-onyx/20 px-4 py-2 text-sm"
                onClick={clearFilters}
              >
                Clear
              </button>
              <button
                className="flex-1 rounded-full bg-onyx px-4 py-2 text-sm text-white"
                onClick={onClose}
              >
                Apply
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default FilterDrawer;
