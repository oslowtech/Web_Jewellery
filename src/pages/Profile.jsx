import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta.js";

const Profile = () => {
  usePageMeta({
    title: "Profile | Elan Jewellery",
    description: "Profile and account settings will be available soon.",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-display text-2xl">Profile</h1>
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        <p className="text-sm text-stone">
          User accounts, wishlist sync, and order tracking will be available once
          backend integration is enabled.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/login"
            className="rounded-full bg-onyx px-4 py-2 text-sm text-white"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full border border-onyx/20 px-4 py-2 text-sm"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
