import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { formatPrice } from "../../utils/format.js";
import { buildProductSlug } from "../../utils/slug.js";

const ProductCard = ({ product, onQuickView }) => {
  const { addItem, openCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const wished = isWished(product.id);
  const slug = buildProductSlug(product);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images[0],
      category: product.category,
    });
    openCart();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group rounded-3xl border border-white/70 bg-white/80 p-3 shadow-soft"
    >
      <div className="relative">
        <Link to={`/product/${slug}`} className="block overflow-hidden rounded-2xl">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          onClick={() => toggle(product)}
          className={`absolute right-2 top-2 rounded-full p-2 ${
            wished ? "bg-onyx text-white" : "bg-white/90 text-onyx"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
        {product.isNew ? (
          <span className="absolute left-2 top-2 rounded-full bg-rose/80 px-2 py-1 text-[10px] uppercase tracking-wide text-white">
            New
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wide text-stone">{product.category}</p>
        <Link to={`/product/${slug}`} className="text-sm font-medium">
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-onyx">
            {formatPrice(product.discountPrice || product.price)}
          </span>
          {product.discountPrice ? (
            <span className="text-xs text-stone line-through">
              {formatPrice(product.price)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 rounded-full border border-onyx/20 px-3 py-2 text-xs"
          onClick={() => onQuickView?.(product)}
        >
          Quick View
        </button>
        <button
          type="button"
          className="flex-1 rounded-full bg-onyx px-3 py-2 text-xs text-white"
          onClick={handleAdd}
        >
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
