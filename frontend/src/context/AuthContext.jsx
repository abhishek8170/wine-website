import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore login state when the app starts
  useEffect(() => {
    const savedToken = localStorage.getItem("wine_auth_token");
    const savedCustomer = localStorage.getItem("wine_customer");

    if (savedToken && savedCustomer) {
      try {
        setToken(savedToken);
        setCustomer(JSON.parse(savedCustomer));
      } catch (error) {
        console.error("Failed to restore customer session:", error);

        localStorage.removeItem("wine_auth_token");
        localStorage.removeItem("wine_customer");
      }
    }

    setLoading(false);
  }, []);

  // Login customer
  const login = async (email, password) => {
    const response = await fetch(
      "/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Save authentication data
    localStorage.setItem("wine_auth_token", data.token);
    localStorage.setItem(
      "wine_customer",
      JSON.stringify(data.customer)
    );

    setToken(data.token);
    setCustomer(data.customer);

    return data;
  };

  // Register customer
  const register = async (customerData) => {
    const response = await fetch(
      "/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  };

  // Logout customer
  const logout = () => {
    localStorage.removeItem("wine_auth_token");
    localStorage.removeItem("wine_customer");

    setToken(null);
    setCustomer(null);
  };

  const value = {
    customer,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};