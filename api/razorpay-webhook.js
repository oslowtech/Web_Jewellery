import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// More robust environment variable access
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('INFO: Razorpay webhook handler invoked.');

  if (req.method !== 'POST') {
    console.warn(`WARN: Method ${req.method} not allowed for webhook.`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is not set in Vercel environment variables.');
    return res.status(500).json({ error: 'Webhook secret not configured on the server.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
      console.warn('WARN: Webhook request missing x-razorpay-signature header.');
      return res.status(400).json({ error: 'Invalid request: Missing signature' });
  }

  try {
    const requestBody = JSON.stringify(req.body);
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(requestBody);
    const digest = shasum.digest('hex');

    console.log(`INFO: Received signature: ${signature}`);
    console.log(`INFO: Calculated digest: ${digest}`);

    // 1. Validate the signature
    if (digest !== signature) {
      console.warn('Webhook signature validation failed.');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('INFO: Webhook signature validated successfully.');

    // 2. Process the event
    const event = req.body;
    console.log(`INFO: Processing event: ${event.event}`);

    if (event.event === 'payment_link.paid') {
      const paymentLink = event.payload.payment_link.entity;
      const payment = event.payload.payment.entity;
      
      const invoiceId = paymentLink.reference_id; // This is our manual_invoice.id
      const razorpayPaymentId = payment.id;

      console.log(`INFO: Event 'payment_link.paid'. Invoice ID (reference_id): ${invoiceId}`);

      if (!invoiceId) {
        console.warn('Webhook received for payment_link.paid but no reference_id (invoiceId) found.');
        return res.status(200).json({ status: 'ignored', reason: 'No reference_id' });
      }

      console.log(`INFO: Updating manual_invoices table for ID: ${invoiceId}`);
      const { data, error } = await supabase
        .from('manual_invoices')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        console.error('ERROR: Supabase update error for payment_link.paid:', error);
        throw error;
      }
      console.log(`SUCCESS: Updated invoice ${data.invoice_number} to paid via payment link.`);

    } else if (event.event === 'qr_code.credited') {
      const qrCode = event.payload.qr_code.entity;
      const payment = event.payload.payment.entity;

      const invoiceId = qrCode.notes?.invoice_id;
      const razorpayPaymentId = payment.id;

      console.log(`INFO: Event 'qr_code.credited'. Invoice ID (from notes): ${invoiceId}`);

      if (!invoiceId) {
        console.warn('Webhook received for qr_code.credited but no invoice_id found in notes.');
        return res.status(200).json({ status: 'ignored', reason: 'No invoice_id in notes' });
      }

      console.log(`INFO: Updating manual_invoices table for ID: ${invoiceId}`);
      const { data, error } = await supabase
        .from('manual_invoices')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        console.error('ERROR: Supabase update error for qr_code.credited:', error);
        throw error;
      }
      console.log(`SUCCESS: Updated invoice ${data.invoice_number} to paid via QR code.`);

    } else {
      console.log(`INFO: Received event '${event.event}', which is not handled. Ignoring.`);
    }

    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('ERROR: Razorpay Webhook handler failed.', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}