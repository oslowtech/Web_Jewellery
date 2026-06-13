import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ReceiptText } from 'lucide-react';
import { getOrderById } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';
import { getLuckyDrawEntryByOrder, verifyAndUseCode } from '../services/luckyDrawService.js';
import PageLoader from '../components/common/PageLoader.jsx';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [luckyDraw, setLuckyDraw] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
        
        if (data && data.total_amount >= 3000) {
          const drawData = await getLuckyDrawEntryByOrder(orderId);
          setLuckyDraw(drawData);
        }
      } catch (err) {
        setError(err.message || 'Unable to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) loadOrder();
  }, [orderId]);

  const handleRedeem = async () => {
    if (!window.confirm("Are you sure you want to redeem this code now?")) return;
    setRedeeming(true);
    try {
      const updated = await verifyAndUseCode(luckyDraw.code);
      setLuckyDraw(updated);
    } catch (err) {
      alert(err.message || "Failed to redeem code.");
    } finally {
      setRedeeming(false);
    }
  };

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
        {/* Printable Invoice Header */}
        <div className="hidden print:block text-center mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-display font-bold text-onyx">Nagneshwari Jewels</h1>
          <p className="text-sm text-stone mt-1">Premium Artificial Jewellery</p>
        </div>

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

        {/* Tracking Details */}
        {(order.tracking_id || order.tracking_url) && (
          <div className="mt-6 rounded-lg bg-indigo-50 border border-indigo-200 p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Tracking Information</h3>
            {order.tracking_id && (
              <p className="text-sm text-indigo-800 mb-1">
                <span className="font-medium">Tracking ID:</span> {order.tracking_id}
              </p>
            )}
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-sm text-rose hover:underline font-semibold">
                Track your shipment &rarr;
              </a>
            )}
          </div>
        )}

        {luckyDraw && (
          <div className="mt-6 rounded-lg bg-rose/5 border border-rose/20 p-6 text-center">
            <h3 className="font-display text-xl text-rose mb-2">🎉 You won a Lucky Draw Entry!</h3>
            <p className="text-sm text-stone mb-4">Show this QR code at the store or click Redeem to claim your prize.</p>
            <img src={`https://quickchart.io/qr?text=${luckyDraw.code}&size=200&margin=2`} alt="Lucky Draw QR" className="w-32 h-32 mx-auto rounded-xl mb-3 p-2 bg-white shadow-sm" />
            <p className="font-bold tracking-widest text-lg text-onyx">{luckyDraw.code}</p>
            <p className="text-xs text-stone mt-1">Or access it anytime from your <Link to="/lucky-draw" className="underline font-medium text-rose">Lucky Draw</Link> page.</p>
            {luckyDraw.is_used && <p className="mt-2 text-sm font-bold text-rose">Redeemed</p>}
            {!luckyDraw.is_used && (
              <button 
                onClick={handleRedeem}
                disabled={redeeming || order?.status !== 'delivered'}
                className="mt-4 rounded-full bg-onyx px-6 py-2 text-sm font-bold text-white uppercase tracking-wider disabled:opacity-50"
              >
                {redeeming ? "REDEEMING..." : order?.status !== 'delivered' ? "REDEEM AFTER DELIVERY" : "REDEEM NOW"}
              </button>
            )}
          </div>
        )}

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
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between text-stone">
                <span>Base Price (Excl. tax)</span>
                <span>{formatPrice(order.total_amount - order.shipping_charge - (order.gift_wrap_fee || 0) - (order.cod_fee || 0) + order.discount_amount - order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-stone">
                <span>Tax (GST)</span>
                <span>{formatPrice(order.tax_amount)}</span>
              </div>
              {order.shipping_charge > 0 && (
                <div className="flex justify-between text-stone">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping_charge)}</span>
                </div>
              )}
              {order.gift_wrap_fee > 0 && (
                <div className="flex justify-between text-stone">
                  <span>Gift Wrap</span>
                  <span>{formatPrice(order.gift_wrap_fee)}</span>
                </div>
              )}
              {order.cod_fee > 0 && (
                <div className="flex justify-between text-stone">
                  <span>COD Fee</span>
                  <span>{formatPrice(order.cod_fee)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t text-onyx">
                <span>Total Paid</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
          {order.payment_status === 'completed' && (
            <button onClick={() => window.print()} className="inline-flex justify-center rounded-lg bg-onyx px-5 py-3 text-sm font-semibold text-white">
              Download Invoice
            </button>
          )}
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
