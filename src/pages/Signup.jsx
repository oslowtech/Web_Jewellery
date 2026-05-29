import usePageMeta from "../hooks/usePageMeta.js";

const Signup = () => {
  usePageMeta({
    title: "Sign Up | Elan Jewellery",
    description: "Sign up will be enabled with backend integration.",
  });

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="font-display text-2xl">Create account</h1>
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft">
        <p className="text-sm text-stone">
          Account creation will be available once backend integration is enabled.
        </p>
      </div>
    </div>
  );
};

export default Signup;
