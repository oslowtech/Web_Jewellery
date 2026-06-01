import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { initiateRazorpayPayment, loadRazorpaySDK, validatePaymentConfig } from '../../services/paymentService';

/**
 * RazorpayButton Component
 * 
 * A reusable button component that handles the complete Razorpay payment flow.
 * Manages loading states, error handling, and success/failure callbacks.
 * 
 * Props:
 * - orderId: UUID of the order
 * - amount: Total amount to charge (in rupees)
 * - orderNumber: Order number for display
 * - customerEmail: User email
 * - customerPhone: User phone
 * - customerName: User name
 * - onSuccess: Callback function on payment success
 * - onError: Callback function on payment failure
 * - loading: External loading state (optional)
 * - disabled: Disable button (optional)
 */
const RazorpayButton = ({
  orderId,
  amount,
  orderNumber,
  customerEmail,
  customerPhone,
  customerName,
  onSuccess,
  onError,
  loading: externalLoading = false,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clearCart } = useCart();

  // Validate payment configuration and load Razorpay SDK on mount
  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Validate payment configuration
        const config = validatePaymentConfig();
        if (!config.isValid) {
          const errorMsg = config.errors.join(', ');
          setError(errorMsg);
          addToast(`Payment configuration error: ${errorMsg}`);
          return;
        }

        // Load Razorpay SDK
        await loadRazorpaySDK();
        setSdkLoaded(true);
      } catch (err) {
        const errorMsg = err.message || 'Failed to initialize payment';
        setError(errorMsg);
        addToast(errorMsg);
        console.error('Payment initialization error:', err);
      }
    };

    initializePayment();
  }, [addToast]);

  // Format amount for display (INR currency symbol)
  const formatCurrency = (amountInRupees) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInRupees);
  };

  // Handle payment button click
  const handlePaymentClick = async () => {
    try {
      // Clear any previous errors
      setError(null);

      // Validate required props
      if (!orderId || !amount || !customerEmail || !customerPhone || !customerName) {
        const missingFields = [];
        if (!orderId) missingFields.push('orderId');
        if (!amount) missingFields.push('amount');
        if (!customerEmail) missingFields.push('customerEmail');
        if (!customerPhone) missingFields.push('customerPhone');
        if (!customerName) missingFields.push('customerName');

        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        setError(errorMsg);
        addToast(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return;
      }

      // Check SDK is loaded
      if (!sdkLoaded || !window.Razorpay) {
        const errorMsg = 'Payment gateway not loaded. Please refresh and try again.';
        setError(errorMsg);
        addToast(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return;
      }

      setIsLoading(true);

      // Prepare order data for Razorpay
      const orderData = {
        orderId,
        amount: Math.round(amount * 100), // Convert to paisa (smallest unit)
        orderNumber,
        customerEmail,
        customerPhone,
        customerName,
        onSuccess: (response) => {
          setIsLoading(false);
          
          // Show success message
          addToast(`Payment successful! Order #${orderNumber} confirmed.`);
          
          // Clear cart after successful payment
          clearCart();
          
          // Call external success callback
          if (onSuccess) {
            onSuccess(response);
          }
          
          // Redirect to order confirmation page
          setTimeout(() => {
            navigate(`/order-confirmation/${orderId}`, { 
              state: { paymentResponse: response } 
            });
          }, 500);
        },
        onError: (err) => {
          setIsLoading(false);
          
          const errorMsg = err.message || 'Payment failed. Please try again.';
          setError(errorMsg);
          addToast(errorMsg);
          
          // Call external error callback
          if (onError) {
            onError(err);
          }
          
          console.error('Payment error:', err);
        }
      };

      // Initiate payment through Razorpay
      await initiateRazorpayPayment(orderData);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.message || 'An error occurred while processing payment';
      setError(errorMsg);
      addToast(errorMsg);
      
      if (onError) {
        onError(err);
      }
      
      console.error('Payment click handler error:', err);
    }
  };

  const isProcessing = isLoading || externalLoading;
  const isDisabled = disabled || isProcessing || !sdkLoaded;
  const formattedAmount = formatCurrency(amount);

  return (
    <div className="w-full">
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Payment Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Payment button */}
      <button
        onClick={handlePaymentClick}
        disabled={isDisabled}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold text-base
          flex items-center justify-center gap-2
          transition-all duration-200
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-rose text-cream hover:bg-opacity-90 active:scale-95 cursor-pointer'
          }
        `}
        aria-label={`Pay ${formattedAmount} for order #${orderNumber}`}
      >
        {isProcessing ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Pay Now</span>
            <span className="font-bold">{formattedAmount}</span>
          </>
        )}
      </button>

      {/* SDK not loaded warning */}
      {!sdkLoaded && !error && (
        <p className="text-center text-sm text-stone mt-2">
          Initializing payment gateway...
        </p>
      )}

      {/* Additional info */}
      <p className="text-center text-xs text-stone mt-3">
        Secured by Razorpay | Order #{orderNumber}
      </p>
    </div>
  );
};

export default RazorpayButton;
