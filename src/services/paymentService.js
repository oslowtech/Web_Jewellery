import { supabase } from '../lib/supabase.js';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const WHATSAPP_PHONE = '917307058932';

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) {
    throw new Error('Please sign in again before making payment');
  }
  return data.session.access_token;
}

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/**
 * Create a Razorpay order
 * This calls your backend API endpoint to create a Razorpay order securely
 */
export async function createRazorpayOrder(orderData) {
  try {
    const { orderId } = orderData;

    if (!RAZORPAY_KEY_ID) {
      throw new Error('Razorpay Key ID not configured. Please set VITE_RAZORPAY_KEY_ID in your .env file');
    }

    const token = await getAccessToken();
    const response = await fetch(apiUrl('/api/razorpay/create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Failed to create Razorpay order: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    throw err;
  }
}

/**
 * Open Razorpay payment modal and handle payment
 */
export async function initiateRazorpayPayment(orderData) {
  try {
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded. Make sure to include <script src="https://checkout.razorpay.com/v1/checkout.js"></script>');
    }

    // Create Razorpay order first
    const razorpayOrder = await createRazorpayOrder(orderData);

    const {
      orderId,
      customerEmail,
      customerPhone,
      customerName,
      onSuccess,
      onError
    } = orderData;

    // Razorpay checkout options
    const options = {
      key: razorpayOrder.keyId || RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      order_id: razorpayOrder.razorpayOrderId,
      name: 'Elan Jewellery',
      description: `Order #${razorpayOrder.orderNumber}`,
      customer_id: orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      },
      handler: async (response) => {
        try {
          // Verify payment on the backend
          const verified = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId
          });

          if (verified) {
            if (onSuccess) {
              onSuccess(response);
            }
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (err) {
          console.error('Error handling payment success:', err);
          if (onError) {
            onError(err);
          }
        }
      },
      modal: {
        ondismiss: () => {
          // Payment modal closed
          if (onError) {
            onError(new Error('Payment modal closed by user'));
          }
        }
      },
      retry: {
        enabled: true,
        max_count: 3
      },
      theme: {
        color: '#F37254' // Elan branding color (customize as needed)
      }
    };

    // Create and open the checkout
    const rzp = new window.Razorpay(options);
    rzp.open();

    return rzp;
  } catch (err) {
    console.error('Error initiating Razorpay payment:', err);
    throw err;
  }
}

/**
 * Verify Razorpay payment signature
 * This should be called on your backend for security
 */
export async function verifyRazorpayPayment(verificationData) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = verificationData;

    // Call backend API to verify payment
    const token = await getAccessToken();
    const response = await fetch(apiUrl('/api/razorpay/verify-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Payment verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.verified === true;
  } catch (err) {
    console.error('Error verifying Razorpay payment:', err);
    throw err;
  }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailure(orderId, errorData) {
  try {
    return {
      success: false,
      message: 'Payment failed. Please try again.',
      error: errorData.error
    };
  } catch (err) {
    console.error('Error handling payment failure:', err);
    throw err;
  }
}

/**
 * Refund payment (admin function)
 */
export async function refundPayment(paymentId, amount = null) {
  try {
    const token = await getAccessToken();
    const response = await fetch(apiUrl('/api/razorpay/refund'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpayPaymentId: paymentId,
        amount: amount ? amount * 100 : null // Razorpay expects paisa
      })
    });

    if (!response.ok) {
      throw new Error(`Refund request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error refunding payment:', err);
    throw err;
  }
}

/**
 * Get payment methods (for UI selection)
 */
export const PAYMENT_METHODS = {
  COD: 'cod',
  PREPAID: 'prepaid',
  CARD: 'card',
  UPI: 'upi',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  EMI: 'emi'
};

/**
 * Format amount for Razorpay (convert to paisa)
 */
export function formatAmountForRazorpay(amount) {
  return Math.round(amount * 100);
}

/**
 * Format amount from Razorpay (convert from paisa)
 */
export function formatAmountFromRazorpay(amount) {
  return amount / 100;
}

/**
 * Validate payment configuration
 */
export function validatePaymentConfig() {
  const errors = [];

  if (!RAZORPAY_KEY_ID) {
    errors.push('Razorpay Key ID (VITE_RAZORPAY_KEY_ID) is not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Load Razorpay SDK dynamically
 */
export function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Generate payment receipt/invoice
 */
export function generatePaymentReceipt(order, payment) {
  return {
    orderId: order.id,
    orderNumber: order.order_number,
    paymentId: payment.razorpay_payment_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    timestamp: payment.created_at,
    paymentMethod: payment.payment_method
  };
}

/**
 * Finalize manual order (COD or Prepaid) in database
 */
export async function finalizeManualOrder(orderId, paymentMethod) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_method: paymentMethod,
      payment_status: paymentMethod === PAYMENT_METHODS.COD ? 'pending_cod' : 'pending_prepaid',
      status: 'processing'
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generate WhatsApp order confirmation link
 */
export function generateWhatsAppOrderLink(order, paymentMethod) {
  const isCod = paymentMethod === PAYMENT_METHODS.COD;
  const methodText = isCod ? 'Cash on Delivery (COD)' : 'Prepaid (Manual)';
  
  const message = `Hello Elan Jewellery, I have placed a new order!\n\n*Order ID:* ${order.order_number || order.id}\n*Payment Method:* ${methodText}\n*Total Amount:* ₹${order.total_amount}\n\nPlease confirm my order details and provide the payment link.`;
  
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
