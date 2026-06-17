import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is not set in Vercel environment variables.');
    return res.status(500).json({ error: 'Webhook secret not configured on the server.' });
  }

  try {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    // 1. Validate the signature
    if (digest !== req.headers['x-razorpay-signature']) {
      console.warn('Webhook signature validation failed.');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // 2. Process the event
    const event = req.body;

    if (event.event === 'payment_link.paid') {
      const paymentLink = event.payload.payment_link.entity;
      const payment = event.payload.payment.entity;
      
      const invoiceId = paymentLink.reference_id; // This is our manual_invoice.id
      const razorpayPaymentId = payment.id;

      if (!invoiceId) {
        console.warn('Webhook received for payment_link.paid but no reference_id (invoiceId) found.');
        return res.status(200).json({ status: 'ignored', reason: 'No reference_id' });
      }

      // 3. Update the manual_invoices table in Supabase
      const { error } = await supabase
        .from('manual_invoices')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;
    }

    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}