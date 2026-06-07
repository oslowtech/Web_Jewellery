import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageLoader from "../components/common/PageLoader.jsx";
import { RequireAdmin, RequireAuth } from "./RouteGuards.jsx";

const Home = lazy(() => import("../pages/Home.jsx"));
const Shop = lazy(() => import("../pages/Shop.jsx"));
const ProductDetail = lazy(() => import("../pages/ProductDetail.jsx"));
const CartPage = lazy(() => import("../pages/Cart.jsx"));
const WishlistPage = lazy(() => import("../pages/Wishlist.jsx"));
const ProfilePage = lazy(() => import("../pages/Profile.jsx"));
const LoginPage = lazy(() => import("../pages/Login.jsx"));
const SignupPage = lazy(() => import("../pages/Signup.jsx"));
const AdminPage = lazy(() => import("../pages/Admin.jsx"));
const AddressManagerPage = lazy(() => import("../pages/AddressManager.jsx"));
const CheckoutPage = lazy(() => import("../pages/Checkout.jsx"));
const OrderConfirmationPage = lazy(() => import("../pages/OrderConfirmation.jsx"));
const OrderHistoryPage = lazy(() => import("../pages/OrderHistory.jsx"));
const AdminOrdersPage = lazy(() => import("../pages/AdminOrders.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPassword.jsx"));
const UpdatePasswordPage = lazy(() => import("../pages/UpdatePassword.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35 }}
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/shop"
            element={
              <PageTransition>
                <Shop />
              </PageTransition>
            }
          />
          <Route
            path="/product/:slug"
            element={
              <PageTransition>
                <ProductDetail />
              </PageTransition>
            }
          />
          <Route
            path="/cart"
            element={
              <PageTransition>
                <CartPage />
              </PageTransition>
            }
          />
          <Route
            path="/wishlist"
            element={
              <PageTransition>
                <WishlistPage />
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <PageTransition>
                  <ProfilePage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <PageTransition>
                  <AdminPage />
                </PageTransition>
              </RequireAdmin>
            }
          />
          <Route
            path="/addresses"
            element={
              <RequireAuth>
                <PageTransition>
                  <AddressManagerPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <PageTransition>
                  <CheckoutPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <PageTransition>
                  <OrderHistoryPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <RequireAuth>
                <PageTransition>
                  <OrderConfirmationPage />
                </PageTransition>
              </RequireAuth>
            }
          />
          <Route
            path="/admin-orders"
            element={
              <RequireAdmin>
                <PageTransition>
                  <AdminOrdersPage />
                </PageTransition>
              </RequireAdmin>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginPage />
              </PageTransition>
            }
          />
          <Route
            path="/signup"
            element={
              <PageTransition>
                <SignupPage />
              </PageTransition>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PageTransition>
                <ForgotPasswordPage />
              </PageTransition>
            }
          />
          <Route
            path="/update-password"
            element={
              <PageTransition>
                <UpdatePasswordPage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

export default AppRoutes;
