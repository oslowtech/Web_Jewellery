import usePageMeta from "../hooks/usePageMeta.js";

const Login = () => {
  usePageMeta({
    title: "Login | Elan Jewellery",
    description: "Login will be enabled with backend integration.",
  });

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="font-display text-2xl">Login</h1>
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        <p className="text-sm text-stone">
          Login will be available once backend integration is enabled. Use the
          shop and wishlist features in the meantime.
        </p>
      </div>
    </div>
  );
};

export default Login;
