import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";
import { verifyOtp } from "../services/authService.js";

const Signup = () => {
  const { signUp, signInWithGoogle, user, configured, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({
    title: "Sign Up | Nagneshwari Jewels",
    description: "Create a customer account with Supabase.",
  });

  if (loading) {
    return <div className="py-10 text-center text-stone">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (needsOtp) {
        await verifyOtp({ email, token: otp, type: "signup" });
        setSuccess("Account verified successfully! Redirecting...");
        window.location.href = "/profile"; // Force complete refresh to apply auth state
      } else {
        await signUp({ fullName, email, password });
        setNeedsOtp(true);
        setSuccess("Please check your email for the 6-digit verification code.");
      }
    } catch (signupError) {
      setError(signupError.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    await signInWithGoogle();
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="font-display text-2xl">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        {!configured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase is not configured yet. Add your cloud project variables to enable signup.
          </div>
        ) : null}
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full rounded-full border border-onyx/20 bg-white py-3 text-sm"
        >
          Sign up with Google
        </button>
        <div className="relative py-1 text-center text-xs uppercase tracking-[0.25em] text-stone">
          <span className="relative z-10 bg-white px-2">or</span>
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-stone/20" />
        </div>
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} type="text" required disabled={needsOtp} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 disabled:opacity-50" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required disabled={needsOtp} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 disabled:opacity-50" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength="6" required disabled={needsOtp} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 disabled:opacity-50" />
        </label>

        {needsOtp && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-onyx">Verification Code (OTP)</span>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} type="text" required maxLength="6" placeholder="123456" className="w-full rounded-xl border border-onyx bg-white px-3 py-2 font-mono text-center tracking-widest outline-none focus:border-rose focus:ring-1 focus:ring-rose/30" />
          </label>
        )}

        <button disabled={submitting} className="w-full rounded-full bg-onyx py-3 text-sm text-white disabled:opacity-60">
          {submitting ? "Processing..." : needsOtp ? "Verify Code" : "Sign up"}
        </button>
        <p className="text-sm text-stone">
          Already have an account? <Link to="/login" className="text-onyx underline">Login</Link>
        </p>
        <p className="text-xs text-stone">
          Email sign-up can hit Supabase limits; Google is the fastest way to get in.
        </p>
      </form>
    </div>
  );
};

export default Signup;
