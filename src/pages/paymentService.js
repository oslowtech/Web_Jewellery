export const PAYMENT_METHODS = {
  PREPAID: 'prepaid',
  COD: 'cod',
};

/**
 * A placeholder for the old COD/manual flow.
 * It just updates the order status.
 */
export const finalizeManualOrder = async (orderId, paymentMethod) => {
  // This function is now only for COD.
  if (paymentMethod !== PAYMENT_METHODS.COD) {
    return; // Do nothing for prepaid, as it's handled by Razorpay verification
  }
  
  console.log(`Finalizing COD order ${orderId}`);
  return { success: true, orderId };
};

/**
 * Loads the Razorpay SDK script dynamically.
 * @returns {Promise<boolean>}
 */
export const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};