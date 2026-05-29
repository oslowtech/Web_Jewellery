import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext.jsx";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Profile", to: "/profile" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { cart, toggleCart } = useCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/60 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-xl">
          Elan Jewellery
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `transition ${isActive ? "text-onyx" : "text-stone"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <NavLink to="/wishlist" className="hidden md:inline-flex">
            <Heart size={20} />
          </NavLink>
          <button onClick={toggleCart} className="relative" aria-label="Open cart">
            <ShoppingBag size={20} />
            {count > 0 ? (
              <span className="absolute -right-2 -top-2 rounded-full bg-onyx px-1.5 text-xs text-white">
                {count}
              </span>
            ) : null}
          </button>
          <NavLink to="/profile" className="hidden md:inline-flex">
            <User size={20} />
          </NavLink>
          <button
            className="md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/60 bg-cream px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3 text-sm">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `transition ${isActive ? "text-onyx" : "text-stone"}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/login" onClick={() => setOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)}>
                Sign up
              </NavLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
