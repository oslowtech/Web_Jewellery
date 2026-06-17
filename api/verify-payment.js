import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin-level access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set CORS headers natively for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { orderId, orderIdRzp, paymentId, signature } = body || {};

    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET is not set in environment variables.');
      // Don't expose the exact variable name to the client
      return res.status(500).json({ success: false, error: 'Server authentication configuration error.' });
    }

    if (!orderId || !orderIdRzp || !paymentId || !signature) {
      console.error('Missing fields. Received body:', JSON.stringify(body, null, 2));
      
      const missing = [];
      if (!orderId) missing.push('orderId');
      if (!orderIdRzp) missing.push('orderIdRzp (from Razorpay)');
      if (!paymentId) missing.push('paymentId (from Razorpay)');
      if (!signature) missing.push('signature (from Razorpay)');

      return res.status(400).json({ error: `Missing payment verification fields: ${missing.join(', ')}` });
    }

    const signatureBody = orderIdRzp + '|' + paymentId;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signatureBody.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Signature is valid, update the order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'processing',
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderIdRzp,
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