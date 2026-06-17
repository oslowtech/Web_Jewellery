import Razorpay from 'razorpay';
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

export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, receipt } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is 100 paise (₹1).' });
    }

    const options = { amount, currency: 'INR', receipt };
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ error: 'Razorpay order creation failed' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}