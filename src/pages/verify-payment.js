import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: '*', // In production, restrict this to your frontend's domain
  methods: ['POST', 'OPTIONS'],
});

// Helper to run middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Initialize Supabase client with service role key for admin-level access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Signature is valid, update the order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'processing',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Supabase order update error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update order status' });
    }

    res.status(200).json({ success: true, order: data });

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}