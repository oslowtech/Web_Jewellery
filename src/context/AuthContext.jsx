import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getProfile,
  getSession,
  signInUser,
  signInWithGoogle,
  signOutUser,
  signUpUser,
  updateProfile,
} from "../services/authService.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

// Suppress all console logs in production to clean up the browser console
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    // Fetch initial session and profile safely outside of auth listeners
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error("Session error:", error);

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        try {
          setProfile(await getProfile(session.user));
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      }

      setLoading(false);
    });

    // Synchronous listener for auth changes (prevents deadlocks!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Handle subsequent profile updates when user changes (e.g. login/logout)
  useEffect(() => {
    let mounted = true;
    
    // Skip if initial load is still running
    if (loading) return;

    if (!user) {
      setProfile(null);
      return;
    }

    getProfile(user)
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch((err) => {
        console.error("Profile update error:", err);
        if (mounted) setProfile(null);
      });

    return () => { mounted = false; };
  }, [user?.id, loading]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      configured: isSupabaseConfigured,
      isAdmin:
        profile?.role === "admin" ||
        (user?.email && import.meta.env.VITE_DEV_ADMIN_EMAIL && user.email === import.meta.env.VITE_DEV_ADMIN_EMAIL),
      signIn: signInUser,
      signInWithGoogle,
      signUp: signUpUser,
      signOut: async () => {
        // clear local state immediately so UI updates regardless of remote sign-out
        setSession(null);
        setUser(null);
        setProfile(null);
        setError("");
        setLoading(false);

        try {
          await signOutUser();
        } catch (err) {
          console.error("signOut error:", err?.message || err);
        }
      },
      saveProfile: async (updates) => {
        if (!user) return null;
        const nextProfile = await updateProfile({
          id: user.id,
          email: user.email,
          fullName: updates.fullName,
          address: updates.address,
          role: profile?.role || "user",
        });
        setProfile(nextProfile);
        return nextProfile;
      },
      refreshProfile: async () => {
        if (!user) return null;
        const nextProfile = await getProfile(user);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [error, loading, profile, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
