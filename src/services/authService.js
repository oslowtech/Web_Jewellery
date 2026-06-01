import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const MISSING_TABLE_MESSAGE = "Could not find the table 'public.profiles' in the schema cache";

const isMissingProfilesTableError = (error) => {
  const message = error?.message || "";
  return message.includes(MISSING_TABLE_MESSAGE) || message.includes("public.profiles");
};

const requireSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
};

export const getSession = async () => {
  requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const getProfile = async (user) => {
  if (!user) return null;

  requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, address")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingProfilesTableError(error)) {
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: user.app_metadata?.role || "user",
        address: user.user_metadata?.address || "",
      };
    }

    throw error;
  }

  return (
    data || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.app_metadata?.role || "user",
      address: user.user_metadata?.address || "",
    }
  );
};

export const signInUser = async ({ email, password }) => {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpUser = async ({ fullName, email, password }) => {
  requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: "user",
      address: "",
      updated_at: new Date().toISOString(),
    });

    if (profileError && !isMissingProfilesTableError(profileError)) {
      throw profileError;
    }
  }

  return data;
};

export const signInWithGoogle = async () => {
  requireSupabase();

  const redirectTo = `${window.location.origin}/profile`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) throw error;

  if (data?.url) {
    window.location.assign(data.url);
  }

  return data;
};

export const updateProfile = async ({ id, email, fullName, address, role }) => {
  requireSupabase();

  const payload = {
    id,
    email,
    full_name: fullName,
    address,
    role: role || "user",
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, email, full_name, role, address")
      .single();

    if (error) {
      if (isMissingProfilesTableError(error)) {
        // Profiles table missing — return payload with a flag so UI can warn the user
        return { ...payload, __notPersisted: true };
      }
      throw error;
    }

    return data;
  } catch (err) {
    if (isMissingProfilesTableError(err)) {
      return { ...payload, __notPersisted: true };
    }
    throw err;
  }
};

export const signOutUser = async () => {
  if (!isSupabaseConfigured || !supabase) {
    // Supabase not configured — nothing to sign out remotely
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    // Non-fatal: log and let caller proceed
    console.error("signOutUser error:", err?.message || err);
  }
};