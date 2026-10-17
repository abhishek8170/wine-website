import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/admin/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send the reset email."
        );
      }

      setSuccess(
        data.message ||
          "If an admin account exists with this email, a password reset link has been sent to it."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to send the reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#241311] text-[#f3e8d7] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <p className="text-[#c9a45c] text-xs tracking-[0.35em] uppercase mb-3">
            VINEORA
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#f3e8d7]">
            Forgot Password
          </h1>

          <p className="mt-3 text-sm text-[#bdaea4]">
            Enter your admin email and we will send you a link to
            choose a new password.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.055] backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {success ? (
            <div className="space-y-6">
              <div
                role="status"
                className="rounded-xl border border-[#c9a45c]/30 bg-[#c9a45c]/[0.08] px-4 py-3 text-sm text-[#f3e8d7]"
              >
                {success}
              </div>

              <p className="text-xs text-[#8e8078]">
                The link works for 30 minutes. Please also check
                your spam folder.
              </p>

              <Link
                to="/login"
                className="flex w-full h-12 items-center justify-center rounded-xl bg-[#c9a45c] text-[#241311] text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-[#d7b875]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-[0.18em] text-[#cfc1b7] mb-2"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    strokeWidth={1.5}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88342]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="admin@example.com"
                    disabled={loading}
                    className="w-full h-12 rounded-xl border border-white/10 bg-black/10 pl-12 pr-4 text-sm text-[#f3e8d7] placeholder:text-[#8e8078] outline-none transition focus:border-[#c9a45c]/70 focus:bg-white/[0.07] disabled:opacity-60"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#c9a45c] text-[#241311] text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-[#d7b875] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs text-[#bdaea4] hover:text-[#c9a45c] transition"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
