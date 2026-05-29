import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../../context/CartContext.jsx";
import CartItem from "./CartItem.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatPrice } from "../../utils/format.js";
import { calculateShipping, getShippingInfo, validatePincode } from "../../utils/shipping.js";
import { Link } from "react-router-dom";
import { useState } from "react";

const CartDrawer = () => {
  const { isOpen, closeCart, cart, removeItem, updateItem, total, pincode, setPincode } = useCart();
  const [pincodeInput, setPincodeInput] = useState(pincode);
  const [pincodeError, setPincodeError] = useState("");

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    setPincodeInput(value);
    setPincodeError("");
  };

  const handlePincodeSubmit = () => {
    if (!validatePincode(pincodeInput)) {
      setPincodeError("Please enter a valid 6-digit pincode");
      return;
    }

    const shippingInfo = getShippingInfo(pincodeInput);
    if (!shippingInfo.valid) {
      setPincodeError(shippingInfo.message);
      return;
    }

    setPincode(pincodeInput);
    setPincodeError("");
  };

  const shipping = calculateShipping(pincode, total);
  const isFreeShipping = total >= 1499;

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
                    <label className="block text-xs font-medium">Shipping Pincode</label>
                    <input
                      type="text"
                      value={pincodeInput}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength="6"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                        pincodeError
                          ? "border-rose bg-rose/10"
                          : "border-white/70 bg-white"
                      }`}
                    />
                    {pincodeError ? (
                      <p className="text-xs text-rose">{pincodeError}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handlePincodeSubmit}
                      className="mt-2 w-full rounded-lg bg-onyx/10 px-3 py-2 text-xs font-medium text-onyx"
                    >
                      Calculate shipping
                    </button>
                    {pincode && !pincodeError ? (
                      <p className="text-xs text-stone">
                        ✓ Shipping calculated for {pincode}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                    {pincode && !pincodeError ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span>
                            {isFreeShipping ? (
                              "Shipping"
                            ) : (
                              <>
                                Shipping
                                <span className="ml-1 text-xs text-stone">
                                  (Free on orders ₹1499+)
                                </span>
                              </>
                            )}
                          </span>
                          <span className="font-medium">
                            {shipping === 0 ? "Free" : formatPrice(shipping)}
                          </span>
                        </div>
                        <div className="border-t border-white/70 pt-2 flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(total + (shipping || 0))}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-stone italic">
                        Enter pincode to calculate shipping
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-full bg-onyx py-3 text-sm text-white"
                  >
                    Proceed to checkout
                  </button>
                  <p className="text-center text-xs text-stone">
                    Checkout will be available with backend integration.
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

