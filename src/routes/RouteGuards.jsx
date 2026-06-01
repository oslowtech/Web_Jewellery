import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "../components/common/PageLoader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { loading, user, configured } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
          <h1 className="font-display text-2xl">Supabase not configured</h1>
          <p className="mt-2 text-sm text-stone">
            Add your Supabase project URL and anon key to enable login, signup, and admin access.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export const RequireAdmin = ({ children }) => {
  const { loading, user, isAdmin, configured } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
          <h1 className="font-display text-2xl">Admin portal not configured</h1>
          <p className="mt-2 text-sm text-stone">
            Configure Supabase and mark one account as <span className="font-medium">admin</span> in the profiles table.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};