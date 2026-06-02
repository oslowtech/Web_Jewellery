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

    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const currentSession = await getSession();
        if (!mounted) return;

        const currentUser = currentSession?.user || null;
        setSession(currentSession || null);
        setUser(currentUser);
        setProfile(currentUser ? await getProfile(currentUser) : null);
      } catch (authError) {
        if (mounted) {
          setError(authError.message || "Unable to load account state.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
      if (!mounted) return;

      setSession(nextSession || null);
      const nextUser = nextSession?.user || null;
      setUser(nextUser);

      if (nextUser) {
        try {
          setProfile(await getProfile(nextUser));
        } catch (profileError) {
          setError(profileError.message || "Unable to load profile.");
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

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
