import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter } from "lucide-react";
import useProducts from "../hooks/useProducts.js";
import useDebounce from "../hooks/useDebounce.js";
import usePageMeta from "../hooks/usePageMeta.js";
import SectionHeading from "../components/common/SectionHeading.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import ProductGrid from "../components/product/ProductGrid.jsx";
import { buildProductSlug } from "../utils/slug.js";
import heroVideo from "./hero-video.mp4";

const Home = () => {
  usePageMeta({
    title: "Nagneshwari Jewels | Premium Artificial Jewellery",
    description:
      "Discover premium artificial jewellery with elegant, mobile-first shopping.",
  });

  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

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
      .slice(0, 5);
  }, [debouncedQuery, products]);

  const featured = products.filter((product) => product.featured).slice(0, 4);
  const newArrivals = products.filter((product) => product.isNew).slice(0, 4);
  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 4);
  const womensProducts = products.filter((product) => product.gender === "women").slice(0, 4);
  const mensProducts = products.filter((product) => product.gender === "men").slice(0, 4);
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden rounded-[32px] shadow-soft sm:h-[80vh]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-6 text-center text-white">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-widest text-white/80">
              Premium Artificial Jewellery
            </p>
            <h1 className="drop-shadow-md font-display text-4xl sm:text-5xl md:text-6xl">
              Soft luxe sparkle for every celebration
            </h1>
            <p className="drop-shadow-md mx-auto max-w-md text-sm text-white/90 sm:text-base">
              Explore handpicked artificial jewellery designed to feel premium,
              feminine, and effortlessly elegant.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="rounded-full bg-white px-8 py-3 text-center text-sm font-medium text-onyx transition-colors hover:bg-cream"
              >
                Shop new arrivals
              </Link>
              <Link
                to="/shop"
                className="rounded-full border border-white/50 bg-black/20 px-8 py-3 text-center text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/40"
              >
                Explore collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            query={query}
            onChange={setQuery}
            suggestions={suggestions}
            onSelect={(product) => {
              setQuery("");
              navigate(`/product/${buildProductSlug(product)}`);
            }}
            placeholder="Search by name, ID, tags..."
          />
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-onyx/20 px-4 py-2 text-sm"
          >
            <Filter size={16} />
            Filter
          </Link>
        </div>
        <div className="rounded-3xl border border-rose/20 bg-rose/10 px-6 py-4 text-sm text-stone">
          Limited-time offer: Flat 15% off on bridal sets and pearl collections.
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Featured jewellery"
          subtitle="Our most loved premium picks"
          action={
            <Link to="/shop" className="text-onyx">
              View all
            </Link>
          }
        />
        <ProductGrid products={featured} loading={loading} />
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Women's Collection"
          subtitle="Elegant pieces for every occasion"
          action={
            <Link to="/shop?gender=women" className="text-onyx">
              View all
            </Link>
          }
        />
        <ProductGrid products={womensProducts} loading={loading} />
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Men's Collection"
          subtitle="Sophisticated styles for modern men"
          action={
            <Link to="/shop?gender=men" className="text-onyx">
              View all
            </Link>
          }
        />
        <ProductGrid products={mensProducts} loading={loading} />
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="New arrivals"
          subtitle="Fresh additions for your collection"
          action={
            <Link to="/shop" className="text-onyx">
              View all
            </Link>
          }
        />
        <ProductGrid products={newArrivals} loading={loading} />
      </section>

      <section className="space-y-5">
        <SectionHeading title="Shop by category" subtitle="Curated edits" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/shop?category=${encodeURIComponent(category)}`}
              className="rounded-3xl border border-white/70 bg-white/80 p-5 text-center text-sm shadow-soft"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Best sellers"
          subtitle="Trending pieces customers love"
          action={
            <Link to="/shop" className="text-onyx">
              View all
            </Link>
          }
        />
        <ProductGrid products={bestSellers} loading={loading} />
      </section>
    </div>
  );
};

export default Home;
