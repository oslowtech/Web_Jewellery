import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export const fetchCustomers = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, address, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchCustomers error:", error.message || error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("fetchCustomers exception:", err?.message || err);
    return [];
  }
};
export const loginUser = async () => {
  throw new Error("Login service is not available in frontend-only mode.");
};

export const signupUser = async () => {
  throw new Error("Signup service is not available in frontend-only mode.");
};
