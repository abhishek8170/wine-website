import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/* Same rule as the backend and the customer site:
   8-128 characters, one uppercase letter, one lowercase letter,
   one number and one symbol (not a letter, number or space) */
const checkPassword = (value) => ({
  length: value.length >= 8 && value.length <= 128,
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /[0-9]/.test(value),
  symbol: /[^A-Za-z0-9\s]/.test(value),
});

const RULE_LABELS = [
  ["length", "8 to 128 characters"],
  ["upper", "One uppercase letter"],
  ["lower", "One lowercase letter"],
  ["number", "One number"],
  ["symbol", "One symbol (for example ! @ # $)"],
];

const inputClass =
  "w-full h-12 rounded-xl border border-white/10 bg-black/10 pl-12 pr-12 text-sm text-[#f3e8d7] placeholder:text-[#8e8078] outline-none transition focus:border-[#c9a45c]/70 focus:bg-white/[0.07] disabled:opacity-60";

const ResetPassword = () => {
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
        `${API_BASE_URL}/admin/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            confirm_password: confirmPassword,
          }),
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
          data.message || "Unable to reset the password."
        );
      }

      setSuccess(
        data.message ||
          "Password has been reset successfully. You can now sign in with your new password."
      );
    } catch (requestError) {
      setError(
        requestError.message || "Unable to reset the password."
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
            Choose a New Password
          </h1>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.055] backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {!token ? (
            <div className="space-y-6">
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
              >
                This password reset link is missing or incomplete.
                Please request a new one.
              </div>

              <Link
                to="/forgot-password"
                className="flex w-full h-12 items-center justify-center rounded-xl bg-[#c9a45c] text-[#241311] text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-[#d7b875]"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div
                role="status"
                className="rounded-xl border border-[#c9a45c]/30 bg-[#c9a45c]/[0.08] px-4 py-3 text-sm text-[#f3e8d7]"
              >
                {success}
              </div>

              <Link
                to="/login"
                className="flex w-full h-12 items-center justify-center rounded-xl bg-[#c9a45c] text-[#241311] text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-[#d7b875]"
              >
                Go to Sign In
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
                  htmlFor="password"
                  className="block text-xs uppercase tracking-[0.18em] text-[#cfc1b7] mb-2"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    strokeWidth={1.5}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88342]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter a new password"
                    disabled={loading}
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9f9189] hover:text-[#c9a45c] transition disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.5} />
                    ) : (
                      <Eye size={18} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs uppercase tracking-[0.18em] text-[#cfc1b7] mb-2"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    strokeWidth={1.5}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88342]"
                  />

                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Repeat the new password"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>

              <ul className="space-y-1.5">
                {RULE_LABELS.map(([key, label]) => (
                  <li
                    key={key}
                    className={`flex items-center gap-2 text-xs transition ${
                      rules[key]
                        ? "text-[#c9a45c]"
                        : "text-[#8e8078]"
                    }`}
                  >
                    <Check
                      size={14}
                      className={
                        rules[key] ? "opacity-100" : "opacity-30"
                      }
                    />
                    {label}
                  </li>
                ))}
              </ul>

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
                {loading ? "Saving..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
