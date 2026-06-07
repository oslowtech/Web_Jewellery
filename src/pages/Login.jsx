import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";
import { sendLoginOtp, verifyOtp } from "../services/authService.js";

const Login = () => {
  const { signIn, signInWithGoogle, user, configured, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({
    title: "Login | Nagneshwari Jewels",
    description: "Login with your Supabase account.",
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
      if (isOtpLogin) {
        if (needsOtp) {
          await verifyOtp({ email, token: otp, type: "email" });
          window.location.href = from; // Force complete refresh to apply auth state
        } else {
          await sendLoginOtp(email);
          setNeedsOtp(true);
          setSuccess("A 6-digit login code has been sent to your email.");
        }
      } else {
        await signIn({ email, password });
        navigate(from, { replace: true });
      }
    } catch (loginError) {
      setError(loginError.message || "Unable to process request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    await signInWithGoogle();
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="font-display text-2xl">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        {!configured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase is not configured yet. Add your cloud project variables to enable login.
          </div>
        ) : null}
        {authError ? <p className="text-sm text-rose">{authError}</p> : null}
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full rounded-full border border-onyx/20 bg-white py-3 text-sm"
        >
          Continue with Google
        </button>
        <div className="relative py-1 text-center text-xs uppercase tracking-[0.25em] text-stone">
          <span className="relative z-10 bg-white px-2">or</span>
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-stone/20" />
        </div>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required disabled={needsOtp} className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 disabled:opacity-50" />
        </label>
        
        {!isOtpLogin && (
          <label className="block space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Password</span>
              <Link to="/forgot-password" className="text-xs font-medium text-rose hover:underline">Forgot password?</Link>
            </div>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
          </label>
        )}

        {needsOtp && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-onyx">Verification Code (OTP)</span>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} type="text" required maxLength="6" placeholder="123456" className="w-full rounded-xl border border-onyx bg-white px-3 py-2 font-mono text-center tracking-widest outline-none focus:border-rose focus:ring-1 focus:ring-rose/30" />
          </label>
        )}

        <button disabled={submitting} className="w-full rounded-full bg-onyx py-3 text-sm text-white disabled:opacity-60">
          {submitting ? "Processing..." : isOtpLogin ? (needsOtp ? "Verify Code" : "Send Login Code") : "Login"}
        </button>

        {!needsOtp && (
          <button type="button" onClick={() => setIsOtpLogin(!isOtpLogin)} className="w-full text-center text-sm font-medium text-stone hover:text-onyx transition-colors">
            {isOtpLogin ? "Sign in with password instead" : "Sign in with email code (OTP)"}
          </button>
        )}

        <p className="text-sm text-stone">
          New here? <Link to="/signup" className="text-onyx underline">Create an account</Link>
        </p>
        <p className="text-xs text-stone">
          If email sign-up is rate-limited, use Google login instead.
        </p>
      </form>
    </div>
  );
};

export default Login;
