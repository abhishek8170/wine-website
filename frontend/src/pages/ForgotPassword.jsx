import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const validateEmail = (value) => {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailRegex.test(value.trim());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setStatus("");
    setResetUrl("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process your request."
        );
      }

      setStatus(
        data.message ||
          "If an account exists with this email, a password reset link has been generated."
      );

      /*
        Development only.

        The backend currently returns this URL
        so that we can test the complete reset flow
        before connecting an actual email service.

        Remove this before production.
      */
      if (data.developmentResetUrl) {
        setResetUrl(
          data.developmentResetUrl
        );
      }

      setEmail("");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#241311] px-4 py-12 text-[#f3e9d8] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[32px] border border-[#c9a45c]/20 bg-[#351716]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
          {/* Brand */}
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
              VINEORA
            </p>

            <h1 className="text-3xl font-light tracking-wide text-[#f3e9d8] sm:text-4xl">
              Forgot Password?
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#f3e9d8]/65 sm:text-base">
              Enter the email address associated
              with your account and we’ll help you
              reset your password.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-400/20 bg-red-950/30 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {status && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-[#c9a45c]/25 bg-[#c9a45c]/10 px-4 py-4 text-sm leading-6 text-[#f3e9d8]"
            >
              {status}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#f3e9d8]/60"
              >
                Email Address
              </label>

              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                disabled={loading}
                className="w-full rounded-2xl border border-[#f3e9d8]/15 bg-black/15 px-5 py-4 text-sm text-[#f3e9d8] outline-none transition placeholder:text-[#f3e9d8]/30 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-[#c9a45c] bg-[#c9a45c] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#241311] transition hover:bg-[#d7b66d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>
          </form>

          {/* Development reset link */}
          {resetUrl && (
            <div className="mt-8 rounded-2xl border border-[#c9a45c]/20 bg-black/20 p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#c9a45c]">
                Development Reset Link
              </p>

              <p className="mb-4 break-all text-xs leading-6 text-[#f3e9d8]/60">
                This link is shown only for local
                development and testing.
              </p>

              <Link
                to={`/reset-password?token=${
                  new URL(resetUrl).searchParams.get(
                    "token"
                  ) || ""
                }`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#f3e9d8]/15 px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-[#f3e9d8] transition hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
              >
                Continue to Reset Password
              </Link>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="text-xs uppercase tracking-[0.18em] text-[#f3e9d8]/55 transition hover:text-[#c9a45c]"
            >
              ← Back to Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;