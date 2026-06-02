import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase client for backend validation
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Razorpay
let razorpay = null;
if (process.env.VITE_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// 1. Create Order Endpoint
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    if (!razorpay) return res.status(500).json({ error: 'Razorpay is not configured on the backend' });

    const { orderId } = req.body;
    if (!orderId || !supabase) return res.status(400).json({ error: 'Invalid request payload' });

    // Fetch order from Supabase to get the exact amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

    const amountInPaisa = Math.round(order.total_amount * 100);

    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: order.order_number,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Update order in Supabase with Razorpay Order ID
    await supabase
      .from('orders')
      .update({ razorpay_order_id: rzpOrder.id })
      .eq('id', orderId);

    res.json({
      keyId: process.env.VITE_RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      razorpayOrderId: rzpOrder.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 2. Verify Payment Endpoint
app.post('/api/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      if (supabase) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'processing',
            razorpay_payment_id: razorpay_payment_id
          })
          .eq('id', orderId);
      }
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// 3. Stub for Refund Endpoint
app.post('/api/razorpay/refund', async (req, res) => {
  res.status(501).json({ error: 'Refunds must be processed manually via the Razorpay dashboard for now.' });
});

// Export for Vercel Serverless OR Listen for Local Development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;