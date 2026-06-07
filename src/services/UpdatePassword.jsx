import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "../services/authService.js";
import usePageMeta from "../hooks/usePageMeta.js";

const UpdatePassword = () => {
  usePageMeta({
    title: "Set New Password | Nagneshwari Jewels",
  });

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updatePassword(password);
      // Password updated successfully! Send them to their profile.
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Failed to update password. Your link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl text-onyx">Set New Password</h1>
        <p className="mt-2 text-sm text-stone">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        {error && <div className="rounded-xl border border-rose/20 bg-rose/10 p-3 text-sm text-rose">{error}</div>}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-onyx">New password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-stone/20 bg-white px-4 py-2.5 outline-none focus:border-onyx/30" placeholder="Minimum 6 characters" />
        </label>

        <button type="submit" disabled={loading} className="w-full rounded-full bg-onyx py-3 text-sm font-medium text-white transition-colors hover:bg-onyx/90 disabled:opacity-70">
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
};

export default UpdatePassword;