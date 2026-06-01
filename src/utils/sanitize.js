/**
 * Sanitization utilities for security hardening
 * Sanitizes user inputs to prevent XSS, injection attacks, and data validation issues
 */

/**
 * Sanitize string input - Remove HTML/script tags and trim
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = str.trim();

  // Remove HTML/script tags
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Decode HTML entities (basic cleanup)
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');

  return sanitized;
}

/**
 * Sanitize and validate email
 * @param {string} email - Email to sanitize
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Trim and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Additional checks
  if (sanitized.length > 254) {
    return null; // Email too long (RFC 5321)
  }

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check for suspicious patterns
  if (/javascript:/i.test(sanitized) || /[<>"';]/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize and validate phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string|null} Sanitized phone number (digits only) or null if invalid
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Validate length (10-12 digits for international numbers)
  if (digitsOnly.length < 10 || digitsOnly.length > 12) {
    return null;
  }

  // For India: 10 digits is standard
  if (digitsOnly.length === 10) {
    // Check if it's a valid Indian mobile (2-9) or landline (0-9)
    if (!/^[2-9]\d{9}$/.test(digitsOnly) && !/^0\d{9,10}$/.test(digitsOnly)) {
      return null;
    }
  }

  return digitsOnly;
}

/**
 * Sanitize and validate postal code
 * @param {string} code - Postal code to sanitize
 * @returns {string|null} Sanitized postal code or null if invalid
 */
export function sanitizePostalCode(code) {
  if (!code || typeof code !== 'string') {
    return null;
  }

  // Remove whitespace
  const cleaned = code.replace(/\s/g, '');

  // For India: 6 digits only
  if (!/^\d{6}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize and validate price/amount
 * @param {number|string} price - Price to sanitize
 * @returns {number|null} Sanitized price or null if invalid
 */
export function sanitizePrice(price) {
  if (price === null || price === undefined || price === '') {
    return null;
  }

  // Convert to number if string
  let numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Check if valid number
  if (isNaN(numPrice) || !isFinite(numPrice)) {
    return null;
  }

  // Must be positive
  if (numPrice < 0) {
    return null;
  }

  // Round to 2 decimal places
  numPrice = Math.round(numPrice * 100) / 100;

  // Check max reasonable value (e.g., 10 million for India)
  if (numPrice > 9999999.99) {
    return null;
  }

  return numPrice;
}

/**
 * Sanitize address data object
 * @param {Object} address - Address object to sanitize
 * @returns {Object} Sanitized address object with validation
 */
export function sanitizeAddress(address) {
  if (!address || typeof address !== 'object') {
    return { isValid: false, data: {}, errors: ['Invalid address data'] };
  }

  const errors = [];
  const sanitized = {};

  // Sanitize full_name
  if (address.full_name) {
    sanitized.full_name = sanitizeString(address.full_name);
    if (!sanitized.full_name || sanitized.full_name.length < 2) {
      errors.push('Full name must be at least 2 characters');
    }
    if (sanitized.full_name.length > 100) {
      errors.push('Full name must not exceed 100 characters');
    }
  } else {
    errors.push('Full name is required');
  }

  // Sanitize email
  if (address.email) {
    const sanitizedEmail = sanitizeEmail(address.email);
    if (!sanitizedEmail) {
      errors.push('Invalid email address');
    } else {
      sanitized.email = sanitizedEmail;
    }
  } else {
    errors.push('Email is required');
  }

  // Sanitize phone
  if (address.phone) {
    const sanitizedPhone = sanitizePhone(address.phone);
    if (!sanitizedPhone) {
      errors.push('Invalid phone number (10-12 digits required)');
    } else {
      sanitized.phone = sanitizedPhone;
    }
  } else {
    errors.push('Phone is required');
  }

  // Sanitize street_address
  if (address.street_address) {
    sanitized.street_address = sanitizeString(address.street_address);
    if (!sanitized.street_address || sanitized.street_address.length < 5) {
      errors.push('Street address must be at least 5 characters');
    }
    if (sanitized.street_address.length > 255) {
      errors.push('Street address must not exceed 255 characters');
    }
  } else {
    errors.push('Street address is required');
  }

  // Sanitize city
  if (address.city) {
    sanitized.city = sanitizeString(address.city);
    if (!sanitized.city || sanitized.city.length < 2) {
      errors.push('City must be at least 2 characters');
    }
    if (sanitized.city.length > 100) {
      errors.push('City must not exceed 100 characters');
    }
  } else {
    errors.push('City is required');
  }

  // Sanitize state
  if (address.state) {
    sanitized.state = sanitizeString(address.state);
    if (!sanitized.state || sanitized.state.length < 2) {
      errors.push('State must be at least 2 characters');
    }
    if (sanitized.state.length > 100) {
      errors.push('State must not exceed 100 characters');
    }
  } else {
    errors.push('State is required');
  }

  // Sanitize postal_code
  if (address.postal_code) {
    const sanitizedPostalCode = sanitizePostalCode(address.postal_code);
    if (!sanitizedPostalCode) {
      errors.push('Invalid postal code (6 digits required)');
    } else {
      sanitized.postal_code = sanitizedPostalCode;
    }
  } else {
    errors.push('Postal code is required');
  }

  // Sanitize country (optional, default to India)
  if (address.country) {
    sanitized.country = sanitizeString(address.country);
  } else {
    sanitized.country = 'India';
  }

  // Preserve address_type if provided
  if (address.address_type) {
    const validTypes = ['billing', 'shipping', 'both'];
    if (validTypes.includes(address.address_type)) {
      sanitized.address_type = address.address_type;
    }
  }

  // Preserve is_default if provided
  if (address.is_default !== undefined) {
    sanitized.is_default = Boolean(address.is_default);
  }

  return {
    isValid: errors.length === 0,
    data: sanitized,
    errors
  };
}

/**
 * Sanitize order item data
 * @param {Object} item - Order item to sanitize
 * @returns {Object} Sanitized item with validation
 */
export function sanitizeOrderItem(item) {
  if (!item || typeof item !== 'object') {
    return { isValid: false, data: {}, errors: ['Invalid item data'] };
  }

  const errors = [];
  const sanitized = {};

  // Validate and sanitize productId
  if (item.productId) {
    sanitized.productId = sanitizeString(item.productId);
    if (!sanitized.productId) {
      errors.push('Invalid product ID');
    }
  } else {
    errors.push('Product ID is required');
  }

  // Sanitize productName
  if (item.productName) {
    sanitized.productName = sanitizeString(item.productName);
    if (!sanitized.productName || sanitized.productName.length < 1) {
      errors.push('Invalid product name');
    }
    if (sanitized.productName.length > 255) {
      errors.push('Product name too long');
    }
  } else {
    errors.push('Product name is required');
  }

  // Validate quantity
  if (item.quantity !== undefined && item.quantity !== null) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > 1000) {
      errors.push('Quantity must be a number between 1 and 1000');
    } else {
      sanitized.quantity = qty;
    }
  } else {
    errors.push('Quantity is required');
  }

  // Validate pricePerUnit
  if (item.pricePerUnit !== undefined && item.pricePerUnit !== null) {
    const price = sanitizePrice(item.pricePerUnit);
    if (price === null) {
      errors.push('Invalid price per unit');
    } else {
      sanitized.pricePerUnit = price;
    }
  } else {
    errors.push('Price per unit is required');
  }

  // Validate discount (optional)
  if (item.discountPerUnit !== undefined && item.discountPerUnit !== null) {
    const discount = sanitizePrice(item.discountPerUnit);
    if (discount === null) {
      errors.push('Invalid discount');
    } else {
      sanitized.discountPerUnit = discount;
    }
  } else {
    sanitized.discountPerUnit = 0;
  }

  // Validate totalPrice
  if (item.totalPrice !== undefined && item.totalPrice !== null) {
    const total = sanitizePrice(item.totalPrice);
    if (total === null) {
      errors.push('Invalid total price');
    } else {
      sanitized.totalPrice = total;
    }
  } else {
    errors.push('Total price is required');
  }

  return {
    isValid: errors.length === 0,
    data: sanitized,
    errors
  };
}

/**
 * Sanitize gifting metadata
 * @param {Object} gifting - Gifting object to sanitize
 * @returns {Object} Sanitized gifting with validation
 */
export function sanitizeGiftingMetadata(gifting) {
  if (!gifting || typeof gifting !== 'object') {
    return { isValid: false, data: {}, errors: ['Invalid gifting data'] };
  }

  const errors = [];
  const sanitized = { is_gift: Boolean(gifting.is_gift) };

  if (!gifting.is_gift) {
    // Not a gift, return early
    return { isValid: true, data: sanitized, errors: [] };
  }

  // Sanitize recipient_name
  if (gifting.recipientName) {
    sanitized.recipient_name = sanitizeString(gifting.recipientName);
    if (!sanitized.recipient_name || sanitized.recipient_name.length < 2) {
      errors.push('Recipient name must be at least 2 characters');
    }
    if (sanitized.recipient_name.length > 100) {
      errors.push('Recipient name must not exceed 100 characters');
    }
  } else {
    errors.push('Recipient name is required for gifts');
  }

  // Sanitize recipient_email
  if (gifting.recipientEmail) {
    const sanitizedEmail = sanitizeEmail(gifting.recipientEmail);
    if (!sanitizedEmail) {
      errors.push('Invalid recipient email');
    } else {
      sanitized.recipient_email = sanitizedEmail;
    }
  }

  // Sanitize recipient_phone
  if (gifting.recipientPhone) {
    const sanitizedPhone = sanitizePhone(gifting.recipientPhone);
    if (!sanitizedPhone) {
      errors.push('Invalid recipient phone number');
    } else {
      sanitized.recipient_phone = sanitizedPhone;
    }
  } else {
    errors.push('Recipient phone is required for gifts');
  }

  // Sanitize gift_message
  if (gifting.giftMessage) {
    sanitized.gift_message = sanitizeString(gifting.giftMessage);
    if (sanitized.gift_message.length > 500) {
      errors.push('Gift message must not exceed 500 characters');
    }
  }

  // Sanitize from_name
  if (gifting.fromName) {
    sanitized.from_name = sanitizeString(gifting.fromName);
    if (!sanitized.from_name || sanitized.from_name.length < 2) {
      errors.push('From name must be at least 2 characters');
    }
    if (sanitized.from_name.length > 100) {
      errors.push('From name must not exceed 100 characters');
    }
  }

  // gift_wrap is boolean
  if (gifting.giftWrap !== undefined) {
    sanitized.gift_wrap = Boolean(gifting.giftWrap);
  }

  return {
    isValid: errors.length === 0,
    data: sanitized,
    errors
  };
}

/**
 * Log security event (for monitoring and audit trails)
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 * @param {string} severity - 'info', 'warning', 'critical'
 */
export function logSecurityEvent(eventType, details = {}, severity = 'info') {
  const timestamp = new Date().toISOString();
  const event = {
    timestamp,
    eventType,
    severity,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log to console (development)
  if (severity === 'critical' || severity === 'warning') {
    console.warn(`[SECURITY-${severity.toUpperCase()}] ${eventType}:`, event);
  } else {
    console.info(`[SECURITY-${severity.toUpperCase()}] ${eventType}:`, event);
  }

  // Store in localStorage for monitoring (keep last 100 events)
  try {
    const securityLog = JSON.parse(localStorage.getItem('securityLog') || '[]');
    securityLog.push(event);
    // Keep only last 100 events
    if (securityLog.length > 100) {
      securityLog.shift();
    }
    localStorage.setItem('securityLog', JSON.stringify(securityLog));
  } catch (err) {
    console.error('Error logging security event:', err);
  }

  return event;
}
