import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

/* Same API address pattern as ForgotPassword.jsx */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/* Same rule as the backend (and the signup page):
   8-128 characters, one uppercase letter, one lowercase letter,
   one number and one symbol (any character that is not a letter,
   a number or a space) */
const checkPassword = (value) => ({
  length: value.length >= 8 && value.length <= 128,
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /[0-9]/.test(value),
  symbol: /[^A-Za-z0-9\s]/.test(value),
});

function ResetPassword() {
  const [searchParams] = useSearchParams();

  // The emailed link looks like /reset-password?token=...
  const token = useMemo(
    () => (searchParams.get("token") || "").trim(),
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = checkPassword(password);
  const passwordOk = Object.values(rules).every(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!passwordOk) {
      setError(
        "Please choose a password that meets all the requirements below."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset your password. Please request a new link."
        );
      }

      setSuccess(
        data.message ||
          "Your password has been reset. You can now log in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const ruleItem = (ok, text) => (
    <li
      className={`flex items-center gap-2 text-xs leading-5 ${
        ok ? "text-[#c9a45c]" : "text-[#f3e9d8]/55"
      }`}
    >
      <span aria-hidden="true">{ok ? "✓" : "○"}</span>
      {text}
    </li>
  );

  return (
    <main className="min-h-screen bg-[#241311] px-4 py-12 text-[#f3e9d8] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-[32px] border border-[#c9a45c]/20 bg-[#351716]/80 p-6 shadow-2xl sm:p-10 lg:p-12">
          {/* Brand */}
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
              VINEORA
            </p>

            <h1 className="font-serif text-3xl font-normal tracking-wide text-[#f3e9d8] sm:text-4xl">
              Choose a New Password
            </h1>

            {!success && token && (
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#f3e9d8]/70 sm:text-base">
                Enter a new password for your account.
              </p>
            )}
          </div>

          {/* No token in the link */}
          {!token && !success && (
            <div className="text-center">
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-400/20 bg-red-950/30 px-4 py-3 text-sm text-red-200"
              >
                This password reset link is not valid. Please
                request a new one.
              </div>

              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#c9a45c] bg-[#c9a45c] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#241311] transition hover:bg-[#d7b66d]"
              >
                Request a New Link
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center">
              <div
                role="status"
                className="mb-6 rounded-2xl border border-[#c9a45c]/25 bg-[#c9a45c]/10 px-4 py-4 text-sm leading-6 text-[#f3e9d8]"
              >
                {success}
              </div>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#c9a45c] bg-[#c9a45c] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#241311] transition hover:bg-[#d7b66d]"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Form */}
          {token && !success && (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-red-400/20 bg-red-950/30 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="reset-password"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#f3e9d8]/70"
                  >
                    New Password
                  </label>

                  <input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    maxLength={128}
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#f3e9d8]/15 bg-black/15 px-5 py-4 text-base text-[#f3e9d8] outline-none transition placeholder:text-[#f3e9d8]/30 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#f3e9d8]/70"
                  >
                    Confirm New Password
                  </label>

                  <input
                    id="reset-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    maxLength={128}
                    disabled={loading}
                    className="w-full rounded-2xl border border-[#f3e9d8]/15 bg-black/15 px-5 py-4 text-base text-[#f3e9d8] outline-none transition placeholder:text-[#f3e9d8]/30 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#f3e9d8]/75">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) =>
                      setShowPassword(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#c9a45c]"
                  />
                  Show passwords
                </label>

                <ul className="space-y-1.5 rounded-2xl border border-[#f3e9d8]/10 bg-black/10 px-5 py-4">
                  {ruleItem(rules.length, "8 to 128 characters")}
                  {ruleItem(rules.upper, "One uppercase letter")}
                  {ruleItem(rules.lower, "One lowercase letter")}
                  {ruleItem(rules.number, "One number")}
                  {ruleItem(
                    rules.symbol,
                    "One symbol (for example ! @ # $ %)"
                  )}
                </ul>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl border border-[#c9a45c] bg-[#c9a45c] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#241311] transition hover:bg-[#d7b66d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Back to login */}
          {!success && (
            <div className="mt-10 text-center">
              <Link
                to="/login"
                className="text-xs uppercase tracking-[0.18em] text-[#f3e9d8]/65 transition hover:text-[#c9a45c]"
              >
                ← Back to Login
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;
