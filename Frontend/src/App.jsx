import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import { useAuth, useInitializeAuth } from './features/auth/hooks/useAuth'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import CartPage from './features/cart/pages/CartPage'
import CheckoutPage from './features/order/pages/CheckoutPage'
import MyOrdersPage from './features/order/pages/MyOrdersPage'
import OrderDetailsPage from './features/order/pages/OrderDetailsPage'
import CreateProductPage from './features/product/pages/CreateProductPage'
import ProductDetailsPage from './features/product/pages/ProductDetailsPage'
import ProductListingPage from './features/product/pages/ProductListingPage'
import SellerProductsPage from './features/product/pages/SellerProductsPage'
import './styles/index.css'

function AppLayout() {
  return (
    <div className="appShell">
      <Navbar />
      <main className="pageShell">
        <Outlet />
      </main>
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

export default function App() {
  useInitializeAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
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
                <SellerProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products/new"
            element={
              <ProtectedRoute roles={['seller']}>
                <CreateProductPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
