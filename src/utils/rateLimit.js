/**
 * Rate Limiting utilities for security
 * Implements client-side rate limiting to prevent abuse
 * Note: Server-side rate limiting is also required for complete protection
 */

/**
 * Rate limit configuration
 */
const rateLimitConfig = {
  address: {
    maxAttempts: 10,
    windowMs: 3600000, // 1 hour
    key: 'rateLimit_address'
  },
  checkout: {
    maxAttempts: 20,
    windowMs: 3600000, // 1 hour
    key: 'rateLimit_checkout'
  },
  payment: {
    maxAttempts: 5,
    windowMs: 3600000, // 1 hour (per order)
    key: 'rateLimit_payment'
  }
};

/**
 * Get rate limit key for a user/resource
 * @param {string} type - Type of rate limit (address, checkout, payment)
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID (e.g., orderId for payment)
 * @returns {string} Rate limit key
 */
function getRateLimitKey(type, userId, resourceId = '') {
  const config = rateLimitConfig[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const keyPrefix = config.key;
  if (resourceId) {
    return `${keyPrefix}_${userId}_${resourceId}`;
  }
  return `${keyPrefix}_${userId}`;
}

/**
 * Check and increment rate limit counter
 * @param {string} type - Type of rate limit
 * @param {string} userId - User ID
 * @param {string} resourceId - Optional resource ID for per-resource limits
 * @returns {Object} Rate limit status
 */
export function checkRateLimit(type, userId, resourceId = '') {
  if (!userId) {
    return {
      allowed: false,
      error: 'User ID required for rate limiting',
      remaining: 0,
      resetTime: null
    };
  }

  const config = rateLimitConfig[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const key = getRateLimitKey(type, userId, resourceId);
  const now = Date.now();

  try {
    // Get current attempt data
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const attempts = data.attempts || [];
    const windowStart = data.windowStart || now;

    // Clear old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < config.windowMs);

    // Check if limit exceeded
    const remaining = config.maxAttempts - validAttempts.length;
    const isAllowed = validAttempts.length < config.maxAttempts;
    const resetTime = windowStart + config.windowMs;

    if (!isAllowed) {
      // Log rate limit violation
      logRateLimitViolation(type, userId, resourceId, validAttempts.length, config.maxAttempts);
      
      return {
        allowed: false,
        error: `Rate limit exceeded. Max ${config.maxAttempts} attempts per hour. Please try again later.`,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000) // seconds
      };
    }

    // Increment counter
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify({
      attempts: validAttempts,
      windowStart,
      type
    }));

    return {
      allowed: true,
      remaining: config.maxAttempts - validAttempts.length,
      resetTime,
      attempts: validAttempts.length
    };
  } catch (err) {
    console.error('Error checking rate limit:', err);
    // On error, allow the request but log it
    return {
      allowed: true,
      error: 'Rate limit check failed',
      remaining: config.maxAttempts
    };
  }
}

/**
 * Reset rate limit for a user/resource
 * @param {string} type - Type of rate limit
 * @param {string} userId - User ID
 * @param {string} resourceId - Optional resource ID
 */
export function resetRateLimit(type, userId, resourceId = '') {
  if (!userId) return;

  const key = getRateLimitKey(type, userId, resourceId);
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error resetting rate limit:', err);
  }
}

/**
 * Get rate limit status without incrementing
 * @param {string} type - Type of rate limit
 * @param {string} userId - User ID
 * @param {string} resourceId - Optional resource ID
 * @returns {Object} Rate limit status
 */
export function getRateLimitStatus(type, userId, resourceId = '') {
  if (!userId) {
    return {
      allowed: true,
      remaining: rateLimitConfig[type]?.maxAttempts || 0,
      resetTime: null
    };
  }

  const config = rateLimitConfig[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }

  const key = getRateLimitKey(type, userId, resourceId);
  const now = Date.now();

  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const attempts = data.attempts || [];
    const windowStart = data.windowStart || now;

    // Clear old attempts
    const validAttempts = attempts.filter(timestamp => now - timestamp < config.windowMs);
    const resetTime = windowStart + config.windowMs;

    return {
      used: validAttempts.length,
      remaining: Math.max(0, config.maxAttempts - validAttempts.length),
      total: config.maxAttempts,
      resetTime,
      resetIn: Math.ceil((resetTime - now) / 1000) // seconds
    };
  } catch (err) {
    console.error('Error getting rate limit status:', err);
    return {
      used: 0,
      remaining: config.maxAttempts,
      total: config.maxAttempts,
      resetTime: null
    };
  }
}

/**
 * Clear all rate limits for a user (useful on logout)
 * @param {string} userId - User ID
 */
export function clearAllRateLimits(userId) {
  if (!userId) return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('rateLimit_') && key.includes(userId)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Error clearing rate limits:', err);
  }
}

/**
 * Get address creation limiter check
 * @param {string} userId - User ID
 * @returns {Object} Rate limit check result
 */
export function checkAddressCreationLimit(userId) {
  return checkRateLimit('address', userId);
}

/**
 * Get checkout attempt limiter check
 * @param {string} userId - User ID
 * @returns {Object} Rate limit check result
 */
export function checkCheckoutLimit(userId) {
  return checkRateLimit('checkout', userId);
}

/**
 * Get payment attempt limiter check (per order)
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @returns {Object} Rate limit check result
 */
export function checkPaymentLimit(userId, orderId) {
  return checkRateLimit('payment', userId, orderId);
}

/**
 * Log rate limit violation for monitoring
 * @param {string} type - Type of rate limit
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID
 * @param {number} currentAttempts - Current attempt count
 * @param {number} maxAttempts - Max allowed attempts
 */
function logRateLimitViolation(type, userId, resourceId, currentAttempts, maxAttempts) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'rate_limit_violation',
    limitType: type,
    userId: userId ? userId.substring(0, 8) + '...' : 'unknown', // obfuscate user ID
    resourceId: resourceId ? resourceId.substring(0, 8) + '...' : 'n/a',
    attempts: currentAttempts,
    maxAttempts,
    userAgent: navigator.userAgent
  };

  console.warn('[SECURITY] Rate limit violation:', logEntry);

  // Store in localStorage for monitoring
  try {
    const violations = JSON.parse(localStorage.getItem('rateLimitViolations') || '[]');
    violations.push(logEntry);
    // Keep only last 50 violations
    if (violations.length > 50) {
      violations.shift();
    }
    localStorage.setItem('rateLimitViolations', JSON.stringify(violations));
  } catch (err) {
    console.error('Error logging rate limit violation:', err);
  }
}

/**
 * Get rate limit violations log (for debugging/monitoring)
 * @returns {Array} Array of rate limit violations
 */
export function getRateLimitViolations() {
  try {
    return JSON.parse(localStorage.getItem('rateLimitViolations') || '[]');
  } catch (err) {
    console.error('Error retrieving rate limit violations:', err);
    return [];
  }
}

/**
 * Clear rate limit violations log
 */
export function clearRateLimitViolations() {
  try {
    localStorage.removeItem('rateLimitViolations');
  } catch (err) {
    console.error('Error clearing rate limit violations:', err);
  }
}

/**
 * Get comprehensive rate limit report for a user
 * @param {string} userId - User ID
 * @returns {Object} Rate limit report
 */
export function getRateLimitReport(userId) {
  if (!userId) {
    return {};
  }

  return {
    address: getRateLimitStatus('address', userId),
    checkout: getRateLimitStatus('checkout', userId),
    address_creation: getAddressCreationLimitReport(userId),
    checkout_attempts: getCheckoutLimitReport(userId)
  };
}

/**
 * Get address creation limit report
 * @param {string} userId - User ID
 * @returns {Object} Address creation limit details
 */
export function getAddressCreationLimitReport(userId) {
  const status = getRateLimitStatus('address', userId);
  return {
    ...status,
    type: 'address_creation',
    description: 'Maximum addresses that can be created per hour'
  };
}

/**
 * Get checkout limit report
 * @param {string} userId - User ID
 * @returns {Object} Checkout limit details
 */
export function getCheckoutLimitReport(userId) {
  const status = getRateLimitStatus('checkout', userId);
  return {
    ...status,
    type: 'checkout_attempts',
    description: 'Maximum checkout attempts per hour'
  };
}

/**
 * Backend adoption guide - document for backend team
 * This rate limiting is CLIENT-SIDE ONLY and must be replicated on the backend
 */
export const BACKEND_ADOPTION_GUIDE = `
# Rate Limiting Backend Implementation Guide

## Overview
The frontend implements client-side rate limiting. This MUST be replicated on the backend
for proper security, as client-side limits can be bypassed.

## Configuration

### Address Creation Rate Limit
- Max: 10 addresses per hour per user
- Window: 1 hour (3600000ms)
- Endpoint: POST /api/addresses

### Checkout Rate Limit
- Max: 20 checkout attempts per hour per user
- Window: 1 hour (3600000ms)
- Endpoint: POST /api/checkout

### Payment Rate Limit
- Max: 5 payment attempts per order per user
- Window: 1 hour (3600000ms)
- Endpoint: POST /api/payments

## Implementation Recommendations

### Using Node.js with express-rate-limit:
\`\`\`javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const client = redis.createClient();

const addressLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:address:',
  }),
  windowMs: 1 * 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many addresses created, please try again later.'
});

app.post('/api/addresses', addressLimiter, addressController.create);
\`\`\`

### Using Django with django-ratelimit:
\`\`\`python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='10/h', method='POST')
def create_address(request):
    # Address creation logic
    pass
\`\`\`

### Fallback without Redis (using database):
\`\`\`sql
CREATE TABLE rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  endpoint VARCHAR(100) NOT NULL,
  attempt_time TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_rate_limit_user_endpoint 
ON rate_limit_attempts(user_id, endpoint, attempt_time);
\`\`\`

## Headers to Return

When rate limited, return these HTTP headers:
- X-RateLimit-Limit: 10 (max attempts)
- X-RateLimit-Remaining: 3 (attempts remaining)
- X-RateLimit-Reset: 1234567890 (unix timestamp when limit resets)
- Retry-After: 3600 (seconds to wait before retrying)

Return HTTP 429 (Too Many Requests) status code.

## Monitoring
- Log all rate limit violations with timestamp, user_id, endpoint
- Alert if rate limit violations exceed threshold
- Track patterns to detect potential attacks

## Testing
- Test with concurrent requests exceeding limits
- Verify window resets correctly
- Ensure rate limits reset per user (not global)
- Test with expired/invalid tokens
`;
