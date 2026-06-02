import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, profile, saveProfile, signOut, loading, configured, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || "");
    setAddress(profile?.address || "");
  }, [profile, user]);

  usePageMeta({
    title: "Profile | Nagneshwari Jewels",
    description: "Account profile and cloud login details.",
  });

  if (!loading && !configured) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <h1 className="font-display text-2xl">Profile</h1>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft text-sm text-stone">
          Supabase is not configured yet. Add your cloud project variables to enable login and signup.
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await saveProfile({ fullName, address });
      if (result?.__notPersisted) {
        setMessage("Profile updated locally, but the profiles table is not present in Supabase. Run SUPABASE_SETUP.md to create it.");
      } else {
        setMessage("Profile saved successfully.");
      }
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-2xl">Profile</h1>
      <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        <p className="text-sm text-stone">Signed in as</p>
        <p className="mt-1 text-lg font-medium">{profile?.full_name || user?.email}</p>
        <p className="text-sm text-stone">{user?.email}</p>
        <p className="mt-3 text-sm text-stone">Role: <span className="font-medium text-onyx">{profile?.role || "user"}</span></p>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            className="w-full rounded-xl border border-white/70 bg-white px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Address</span>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows="4"
            className="w-full rounded-2xl border border-white/70 bg-white px-3 py-2"
            placeholder="House no, street, area, city, state, pincode"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-onyx px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {isAdmin ? (
            <Link to="/admin" className="rounded-full bg-onyx px-4 py-2 text-sm text-white">
              Open admin portal
            </Link>
          ) : null}
          <button type="button" onClick={handleSignOut} className="rounded-full border border-onyx/20 px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
