import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../services/authService.js";
import usePageMeta from "../hooks/usePageMeta.js";

const ForgotPassword = () => {
  usePageMeta({
    title: "Forgot Password | Nagneshwari Jewels",
  });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPassword(email);
      setMessage("Check your email for the password reset link.");
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl text-onyx">Reset Password</h1>
        <p className="mt-2 text-sm text-stone">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        {error && <div className="rounded-xl border border-rose/20 bg-rose/10 p-3 text-sm text-rose">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-onyx">Email address</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-stone/20 bg-white px-4 py-2.5 outline-none focus:border-onyx/30" placeholder="you@example.com" />
        </label>

        <button type="submit" disabled={loading} className="w-full rounded-full bg-onyx py-3 text-sm font-medium text-white transition-colors hover:bg-onyx/90 disabled:opacity-70">
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <p className="mt-4 text-center text-sm text-stone">
          Remembered your password?{" "}
          <Link to="/login" className="font-medium text-rose hover:underline">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;