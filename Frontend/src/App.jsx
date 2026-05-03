import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import AiBuddyChat from './features/ai-buddy/components/AiBuddyChat'
import { useAuth, useInitializeAuth } from './features/auth/hooks/useAuth'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import SellerAccessPage from './features/auth/pages/SellerAccessPage'
import SellerRegisterPage from './features/auth/pages/SellerRegisterPage'
import CartPage from './features/cart/pages/CartPage'
import CheckoutPage from './features/order/pages/CheckoutPage'
import MyOrdersPage from './features/order/pages/MyOrdersPage'
import OrderDetailsPage from './features/order/pages/OrderDetailsPage'
import ProductDetailsPage from './features/product/pages/ProductDetailsPage'
import ProductListingPage from './features/product/pages/ProductListingPage'
import StorefrontHomePage from './features/product/pages/StorefrontHomePage'
import SellerCreateProductPage from './features/seller/pages/SellerCreateProductPage'
import SellerDashboardPage from './features/seller/pages/SellerDashboardPage'
import SellerEditProductPage from './features/seller/pages/SellerEditProductPage'
import './lib/local-toastify/styles.css'
import './styles/index.css'

function AppLayout() {
  return (
    <div className="appShell">
      <Navbar />
      <main className="pageShell">
        <Outlet />
      </main>
      <Footer />
      <AiBuddyChat />
      <ToastContainer position="top-right" autoClose={2500} newestOnTop pauseOnFocusLoss={false} />
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { authChecked, isAuthenticated, role } = useAuth()

  if (!authChecked) {
    return <div className="pageState">Checking your session...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/products" replace />
  }

  return children
}

function GuestOnlyRoute({ children }) {
  const { authChecked, isAuthenticated } = useAuth()

  if (!authChecked) {
    return <div className="pageState">Preparing storefront...</div>
  }

  return isAuthenticated ? <Navigate to="/products" replace /> : children
}

function SellerOnboardingRoute({ children }) {
  const { authChecked, isAuthenticated, role } = useAuth()

  if (!authChecked) {
    return <div className="pageState">Preparing seller access...</div>
  }

  if (isAuthenticated && role === 'seller') {
    return <Navigate to="/seller/products" replace />
  }

  return children
}

export default function App() {
  useInitializeAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<StorefrontHomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route
            path="/auth/login"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/seller/access"
            element={
              <SellerOnboardingRoute>
                <SellerAccessPage />
              </SellerOnboardingRoute>
            }
          />
          <Route
            path="/seller/auth/register"
            element={
              <SellerOnboardingRoute>
                <SellerRegisterPage />
              </SellerOnboardingRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute roles={['user']}>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute roles={['user']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={['user']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute roles={['user']}>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <ProtectedRoute roles={['seller']}>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/new"
            element={
              <ProtectedRoute roles={['seller']}>
                <SellerCreateProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/:productId/edit"
            element={
              <ProtectedRoute roles={['seller']}>
                <SellerEditProductPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
