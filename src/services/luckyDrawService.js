import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export const createLuckyDrawEntry = async (orderId, totalAmount, userId, customerName, customerPhone) => {
  if (!isSupabaseConfigured || !supabase || totalAmount < 3000) return null;

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
  const { data } = await supabase.from('lucky_draw_entries').select('*').eq('order_id', orderId).maybeSingle();
  return data;
};

export const getUserLuckyDrawEntries = async (userId) => {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  const { data } = await supabase.from('lucky_draw_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getAllLuckyDrawEntries = async () => {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from('lucky_draw_entries').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const verifyAndUseCode = async (code) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Database not configured");

  const upperCode = code.toUpperCase().trim();

  const { data: entry, error: findError } = await supabase.from('lucky_draw_entries').select('*').eq('code', upperCode).single();

  if (findError || !entry) throw new Error("Invalid code or code not found.");
  if (entry.is_used) throw new Error(`Code was already used/redeemed on ${new Date(entry.used_at).toLocaleString()}`);

  const { data: updated, error: updateError } = await supabase.from('lucky_draw_entries').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', entry.id).select().single();

  if (updateError) throw new Error("Failed to update code status.");
  return updated;
};