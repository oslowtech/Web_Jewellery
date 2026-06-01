# 🔒 Security Utilities - Quick Reference

## Usage Guide for Developers

### Import Sanitization Functions

```javascript
import { 
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizePostalCode,
  sanitizePrice,
  sanitizeAddress,
  sanitizeOrderItem,
  sanitizeGiftingMetadata,
  logSecurityEvent
} from '../utils/sanitize.js';
```

---

## 🧹 Sanitization Functions

### `sanitizeString(str)`
Remove HTML/script tags, null bytes, and dangerous patterns.

```javascript
// ✅ Usage
const name = sanitizeString(userInput);  // "Hello <script>alert()</script>" → "Hello alert()"

// ✅ What it does
// - Removes HTML/script tags
// - Removes null bytes
// - Removes JavaScript URLs
// - Removes event handlers
// - Decodes HTML entities
// - Trims whitespace
```

### `sanitizeEmail(email)`
Validate and sanitize email addresses.

```javascript
// ✅ Usage
const email = sanitizeEmail(userInput);  // Returns lowercase email or null

// ✅ Validation
if (!email) {
  console.error('Invalid email');
} else {
  // Valid email - proceed with usage
}

// ✅ Checks
// - Format validation (RFC 5321 compliant)
// - Length check (max 254 chars)
// - Converts to lowercase
// - Blocks suspicious patterns
```

### `sanitizePhone(phone)`
Validate and sanitize phone numbers (India standard: 10-12 digits).

```javascript
// ✅ Usage
const phone = sanitizePhone(userInput);  // "+91-98765-43210" → "9876543210"

// ✅ Validation
if (!phone) {
  console.error('Invalid phone number');
} else {
  // Valid phone - proceed with usage
}

// ✅ Checks
// - Removes all non-digit characters
// - Validates 10-12 digit length
// - India-specific validation (landline/mobile)
```

### `sanitizePostalCode(code)`
Validate postal codes (India standard: 6 digits).

```javascript
// ✅ Usage
const postal = sanitizePostalCode(userInput);  // "123456" → "123456", "12 34 56" → "123456"

// ✅ Validation
if (!postal) {
  console.error('Invalid postal code');
} else {
  // Valid postal code - proceed with usage
}

// ✅ Checks
// - Removes whitespace
// - Validates 6-digit format
// - India-specific validation
```

### `sanitizePrice(price)`
Validate and sanitize prices (positive numbers, 2 decimals).

```javascript
// ✅ Usage
const price = sanitizePrice(userInput);  // "99.999" → 100.00

// ✅ Validation
if (price === null) {
  console.error('Invalid price');
} else {
  // Valid price - use in calculations
}

// ✅ Features
// - Converts strings to numbers
// - Ensures positive numbers only
// - Rounds to 2 decimal places
// - Max value: 9,999,999.99
// - Rejects NaN and Infinity
```

### `sanitizeAddress(address)`
Comprehensive address object validation and sanitization.

```javascript
// ✅ Usage
const result = sanitizeAddress({
  full_name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  street_address: "123 Main St",
  city: "New York",
  state: "NY",
  postal_code: "123456",
  country: "India"
});

if (result.isValid) {
  const sanitized = result.data;
  // All fields are sanitized and validated
} else {
  console.error(result.errors);
  // Array of error messages
}

// ✅ Fields Sanitized
// - full_name: 2-100 chars, no HTML
// - email: Valid RFC 5321 format
// - phone: 10-12 digits
// - street_address: 5-255 chars, no HTML
// - city: 2-100 chars, no HTML
// - state: 2-100 chars, no HTML
// - postal_code: 6 digits
// - country: Defaults to "India"
```

### `sanitizeOrderItem(item)`
Validate and sanitize order items.

```javascript
// ✅ Usage
const result = sanitizeOrderItem({
  productId: "prod_123",
  productName: "Gold Ring",
  quantity: 2,
  pricePerUnit: 5000,
  discountPerUnit: 500,
  totalPrice: 9000
});

if (result.isValid) {
  const sanitized = result.data;
  // Use sanitized item data
} else {
  console.error(result.errors);
}

// ✅ Validations
// - productId: Required, non-empty string
// - productName: 1-255 chars, no HTML
// - quantity: 1-1000, must be integer
// - pricePerUnit: Positive, 2 decimals, no overflow
// - discountPerUnit: Optional, same as price
// - totalPrice: Positive, 2 decimals
```

### `sanitizeGiftingMetadata(gifting)`
Validate and sanitize gift data.

```javascript
// ✅ Usage
const result = sanitizeGiftingMetadata({
  is_gift: true,
  recipient_name: "Jane Doe",
  recipient_email: "jane@example.com",
  recipient_phone: "9876543210",
  gift_message: "Happy birthday!",
  from_name: "John",
  gift_wrap: true
});

if (result.isValid) {
  const sanitized = result.data;
  // Use sanitized gift data
} else {
  console.error(result.errors);
}

// ✅ Validations
// - recipient_name: 2-100 chars, no HTML
// - recipient_email: Valid RFC 5321 format
// - recipient_phone: 10-12 digits
// - gift_message: Max 500 chars
// - from_name: 2-100 chars, no HTML
// - gift_wrap: Boolean
```

### `logSecurityEvent(eventType, details, severity)`
Log security events for monitoring.

```javascript
// ✅ Usage
logSecurityEvent('address_created', {
  userId: user.id,
  addressId: address.id,
  addressType: 'billing'
}, 'info');

logSecurityEvent('validation_failed', {
  field: 'email',
  reason: 'Invalid format'
}, 'warning');

logSecurityEvent('unauthorized_access', {
  userId: user.id,
  resource: 'address'
}, 'critical');

// ✅ Severity Levels
// - 'info': Normal operations (address created)
// - 'warning': Validation failures, rate limits
// - 'critical': Security violations, unauthorized access

// ✅ Storage
// - Last 100 events kept in localStorage
// - Timestamp and user agent recorded
// - Can be retrieved: JSON.parse(localStorage.getItem('securityLog'))
```

---

## ⏱️ Rate Limiting Functions

### Import Rate Limiting Functions

```javascript
import {
  checkRateLimit,
  checkAddressCreationLimit,
  checkCheckoutLimit,
  checkPaymentLimit,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits
} from '../utils/rateLimit.js';
```

### `checkAddressCreationLimit(userId)`
Check address creation rate limit (10 per hour).

```javascript
// ✅ Usage
const result = checkAddressCreationLimit(user.id);

if (result.allowed) {
  // Proceed with address creation
  console.log(`Remaining: ${result.remaining} addresses`);
} else {
  // Rate limit exceeded
  console.error(result.error);
  console.log(`Retry after: ${result.retryAfter} seconds`);
}

// ✅ Response Properties
result.allowed        // boolean: Is operation allowed?
result.remaining      // number: Remaining attempts
result.error          // string: Error message (if not allowed)
result.retryAfter     // number: Seconds to wait (if not allowed)
result.attempts       // number: Current attempt count (if allowed)
result.resetTime      // number: Unix timestamp when limit resets
```

### `checkCheckoutLimit(userId)`
Check checkout rate limit (20 per hour).

```javascript
// ✅ Usage
const result = checkCheckoutLimit(user.id);

if (!result.allowed) {
  throw new Error(result.error);
}

// Proceed with checkout
```

### `checkPaymentLimit(userId, orderId)`
Check payment rate limit (5 per order per hour).

```javascript
// ✅ Usage
const result = checkPaymentLimit(user.id, order.id);

if (!result.allowed) {
  throw new Error('Too many payment attempts. Please try again later.');
}

// Proceed with payment
```

### `getRateLimitStatus(type, userId, resourceId)`
Check rate limit status without incrementing.

```javascript
// ✅ Usage
const status = getRateLimitStatus('address', user.id);
console.log(`Used: ${status.used}/${status.total}`);
console.log(`Remaining: ${status.remaining}`);
console.log(`Resets in: ${status.resetIn} seconds`);

// ✅ Response Properties
status.used       // number: Current attempt count
status.remaining  // number: Remaining attempts
status.total      // number: Max attempts
status.resetTime  // number: Unix timestamp
status.resetIn    // number: Seconds until reset
```

### `resetRateLimit(type, userId, resourceId)`
Clear rate limit for a specific resource.

```javascript
// ✅ Usage
resetRateLimit('address', user.id);
resetRateLimit('payment', user.id, order.id);

// Useful for
// - Resetting after successful completion
// - Testing purposes
// - Manual intervention
```

### `clearAllRateLimits(userId)`
Clear all rate limits for a user (use on logout).

```javascript
// ✅ Usage
async function logout() {
  clearAllRateLimits(user.id);
  // Clear auth token
  // Redirect to login
}

// Clears
// - Address creation limits
// - Checkout limits
// - All payment limits for all orders
```

---

## 🔌 Integration Examples

### In addressService.js

```javascript
import { sanitizeAddress, logSecurityEvent } from '../utils/sanitize.js';
import { checkAddressCreationLimit } from '../utils/rateLimit.js';

export async function saveAddress(addressData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check rate limit
    const limitCheck = checkAddressCreationLimit(user.id);
    if (!limitCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded_address', 
        { userId: user.id, reason: limitCheck.error }, 'warning');
      throw new Error(limitCheck.error);
    }
    
    // Sanitize input
    const result = sanitizeAddress(addressData);
    if (!result.isValid) {
      logSecurityEvent('address_validation_failed',
        { userId: user.id, errors: result.errors }, 'warning');
      throw new Error(result.errors.join(', '));
    }
    
    // Save to database
    const { data } = await supabase.from('addresses').insert({
      user_id: user.id,
      ...result.data
    }).select().single();
    
    logSecurityEvent('address_created',
      { userId: user.id, addressId: data.id }, 'info');
    
    return data;
  } catch (err) {
    logSecurityEvent('address_creation_error', 
      { error: err.message }, 'error');
    throw err;
  }
}
```

### In orderService.js

```javascript
import { 
  sanitizeOrderItem, 
  sanitizePrice, 
  logSecurityEvent 
} from '../utils/sanitize.js';
import { checkCheckoutLimit, checkPaymentLimit } from '../utils/rateLimit.js';

export async function createOrder(orderData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check rate limit
    const limitCheck = checkCheckoutLimit(user.id);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.error);
    }
    
    // Sanitize items
    const sanitizedItems = [];
    for (const item of orderData.items) {
      const result = sanitizeOrderItem(item);
      if (!result.isValid) {
        throw new Error(`Invalid item: ${result.errors.join(', ')}`);
      }
      sanitizedItems.push(result.data);
    }
    
    // Sanitize amounts
    const totalAmount = sanitizePrice(orderData.totalAmount);
    if (totalAmount === null) {
      throw new Error('Invalid total amount');
    }
    
    // Create order
    const { data } = await supabase.from('orders').insert({
      user_id: user.id,
      ...orderData,
      total_amount: totalAmount
    }).select().single();
    
    logSecurityEvent('order_created',
      { userId: user.id, orderId: data.id, amount: totalAmount }, 'info');
    
    return data;
  } catch (err) {
    logSecurityEvent('order_error', { error: err.message }, 'error');
    throw err;
  }
}

export async function recordPayment(paymentData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { orderId, amount } = paymentData;
    
    // Check payment rate limit
    const limitCheck = checkPaymentLimit(user.id, orderId);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.error);
    }
    
    // Sanitize amount
    const sanitizedAmount = sanitizePrice(amount);
    if (sanitizedAmount === null) {
      throw new Error('Invalid amount');
    }
    
    // Record payment
    const { data } = await supabase.from('payments').insert({
      order_id: orderId,
      amount: sanitizedAmount,
      ...paymentData
    }).select().single();
    
    logSecurityEvent('payment_recorded',
      { userId: user.id, orderId, amount: sanitizedAmount }, 'info');
    
    return data;
  } catch (err) {
    logSecurityEvent('payment_error', { error: err.message }, 'error');
    throw err;
  }
}
```

---

## 🧪 Testing Examples

### Test Sanitization

```javascript
// Test XSS prevention
const malicious = "<img src=x onerror=alert('xss')>";
const sanitized = sanitizeString(malicious);
console.log(sanitized); // "alert('xss')" - tags removed

// Test email validation
console.log(sanitizeEmail("john@example.com"));     // ✅ "john@example.com"
console.log(sanitizeEmail("invalid.email"));        // ❌ null
console.log(sanitizeEmail("test@example"));         // ❌ null

// Test phone validation
console.log(sanitizePhone("9876543210"));           // ✅ "9876543210"
console.log(sanitizePhone("+91-98765-43210"));      // ✅ "9876543210"
console.log(sanitizePhone("123"));                  // ❌ null

// Test postal code
console.log(sanitizePostalCode("123456"));          // ✅ "123456"
console.log(sanitizePostalCode("12 34 56"));        // ✅ "123456"
console.log(sanitizePostalCode("12345"));           // ❌ null

// Test price
console.log(sanitizePrice(99.999));                 // ✅ 100.00
console.log(sanitizePrice(-50));                    // ❌ null
console.log(sanitizePrice(10000000));               // ❌ null
```

### Test Rate Limiting

```javascript
// Test address creation limit
for (let i = 0; i < 11; i++) {
  const result = checkAddressCreationLimit(userId);
  console.log(`Attempt ${i + 1}:`, result.allowed ? '✅' : '❌', 
    `Remaining: ${result.remaining}`);
}

// Output:
// Attempt 1: ✅ Remaining: 9
// Attempt 2: ✅ Remaining: 8
// ...
// Attempt 10: ✅ Remaining: 0
// Attempt 11: ❌ Remaining: 0 (Rate limit exceeded)
```

---

## 📋 Error Handling

### Common Patterns

```javascript
// ✅ Good: Check and handle
const result = sanitizeAddress(userInput);
if (!result.isValid) {
  showErrorMessage(result.errors.join(', '));
  logSecurityEvent('validation_error', { errors: result.errors }, 'warning');
  return; // Stop processing
}

// ✅ Good: Use sanitized data
const sanitized = result.data;
await saveToDatabase(sanitized);

// ✅ Good: Rate limiting with helpful message
const limitCheck = checkAddressCreationLimit(userId);
if (!limitCheck.allowed) {
  const minutes = Math.ceil(limitCheck.retryAfter / 60);
  showMessage(`Too many address creations. Please try again in ${minutes} minutes.`);
  return;
}

// ❌ Bad: Ignore validation
const data = userInput; // Don't do this!
await saveToDatabase(data);

// ❌ Bad: No error handling
const email = sanitizeEmail(userInput);
sendEmail(email); // What if email is null?
```

---

## 🔍 Monitoring

### View Security Events

```javascript
// Get all security events
const events = JSON.parse(localStorage.getItem('securityLog') || '[]');
console.table(events);

// Get recent events
const recent = events.slice(-10);

// Filter by severity
const warnings = events.filter(e => e.severity === 'warning');
const critical = events.filter(e => e.severity === 'critical');

// Export for analysis
console.log(JSON.stringify(events, null, 2));
```

### View Rate Limit Status

```javascript
// Get comprehensive report
const report = getRateLimitReport(userId);
console.table(report);

// Expected output:
// {
//   address: { used: 3, remaining: 7, total: 10, ... },
//   checkout: { used: 5, remaining: 15, total: 20, ... },
//   ...
// }
```

---

## 📚 Additional Resources

- **SECURITY_SETUP.md** - Comprehensive security guide
- **SECURITY_CHECKLIST.md** - Implementation tracking
- **Source Code JSDoc** - Function documentation

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Ready for use
