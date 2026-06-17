import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';
import { useOrder } from '../context/OrderContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fetchAddresses } from '../services/addressService.js';
import { createOrder, validateOrderData } from '../services/orderService.js';
import { PAYMENT_METHODS, finalizeManualOrder, loadRazorpaySDK } from '../services/paymentService.js';
import { calculateShipping } from '../utils/shipping.js';
import { formatPrice } from '../utils/format.js';
import { createLuckyDrawEntry, checkUserEligibility } from '../services/luckyDrawService.js';
import { Sparkles } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cart, pincode, clearCart, coupon, discountAmount: cartDiscountAmount, finalTotal } = useCart();
  const { state: checkoutState, actions: checkoutActions, totals, isCheckoutReady } = useCheckout();
  const { actions: orderActions } = useOrder();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.PREPAID);
  const [isEligibleForDraw, setIsEligibleForDraw] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserEligibility(user.id).then(setIsEligibleForDraw);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    loadAddresses();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (paymentMethod === PAYMENT_METHODS.COD && totals.subtotal > 1000) {
      setPaymentMethod(PAYMENT_METHODS.PREPAID);
      addToast({ message: 'COD not available over ₹1000. Switched to Prepaid.', type: 'info' });
    }
  }, [totals.subtotal, paymentMethod, addToast]);

  useEffect(() => {
    checkoutActions.setCartItems(cart || []);
  }, [cart, checkoutActions]);

  useEffect(() => {
    const subtotal = (cart || []).reduce((sum, item) => {
      const unitPrice = item.discountPrice ?? item.discount_price ?? item.price;
      return sum + unitPrice * item.quantity;
    }, 0);
    
    const activePincode = checkoutState.shippingAddress?.postal_code || pincode;
    const baseShipping = activePincode ? calculateShipping(activePincode, finalTotal) : 0;
    const freeShippingThreshold = 1500;
    const finalShipping = finalTotal >= freeShippingThreshold ? 0 : baseShipping;
    checkoutActions.setShippingCharge(finalShipping ?? 0);
  }, [cart, pincode, checkoutState.shippingAddress, checkoutActions, finalTotal]);

  const loadAddresses = async () => {
    try {
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Error loading addresses:', err);
      addToast({ message: 'Failed to load addresses', type: 'error' });
    }
  };

  const handleSelectBillingAddress = (address) => {
    checkoutActions.setBillingAddress(address);
  };

  const handleSelectShippingAddress = (address) => {
    checkoutActions.setShippingAddress(address);
  };

  const handleSetGifting = (giftData) => {
    checkoutActions.setGifting(giftData);
  };

  const handlePrepaidOrder = async (order, finalOrderAmount) => {
    const res = await loadRazorpaySDK();
    if (!res) {
      addToast({ message: 'Razorpay SDK failed to load. Are you online?', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      // 1. Create a Razorpay Order from our backend
      const razorpayOrderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalOrderAmount * 100), // Amount in paise
          receipt: order.order_number,
        }),
      });

      let razorpayOrder;
      if (!razorpayOrderResponse.ok) {
        let errMessage = 'Failed to create Razorpay order.';
        try {
          const err = await razorpayOrderResponse.json();
          errMessage = err.error || errMessage;
        } catch (e) {
          errMessage = `API Error (${razorpayOrderResponse.status}): Please test via the live Vercel link or using 'vercel dev'.`;
        }
        throw new Error(errMessage);
      }

      razorpayOrder = await razorpayOrderResponse.json();

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Nagneshwari Jewels',
        description: `Order #${order.order_number}`,
        order_id: razorpayOrder.order_id,
        modal: {
          ondismiss: function () {
            // This prevents the UI from getting stuck on "Processing..."
            // if the user simply closes the Razorpay modal.
            setLoading(false);
          },
        },
        events: {
          'payment.failed': function (response) {
            const errorMessage = `Payment Failed: ${response.error.description} (Reason: ${response.error.reason})`;
            addToast({ message: errorMessage, type: 'error' });
            setLoading(false);
          },
        },
        handler: async function (response) {
          try {
            // Defensively check for an error object in the success handler response
            if (response.error) {
              addToast({ message: `Payment Failed: ${response.error.description || 'An unknown error occurred.'}`, type: 'error' });
              setLoading(false);
              return;
            }
            // Add pre-flight validation to ensure all data is present before sending to backend
            if (!order || !order.id) {
              throw new Error("Local order ID is missing. Cannot verify payment.");
            }
            if (!response || typeof response.razorpay_payment_id !== 'string' || typeof response.razorpay_order_id !== 'string' || typeof response.razorpay_signature !== 'string') {
              console.error("Invalid or incomplete Razorpay response:", response);
              throw new Error("Incomplete Razorpay response. Cannot verify payment.");
            }

            // 3. Verify Payment on our backend
            setLoading(true);
            const verificationResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderIdRzp: response.razorpay_order_id,
                signature: response.razorpay_signature,
                orderId: order.id, // Our internal DB order ID
              }),
            });

            let verificationResult;
            try {
              verificationResult = await verificationResponse.json();
            } catch (e) {
              throw new Error(`API Error (${verificationResponse.status}): Could not parse verification response.`);
            }

            if (!verificationResponse.ok || !verificationResult.success) {
              throw new Error(verificationResult?.error || 'Payment verification failed.');
            }

            // 4. Handle Success
            let luckyCode = null;
            if (finalOrderAmount >= 3000 && isEligibleForDraw) {
              const drawEntry = await createLuckyDrawEntry(order.id, finalOrderAmount, user.id, checkoutState.billingAddress.full_name, checkoutState.billingAddress.phone);
              if (drawEntry) luckyCode = drawEntry.code;
            }

            clearCart();
            addToast({ message: 'Payment successful! Order placed.', type: 'success' });
            navigate(`/order-confirmation/${order.id}`);
          } catch (err) {
            setError(err.message || 'An error occurred during payment verification.');
            addToast({ message: err.message || 'Payment verification failed.', type: 'error' });
            setLoading(false);
          }
        },
        prefill: {
          name: checkoutState.billingAddress.full_name,
          email: checkoutState.billingAddress.email,
          contact: checkoutState.billingAddress.phone,
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setLoading(false); // Modal is open, stop loading indicator

      paymentObject.on('payment.failed', function (response) {
        setError(`Payment Failed: ${response.error.description}`);
        addToast({ message: `Payment Failed: ${response.error.reason}`, type: 'error' });
        setLoading(false);
      });

    } catch (err) {
      setError(err.message || 'An error occurred during payment.');
      addToast({ message: err.message || 'Payment failed.', type: 'error' });
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate checkout state
      if (!isCheckoutReady()) {
        throw new Error('Please select both billing and shipping addresses');
      }
      
      const codFee = paymentMethod === PAYMENT_METHODS.COD ? 50 : 0;
      const finalOrderAmount = totals.totalAmount + codFee - cartDiscountAmount;

      // Prepare order data
      const orderData = {
        billingAddressId: checkoutState.billingAddress.id,
        shippingAddressId: checkoutState.shippingAddress.id,
        items: checkoutState.cartItems.map(item => {
          const unitPrice = item.discountPrice ?? item.discount_price ?? item.price;
          return {
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            pricePerUnit: item.price,
            discountPerUnit: Math.max(0, item.price - unitPrice),
            totalPrice: unitPrice * item.quantity
          };
        }),
        totalAmount: finalOrderAmount,
        taxAmount: totals.taxAmount,
        shippingCharge: totals.shippingCharge,
        discountAmount: totals.discountAmount + cartDiscountAmount,
        giftWrapFee: totals.giftWrapFee,
        codFee: codFee,
        appliedCoupon: coupon?.code || null,
        gifting: checkoutState.gifting.isGift
          ? { ...checkoutState.gifting, is_gift: true }
          : null
      };

      // Validate order
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create order in our DB first
      const order = await createOrder(orderData);
      orderActions.addOrder(order);

      // Proceed to payment
      if (paymentMethod === PAYMENT_METHODS.PREPAID) {
        await handlePrepaidOrder(order, finalOrderAmount);
        // setLoading is handled inside handlePrepaidOrder
      } else { // COD
        await finalizeManualOrder(order.id, paymentMethod);
        let luckyCode = null;
        if (finalOrderAmount >= 3000 && isEligibleForDraw) {
          const drawEntry = await createLuckyDrawEntry(order.id, finalOrderAmount, user.id, checkoutState.billingAddress.full_name, checkoutState.billingAddress.phone);
          if (drawEntry) luckyCode = drawEntry.code;
        }
        clearCart();
        addToast({ message: 'Order placed successfully!', type: 'success' });
        navigate(`/order-confirmation/${order.id}`);
      }
    } catch (err) {
      const message = err.message || 'Failed to process order';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  if (!checkoutState.cartItems || checkoutState.cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-onyx mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add items before proceeding to checkout</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-rose text-cream px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-onyx mb-8">Checkout</h1>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex justify-between mb-6">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        s <= step
                          ? 'bg-rose text-cream'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          s < step ? 'bg-rose' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Items</span>
                <span>Billing</span>
                <span>Shipping</span>
                <span>Review</span>
              </div>
            </div>

            {/* Step 1: Review Items */}
            {step === 1 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {checkoutState.cartItems.map(item => {
                    const unitPrice = item.discountPrice ?? item.discount_price ?? item.price;
                    const hasDiscount = unitPrice < item.price;

                    return (
                    <div key={item.id} className="flex justify-between items-center pb-4 border-b">
                      <div>
                        <p className="font-semibold text-onyx">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(unitPrice * item.quantity)}
                        </p>
                        {hasDiscount ? (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Billing Address */}
            {step === 2 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No addresses saved</p>
                    <button
                      onClick={() => navigate('/addresses')}
                      className="text-rose hover:underline"
                    >
                      Add an address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(address => (
                      <label key={address.id} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="billing"
                          checked={checkoutState.billingAddress?.id === address.id}
                          onChange={() => handleSelectBillingAddress(address)}
                          className="mt-1 mr-4"
                        />
                        <div>
                          <p className="font-semibold">{address.full_name}</p>
                          <p className="text-sm text-gray-600">{address.street_address}</p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Shipping Address */}
            {step === 3 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-3">
                  {addresses.map(address => (
                    <label key={address.id} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shipping"
                        checked={checkoutState.shippingAddress?.id === address.id}
                        onChange={() => handleSelectShippingAddress(address)}
                        className="mt-1 mr-4"
                      />
                      <div>
                        <p className="font-semibold">{address.full_name}</p>
                        <p className="text-sm text-gray-600">{address.street_address}</p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Gifting Options */}
                <div className="mt-6 pt-6 border-t">
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={checkoutState.gifting.isGift}
                      onChange={(e) => handleSetGifting({ isGift: e.target.checked })}
                      className="w-4 h-4 text-rose rounded"
                    />
                    <span className="ml-3 font-semibold">This is a gift</span>
                  </label>

                  {checkoutState.gifting.isGift && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <input
                        type="text"
                        placeholder="Recipient's Name"
                        value={checkoutState.gifting.recipientName}
                        onChange={(e) => handleSetGifting({ recipientName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="Recipient's Phone"
                        value={checkoutState.gifting.recipientPhone}
                        onChange={(e) => handleSetGifting({ recipientPhone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="email"
                        placeholder="Recipient's Email (Optional)"
                        value={checkoutState.gifting.recipientEmail}
                        onChange={(e) => handleSetGifting({ recipientEmail: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <textarea
                        placeholder="Gift Message (Optional)"
                        value={checkoutState.gifting.giftMessage}
                        onChange={(e) => handleSetGifting({ giftMessage: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border rounded-lg resize-none"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={checkoutState.gifting.giftWrap}
                          onChange={(e) => handleSetGifting({ giftWrap: e.target.checked })}
                          className="w-4 h-4 text-rose rounded"
                        />
                        <span className="ml-2">Add gift wrapping (+₹50)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Place Order */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Base Price (Excl. tax):</span>
                      <span className="float-right font-semibold">
                        {formatPrice(totals.subtotal - totals.taxAmount)}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Tax ({Math.round(checkoutState.taxRate * 100)}% GST):</span>
                      <span className="float-right font-semibold">
                        {formatPrice(totals.taxAmount)}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Shipping:</span>
                      <span className="float-right font-semibold">
                        {formatPrice(totals.shippingCharge)}
                      </span>
                    </p>
                    {totals.giftWrapFee > 0 && (
                      <p>
                        <span className="text-gray-600">Gift Wrap:</span>
                        <span className="float-right font-semibold">
                          {formatPrice(totals.giftWrapFee)}
                        </span>
                      </p>
                    )}
                    {(totals.discountAmount + cartDiscountAmount) > 0 && (
                      <p>
                        <span className="text-gray-600">Discount:</span>
                        <span className="float-right font-semibold text-green-600">
                          -{formatPrice(totals.discountAmount + cartDiscountAmount)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Addresses Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Billing Address</h3>
                    <p className="text-sm text-gray-600">
                      {checkoutState.billingAddress?.full_name}
                      <br />
                      {checkoutState.billingAddress?.street_address}
                      <br />
                      {checkoutState.billingAddress?.city}, {checkoutState.billingAddress?.state}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {checkoutState.shippingAddress?.full_name}
                      <br />
                      {checkoutState.shippingAddress?.street_address}
                      <br />
                      {checkoutState.shippingAddress?.city}, {checkoutState.shippingAddress?.state}
                    </p>
                  </div>
                </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === PAYMENT_METHODS.PREPAID}
                    onChange={() => setPaymentMethod(PAYMENT_METHODS.PREPAID)}
                    className="mt-1 mr-4"
                  />
                  <div>
                    <p className="font-semibold">Prepaid (UPI / Cards / NetBanking)</p>
                    <p className="text-sm text-gray-600">Pay securely with Razorpay.</p>
                  </div>
                </label>
                <label className={`flex items-start p-4 border rounded-lg ${totals.subtotal > 1000 ? 'cursor-not-allowed bg-gray-50 opacity-60' : 'cursor-pointer hover:bg-gray-50'}`}>
                  <input
                    type="radio" name="paymentMethod" checked={paymentMethod === PAYMENT_METHODS.COD} onChange={() => setPaymentMethod(PAYMENT_METHODS.COD)} className="mt-1 mr-4"
                    disabled={totals.subtotal > 1000}
                  />
                  <div>
                    <p className="font-semibold">Cash on Delivery (COD)</p>
                    <p className="text-sm text-gray-600">Not available on orders above ₹1000. (+₹50 COD Fee)</p>
                  </div>
                </label>
              </div>
            </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                className="flex-1 bg-gray-200 text-onyx py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                disabled={step === 1 || loading}
              >
                Previous
              </button>
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-rose text-cream py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50"
                  disabled={
                    (step === 2 && !checkoutState.billingAddress) ||
                    (step === 3 && !checkoutState.shippingAddress) ||
                    loading
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 bg-rose text-cream py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50"
                  disabled={!isCheckoutReady() || loading}
                >
              {loading ? 'Processing...' : `Place Order • ${formatPrice(totals.totalAmount + (paymentMethod === PAYMENT_METHODS.COD ? 50 : 0) - cartDiscountAmount)}`}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Order Total</h3>
              
              {finalTotal >= 3000 && isEligibleForDraw && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="flex items-start gap-2 text-sm font-medium text-green-800">
                    <Sparkles size={16} className="mt-0.5 shrink-0" />
                    <span>You're eligible for the ₹3000 Purchase Lucky Draw!</span>
                  </p>
                  <p className="mt-2 text-xs text-green-600">
                    Details regarding your lucky draw entry will be sent to you via WhatsApp once your order is confirmed.
                  </p>
                </div>
              )}

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price (Excl. tax)</span>
                  <span>{formatPrice(totals.subtotal - totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({Math.round(checkoutState.taxRate * 100)}% GST)</span>
                  <span>{formatPrice(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {finalTotal >= 1500 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    <span>{formatPrice(totals.shippingCharge)}</span>
                  )}
                </div>
                {totals.giftWrapFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Gift Wrap</span>
                    <span>{formatPrice(totals.giftWrapFee)}</span>
                  </div>
                )}
            {paymentMethod === PAYMENT_METHODS.COD && (
              <div className="flex justify-between text-gray-600">
                <span>COD Fee</span>
                <span>{formatPrice(50)}</span>
              </div>
            )}
                {(totals.discountAmount + cartDiscountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(totals.discountAmount + cartDiscountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
              <span>{formatPrice(totals.totalAmount + (paymentMethod === PAYMENT_METHODS.COD ? 50 : 0) - cartDiscountAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
