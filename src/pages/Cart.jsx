import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCheckout } from "../context/CheckoutContext.jsx";
import CartItem from "../components/cart/CartItem.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { formatPrice } from "../utils/format.js";
import usePageMeta from "../hooks/usePageMeta.js";

const Cart = () => {
  usePageMeta({
    title: "Your Cart | Nagneshwari Jewels",
    description: "Review your selected jewellery pieces and totals.",
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeItem, updateItem, total } = useCart();
  const { actions: checkoutActions } = useCheckout();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkoutActions.setCartItems(cart);
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl">Your Cart</h1>
      {cart.length === 0 ? (
        <EmptyState
          title="Cart is empty"
          description="Add jewellery pieces to continue."
          action={
            <Link
              to="/shop"
              className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white"
            >
              Explore shop
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={removeItem}
              onUpdate={updateItem}
            />
          ))}
          <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 p-4">
            <span className="text-sm">Total</span>
            <span className="text-lg font-semibold">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-rose text-cream py-3 rounded-lg font-semibold hover:bg-opacity-90 transition mt-6"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
