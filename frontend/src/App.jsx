import { BrowserRouter, Routes, Route } from "react-router-dom";

import AgeVerification from "./components/AgeVerification";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Account from "./pages/Account.jsx";
import CollectionsPage from "./pages/Collections";
import Orders from "./pages/Orders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import OurStory from "./pages/OurStory.jsx";
import WineGuide from "./pages/WineGuide";
import WineGuideArticle from "./pages/WineGuideArticle";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  const brandName = "VINEORA";

  return (
    <BrowserRouter>
      {/* =========================================================
          GLOBAL WEBSITE COMPONENTS
      ========================================================= */}

      <ScrollToTop />

      <AgeVerification brandName={brandName} />

      <Header brandName={brandName} />

      {/* =========================================================
          CUSTOMER PAGES
      ========================================================= */}

      <Routes>
        {/* Home */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* Shop */}

        <Route
          path="/shop"
          element={<Shop />}
        />

        {/* Product Details */}

        <Route
          path="/shop/:id"
          element={<ProductDetails />}
        />

        {/* Cart */}

        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* Checkout */}

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* Wishlist */}

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        {/* Authentication */}

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Account */}

        <Route
          path="/account"
          element={<Account />}
        />

        {/* Collections */}

        <Route
          path="/collections"
          element={<CollectionsPage />}
        />

        {/* Orders */}

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/orders/:id"
          element={<OrderDetails />}
        />

        {/* Our Story */}

        <Route
          path="/our-story"
          element={<OurStory />}
        />

        {/* Wine Guide */}

        <Route
          path="/wine-guide"
          element={<WineGuide />}
        />

        <Route
          path="/wine-guide/:slug"
          element={<WineGuideArticle />}
        />

        <Route path="/contact" element={<Contact />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        
      </Routes>

      {/* =========================================================
          GLOBAL FOOTER
      ========================================================= */}

      <Footer />
    </BrowserRouter>
  );
}

export default App;