import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { 
  sanitizeOrderItem, 
  sanitizeGiftingMetadata, 
  sanitizePrice,
  logSecurityEvent 
} from '../utils/sanitize.js';
import { checkCheckoutLimit, checkPaymentLimit } from '../utils/rateLimit.js';

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local'
    );
  }
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber() {
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().slice(0, 13).replace(/[-T]/g, '');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${dateStr}-${random}`;
}

/**
 * Create a new order
 */
export async function createOrder(orderData) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check rate limit for checkout
    const checkoutLimitCheck = checkCheckoutLimit(user.id);
    if (!checkoutLimitCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded_checkout', {
        userId: user.id,
        reason: checkoutLimitCheck.error
      }, 'warning');
      throw new Error(checkoutLimitCheck.error);
    }

    const {
      billingAddressId,
      shippingAddressId,
      items,
      totalAmount,
      taxAmount = 0,
      shippingCharge = 0,
      discountAmount = 0,
      gifting = null
    } = orderData;

    // Validate input
    if (!billingAddressId || !shippingAddressId) {
      logSecurityEvent('order_validation_failed', {
        userId: user.id,
        reason: 'Missing billing or shipping address'
      }, 'warning');
      throw new Error('Billing and shipping addresses are required');
    }

    if (!items || items.length === 0) {
      logSecurityEvent('order_validation_failed', {
        userId: user.id,
        reason: 'No items in order'
      }, 'warning');
      throw new Error('Order must contain at least one item');
    }

    // Sanitize and validate order items
    const sanitizedItems = [];
    for (const item of items) {
      const itemResult = sanitizeOrderItem(item);
      if (!itemResult.isValid) {
        logSecurityEvent('order_item_validation_failed', {
          userId: user.id,
          errors: itemResult.errors
        }, 'warning');
        throw new Error(`Invalid order item: ${itemResult.errors.join(', ')}`);
      }
      sanitizedItems.push(itemResult.data);
    }

    // Sanitize amount fields
    const sanitizedTotalAmount = sanitizePrice(totalAmount);
    const sanitizedTaxAmount = sanitizePrice(taxAmount);
    const sanitizedShippingCharge = sanitizePrice(shippingCharge);
    const sanitizedDiscountAmount = sanitizePrice(discountAmount);

    if (sanitizedTotalAmount === null) {
      logSecurityEvent('order_validation_failed', {
        userId: user.id,
        reason: 'Invalid total amount'
      }, 'warning');
      throw new Error('Invalid total amount');
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          order_number: orderNumber,
          billing_address_id: billingAddressId,
          shipping_address_id: shippingAddressId,
          total_amount: sanitizedTotalAmount,
          tax_amount: sanitizedTaxAmount,
          shipping_charge: sanitizedShippingCharge,
          discount_amount: sanitizedDiscountAmount,
          status: 'pending',
          payment_status: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = sanitizedItems.map(item => ({
      order_id: orderRecord.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price_per_unit: item.pricePerUnit,
      discount_per_unit: item.discountPerUnit || 0,
      total_price: item.totalPrice
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Insert gifting metadata if applicable
    if (gifting && (gifting.is_gift || gifting.isGift)) {
      const giftingResult = sanitizeGiftingMetadata({
        ...gifting,
        is_gift: Boolean(gifting.is_gift || gifting.isGift)
      });
      if (!giftingResult.isValid) {
        logSecurityEvent('gifting_validation_failed', {
          userId: user.id,
          errors: giftingResult.errors
        }, 'warning');
        throw new Error(`Invalid gifting data: ${giftingResult.errors.join(', ')}`);
      }

      const { error: giftingError } = await supabase
        .from('gifting_metadata')
        .insert([
          {
            order_id: orderRecord.id,
            ...giftingResult.data
          }
        ]);

      if (giftingError) throw giftingError;
    }

    logSecurityEvent('order_created', {
      userId: user.id,
      orderId: orderRecord.id,
      orderNumber,
      itemCount: sanitizedItems.length,
      totalAmount: sanitizedTotalAmount
    }, 'info');

    return orderRecord;
  } catch (err) {
    console.error('Error creating order:', err);
    logSecurityEvent('order_creation_error', {
      error: err.message
    }, 'error');
    throw err;
  }
}

/**
 * Fetch all orders for the logged-in user
 */
export async function fetchUserOrders(filters = {}) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gifting_metadata(*),
        billing_address:addresses!billing_address_id(*),
        shipping_address:addresses!shipping_address_id(*)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching user orders:', err);
    throw err;
  }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gifting_metadata(*),
        billing_address:addresses!billing_address_id(*),
        shipping_address:addresses!shipping_address_id(*),
        payments(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching order:', err);
    throw err;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gifting_metadata(*),
        billing_address:addresses!billing_address_id(*),
        shipping_address:addresses!shipping_address_id(*),
        payments(*)
      `)
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching order by number:', err);
    throw err;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, newStatus, notes = '') {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current order to verify ownership
    const order = await getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    await supabase
      .from('order_status_history')
      .insert([
        {
          order_id: orderId,
          old_status: order.status,
          new_status: newStatus,
          changed_by: user.id,
          notes
        }
      ]);

    return data;
  } catch (err) {
    console.error('Error updating order status:', err);
    throw err;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(orderId, paymentStatus, razorpayPaymentId = null, razorpayOrderId = null) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    if (razorpayPaymentId) {
      updateData.razorpay_payment_id = razorpayPaymentId;
    }

    if (razorpayOrderId) {
      updateData.razorpay_order_id = razorpayOrderId;
    }

    // If payment completed, also update order status
    if (paymentStatus === 'completed') {
      updateData.status = 'processing';
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating payment status:', err);
    throw err;
  }
}

/**
 * Record payment transaction
 */
export async function recordPayment(paymentData) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      amount,
      paymentMethod,
      status = 'pending',
      responseData = null
    } = paymentData;

    // Check rate limit for payment attempts
    const paymentLimitCheck = checkPaymentLimit(user.id, orderId);
    if (!paymentLimitCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded_payment', {
        userId: user.id,
        orderId,
        reason: paymentLimitCheck.error
      }, 'warning');
      throw new Error(paymentLimitCheck.error);
    }

    // Sanitize amount
    const sanitizedAmount = sanitizePrice(amount);
    if (sanitizedAmount === null) {
      logSecurityEvent('payment_validation_failed', {
        userId: user.id,
        orderId,
        reason: 'Invalid amount'
      }, 'warning');
      throw new Error('Invalid payment amount');
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          amount: sanitizedAmount,
          currency: 'INR',
          payment_method: paymentMethod,
          status,
          response_data: responseData
        }
      ])
      .select()
      .single();

    if (error) throw error;

    logSecurityEvent('payment_recorded', {
      userId: user.id,
      orderId,
      paymentId: data.id,
      amount: sanitizedAmount,
      status
    }, 'info');

    return data;
  } catch (err) {
    console.error('Error recording payment:', err);
    logSecurityEvent('payment_error', {
      error: err.message
    }, 'error');
    throw err;
  }
}

/**
 * Get payment for order
 */
export async function getOrderPayment(orderId) {
  requireSupabase();
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return null; // No payment found
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching order payment:', err);
    throw err;
  }
}

/**
 * Get order status history
 */
export async function getOrderStatusHistory(orderId) {
  requireSupabase();
  try {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching order status history:', err);
    throw err;
  }
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(items, taxRate = 0.18, shippingCharge = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount + shippingCharge;

  return {
    subtotal,
    taxAmount,
    shippingCharge,
    totalAmount
  };
}

/**
 * Validate order data
 */
export function validateOrderData(orderData) {
  const errors = [];

  if (!orderData.billingAddressId) {
    errors.push('Billing address is required');
  }

  if (!orderData.shippingAddressId) {
    errors.push('Shipping address is required');
  }

  if (!orderData.items || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (orderData.items) {
    orderData.items.forEach((item, index) => {
      const itemResult = sanitizeOrderItem(item);
      if (!itemResult.isValid) {
        errors.push(`Item ${index + 1}: ${itemResult.errors.join(', ')}`);
      }
    });
  }

  if (!orderData.totalAmount || orderData.totalAmount <= 0) {
    errors.push('Valid total amount is required');
  }

  if (orderData.gifting && orderData.gifting.is_gift) {
    const giftingResult = sanitizeGiftingMetadata(orderData.gifting);
    if (!giftingResult.isValid) {
      errors.push(`Gifting data: ${giftingResult.errors.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Fetch all orders for admin (requires admin role)
 */
export async function fetchAllOrdersForAdmin(filters = {}) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gifting_metadata(*),
        billing_address:addresses!billing_address_id(*),
        shipping_address:addresses!shipping_address_id(*),
        profiles!user_id(full_name, email)
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching all orders:', err);
    throw err;
  }
}

/**
 * Update order status for admin
 */
export async function updateOrderStatusAdmin(orderId, newStatus, trackingId = null, trackingUrl = null, notes = '') {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existingOrder, error: existingError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (existingError) throw existingError;

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        tracking_id: trackingId || null,
        tracking_url: trackingUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    await supabase
      .from('order_status_history')
      .insert([
        {
          order_id: orderId,
          old_status: existingOrder?.status || null,
          new_status: newStatus,
          changed_by: user.id,
          notes
        }
      ]);

    return data;
  } catch (err) {
    console.error('Error updating order status:', err);
    throw err;
  }
}
