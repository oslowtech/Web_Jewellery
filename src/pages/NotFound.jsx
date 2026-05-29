import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12 text-center">
      <h1 className="font-display text-3xl">Page not found</h1>
      <p className="text-sm text-stone">
        The page you are looking for does not exist. Let us take you back to the
        collections.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-full bg-onyx px-4 py-2 text-sm text-white"
      >
        Go home
      </Link>
    </div>
  );
};

export default NotFound;
