import { supabase } from '../lib/supabase.js';

const WHATSAPP_PHONE = '917307058932';

/**
 * Get payment methods (for UI selection)
 */
export const PAYMENT_METHODS = {
  COD: 'cod',
  PREPAID: 'prepaid',
};

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
