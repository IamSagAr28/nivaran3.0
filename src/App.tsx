import React, { Suspense } from 'react';
import { Router, Route } from './utils/Router.jsx';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ShopCartProvider } from './contexts/ShopCartContext';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthForm } from "./components/AuthForm";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import HomePage from "./components/HomePage";
import NotFoundPage from "./components/NotFoundPage";
import ProductPage from "./components/ProductPage";
import CartPage from "./components/CartPage";
import ShopCartPage from "./components/shop/ShopCartPage";
import BlogPostPage from "./components/BlogPostPage";
import "./admin/styles/admin.css";
import { initCacheCleanup } from "./shopify/cache";

// Initialize cache cleanup
initCacheCleanup();

// Lazy load components to improve initial load time
const Dashboard = React.lazy(() => import('./components/DashboardV2'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const PrivacyPage = React.lazy(() => import('./components/PrivacyPage'));
const TermsPage = React.lazy(() => import('./components/TermsPage'));
const ShippingPage = React.lazy(() => import('./components/ShippingPage'));
const ShopPage = React.lazy(() => import('./components/shop/ShopPage'));
const ProductDetailPage = React.lazy(() => import('./components/shop/ProductDetailPage'));

// Admin Pages - Lazy loaded
const AdminDashboard = React.lazy(() => import('./admin/pages/AdminDashboard'));
const ProductsAdmin = React.lazy(() => import('./admin/pages/ProductsAdmin'));
const OrdersAdmin = React.lazy(() => import('./admin/pages/OrdersAdmin'));
const UsersAdmin = React.lazy(() => import('./admin/pages/UsersAdmin'));
const AnalyticsAdmin = React.lazy(() => import('./admin/pages/AnalyticsAdmin'));
const AdminLogin = React.lazy(() => import('./admin/pages/AdminLogin'));
const HeroSlidesAdmin = React.lazy(() => import('./admin/pages/HeroSlidesAdmin'));
const MembershipAdmin = React.lazy(() => import('./admin/pages/MembershipAdmin'));
const BlogsAdmin = React.lazy(() => import('./admin/pages/BlogsAdmin'));
const NewsletterAdmin = React.lazy(() => import('./admin/pages/NewsletterAdmin'));

export default function App() {
  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminSession");
    window.location.href = "/admin-login";
  };

  return (
    <AuthProvider>
      <CartProvider>
        <ShopCartProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Router fallback={<NotFoundPage />}>
            {/* Main Website Routes */}
            <Route path="/" component={HomePage} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/products" component={ShopPage} />
            <Route path="/product/:id" component={ProductDetailPage} />
            <Route path="/blogs/:blogHandle/:articleHandle" component={BlogPostPage} />
            <Route path="/cart" component={ShopCartPage} />
            <Route path="/shop-cart" component={ShopCartPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/shipping" component={ShippingPage} />

            {/* Admin Routes */}
            <Route path="/admin-login" component={AdminLogin} />
            <Route
              path="/admin"
              component={() => <AdminDashboard onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/products"
              component={() => <ProductsAdmin onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/orders"
              component={() => <OrdersAdmin onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/users"
              component={() => <UsersAdmin onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/analytics"
              component={() => <AnalyticsAdmin onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/hero-slides"
              component={() => <HeroSlidesAdmin onLogout={handleAdminLogout} />}
            />
            <Route
              path="/admin/memberships"
              component={() => <MembershipAdmin onLogout={handleAdminLogout} />}
            />
             <Route
               path="/admin/blogs"
               component={() => <BlogsAdmin onLogout={handleAdminLogout} />}
             />
             <Route
               path="/admin/newsletter"
               component={() => <NewsletterAdmin onLogout={handleAdminLogout} />}
             />
          </Router>
          </Suspense>
        </ShopCartProvider>
      </CartProvider>
    </AuthProvider>
  );
}
