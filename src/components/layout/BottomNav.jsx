import { NavLink } from "react-router-dom";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";

const BottomNav = () => {
  const { toggleCart, cart } = useCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 text-xs ${
      isActive ? "text-onyx" : "text-stone"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-cream/95 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-2 px-4">
        <NavLink to="/" className={linkClass}>
          <Home size={18} />
          Home
        </NavLink>
        <NavLink to="/shop" className={linkClass}>
          <Store size={18} />
          Shop
        </NavLink>
        <button
          type="button"
          className="relative flex flex-col items-center gap-1 text-xs text-stone"
          onClick={toggleCart}
          aria-label="Open cart"
        >
          <ShoppingBag size={18} />
          Cart
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-onyx px-1 text-[10px] text-white">
              {count}
            </span>
          ) : null}
        </button>
        <NavLink to="/wishlist" className={linkClass}>
          <Heart size={18} />
          Wishlist
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <User size={18} />
          Profile
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
