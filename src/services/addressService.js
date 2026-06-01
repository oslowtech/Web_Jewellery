import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { 
  sanitizeAddress, 
  sanitizeString, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizePostalCode,
  logSecurityEvent 
} from '../utils/sanitize.js';
import { checkAddressCreationLimit } from '../utils/rateLimit.js';

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local'
    );
  }
}

/**
 * Fetch all addresses for the logged-in user
 */
export async function fetchAddresses() {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching addresses:', err);
    throw err;
  }
}

/**
 * Get a single address by ID
 */
export async function getAddressById(addressId) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching address:', err);
    throw err;
  }
}

/**
 * Save a new address
 */
export async function saveAddress(addressData) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check rate limit before processing
    const rateLimitCheck = checkAddressCreationLimit(user.id);
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('rate_limit_exceeded_address', {
        userId: user.id,
        reason: rateLimitCheck.error
      }, 'warning');
      throw new Error(rateLimitCheck.error);
    }

    // Sanitize and validate input
    const sanitizationResult = sanitizeAddress(addressData);
    if (!sanitizationResult.isValid) {
      logSecurityEvent('address_validation_failed', {
        userId: user.id,
        errors: sanitizationResult.errors
      }, 'warning');
      throw new Error(`Validation failed: ${sanitizationResult.errors.join(', ')}`);
    }

    const sanitizedData = sanitizationResult.data;

    // If this is set as default, unset other defaults
    if (sanitizedData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('address_type', sanitizedData.address_type || 'billing');
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert([
        {
          user_id: user.id,
          ...sanitizedData,
          country: sanitizedData.country || 'India'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Log successful address creation
    logSecurityEvent('address_created', {
      userId: user.id,
      addressId: data.id,
      addressType: data.address_type
    }, 'info');

    return data;
  } catch (err) {
    console.error('Error saving address:', err);
    logSecurityEvent('address_creation_error', {
      error: err.message
    }, 'error');
    throw err;
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(addressId, addressData) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify ownership
    const existing = await getAddressById(addressId);
    if (existing.user_id !== user.id) {
      logSecurityEvent('unauthorized_address_access', {
        userId: user.id,
        targetAddressId: addressId
      }, 'warning');
      throw new Error('Unauthorized: Cannot update another user\'s address');
    }

    // Sanitize and validate input
    const sanitizationResult = sanitizeAddress(addressData);
    if (!sanitizationResult.isValid) {
      logSecurityEvent('address_validation_failed', {
        userId: user.id,
        addressId,
        errors: sanitizationResult.errors
      }, 'warning');
      throw new Error(`Validation failed: ${sanitizationResult.errors.join(', ')}`);
    }

    const sanitizedData = sanitizationResult.data;

    // If this is set as default, unset other defaults
    if (sanitizedData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('address_type', sanitizedData.address_type || 'billing')
        .neq('id', addressId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(sanitizedData)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    logSecurityEvent('address_updated', {
      userId: user.id,
      addressId
    }, 'info');

    return data;
  } catch (err) {
    console.error('Error updating address:', err);
    logSecurityEvent('address_update_error', {
      error: err.message
    }, 'error');
    throw err;
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId) {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify ownership before deletion
    const existing = await getAddressById(addressId);
    if (existing.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot delete another user\'s address');
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting address:', err);
    throw err;
  }
}

/**
 * Get user's default addresses
 */
export async function getDefaultAddresses() {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching default addresses:', err);
    throw err;
  }
}

/**
 * Get default address by type
 */
export async function getDefaultAddressByType(type = 'billing') {
  requireSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .eq('address_type', type)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found - return null
      return null;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching default address by type:', err);
    throw err;
  }
}

/**
 * Validate address format
 */
export function validateAddress(address) {
  // Use the sanitization utility for comprehensive validation
  const sanitizationResult = sanitizeAddress(address);
  
  if (sanitizationResult.isValid) {
    return {
      isValid: true,
      errors: []
    };
  }

  return {
    isValid: false,
    errors: sanitizationResult.errors
  };
}
