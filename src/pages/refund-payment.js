import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin-level access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payment_id, amount, order_id } = req.body;

    if (!payment_id || !amount || !order_id) {
      return res.status(400).json({ error: 'Missing payment_id, amount, or order_id' });
    }

    const refund = await razorpay.payments.refund(payment_id, {
      amount: Math.round(amount * 100), // amount in paise
      speed: 'normal',
      notes: {
        reason: 'Refund initiated from admin panel.',
      },
    });

    if (!refund) {
      throw new Error('Razorpay refund failed to process.');
    }

    // Update order status in Supabase to 'refunded'
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'refunded', payment_status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (error) throw error;

    res.status(200).json({ success: true, refund });
  } catch (error) {
    console.error('Refund API Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}