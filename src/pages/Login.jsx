import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta.js";
import { useAuth } from "../context/AuthContext.jsx";
import { sendLoginOtp, resendConfirmationEmail } from "../services/authService.js";

const Login = () => {
  const { signIn, signInWithGoogle, user, configured, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
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
    setNeedsConfirmation(false);

    try {
      if (isOtpLogin) {
        await sendLoginOtp(email, { emailRedirectTo: window.location.origin + from });
        setSuccess("A magic link has been sent to your email. Click it to log in.");
      } else {
        await signIn({ email, password });
        navigate(from, { replace: true });
      }
    } catch (loginError) {
      const msg = loginError.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("Your email address has not been verified yet.");
        setNeedsConfirmation(true);
      } else {
        setError(msg || "Unable to process request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await resendConfirmationEmail(email, { emailRedirectTo: window.location.origin + from });
      setSuccess("A new confirmation link has been sent to your email. Please check your inbox!");
      setNeedsConfirmation(false);
    } catch (err) {
      setError(err.message || "Unable to resend confirmation email.");
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
        
        {needsConfirmation && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            <p className="font-medium mb-3">Haven't received the link?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="w-full rounded-full bg-amber-200 py-2.5 font-medium text-amber-900 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Resend confirmation email"}
            </button>
          </div>
        )}

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
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full rounded-xl border border-white/70 bg-white px-3 py-2" />
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

        <button disabled={submitting} className="w-full rounded-full bg-onyx py-3 text-sm text-white disabled:opacity-60">
          {submitting ? "Processing..." : isOtpLogin ? "Send Magic Link" : "Login"}
        </button>

        <button type="button" onClick={() => setIsOtpLogin(!isOtpLogin)} className="w-full text-center text-sm font-medium text-stone hover:text-onyx transition-colors">
          {isOtpLogin ? "Sign in with password instead" : "Sign in with Magic Link"}
        </button>

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
