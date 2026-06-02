﻿import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fetchAllOrdersForAdmin, updateOrderStatusAdmin } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  payment_pending: 'bg-orange-100 text-orange-800 border-orange-300',
  paid: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-purple-100 text-purple-800 border-purple-300',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  refunded: 'bg-gray-100 text-gray-800 border-gray-300'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-orange-50 text-orange-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-100 text-gray-800'
};

const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
];

const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const getCustomerName = (order) =>
  order.billing_address?.full_name ||
  order.profiles?.full_name ||
  order.profiles?.email ||
  'Customer';

const getCustomerEmail = (order) =>
  order.billing_address?.email || order.profiles?.email || '';

const formatStatus = (status = '') => status.replace(/_/g, ' ');

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  // State
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load orders on mount
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadOrders();
  }, [isAdmin, authLoading, navigate]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, paymentStatusFilter, startDate, endDate, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllOrdersForAdmin();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      addToast('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = orders;

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Payment status filter
    if (paymentStatusFilter) {
      filtered = filtered.filter(o => o.payment_status === paymentStatusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(o => new Date(o.created_at) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(o => new Date(o.created_at) <= new Date(endDate));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.order_number?.toLowerCase().includes(query) ||
        getCustomerName(o).toLowerCase().includes(query) ||
        getCustomerEmail(o).toLowerCase().includes(query) ||
        o.billing_address?.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setIsUpdating(true);
      await updateOrderStatusAdmin(selectedOrder.id, newStatus, trackingId, trackingUrl, statusNotes);
      
      // Update local state
      const updatedOrders = orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: newStatus, tracking_id: trackingId, tracking_url: trackingUrl } : o
      );
      setOrders(updatedOrders);
      
      setShowStatusModal(false);
      setStatusNotes('');
      setNewStatus(null);
      setTrackingId('');
      setTrackingUrl('');
      addToast(`Order status updated to ${newStatus}`);
      
      // Reload detail
      const updated = updatedOrders.find(o => o.id === selectedOrder.id);
      setSelectedOrder(updated);
    } catch (err) {
      console.error('Error updating status:', err);
      addToast('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setPaymentStatusFilter(null);
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const getStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-onyx mb-2">Admin Orders Dashboard</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-onyx">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            <p className="text-sm text-gray-600">Processing</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
            <p className="text-sm text-gray-600">Shipped</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            <p className="text-sm text-gray-600">Delivered</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-onyx">Filters</h2>
            {(statusFilter || paymentStatusFilter || startDate || endDate || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-rose hover:text-rose/80 text-sm font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Order/Customer
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order # or name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {formatStatus(status).charAt(0).toUpperCase() + formatStatus(status).slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentStatusFilter || ''}
                onChange={(e) => setPaymentStatusFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
              >
                <option value="">All Payment Status</option>
                {PAYMENT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium">Error: {error}</p>
              <button
                onClick={loadOrders}
                className="mt-4 text-rose hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">
                {orders.length === 0 ? 'No orders found' : 'No orders match these filters'}
              </p>
              {orders.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-rose hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-onyx">
                            Order {order.order_number}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {getCustomerName(order)}
                          {getCustomerEmail(order) && (
                            <> · {getCustomerEmail(order)}</>
                          )}
                        </p>

                        {/* Items Count */}
                        <p className="text-xs text-gray-600">
                          {order.order_items?.length || 0} item(s)
                        </p>

                        {/* Gifting Badge */}
                        {order.gifting_metadata?.[0]?.is_gift && (
                          <span className="inline-block mt-2 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                            Gift Order
                          </span>
                        )}
                      </div>

                      {/* Amount and Date */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-onyx mb-2">
                          {formatPrice(Number(order.total_amount || 0))}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {/* Payment Status */}
                        {order.payment_status && (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              PAYMENT_STATUS_COLORS[order.payment_status] || 'bg-gray-100'
                            }`}
                          >
                            Payment: {order.payment_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-onyx">
                Order {selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-onyx">Order Status</h3>
                  <button
                    onClick={() => {
                      setNewStatus(selectedOrder.status);
                      setTrackingId(selectedOrder.tracking_id || '');
                      setTrackingUrl(selectedOrder.tracking_url || '');
                      setShowStatusModal(true);
                    }}
                    className="text-rose hover:underline text-sm font-medium"
                  >
                    Update Status
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-2 rounded-full text-sm font-semibold border ${
                      ORDER_STATUS_COLORS[selectedOrder.status] || 'bg-gray-100'
                    }`}
                  >
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              {selectedOrder.payment_status && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-onyx mb-2">Payment Status</h3>
                  <span
                    className={`inline-block px-3 py-2 rounded text-sm font-medium ${
                      PAYMENT_STATUS_COLORS[selectedOrder.payment_status] || 'bg-gray-100'
                    }`}
                  >
                    {selectedOrder.payment_status}
                  </span>
                </div>
              )}

              {/* Shipping Details / Tracking */}
              {(selectedOrder.tracking_id || selectedOrder.tracking_url) && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-onyx mb-2">Tracking Information</h3>
                  {selectedOrder.tracking_id && (
                    <p className="text-sm text-indigo-900 mb-1">
                      <span className="font-medium">Tracking ID:</span> {selectedOrder.tracking_id}
                    </p>
                  )}
                  {selectedOrder.tracking_url && (
                    <a href={selectedOrder.tracking_url} target="_blank" rel="noreferrer" className="text-sm text-rose hover:underline font-medium">
                      Track Shipment &rarr;
                    </a>
                  )}
                </div>
              )}

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-onyx mb-3">Customer Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-700">Name:</span>{' '}
                    {getCustomerName(selectedOrder)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Email:</span>{' '}
                    {getCustomerEmail(selectedOrder)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Phone:</span>{' '}
                    {selectedOrder.billing_address?.phone}
                  </p>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="font-semibold text-onyx mb-3">Billing Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  {selectedOrder.billing_address ? (
                    <div className="space-y-1">
                      <p>{selectedOrder.billing_address.full_name}</p>
                      <p>{selectedOrder.billing_address.street_address}</p>
                      {selectedOrder.billing_address.street_address_2 && (
                        <p>{selectedOrder.billing_address.street_address_2}</p>
                      )}
                      <p>
                        {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state}{' '}
                        {selectedOrder.billing_address.postal_code}
                      </p>
                      <p>{selectedOrder.billing_address.country}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No billing address</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-onyx mb-3">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  {selectedOrder.shipping_address ? (
                    <div className="space-y-1">
                      <p>{selectedOrder.shipping_address.full_name}</p>
                      <p>{selectedOrder.shipping_address.street_address}</p>
                      {selectedOrder.shipping_address.street_address_2 && (
                        <p>{selectedOrder.shipping_address.street_address_2}</p>
                      )}
                      <p>
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                        {selectedOrder.shipping_address.postal_code}
                      </p>
                      <p>{selectedOrder.shipping_address.country}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No shipping address</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-onyx mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium text-onyx">{item.product_name}</p>
                        <p className="text-xs text-gray-500 mb-1">Product ID: {item.product_id}</p>
                        <p className="text-gray-600">
                          Qty: {item.quantity} x {formatPrice(Number(item.price_per_unit || 0))}
                        </p>
                      </div>
                      <p className="font-semibold text-onyx">
                        {formatPrice(Number(item.total_price || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gifting Info */}
              {selectedOrder.gifting_metadata?.[0]?.is_gift && (
                <div>
                  <h3 className="font-semibold text-onyx mb-3">Gifting Details</h3>
                  <div className="bg-pink-50 p-4 rounded-lg space-y-2 text-sm border border-pink-200">
                    <p>
                      <span className="font-medium">To:</span>{' '}
                      {selectedOrder.gifting_metadata[0].recipient_name}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{' '}
                      {selectedOrder.gifting_metadata[0].recipient_phone}
                    </p>
                    {selectedOrder.gifting_metadata[0].gift_message && (
                      <p>
                        <span className="font-medium">Message:</span>{' '}
                        {selectedOrder.gifting_metadata[0].gift_message}
                      </p>
                    )}
                    {selectedOrder.gifting_metadata[0].gift_wrap && (
                      <p className="text-pink-700 font-medium">Gift wrap included</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (Incl. taxes):</span>
                  <span>{formatPrice(Number(selectedOrder.total_amount || 0) - Number(selectedOrder.shipping_charge || 0) - Number(selectedOrder.gift_wrap_fee || 0) - Number(selectedOrder.cod_fee || 0) + Number(selectedOrder.discount_amount || 0))}</span>
                </div>
                {selectedOrder.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax (Included):</span>
                    <span>{formatPrice(Number(selectedOrder.tax_amount || 0))}</span>
                  </div>
                )}
                {selectedOrder.shipping_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatPrice(Number(selectedOrder.shipping_charge || 0))}</span>
                  </div>
                )}
                {selectedOrder.gift_wrap_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Gift Wrap:</span>
                    <span>{formatPrice(Number(selectedOrder.gift_wrap_fee || 0))}</span>
                  </div>
                )}
                {selectedOrder.cod_fee > 0 && (
                  <div className="flex justify-between">
                    <span>COD Fee:</span>
                    <span>{formatPrice(Number(selectedOrder.cod_fee || 0))}</span>
                  </div>
                )}
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(Number(selectedOrder.discount_amount || 0))}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(Number(selectedOrder.total_amount || 0))}</span>
                </div>
              </div>

              {/* Order Date */}
              <div className="text-xs text-gray-500">
                Order created: {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-onyx">Update Order Status</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusNotes('');
                  setNewStatus(null);
                  setTrackingId('');
                  setTrackingUrl('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current Status: <span className="text-onyx font-bold">{selectedOrder.status}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus || ''}
                  onChange={(e) => setNewStatus(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                >
                  <option value="">Select status...</option>
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {formatStatus(status).charAt(0).toUpperCase() + formatStatus(status).slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking ID (optional)
                </label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. AWB123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking URL (optional)
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status change..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusNotes('');
                    setNewStatus(null);
                    setTrackingId('');
                    setTrackingUrl('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={isUpdating || !newStatus}
                  className="flex-1 px-4 py-2 bg-rose text-white rounded-lg hover:bg-rose/90 disabled:opacity-50 font-medium"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
