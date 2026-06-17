import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // CORS headers
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
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET,
    });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { amount, description, invoiceId } = body || {};

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is 100 paise (₹1).' });
    }
    if (!invoiceId) {
      return res.status(400).json({ error: 'Invoice ID is required to generate QR code.' });
    }

    const options = {
      type: 'upi_qr',
      name: `Nagneshwari - Inv #${description}`,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amount,
      description: `Payment for Invoice #${description}`,
      notes: {
        invoice_id: invoiceId, // Crucial for webhook mapping
      },
    };

    const qrCode = await razorpay.qrCode.create(options);

    res.status(200).json(qrCode);
  } catch (error) {
    console.error('Razorpay Create QR Code Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}