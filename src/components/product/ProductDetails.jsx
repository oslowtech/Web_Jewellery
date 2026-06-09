import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { formatPrice } from "../../utils/format.js";
import { COD_LIMIT, DISPATCH_PINCODE, OFFER_THRESHOLD, SHIPPING_RATES } from "../../utils/shipping.js";

const ProductDetails = ({ product }) => {
  const navigate = useNavigate();
  const { addItem, openCart, cart } = useCart();
  const { toggle, isWished } = useWishlist();

  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState("");

  const stockAvailable = product.stockQuantity ?? product.stock_quantity ?? 0;
  
  // Calculate total quantity of this product already in the cart (across all sizes)
  const cartQty = (cart || []).reduce((total, item) => {
    return (item.id === product.id || item.id.startsWith(`${product.id}-`)) 
      ? total + item.quantity 
      : total;
  }, 0);
  
  const isOutOfStock = stockAvailable <= cartQty;

  // Convert comma-separated string from Admin into an array of sizes
  const ringSizes = product.ringSize ? product.ringSize.split(',').map(s => s.trim()).filter(Boolean) : [];

  const cartItem = {
      id: selectedSize ? `${product.id}-${selectedSize}` : product.id,
      name: selectedSize ? `${product.name} (Size: ${selectedSize})` : product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images[0],
      category: product.category,
      stockQuantity: stockAvailable,
      ringSize: selectedSize || undefined,
  };

  const handleAdd = () => {
    if (ringSizes.length > 0 && !selectedSize) {
      setSizeError("Please select a size first");
      return;
    }
    setSizeError("");
    addItem(cartItem);
    openCart();
  };

  const handleBuyNow = () => {
    if (ringSizes.length > 0 && !selectedSize) {
      setSizeError("Please select a size first");
      return;
    }
    setSizeError("");
    addItem(cartItem);
    navigate("/checkout");
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone">
          {product.category} · {product.subCategory}
        </p>
        <h1 className="mt-2 font-display text-2xl">{product.name}</h1>
        <p className="mt-1 text-sm text-stone">Product ID: {product.id}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold text-onyx">
          {formatPrice(product.discountPrice || product.price)}
        </span>
        {product.discountPrice ? (
          <span className="text-sm text-stone line-through">
            {formatPrice(product.price)}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm text-stone">{product.description}</p>
      <div className="rounded-2xl bg-champagne/60 p-4 text-sm">
        <p className="font-medium">Material</p>
        <p className="text-stone">{product.material}</p>
      </div>

      {ringSizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-onyx">Select Size</p>
            {sizeError && <p className="text-xs font-medium text-rose">{sizeError}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {ringSizes.map(size => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  setSizeError("");
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  selectedSize === size
                    ? "border-onyx bg-onyx text-white shadow-md"
                    : "border-stone/30 bg-white text-onyx hover:border-onyx/50 hover:bg-stone/5"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blush/70 px-3 py-1 text-xs uppercase tracking-wide text-onyx"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-stone/20 px-4 py-3 text-sm text-stone"
          >
            Out of stock
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full bg-onyx px-4 py-3 text-sm text-white"
            onClick={handleAdd}
          >
            <ShoppingBag size={16} />
            Add to cart
          </button>
        )}
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full border border-onyx/20 px-4 py-3 text-sm"
          onClick={() => toggle(product)}
        >
          <Heart size={16} />
          {isWished(product.id) ? "Saved" : "Save for later"}
        </button>
        {!isOutOfStock && (
          <button
            type="button"
            className="sm:col-span-2 rounded-full bg-rose px-4 py-3 text-sm text-white"
            onClick={handleBuyNow}
          >
            Buy now
          </button>
        )}
      </div>
      <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-xs text-stone">
        Free shipping on orders over ₹1499 · COD
        up to ₹1000 · Spend ₹{OFFER_THRESHOLD}+ for lucky draw entry
      </div>
    </div>
  );
};

export default ProductDetails;
