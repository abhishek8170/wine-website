import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll to the message whenever an error or success occurs
  useEffect(() => {
    if (error || success) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [error, success]);

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
    setSuccess("");

    // Required fields
    if (
      !formData.first_name ||
      !formData.email ||
      !formData.phone ||
      !formData.password
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    // Password length
    if (formData.password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    // Password confirmation
    if (
      formData.password !==
      formData.confirm_password
    ) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess(
        "Your account has been created successfully."
      );

      setTimeout(() => {
        navigate("/login", {
          state: {
            registered: true,
          },
        });
      }, 1500);
    } catch (error) {
      setError(
        error.message ||
          "Unable to create your account."
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
            Create an account
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#351716]/65">
            Join VINEORA to save your favorite wines,
            manage orders and enjoy a more personal
            shopping experience.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:gap-24">

          {/* Register Form */}
          <section>

            <div className="mb-10 flex items-center gap-4">
              <span className="text-[11px] tracking-[0.2em] text-[#8f6d32]">
                01
              </span>

              <h2 className="text-xs font-medium uppercase tracking-[0.22em]">
                Your details
              </h2>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-7 border border-[#8b3a32]/30 bg-[#8b3a32]/5 px-5 py-4 text-sm leading-6 text-[#8b3a32]"
              >
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                role="status"
                className="mb-7 border border-[#8f6d32]/30 bg-[#8f6d32]/5 px-5 py-4 text-sm leading-6 text-[#6e5425]"
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-9"
            >

              {/* First Name + Last Name */}
              <div className="grid gap-9 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                  >
                    First name *
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                  >
                    Last name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    autoComplete="family-name"
                    className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                    placeholder="Last name"
                  />
                </div>

              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Email address *
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

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Phone number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                  className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                  placeholder="Phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Password *
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                  placeholder="Minimum 8 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm_password"
                  className="mb-3 block text-[10px] uppercase tracking-[0.18em]"
                >
                  Confirm password *
                </label>

                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full border-0 border-b border-[#351716]/30 bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-[#351716]"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#351716] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-[#f3e8d7] transition-colors hover:bg-[#4a211d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

            {/* Login */}
            <div className="mt-10 border-t border-[#351716]/15 pt-8 text-center">
              <p className="text-sm text-[#351716]/60">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="mt-3 inline-block text-[10px] font-medium uppercase tracking-[0.2em] text-[#8f6d32] transition-colors hover:text-[#351716]"
              >
                Sign in
              </Link>
            </div>

          </section>

          {/* Side Information */}
          <aside className="border-t border-[#351716]/20 pt-8 lg:border-t-0 lg:border-l lg:pl-16">

            <p className="text-[10px] uppercase tracking-[0.24em] text-[#8f6d32]">
              VINEORA JOURNEY
            </p>

            <h2 className="mt-6 font-serif text-3xl font-light leading-tight sm:text-4xl">
              Discover wines
              <br />
              worth remembering.
            </h2>

            <p className="mt-7 text-sm leading-7 text-[#351716]/65">
              Create your VINEORA account and keep
              your wine journey in one place.
            </p>

            <div className="mt-12 border-t border-[#351716]/15">

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  01
                </p>

                <p className="mt-2 text-sm">
                  Faster checkout
                </p>
              </div>

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  02
                </p>

                <p className="mt-2 text-sm">
                  Manage your orders
                </p>
              </div>

              <div className="border-b border-[#351716]/15 py-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8f6d32]">
                  03
                </p>

                <p className="mt-2 text-sm">
                  Save your favorite wines
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default Register;