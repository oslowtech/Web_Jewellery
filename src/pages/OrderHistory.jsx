import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrder } from '../context/OrderContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';
import { updateOrderStatus } from '../services/orderService.js';

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { state: orderState, actions: orderActions, helpers } = useOrder();
  const { addToast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    orderActions.loadOrders();
  }, [user, authLoading, navigate, orderActions]);

  useEffect(() => {
    let filtered = orderState.orders;
    
    if (selectedStatus) {
      filtered = filtered.filter(o => o.status === selectedStatus);
    }

    setFilteredOrders(filtered);
  }, [orderState.orders, selectedStatus]);

  const handleViewOrder = (orderId) => {
    navigate(`/order-confirmation/${orderId}`);
  };

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }
    
    try {
      setCancellingId(orderId);
      await updateOrderStatus(orderId, 'cancelled', 'Cancelled by customer');
      addToast({ message: 'Order cancelled successfully', type: 'success' });
      await orderActions.loadOrders();
    } catch (err) {
      addToast({ message: err.message || 'Failed to cancel order', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const stats = helpers.getOrderStats();

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-onyx mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedStatus(null)}
          >
            <p className="text-2xl font-bold text-onyx">{stats.total}</p>
            <p className="text-sm text-gray-600">All Orders</p>
          </div>
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedStatus('pending')}
          >
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedStatus('processing')}
          >
            <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            <p className="text-sm text-gray-600">Processing</p>
          </div>
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedStatus('shipped')}
          >
            <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
            <p className="text-sm text-gray-600">Shipped</p>
          </div>
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedStatus('delivered')}
          >
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            <p className="text-sm text-gray-600">Delivered</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orderState.loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orderState.error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium">Error loading orders: {orderState.error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">
                {selectedStatus ? 'No orders with this status' : 'No orders yet'}
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="text-rose hover:underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer"
                onClick={() => handleViewOrder(order.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-onyx">
                      Order {order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {order.order_items?.length || 0} item(s)
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {order.order_items?.slice(0, 3).map(item => (
                      <span
                        key={item.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {item.product_name}
                      </span>
                    ))}
                    {order.order_items?.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{order.order_items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Gifting Badge */}
                {order.gifting_metadata?.[0]?.is_gift && (
                  <div className="mb-4">
                    <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
                      🎁 Gift Order
                    </span>
                  </div>
                )}

                {/* Order Details */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-onyx">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Delivering to {order.shipping_address?.city}
                    </p>
                    <div className="flex gap-4 mt-2 justify-end">
                      {['pending', 'payment_pending', 'paid', 'processing'].includes(order.status) && (
                        <button
                          onClick={(e) => handleCancelOrder(e, order.id)}
                          disabled={cancellingId === order.id}
                          className="text-red-600 hover:underline text-sm font-semibold disabled:opacity-50"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                        className="text-rose hover:underline text-sm font-semibold"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                {order.payment_status && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600">
                      Payment:{' '}
                      <span
                        className={`font-semibold ${
                          order.payment_status === 'completed'
                            ? 'text-green-600'
                            : order.payment_status === 'failed'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </p>
                  </div>
                )}

                {/* Tracking Info */}
                {(order.tracking_id || order.tracking_url) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tracking Information</p>
                        {order.tracking_id && (
                          <p className="text-sm font-semibold text-onyx">ID: {order.tracking_id}</p>
                        )}
                      </div>
                      {order.tracking_url && (
                        <a 
                          href={order.tracking_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-2 sm:mt-0 text-rose hover:underline text-sm font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track Package &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Empty State Suggestions */}
        {filteredOrders.length === 0 && !orderState.loading && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
            <p className="text-blue-700">
              {selectedStatus
                ? 'Try filtering by a different status'
                : 'Start shopping to create your first order'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
