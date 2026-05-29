import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { formatPrice } from "../../utils/format.js";
import { handleWhatsAppInquiry } from "../../utils/whatsapp.js";

const ProductDetails = ({ product }) => {
  const { addItem, openCart, pincode } = useCart();
  const { addToast } = useToast();
  const { toggle, isWished } = useWishlist();

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
      <p className="text-sm text-stone">{product.description}</p>
      <div className="rounded-2xl bg-champagne/60 p-4 text-sm">
        <p className="font-medium">Material</p>
        <p className="text-stone">{product.material}</p>
      </div>
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
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full bg-onyx px-4 py-3 text-sm text-white"
          onClick={handleAdd}
        >
          <ShoppingBag size={16} />
          Add to cart
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full border border-onyx/20 px-4 py-3 text-sm"
          onClick={() => toggle(product)}
        >
          <Heart size={16} />
          {isWished(product.id) ? "Saved" : "Save for later"}
        </button>
        <button
          type="button"
          className="sm:col-span-2 rounded-full bg-rose px-4 py-3 text-sm text-white"
          onClick={() => handleWhatsAppInquiry(product, addToast, pincode)}
        >
          Order on WhatsApp
        </button>
        <button
          type="button"
          className="sm:col-span-2 rounded-full border border-rose/50 px-4 py-3 text-sm text-onyx"
          onClick={() => handleWhatsAppInquiry(product, addToast, pincode)}
        >
          Inquiry on WhatsApp
        </button>
      </div>
      <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-xs text-stone">
        Free delivery on orders above ₹1499 · Easy returns
      </div>
    </div>
  );
};

export default ProductDetails;

