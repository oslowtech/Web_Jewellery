import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import BottomNav from "./components/layout/BottomNav.jsx";
import WhatsAppButton from "./components/common/WhatsAppButton.jsx";
import CartDrawer from "./components/cart/CartDrawer.jsx";
import ToastHost from "./components/common/ToastHost.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { Analytics } from "@vercel/analytics/react";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};

const App = () => {
  return (
    <div className="min-h-screen bg-cream text-onyx">
      <ScrollToTop />
      <Navbar />
      <main className="pb-20 pt-16">
        <AppRoutes />
      </main>
      <BottomNav />
      <WhatsAppButton />
      <CartDrawer />
      <ToastHost />
      <Analytics />
    </div>
  );
};

export default App;
