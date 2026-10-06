import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Shipments from "./pages/Shipments";
import Settings from "./pages/Settings";
import DeliveryManagement from "./pages/DeliveryManagement";
import Coupons from "./pages/Coupons";
import Newsletter from "./pages/Newsletter";
import ContactMessages from "./pages/ContactMessages";
import OurStory from "./pages/OurStory";
import AdminManagement from "./pages/AdminManagement";
import Reviews from "./pages/Reviews";
import Collections from "./pages/Collections.jsx";
import Notifications from "./pages/Notifications";
import AdminLayout from "./components/AdminLayout";

import { useAdminAuth } from "./context/AdminAuthContext";


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTE
|--------------------------------------------------------------------------
*/

const ProtectedRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading,
  } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5eee4]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#6c5850]">
            Loading admin panel
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
};


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ROOT */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />


        {/* INVENTORY */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />


        {/* CUSTOMERS */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />


        {/* ORDERS */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <Shipments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <DeliveryManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coupons"
          element={
            <ProtectedRoute>
              <Coupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newsletter"
          element={
            <ProtectedRoute>
              <Newsletter />
            </ProtectedRoute>
          }
        />

        {/* CONTACT MESSAGES */}
        <Route
          path="/contact-messages"
          element={
            <ProtectedRoute>
              <ContactMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/our-story"
          element={
            <ProtectedRoute>
              <OurStory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-management"
          element={
            <ProtectedRoute>
              <AdminManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/collections"
          element={
            <ProtectedRoute>
              <Collections />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};


export default App;