import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useProducts from "../hooks/useProducts.js";
import useDebounce from "../hooks/useDebounce.js";
import usePageMeta from "../hooks/usePageMeta.js";
import SectionHeading from "../components/common/SectionHeading.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import ProductGrid from "../components/product/ProductGrid.jsx";
import useVisitorTracking from "../hooks/useVisitorTracking.js";
import { buildProductSlug } from "../utils/slug.js";
import { fetchSlides } from "../services/contentService.js";
import heroVideo from "./hero-video.mp4";
import posterImg from "./poster.png";

let hasShownPosterThisLoad = false;

const Home = () => {
  usePageMeta({
    title: "Nagneshwari Jewels | Premium Artificial Jewellery",
    description:
      "Discover premium artificial jewellery with elegant, mobile-first shopping.",
  });

  // Start tracking visits quietly in the background
  useVisitorTracking();

  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const [showPoster, setShowPoster] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [randomizedOrder, setRandomizedOrder] = useState({});

  useEffect(() => {
    if (!hasShownPosterThisLoad) {
      const timer = setTimeout(() => {
        setShowPoster(true);
        hasShownPosterThisLoad = true;
      }, 1000); // Pops up 1 second after page loads
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetchSlides().then(data => {
      if (data && data.length > 0) setSlides(data.slice(0, 4));
    });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  // Shuffle product display order at random time intervals
  useEffect(() => {
    let timerId;
    const shuffle = () => {
      setRandomizedOrder(() => {
        const newOrder = {};
        products.forEach(p => {
          newOrder[p.id] = Math.random();
        });
        return newOrder;
      });
      // Trigger the next shuffle after a random interval between 8 and 20 seconds
      const nextInterval = Math.floor(Math.random() * 12000) + 8000;
      timerId = setTimeout(shuffle, nextInterval);
    };
    if (products.length > 0) shuffle();
    return () => clearTimeout(timerId);
  }, [products]);

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

  const sortProducts = (list) => {
    return list.sort((a, b) => {
      // Use the randomized order if available, fallback to database display_order
      const orderA = randomizedOrder[a.id] ?? Number(a.displayOrder ?? a.display_order ?? 0);
      const orderB = randomizedOrder[b.id] ?? Number(b.displayOrder ?? b.display_order ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return String(a.name).localeCompare(String(b.name));
    });
  };

  const featured = sortProducts(products.filter((product) => product.featured)).slice(0, 4);
  const newArrivals = sortProducts(products.filter((product) => product.isNew)).slice(0, 4);
  const bestSellers = sortProducts(products.filter((product) => product.bestSeller)).slice(0, 4);
  const womensProducts = sortProducts(products.filter((product) => product.gender === "women" || product.gender === "both" || product.gender === "unisex" || product.gender === "couple")).slice(0, 4);
  const mensProducts = sortProducts(products.filter((product) => product.gender === "men" || product.gender === "both" || product.gender === "unisex" || product.gender === "couple")).slice(0, 4);
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      {slides.length > 0 && (
        <section className="relative aspect-[16/9] w-full overflow-hidden rounded-[32px] bg-stone/5 shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 h-full w-full cursor-pointer"
              onClick={() => {
                if (slides[currentSlide].link_url) {
                  navigate(slides[currentSlide].link_url);
                }
              }}
            >
              <img src={slides[currentSlide].image_url} alt="Promo Slide" className="h-full w-full object-cover" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2.5 w-2.5 rounded-full transition-all shadow-md ${i === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`} aria-label={`Go to slide ${i+1}`} />
            ))}
          </div>
        </section>
      )}

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
        <motion.div
          key={featured.map((p) => p.id).join("-")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ProductGrid products={featured} loading={loading} />
        </motion.div>
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
        <motion.div
          key={womensProducts.map((p) => p.id).join("-")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ProductGrid products={womensProducts} loading={loading} />
        </motion.div>
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
        <motion.div
          key={mensProducts.map((p) => p.id).join("-")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ProductGrid products={mensProducts} loading={loading} />
        </motion.div>
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
        <motion.div
          key={newArrivals.map((p) => p.id).join("-")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ProductGrid products={newArrivals} loading={loading} />
        </motion.div>
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
        <motion.div
          key={bestSellers.map((p) => p.id).join("-")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ProductGrid products={bestSellers} loading={loading} />
        </motion.div>
      </section>

      <AnimatePresence>
        {showPoster && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPoster(false)}
          >
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-cream shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPoster(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 text-onyx shadow backdrop-blur-sm transition-colors hover:bg-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <img
                src={posterImg}
                alt="Special Offer"
                className="h-auto w-full object-cover"
              />
              <div className="bg-cream p-4">
                <Link
                  to="/shop"
                  onClick={() => setShowPoster(false)}
                  className="block w-full rounded-full bg-rose py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-rose/90 shadow-md"
                >
                  Buy Now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
