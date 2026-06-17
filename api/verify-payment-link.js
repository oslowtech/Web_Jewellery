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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { paymentLinkId, invoiceId } = body || {};

    if (!paymentLinkId || !invoiceId) {
      return res.status(400).json({ error: 'Missing paymentLinkId or invoiceId' });
    }

    const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);

    if (!paymentLink) {
      return res.status(404).json({ success: false, error: 'Razorpay Payment Link not found.' });
    }

    let newPaymentStatus = paymentLink.status;
    let razorpayPaymentId = null;

    if (paymentLink.status === 'paid' && paymentLink.payments && paymentLink.payments.length > 0) {
      razorpayPaymentId = paymentLink.payments[0].payment_id;
    }

    const { data, error } = await supabase
      .from('manual_invoices')
      .update({ payment_status: newPaymentStatus, razorpay_payment_id: razorpayPaymentId, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, invoice: data, paymentLinkStatus: newPaymentStatus });

  } catch (error) {
    console.error('Verify Payment Link API Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}