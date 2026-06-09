import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export const fetchSlides = async () => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data } = await supabase.from('slides').select('*').order('display_order');
    return data || [];
  } catch {
    return []; // Return empty if table doesn't exist
  }
};

export const saveSlide = async (slide) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from('slides').upsert(slide).select().single();
  if (error) throw error;
  return data;
};

export const deleteSlide = async (id) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from('slides').delete().eq('id', id);
  if (error) throw error;
};

export const fetchCoupons = async () => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
};

export const saveCoupon = async (coupon) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  // Convert valid_product_ids to an array if the admin typed a comma-separated string
  if (typeof coupon.valid_product_ids === 'string') {
    coupon.valid_product_ids = coupon.valid_product_ids.split(',').map(s => s.trim()).filter(Boolean);
  }
  const { data, error } = await supabase.from('coupons').upsert(coupon).select().single();
  if (error) throw error;
  return data;
};

export const deleteCoupon = async (id) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
};