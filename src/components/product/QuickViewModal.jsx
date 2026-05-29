import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format.js";
import { buildProductSlug } from "../../utils/slug.js";
import { useCart } from "../../context/CartContext.jsx";

const QuickViewModal = ({ product, onClose }) => {
  const { addItem, openCart } = useCart();

  if (!product) return null;

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
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg rounded-3xl bg-cream p-5 shadow-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-lg">Quick View</p>
            <button onClick={onClose} aria-label="Close quick view">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-48 w-full rounded-2xl object-cover sm:w-48"
              loading="lazy"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs uppercase tracking-wide text-stone">
                {product.category}
              </p>
              <p className="text-base font-medium">{product.name}</p>
              <p className="text-sm text-stone">Product ID: {product.id}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-onyx">
                  {formatPrice(product.discountPrice || product.price)}
                </span>
                {product.discountPrice ? (
                  <span className="text-xs text-stone line-through">
                    {formatPrice(product.price)}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-full bg-onyx px-4 py-2 text-sm text-white"
                  onClick={handleAdd}
                >
                  Add to Cart
                </button>
                <Link
                  to={`/product/${buildProductSlug(product)}`}
                  className="flex-1 rounded-full border border-onyx/20 px-4 py-2 text-center text-sm"
                  onClick={onClose}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
