import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export const createLuckyDrawEntry = async (orderId, totalAmount, userId, customerName, customerPhone) => {
  if (!isSupabaseConfigured || !supabase || totalAmount < 3000) return null;

  if (userId) {
    const { data: existingUser } = await supabase.from('lucky_draw_entries').select('id').eq('user_id', userId).limit(1);
    if (existingUser && existingUser.length > 0) return null;
  }

  if (customerPhone) {
    const { data: existingPhone } = await supabase.from('lucky_draw_entries').select('id').eq('customer_phone', customerPhone).limit(1);
    if (existingPhone && existingPhone.length > 0) return null;
  }

  // Generate a unique 6-character code (e.g. LUCKY-A8X9P2)
  const code = `LUCKY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from('lucky_draw_entries')
    .insert([{
      order_id: orderId,
      user_id: userId,
      customer_name: customerName,
      customer_phone: customerPhone,
      code,
      is_used: false
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating lucky draw entry:", error);
    return null;
  }
  return data;
};

export const createManualLuckyDrawEntry = async (customerName, customerPhone, amount) => {
  if (!isSupabaseConfigured || !supabase || amount < 3000) return null;

  if (customerPhone) {
    const { data: existingPhone } = await supabase.from('lucky_draw_entries').select('id').eq('customer_phone', customerPhone).limit(1);
    if (existingPhone && existingPhone.length > 0) {
      throw new Error("A customer with this phone number has already received a Lucky Draw entry.");
    }
  }

  const code = `LUCKY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from('lucky_draw_entries')
    .insert([{
      customer_name: customerName,
      customer_phone: customerPhone,
      code,
      is_used: false
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLuckyDrawEntryByOrder = async (orderId) => {
  if (!isSupabaseConfigured || !supabase || !orderId) return null;
  const { data } = await supabase.from('lucky_draw_entries').select('*, orders(status)').eq('order_id', orderId).maybeSingle();
  return data;
};

export const checkUserEligibility = async (userId) => {
  if (!isSupabaseConfigured || !supabase || !userId) return true;
  const { data, error } = await supabase.from('lucky_draw_entries').select('id').eq('user_id', userId).limit(1);
  if (error) return true; // Assume eligible on error to not block UI unnecessarily, backend will enforce
  return !data || data.length === 0;
};

export const getUserLuckyDrawEntries = async (userId) => {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  const { data } = await supabase.from('lucky_draw_entries').select('*, orders(status)').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getAllLuckyDrawEntries = async () => {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from('lucky_draw_entries').select('*, orders(status)').order('created_at', { ascending: false });
  return data || [];
};

export const verifyAndUseCode = async (code) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Database not configured");

  const upperCode = code.toUpperCase().trim();

  const { data: entry, error: findError } = await supabase.from('lucky_draw_entries').select('*, orders(status)').eq('code', upperCode).single();

  if (findError || !entry) throw new Error("Invalid code or code not found.");
  if (entry.is_used) throw new Error(`Code was already used/redeemed on ${new Date(entry.used_at).toLocaleString()}`);

  if (entry.order_id) {
    if (entry.orders?.status === 'cancelled') {
      throw new Error("This code is void because the associated order was cancelled.");
    }
    if (entry.orders?.status !== 'delivered') {
      throw new Error("Code can only be redeemed after the order is delivered.");
    }
  }

  const { data: updated, error: updateError } = await supabase.from('lucky_draw_entries').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', entry.id).select().single();

  if (updateError) throw new Error("Failed to update code status.");
  return updated;
};