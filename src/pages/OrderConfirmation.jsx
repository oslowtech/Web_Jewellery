import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ReceiptText } from 'lucide-react';
import { getOrderById } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';
import PageLoader from '../components/common/PageLoader.jsx';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Unable to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) loadOrder();
  }, [orderId]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-900">Order lookup failed</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link to="/orders" className="mt-5 inline-flex rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-cream">
            View orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-lg border border-white/70 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="h-7 w-7" />
              <h1 className="font-display text-2xl text-onyx">Order confirmed</h1>
            </div>
            <p className="mt-2 text-sm text-stone">
              Thank you. Your payment has been received and your jewellery order is now being processed.
            </p>
          </div>
          <div className="rounded-lg bg-cream px-4 py-3 text-sm">
            <p className="text-stone">Order number</p>
            <p className="font-semibold text-onyx">{order.order_number}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <ReceiptText className="mb-2 h-5 w-5 text-rose" />
            <p className="text-xs text-stone">Payment</p>
            <p className="font-semibold capitalize">{order.payment_status}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <Package className="mb-2 h-5 w-5 text-rose" />
            <p className="text-xs text-stone">Status</p>
            <p className="font-semibold capitalize">{order.status}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-stone">Total paid</p>
            <p className="text-lg font-semibold">{formatPrice(order.total_amount)}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold">Items</h2>
          <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-stone">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.total_price)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/orders" className="inline-flex justify-center rounded-lg bg-onyx px-5 py-3 text-sm font-semibold text-white">
            Track order
          </Link>
          <Link to="/shop" className="inline-flex justify-center rounded-lg border border-onyx/20 px-5 py-3 text-sm font-semibold">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
