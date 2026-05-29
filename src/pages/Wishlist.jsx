import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import ProductGrid from "../components/product/ProductGrid.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import usePageMeta from "../hooks/usePageMeta.js";

const Wishlist = () => {
  usePageMeta({
    title: "Wishlist | Elan Jewellery",
    description: "Save your favorite jewellery pieces for later.",
  });

  const { wishlist } = useWishlist();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl">Wishlist</h1>
      {wishlist.length === 0 ? (
        <EmptyState
          title="No saved items"
          description="Tap the heart icon to save jewellery you love."
          action={
            <Link
              to="/shop"
              className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white"
            >
              Browse shop
            </Link>
          }
        />
      ) : (
        <ProductGrid products={wishlist} loading={false} />
      )}
    </div>
  );
};

export default Wishlist;
