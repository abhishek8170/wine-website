import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
    loading: authLoading,
  } = useAdminAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [brandName, setBrandName] =
    useState("VINEORA");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] =
    useState(false);

  // =====================================
  // LOAD BRAND NAME
  // =====================================

  useEffect(() => {
    const loadBrandName = async () => {
      try {
        const token =
          sessionStorage.getItem("adminToken");

        // Settings endpoint requires admin authentication.
        // On the login page there may be no token yet,
        // so only request settings when a token exists.

        if (!token) {
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/admin/settings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (
          data?.success &&
          data?.settings?.brand_name
        ) {
          setBrandName(
            data.settings.brand_name
          );
        }
      } catch (settingsError) {
        console.error(
          "Login brand settings loading error:",
          settingsError
        );
      }
    };

    loadBrandName();
  }, []);

  // =====================================
  // AUTHENTICATED USER
  // =====================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#241311] flex items-center justify-center text-[#f3e8d7]">
        <p className="text-sm tracking-[0.2em] uppercase">
          Loading...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // =====================================
  // FORM CHANGE
  // =====================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =====================================
  // LOGIN
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email =
      formData.email.trim().toLowerCase();

    const password =
      formData.password;

    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        email,
        password
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // PAGE
  // =====================================

  return (
    <main className="min-h-screen bg-[#241311] text-[#f3e8d7] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[440px]">

        {/* Brand */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#c9a45c]/50 bg-[#351716]/70 mb-6">
            <span className="text-[#c9a45c] text-2xl font-serif">
              V
            </span>
          </div>

          <p className="text-[#c9a45c] text-xs tracking-[0.35em] uppercase mb-3">
            {brandName}
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#f3e8d7]">
            Admin Portal
          </h1>

          <p className="mt-3 text-sm text-[#bdaea4]">
            Sign in to manage your wine store.
          </p>
        </div>

        {/* Login Card */}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.055] backdrop-blur-xl shadow-2xl p-6 sm:p-8">

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >

            {/* Email */}

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
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  disabled={loading}
                  className="w-full h-12 rounded-xl border border-white/10 bg-black/10 pl-12 pr-4 text-sm text-[#f3e8d7] placeholder:text-[#8e8078] outline-none transition focus:border-[#c9a45c]/70 focus:bg-white/[0.07] disabled:opacity-60"
                />

              </div>
            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-[0.18em] text-[#cfc1b7] mb-2"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  strokeWidth={1.5}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a88342]"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full h-12 rounded-xl border border-white/10 bg-black/10 pl-12 pr-12 text-sm text-[#f3e8d7] placeholder:text-[#8e8078] outline-none transition focus:border-[#c9a45c]/70 focus:bg-white/[0.07] disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
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
                    <EyeOff
                      size={18}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Eye
                      size={18}
                      strokeWidth={1.5}
                    />
                  )}
                </button>

              </div>
            </div>

            {/* Error */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#c9a45c] text-[#241311] text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-[#d7b875] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>

          <div className="mt-7 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-[#8e8078]">
              Authorized administrators only
            </p>
          </div>

        </div>

        <p className="text-center text-xs text-[#756861] mt-8">
          {brandName} Admin • Secure Management Portal
        </p>

      </div>
    </main>
  );
};

export default Login;