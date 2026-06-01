import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env (supports local dev with .env.local)
dotenv.config();
dotenv.config({ path: '.env.local' });

typeof process !== 'undefined';

const PORT = Number(process.env.PORT || 5174);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[api] Missing SUPABASE_URL/SUPABASE_ANON_KEY (or VITE_* equivalents). Auth verification may fail.');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[api] Missing SUPABASE_SERVICE_ROLE_KEY. Payment verification cannot update DB securely.');
}
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('[api] Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET. Razorpay endpoints will fail.');
}

const supabaseAuth = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

function safeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

async function requireSupabaseUser(req) {
  if (!supabaseAuth) {
    const err = new Error('Supabase auth not configured on server');
    err.statusCode = 500;
    throw err;
  }

  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    const err = new Error('Missing Authorization: Bearer <token>');
    err.statusCode = 401;
    throw err;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid or expired session');
    err.statusCode = 401;
    throw err;
  }

  return data.user;
}

async function requireAdminUser(req) {
  const user = await requireSupabaseUser(req);
  const admin = requireAdminClient();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    const err = new Error('Admin access required');
    err.statusCode = 403;
    throw err;
  }

  return user;
}

function requireAdminClient() {
  if (!supabaseAdmin) {
    const err = new Error('Supabase service role not configured on server');
    err.statusCode = 500;
    throw err;
  }
  return supabaseAdmin;
}

function requireRazorpayClient() {
  if (!razorpay) {
    const err = new Error('Razorpay not configured on server');
    err.statusCode = 500;
    throw err;
  }
  return razorpay;
}

const app = express();
app.disable('x-powered-by');

app.use(helmet({
  // Vite dev + Razorpay checkout script are handled by the frontend.
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.post('/api/razorpay/create-order', express.json(), async (req, res) => {
  try {
    const user = await requireSupabaseUser(req);
    const admin = requireAdminClient();
    const rzp = requireRazorpayClient();

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, total_amount, status, payment_status, order_number')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    if (order.payment_status === 'completed') {
      return res.status(409).json({ error: 'Order already paid' });
    }

    const total = Number(order.total_amount);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    const amountPaise = Math.round(total * 100);

    const razorpayOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: String(order.id),
      notes: {
        orderId: String(order.id),
        orderNumber: String(order.order_number),
        userId: String(user.id),
      },
    });

    // Store razorpay_order_id on the order for later reconciliation
    await admin
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id);

    res.json({
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderNumber: order.order_number,
      orderId: order.id,
    });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ error: e.message || 'Server error' });
  }
});

app.post('/api/razorpay/verify-payment', express.json(), async (req, res) => {
  try {
    const user = await requireSupabaseUser(req);
    const admin = requireAdminClient();

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch order and ensure ownership
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, total_amount, status, payment_status, order_number, razorpay_order_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    // Verify signature
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ error: 'Razorpay secret not configured' });

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(payload).digest('hex');

    const verified = safeEqualHex(expected, razorpay_signature);
    if (!verified) {
      await admin
        .from('orders')
        .update({ payment_status: 'failed', razorpay_payment_id, razorpay_order_id })
        .eq('id', order.id);

      return res.status(400).json({ verified: false });
    }

    // Mark order paid + record payment
    const oldStatus = order.status;

    const { data: updatedOrder, error: updErr } = await admin
      .from('orders')
      .update({
        payment_status: 'completed',
        status: oldStatus === 'pending' ? 'processing' : oldStatus,
        razorpay_payment_id,
        razorpay_order_id,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updErr) throw updErr;

    await admin.from('payments').upsert({
      order_id: order.id,
      razorpay_payment_id,
      razorpay_order_id,
      amount: order.total_amount,
      currency: 'INR',
      status: 'completed',
      payment_method: 'razorpay',
      response_data: {
        razorpay_order_id,
        razorpay_payment_id,
      },
    }, { onConflict: 'razorpay_payment_id' });

    if (oldStatus !== updatedOrder.status) {
      await admin.from('order_status_history').insert([
        {
          order_id: order.id,
          old_status: oldStatus,
          new_status: updatedOrder.status,
          changed_by: user.id,
          notes: 'Payment verified (Razorpay)',
        },
      ]);
    }

    res.json({ verified: true });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ error: e.message || 'Server error' });
  }
});

app.post('/api/razorpay/refund', express.json(), async (req, res) => {
  try {
    await requireAdminUser(req);
    const admin = requireAdminClient();
    const rzp = requireRazorpayClient();

    const { razorpayPaymentId, amount } = req.body || {};
    if (!razorpayPaymentId) {
      return res.status(400).json({ error: 'razorpayPaymentId is required' });
    }

    const refundPayload = {};
    if (amount !== null && amount !== undefined) {
      const amountPaise = Number(amount);
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        return res.status(400).json({ error: 'amount must be a positive paise value' });
      }
      refundPayload.amount = Math.round(amountPaise);
    }

    const refund = await rzp.payments.refund(razorpayPaymentId, refundPayload);

    const { data: payment } = await admin
      .from('payments')
      .select('id, order_id, response_data')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .maybeSingle();

    if (payment) {
      await admin
        .from('payments')
        .update({
          status: 'refunded',
          response_data: {
            ...(payment.response_data || {}),
            refund,
          },
        })
        .eq('id', payment.id);

      await admin
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', payment.order_id);
    }

    res.json({ ok: true, refund });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ error: e.message || 'Server error' });
  }
});

// Razorpay webhook (optional but recommended for reconciliation)
app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).send('Webhook secret not configured');
    }

    const signature = req.get('x-razorpay-signature');
    const expected = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (!safeEqualHex(expected, signature)) {
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const admin = requireAdminClient();

    const eventType = event?.event;
    const entity = event?.payload?.payment?.entity;
    const razorpayPaymentId = entity?.id;
    const razorpayOrderId = entity?.order_id;

    if (!razorpayOrderId) {
      return res.status(200).json({ ok: true });
    }

    // Find order by razorpay_order_id
    const { data: order } = await admin
      .from('orders')
      .select('id, status, payment_status')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    if (order) {
      if (eventType === 'payment.captured') {
        await admin
          .from('orders')
          .update({
            payment_status: 'completed',
            status: order.status === 'pending' ? 'processing' : order.status,
            razorpay_payment_id: razorpayPaymentId,
          })
          .eq('id', order.id);
      }

      if (eventType === 'payment.failed') {
        await admin
          .from('orders')
          .update({ payment_status: 'failed', razorpay_payment_id: razorpayPaymentId })
          .eq('id', order.id);
      }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[webhook] error', e);
    res.status(500).send('Webhook handler error');
  }
});

// Serve built frontend in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
