import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CheckoutProvider } from "./context/CheckoutContext.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <ToastProvider>
        <WishlistProvider>
          <AuthProvider>
            <CartProvider>
              <CheckoutProvider>
                <OrderProvider>
                  <RouterProvider
                    router={createBrowserRouter(
                      [
                        {
                          path: "/*",
                          element: <App />,
                        },
                      ],
                      { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
                    )}
                  />
                </OrderProvider>
              </CheckoutProvider>
            </CartProvider>
          </AuthProvider>
        </WishlistProvider>
      </ToastProvider>
  </React.StrictMode>
);
