import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../../context/CartContext.jsx";
import CartItem from "./CartItem.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatPrice } from "../../utils/format.js";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCheckout } from "../../context/CheckoutContext.jsx";

const CartDrawer = () => {
  const { isOpen, closeCart, cart, removeItem, updateItem, total, finalTotal, discountAmount, coupon, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const { actions: checkoutActions } = useCheckout();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    try {
      setCouponError("");
      await applyCoupon(couponInput);
      setCouponInput("");
    } catch (error) {
      setCouponError(error.message);
    }
  };

  const freeShippingThreshold = 1500;
  const codAvailable = total <= 1000;
  const OFFER_THRESHOLD = 3000;
  const offerEligible = finalTotal >= OFFER_THRESHOLD;
  const remainingForOffer = Math.max(0, OFFER_THRESHOLD - finalTotal);

  const handleCheckout = () => {
    checkoutActions.setCartItems(cart);
    closeCart();
    navigate(user ? "/checkout" : "/login");
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-cream shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
          >
            <div className="flex items-center justify-between border-b border-white/70 px-5 py-4">
              <p className="font-display text-lg">Your Cart</p>
              <button onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {cart.length === 0 ? (
                  <EmptyState
                    title="Your cart is empty"
                    description="Add your favorite pieces to get started."
                    action={
                      <Link
                        to="/shop"
                        onClick={closeCart}
                        className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white"
                      >
                        Browse shop
                      </Link>
                    }
                  />
                ) : (
                  cart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onRemove={removeItem}
                      onUpdate={updateItem}
                    />
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="space-y-4 border-t border-white/70 px-5 py-4">

                  <div className="space-y-2 rounded-2xl bg-white/70 p-3">
                    <label className="block text-xs font-medium">Coupon Code</label>
                    {coupon ? (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 border border-green-200">
                        <span className="text-sm font-medium text-green-700">{coupon.code} Applied!</span>
                        <button onClick={removeCoupon} className="text-xs font-semibold text-rose hover:underline">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none uppercase ${
                            couponError ? "border-rose bg-rose/10" : "border-white/70 bg-white"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="rounded-lg bg-onyx px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-onyx/90"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-rose">{couponError}</p>}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                    {finalTotal < freeShippingThreshold && (
                      <p className="text-right text-xs font-medium text-green-600">
                        Add {formatPrice(freeShippingThreshold - finalTotal)} more for FREE shipping!
                      </p>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>Discount ({coupon?.code})</span>
                        <span className="font-medium">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/70 pt-2 flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/70 p-3 text-xs text-stone">
                    <p className={`font-medium ${codAvailable ? "text-onyx" : "text-rose"}`}>
                      {codAvailable
                        ? `Cash on Delivery available up to ₹1000.`
                        : `Cash on Delivery not available above ₹1000.`}
                    </p>
                    <div className="mt-3 rounded-xl border border-rose/20 bg-rose/10 p-3">
                      <p className="mb-1 font-medium text-onyx">Lucky Draw Offer!</p>
                      <p className="mb-2 text-xs text-stone">
                        Spend ₹{OFFER_THRESHOLD}+ to get a chance to win Activa, iPhone, Smart TV, Iron, and more.
                      </p>
                      <div className="mb-2 h-2 w-full rounded-full bg-stone/20">
                        <div
                          className="h-2 rounded-full bg-rose transition-all duration-500"
                          style={{ width: `${Math.min((finalTotal / OFFER_THRESHOLD) * 100, 100)}%` }}
                        ></div>
                      </div>
                      {offerEligible ? (
                        <p className="text-xs font-bold text-green-600">🎉 Congratulations! You qualify for the Lucky Draw.</p>
                      ) : (
                        <p className="text-xs text-stone">
                          Add <span className="font-bold text-rose">{formatPrice(remainingForOffer)}</span> more to unlock the lucky draw entry!
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full bg-onyx py-3 text-sm text-white"
                    onClick={handleCheckout}
                  >
                    Proceed to secure checkout
                  </button>
                  <p className="text-center text-xs text-stone">
                    Pay online securely with cards, UPI, netbanking, wallets, or EMI.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default CartDrawer;
