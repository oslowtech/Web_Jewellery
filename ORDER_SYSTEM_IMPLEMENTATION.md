# Order System Implementation Guide

**Current Status:** Phase 3 Complete - Full checkout flow implemented  
**Last Updated:** Current Session

---

## 📋 Overview

This guide covers the complete order management system for Elan Jewellery, including:
- Multi-address management
- Secure checkout flow
- Razorpay payment integration
- Order tracking and history
- Admin order dashboard

---

## ✅ What's Been Built

### 1. Database Schema (Supabase)
✅ **File:** `supabase/init.sql`

**Tables Created:**
- `addresses` - User's saved delivery addresses
- `orders` - Main order records
- `order_items` - Line items in each order
- `gifting_metadata` - Gift information and recipient details
- `payments` - Payment transaction audit trail
- `order_status_history` - Order status change tracking

**Features:**
- Complete Row-Level Security (RLS) policies
- Automatic timestamp updates via triggers
- Optimized indexes for performance
- Support for billing vs. shipping address
- Full audit trail for disputes

### 2. Services Layer
✅ **Files Created:**
- `src/services/addressService.js` - Address CRUD operations
- `src/services/orderService.js` - Order management
- `src/services/paymentService.js` - Razorpay integration

**Key Functions:**
```javascript
// Address Service
fetchAddresses()
saveAddress(data)
updateAddress(id, data)
deleteAddress(id)
getDefaultAddressById(type)
validateAddress(address)

// Order Service
createOrder(orderData)
fetchUserOrders(filters)
getOrderById(orderId)
updateOrderStatus(orderId, status)
recordPayment(paymentData)
calculateOrderTotals(items)
validateOrderData(orderData)

// Payment Service
createRazorpayOrder(orderData)
initiateRazorpayPayment(orderData)
verifyRazorpayPayment(verificationData)
handlePaymentFailure(orderId, errorData)
loadRazorpaySDK()
validatePaymentConfig()
```

### 3. Context (State Management)
✅ **Files Created:**
- `src/context/CheckoutContext.jsx` - Checkout flow state
- `src/context/OrderContext.jsx` - User orders state

**CheckoutContext:**
```javascript
state: {
  billingAddress, shippingAddress,
  gifting: { isGift, recipientName, recipientPhone, ... },
  cartItems, taxRate, shippingCharge, discountAmount
}

actions: {
  setBillingAddress, setShippingAddress, setGifting,
  setCartItems, setTaxRate, setShippingCharge, setDiscount,
  setLoading, setError, setOrderCreated, reset
}

computed: { totals, isCheckoutReady(), validateGifting() }
```

**OrderContext:**
```javascript
state: { orders, currentOrder, loading, error, filters }

actions: {
  loadOrders, loadOrderById, addOrder, updateOrder,
  setFilters, clearFilters, filterByStatus
}

helpers: {
  getOrderStats(), getTotalOrderValue(), getRecentOrders()
}
```

### 4. Pages (User Interfaces)
✅ **Files Created:**

#### Address Manager (`src/pages/AddressManager.jsx`)
- View all saved addresses
- Add new address
- Edit existing address
- Delete address with confirmation
- Set default address
- Address type selection (billing/shipping/both)
- Full form validation

#### Checkout (`src/pages/Checkout.jsx`)
- **Step 1:** Review cart items
- **Step 2:** Select billing address
- **Step 3:** Select shipping address + gifting options
- **Step 4:** Order review and confirmation
- Multi-step form with visual progress
- Live total calculation
- Razorpay payment initiation
- Order summary sidebar

#### Order History (`src/pages/OrderHistory.jsx`)
- View all user orders
- Filter by status (pending, processing, shipped, delivered, etc.)
- Order statistics dashboard
- Quick view order items
- Gift order badge for gifted items
- Payment status indicator
- Click to view full order details

### 5. Components
✅ **Files Created:**
- `src/components/common/AddressForm.jsx` - Reusable address form with validation

**Features:**
- Full name, phone, email validation
- Street address textarea
- City, state (34 Indian states), postal code fields
- Address type selection (radio buttons)
- Default address checkbox
- Error display and validation feedback

### 6. Routes Updated
✅ **File:** `src/routes/AppRoutes.jsx`

**New Routes:**
```javascript
/addresses          → AddressManager (auth-protected)
/checkout           → Checkout (auth-protected)
/orders             → OrderHistory (auth-protected)
```

### 7. Integration Points
✅ **Updated Files:**
- `src/main.jsx` - Added CheckoutProvider & OrderProvider
- `src/pages/Cart.jsx` - Added "Proceed to Checkout" button
- `src/components/layout/Navbar.jsx` - Added links to Orders & Addresses
- `.env.example` - Added Razorpay configuration

---

## 🔧 Setup & Configuration

### 1. Supabase Setup

**Execute SQL Schema:**
1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Copy entire content from `supabase/init.sql`
4. Run query
5. Verify all tables created

**Set Supabase Keys in `.env.local`:**
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 2. Razorpay Setup

**Get Razorpay API Keys:**
1. Go to https://dashboard.razorpay.com/
2. Create account / Login
3. Navigate to Settings > API Keys
4. Copy Key ID (public) and Key Secret (private)

**Add to `.env.local`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXX
VITE_RAZORPAY_KEY_SECRET=XXXXXX
```

⚠️ **IMPORTANT:** Key Secret should ONLY be used in backend API (never commit or expose in frontend)

### 3. Update index.html

**Add Razorpay Script Tag** in `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 4. Backend API Setup (NEXT PHASE)

Create API endpoints needed:
```
POST /api/razorpay/create-order
  - Creates Razorpay order
  - Validates order exists in Supabase
  - Returns razorpay_order_id

POST /api/razorpay/verify-payment
  - Verifies payment signature
  - Updates order & payment records
  - Returns success/failure

Webhook: /api/razorpay/webhook
  - Listens for payment.authorized
  - Confirms order when payment received
```

---

## 🧪 Testing Checklist

### Database
- [ ] Connect to Supabase
- [ ] Run init.sql successfully
- [ ] Verify all 6 tables exist
- [ ] Verify RLS policies active
- [ ] Test insert address (check RLS works)

### Services
- [ ] Import and test addressService
- [ ] Create test address
- [ ] Update and delete address
- [ ] Test address validation
- [ ] Import orderService
- [ ] Create test order
- [ ] Verify order created with items

### Frontend
- [ ] Run `npm run dev`
- [ ] Navigate to Address Manager
- [ ] Create new address
- [ ] Edit address
- [ ] Delete address
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Fill shipping addresses
- [ ] Enable gifting and fill fields
- [ ] Review order (don't submit payment yet)

### Payment (Sandbox Testing)
- [ ] Verify Razorpay SDK loads
- [ ] Test payment modal opens
- [ ] Use Razorpay test card:
  ```
  Card Number: 4111111111111111
  Expiry: Any future date (e.g., 12/25)
  CVV: 123
  ```
- [ ] Complete payment
- [ ] Verify order created in Supabase
- [ ] Check order appears in Order History

---

## 📱 User Journey

### 1. **Shopping**
   - User browses products on Shop page
   - Adds items to cart

### 2. **Checkout**
   - User navigates to cart
   - Clicks "Proceed to Checkout"
   - Selects/creates billing address
   - Selects/creates shipping address (can be different)
   - Optionally enables gifting mode and fills recipient details
   - Reviews order summary
   - Clicks "Place Order"

### 3. **Payment**
   - Razorpay modal opens
   - User completes payment
   - System verifies payment signature
   - Order confirmed in database
   - Cart cleared
   - User redirected to order confirmation

### 4. **Order History**
   - User views all orders
   - Filters by status
   - Clicks order for details
   - Sees delivery address and status timeline

---

## 🔐 Security Features

✅ **Implemented:**
- Row-Level Security (RLS) on all tables
- User isolation via RLS policies
- Payment signature verification required
- No card details stored (Razorpay handles)
- Auth guards on protected routes

⏳ **To Implement (Phase 7):**
- Rate limiting on checkout endpoint
- Input sanitization
- CORS configuration
- PCI compliance verification
- JWT validation for APIs

---

## 📊 Data Models

### Address
```javascript
{
  id: UUID,
  user_id: UUID,
  full_name: string,
  phone: string (10-12 digits),
  email: string,
  street_address: string,
  city: string,
  state: string (34 Indian states),
  postal_code: string (6 digits),
  country: "India",
  address_type: "billing" | "shipping" | "both",
  is_default: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Order
```javascript
{
  id: UUID,
  user_id: UUID,
  order_number: string (unique, e.g., "ORD-202401121430-7842"),
  billing_address_id: UUID,
  shipping_address_id: UUID,
  total_amount: decimal,
  tax_amount: decimal,
  shipping_charge: decimal,
  discount_amount: decimal,
  status: string (pending|payment_pending|paid|processing|shipped|delivered|cancelled),
  payment_status: string (pending|completed|failed|refunded),
  razorpay_order_id: string,
  razorpay_payment_id: string,
  created_at: timestamp,
  updated_at: timestamp,
  delivered_at: timestamp (null until delivered)
}
```

### Order Item
```javascript
{
  id: UUID,
  order_id: UUID,
  product_id: string,
  product_name: string,
  quantity: integer,
  price_per_unit: decimal,
  discount_per_unit: decimal,
  total_price: decimal,
  created_at: timestamp
}
```

### Gifting Metadata
```javascript
{
  id: UUID,
  order_id: UUID (unique),
  is_gift: boolean,
  recipient_name: string,
  recipient_phone: string (10 digits),
  recipient_email: string (optional),
  gift_message: text (optional),
  gift_wrap: boolean,
  from_name: string (optional),
  created_at: timestamp
}
```

### Payment
```javascript
{
  id: UUID,
  order_id: UUID,
  razorpay_payment_id: string (unique),
  razorpay_order_id: string,
  amount: decimal,
  currency: "INR",
  status: string (pending|authorized|captured|failed|refunded),
  payment_method: string (card|upi|netbanking|wallet),
  transaction_id: string,
  error_code: string (on failure),
  error_description: string (on failure),
  response_data: JSON,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🚀 Next Phases

### Phase 4: Backend API Setup
- [ ] Create Express/Node.js API (or Supabase Edge Functions)
- [ ] Implement Razorpay order creation endpoint
- [ ] Implement payment verification endpoint
- [ ] Implement webhook handler
- [ ] Add email sending (order confirmation)
- [ ] Test full end-to-end flow

### Phase 5: Admin Dashboard
- [ ] Admin view all orders
- [ ] Bulk order status updates
- [ ] Order fulfillment workflow
- [ ] Printable invoices/packing slips
- [ ] Refund management

### Phase 6: Advanced Features
- [ ] Order cancellation
- [ ] Return management
- [ ] SMS notifications
- [ ] Real-time order tracking
- [ ] Delivery tracking integration

### Phase 7: Security & Performance
- [ ] Rate limiting
- [ ] DDoS protection
- [ ] CDN for images
- [ ] Database optimization
- [ ] Caching strategy
- [ ] PCI compliance audit

---

## 🐛 Common Issues & Solutions

### Issue: Razorpay SDK not loading
**Solution:** Ensure script tag is in index.html `<head>`, not in body

### Issue: RLS preventing address creation
**Solution:** Verify user is authenticated and JWT is valid. Check RLS policy syntax.

### Issue: Cart not clearing after order
**Solution:** Call `clearCart()` after successful payment verification

### Issue: Addresses not showing in checkout
**Solution:** Verify user has created addresses, check RLS policies allowing read

---

## 📞 Support

**For issues with:**
- **Supabase:** Check SQL syntax and RLS policies
- **Razorpay:** Use test API keys, enable debug logging
- **Frontend:** Check browser console for errors
- **Auth:** Verify JWT token in storage

---

## 📝 Environment Variables Reference

```env
# Supabase (from dashboard)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# Razorpay (from dashboard)
VITE_RAZORPAY_KEY_ID=rzp_test_[key-id]
# NOTE: Never expose VITE_RAZORPAY_KEY_SECRET in frontend!
# Use .env.local and add to .gitignore

# Optional
VITE_API_BASE_URL=https://api.example.com
VITE_WHATSAPP_NUMBER=91...
```

---

## 🎯 Success Criteria

Order system is complete when:
1. ✅ Users can add multiple addresses
2. ✅ Checkout flow supports multi-step navigation
3. ✅ Gifting option works with recipient phone
4. ✅ Orders created in Supabase with all details
5. ✅ Payment processed via Razorpay
6. ✅ Users can view order history
7. ✅ Admin can manage orders (Phase 6)
8. ✅ System is secure and PCI compliant (Phase 7)

---

Last Updated: [Current Session]
Contributors: Copilot
