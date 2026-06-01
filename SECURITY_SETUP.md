# Security Setup Guide

## Overview
This document provides comprehensive security configuration for the Web Jewellery order system. It covers frontend security best practices and backend implementation requirements.

## Table of Contents
1. [CORS Configuration](#cors-configuration)
2. [Security Headers](#security-headers)
3. [Environment-Specific Settings](#environment-specific-settings)
4. [Backend Implementation Guide](#backend-implementation-guide)
5. [PCI Compliance Checklist](#pci-compliance-checklist)
6. [Secure Session Handling](#secure-session-handling)
7. [Data Encryption](#data-encryption)
8. [Webhook Security](#webhook-security)
9. [Monitoring & Logging](#monitoring--logging)
10. [Security Testing](#security-testing)

---

## CORS Configuration

### Overview
Cross-Origin Resource Sharing (CORS) must be properly configured to allow legitimate requests while preventing unauthorized access.

### Frontend Configuration (Vite)
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.yourdomain.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'X-Request-Origin': 'frontend',
          'X-API-Version': 'v1'
        }
      }
    }
  }
}
```

### Backend Configuration

#### Node.js/Express
```javascript
const cors = require('cors');
const app = require('express')();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
```

#### Python/Django
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-api-key',
]

# Ensure CSRF protection is enabled
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
```

### Environment Variables
```bash
# .env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## Security Headers

### Recommended Headers Configuration

#### 1. Content Security Policy (CSP)
Prevents XSS attacks by controlling which resources can be loaded.

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.yourdomain.com https://api.razorpay.com;
  frame-src https://checkout.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self'
```

#### 2. X-Frame-Options
Prevents clickjacking attacks.

```
X-Frame-Options: DENY
```

#### 3. X-Content-Type-Options
Prevents MIME type sniffing.

```
X-Content-Type-Options: nosniff
```

#### 4. Referrer-Policy
Controls referrer information.

```
Referrer-Policy: strict-origin-when-cross-origin
```

#### 5. Permissions-Policy (formerly Feature-Policy)
Controls browser features.

```
Permissions-Policy: 
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

#### 6. Strict-Transport-Security (HSTS)
Enforces HTTPS connections.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### 7. X-XSS-Protection
Legacy XSS protection (modern browsers use CSP).

```
X-XSS-Protection: 1; mode=block
```

### Backend Implementation

#### Express.js using helmet
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.yourdomain.com", "https://api.razorpay.com"],
      frameSrc: ["https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));
```

#### Django using django-cors-headers and django-csp
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'csp.middleware.CSPMiddleware',
    # other middleware...
]

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "https://checkout.razorpay.com"),
    "style-src": ("'self'", "'unsafe-inline'"),
    # ... more directives
}
```

---

## Environment-Specific Settings

### Development Environment
```bash
# .env.development
NODE_ENV=development
API_URL=http://localhost:3001
SUPABASE_URL=your_dev_supabase_url
SUPABASE_KEY=your_dev_supabase_key
RAZORPAY_KEY_ID=your_dev_razorpay_key
CORS_ORIGIN=http://localhost:5173

# Relaxed security for development
CSP_SCRIPT_SRC="'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173"
SESSION_TIMEOUT=1800000 # 30 minutes
RATE_LIMIT_ENABLED=false
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
API_URL=https://staging-api.yourdomain.com
SUPABASE_URL=your_staging_supabase_url
SUPABASE_KEY=your_staging_supabase_key
RAZORPAY_KEY_ID=your_staging_razorpay_key
CORS_ORIGIN=https://staging.yourdomain.com

# Moderate security settings
CSP_SCRIPT_SRC="'self' https://checkout.razorpay.com"
SESSION_TIMEOUT=3600000 # 1 hour
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=3600000
LOG_LEVEL=debug
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
API_URL=https://api.yourdomain.com
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
RAZORPAY_KEY_ID=your_production_razorpay_key
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Strict security settings
CSP_SCRIPT_SRC="'self' https://checkout.razorpay.com"
SESSION_TIMEOUT=1800000 # 30 minutes
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=3600000
REQUIRE_HTTPS=true
LOG_LEVEL=error
MONITOR_SECURITY_EVENTS=true
```

---

## Backend Implementation Guide

### Input Validation & Sanitization
All inputs must be validated and sanitized on the backend:

```javascript
// Example: Address validation endpoint
app.post('/api/addresses', authenticateUser, async (req, res) => {
  try {
    const { full_name, email, phone, street_address, city, state, postal_code } = req.body;
    
    // Validate required fields
    if (!full_name || !email || !phone || !street_address || !city || !state || !postal_code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate phone (10-12 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    
    // Validate postal code (6 digits for India)
    if (!/^\d{6}$/.test(postal_code.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid postal code' });
    }
    
    // Rate limiting check
    const rateLimitStatus = await checkRateLimit('address', req.user.id);
    if (!rateLimitStatus.allowed) {
      return res.status(429)
        .set('Retry-After', rateLimitStatus.retryAfter)
        .json({ error: rateLimitStatus.error });
    }
    
    // Save address with sanitized data
    const address = await Address.create({
      user_id: req.user.id,
      full_name: sanitizeString(full_name),
      email: sanitizeEmail(email),
      phone: sanitizePhone(phone),
      street_address: sanitizeString(street_address),
      city: sanitizeString(city),
      state: sanitizeString(state),
      postal_code: sanitizePostalCode(postal_code)
    });
    
    res.json(address);
  } catch (err) {
    logSecurityEvent('address_creation_error', { error: err.message, user: req.user.id });
    res.status(500).json({ error: 'Failed to create address' });
  }
});
```

### Database Security
- Use parameterized queries to prevent SQL injection
- Implement Row-Level Security (RLS) on all sensitive tables
- Encrypt sensitive data at rest (passwords, payment tokens)
- Use database-level constraints for data validation

### API Security
- Require authentication for all protected endpoints
- Use JWT with short expiration times (15-30 minutes)
- Implement refresh tokens with longer expiration (7 days)
- Validate JWT signature and expiration on every request
- Log all API access attempts
- Implement endpoint-specific authorization checks

### Payment Security
- Never store full credit card details (PCI compliance)
- Use payment gateway's tokenization
- Verify payment signatures on webhook callbacks
- Implement webhook signature verification using HMAC
- Store only last 4 digits and payment method type
- Encrypt payment tokens at rest

---

## PCI Compliance Checklist

### Frontend (Level 1: E-commerce)
- ✅ Use HTTPS/TLS for all connections
- ✅ Implement CSP to prevent XSS
- ✅ Validate all user inputs
- ✅ Implement rate limiting on payment attempts
- ✅ Use secure session handling with HTTPOnly cookies
- ✅ Don't store full credit card numbers (use tokenization)
- ✅ Implement logout functionality to clear session
- ⚠️ Implement detailed logging of payment events
- ⚠️ Implement automated vulnerability scanning

### Backend
- ✅ Implement strong access controls (RLS in Supabase)
- ✅ Encrypt payment data at rest and in transit
- ✅ Implement secure session management
- ✅ Validate all inputs server-side
- ✅ Implement comprehensive audit logging
- ✅ Regularly update dependencies (use `npm audit fix`)
- ✅ Implement Web Application Firewall (WAF) rules
- ⚠️ Conduct quarterly security assessments
- ⚠️ Implement intrusion detection/prevention
- ⚠️ Maintain PCI compliance documentation

### Data Handling
- ✅ Classify data by sensitivity level
- ✅ Implement access controls based on roles
- ✅ Secure data retention policies
- ✅ Implement secure data disposal procedures
- ⚠️ Implement data masking in logs
- ⚠️ Regularly audit data access patterns

### Incident Response
- [ ] Establish incident response team
- [ ] Document incident response procedures
- [ ] Implement 24/7 monitoring for suspicious activity
- [ ] Create incident response playbook
- [ ] Test incident response procedures quarterly

---

## Secure Session Handling

### JWT Best Practices

#### Token Structure
```javascript
// JWT Payload (recommended structure)
{
  "sub": "user_id",           // Subject (user ID)
  "email": "user@example.com",
  "role": "customer",
  "iat": 1516239022,          // Issued at
  "exp": 1516242622,          // Expiration (15 minutes)
  "jti": "unique_token_id"    // JWT ID (for revocation)
}
```

#### Secure Token Handling
```javascript
// Frontend: Store JWT in memory, not localStorage (safer from XSS)
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  // Store refresh token in secure HTTPOnly cookie (set by backend)
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  // HTTPOnly cookie will be cleared by server
}

// Include token in requests
export function authenticatedFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${getAuthToken()}`
  };
  return fetch(url, { ...options, headers });
}
```

#### Token Refresh
```javascript
// Implement automatic token refresh
const tokenRefreshInterval = setInterval(async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Include cookies
    });
    if (response.ok) {
      const { token } = await response.json();
      setAuthToken(token);
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
    logout();
  }
}, 14 * 60 * 1000); // Refresh every 14 minutes (if token is 15 min)
```

### Session Timeout Handling
```javascript
// Warn user before session expires
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000;   // Warn 5 minutes before

let sessionTimeoutId;
let warningTimeoutId;

export function resetSessionTimeout() {
  clearTimeout(sessionTimeoutId);
  clearTimeout(warningTimeoutId);
  
  warningTimeoutId = setTimeout(() => {
    showSessionExpiringWarning();
  }, SESSION_TIMEOUT - WARNING_BEFORE);
  
  sessionTimeoutId = setTimeout(() => {
    logout('Session expired');
  }, SESSION_TIMEOUT);
}

function showSessionExpiringWarning() {
  // Show modal or toast notification
  // Option to extend session or logout
}

// Reset on user activity
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keydown', resetSessionTimeout);
```

### Logout Security
```javascript
export async function logout(reason = 'User initiated') {
  try {
    // Clear session on backend
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    // Clear all sensitive data
    clearAuthToken();
    clearAllRateLimits(userId);
    clearStorageExcept(['theme', 'language']); // Keep non-sensitive prefs
    
    // Clear timeouts
    clearTimeout(sessionTimeoutId);
    clearTimeout(warningTimeoutId);
    
    // Redirect to login
    window.location.href = '/login';
  }
}

function clearStorageExcept(keysToKeep) {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
}
```

### Secure Cookie Recommendations
```javascript
// Backend should set these cookie options
{
  httpOnly: true,    // Not accessible via JavaScript
  secure: true,      // Only sent over HTTPS
  sameSite: 'Strict', // Prevent CSRF
  maxAge: 604800000, // 7 days (for refresh token)
  domain: '.yourdomain.com'
}
```

---

## Data Encryption

### In Transit
- ✅ HTTPS/TLS 1.2+ for all communications
- ✅ Disable older protocols (SSL 3.0, TLS 1.0, TLS 1.1)
- ✅ Use strong cipher suites (AES-256-GCM)
- ✅ Implement HSTS (Strict-Transport-Security)
- ✅ Certificate pinning (optional, for high security)

### At Rest
- Encrypt payment tokens using AES-256
- Encrypt sensitive user data (addresses, phone)
- Encrypt backup databases
- Use key management service (AWS KMS, Google Cloud KMS)
- Rotate encryption keys regularly (annually)
- Store encryption keys separately from data

### Key Management
```javascript
// Example using AWS KMS
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

async function encryptSensitiveData(data) {
  const params = {
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: JSON.stringify(data)
  };
  
  const result = await kms.encrypt(params).promise();
  return result.CiphertextBlob.toString('base64');
}

async function decryptSensitiveData(encryptedData) {
  const params = {
    CiphertextBlob: Buffer.from(encryptedData, 'base64')
  };
  
  const result = await kms.decrypt(params).promise();
  return JSON.parse(result.Plaintext.toString());
}
```

---

## Webhook Security

### Signature Verification (Razorpay)
```javascript
const crypto = require('crypto');

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const data = `${orderId}|${paymentId}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Webhook Validation
```javascript
app.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const body = req.body.toString();
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify signature
    if (!verifyRazorpaySignature(body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const payload = JSON.parse(body);
    
    // Validate event type
    if (payload.event !== 'payment.authorized') {
      return res.status(400).json({ error: 'Unsupported event' });
    }
    
    // Process payment
    await handlePaymentAuthorization(payload.payload.payment);
    res.json({ status: 'ok' });
  } catch (err) {
    logSecurityEvent('webhook_error', { error: err.message });
    res.status(500).json({ error: 'Internal error' });
  }
});
```

---

## Monitoring & Logging

### Events to Log
```javascript
const SECURITY_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  PASSWORD_CHANGE: 'password_change',
  ADDRESS_CREATED: 'address_created',
  ADDRESS_UPDATED: 'address_updated',
  ORDER_CREATED: 'order_created',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  VALIDATION_FAILURE: 'validation_failure',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_ACCESSED: 'data_accessed',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};
```

### Centralized Logging
```javascript
// Send logs to centralized service (Sentry, DataDog, etc.)
export async function logSecurityEvent(eventType, data) {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    ...data
  };
  
  // Send to logging service
  await fetch('https://logs.yourdomain.com/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOG_API_KEY}`
    },
    body: JSON.stringify(event)
  });
}
```

---

## Security Testing

### Automated Testing Checklist
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Use SonarQube for code analysis
- [ ] Run OWASP ZAP for vulnerability scanning
- [ ] Implement pre-commit hooks to check for secrets
- [ ] Use npm packages: `snyk`, `retire`, `npm-check-updates`

### Manual Testing Checklist
- [ ] Test XSS prevention (script injection in forms)
- [ ] Test SQL injection (special characters in inputs)
- [ ] Test CSRF protection (cross-site requests)
- [ ] Test rate limiting (exceed limits multiple times)
- [ ] Test session timeout (inactive session should expire)
- [ ] Test payment flow security (verify signatures)
- [ ] Test authentication bypass attempts
- [ ] Test privilege escalation (access admin features)
- [ ] Test file upload security (malicious files)

### Penetration Testing
- Conduct quarterly security assessments
- Use third-party penetration testing services
- Document and remediate all findings
- Implement compensating controls while fixing issues

---

## Deployment Security Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled and certificates are valid
- [ ] Security headers are configured
- [ ] CORS is restricted to allowed origins only
- [ ] Database credentials are in secure storage (not in code)
- [ ] API keys are rotated
- [ ] Logs are centralized and monitored
- [ ] Backup and restore procedures are tested
- [ ] Incident response plan is in place
- [ ] Security team has been notified
- [ ] Dependencies are up to date (no known vulnerabilities)
- [ ] Code has been reviewed by security team
- [ ] Performance monitoring is configured
- [ ] Rate limiting is enabled
- [ ] WAF rules are configured

---

## References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security/)
