import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  adminLogin,
  getCurrentAdmin,
} from "../services/api";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(
    () => sessionStorage.getItem("adminToken")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentAdmin(token);

        if (response.success) {
          setAdmin(response.admin);
        } else {
          sessionStorage.removeItem("adminToken");
          setToken(null);
          setAdmin(null);
        }
      } catch (error) {
        console.error("Admin session verification failed:", error);

        sessionStorage.removeItem("adminToken");
        setToken(null);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [token]);

  const login = async (email, password) => {
    const response = await adminLogin(email, password);

    if (!response.success || !response.token) {
      throw new Error(
        response.message || "Admin login failed"
      );
    }

    sessionStorage.setItem(
      "adminToken",
      response.token
    );

    setToken(response.token);
    setAdmin(response.admin);

    return response;
  };

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated: Boolean(admin && token),
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider"
    );
  }

  return context;
};