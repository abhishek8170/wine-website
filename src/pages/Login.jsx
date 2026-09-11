import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registeredSuccessfully =
    location.state?.registered === true;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(
        formData.email,
        formData.password
      );

      navigate("/");
    } catch (error) {
      setError(
        error.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3e8d7] px-5 py-16 text-[#351716] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-14 border-b border-[#351716]/20 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[#8f6d32]">
            VINEORA
          </p>

          <h1 className="font-serif text-5xl font-light tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            Welcome back
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#351716]/65">
            Sign in to your VINEORA account to
            continue your wine journey.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:gap-24">

          {/* Login Form */}
          <section>

            <div className="mb-10 flex items-center gap-4">
              <span className="text-[11px] tracking-[0.2em] text-[#8f6d32]">
                01
              </span>

              <h2 className="text-xs font-medium uppercase tracking-[0.22em]">
                Sign in
              </h2>
            </div>

            {/* Registration Success */}
            {registeredSuccessfully && (
              <div className="mb-7 border border-[#8f6d32]/30 bg-[#8f6d32]/5 px-5 py-4 text-sm leading-6 text-[#6e5425]">
                Your account has been created
                successfully. Please sign in.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-7 border border-[#8b3a32]/30 bg-[#8b3a32]/5 px-5 py-4 text-sm leading-6 text-[#8b3a32]">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-9"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                  placeholder="Your password"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-[0.16em] text-[#8f6d32] transition-colors hover:text-[#351716]"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#351716] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-[#f3e8d7] transition-colors hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            {/* Register */}
            <div className="mt-10 border-t border-[#351716]/15 pt-8 text-center">
              <p className="text-sm text-[#351716]/60">
                Don't have an account?
              </p>

              <Link
                to="/register"
                className="mt-3 inline-block text-[10px] font-medium uppercase tracking-[0.2em] text-[#8f6d32] transition-colors hover:text-[#351716]"
              >
                Create an account
              </Link>
            </div>
          </section>

          {/* Side Information */}
          <aside className="border-t border-[#351716]/20 pt-8 lg:border-t-0 lg:border-l lg:pl-16">

            <p className="text-[10px] uppercase tracking-[0.24em] text-[#8f6d32]">
              YOUR VINEORA ACCOUNT
            </p>

            <h2 className="mt-6 font-serif text-3xl font-light leading-tight sm:text-4xl">
              Your wines.
              <br />
              Your journey.
            </h2>

            <p className="mt-7 text-sm leading-7 text-[#351716]/65">
              Your account makes it easier to manage
              your orders, save wines and complete
              future purchases.
            </p>

            <div className="mt-12 border-t border-[#351716]/15">

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  01
                </p>

                <p className="mt-2 text-sm">
                  Track your orders
                </p>
              </div>

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  02
                </p>

                <p className="mt-2 text-sm">
                  Save your favorite wines
                </p>
              </div>

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  03
                </p>

                <p className="mt-2 text-sm">
                  Faster checkout
                </p>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Login;