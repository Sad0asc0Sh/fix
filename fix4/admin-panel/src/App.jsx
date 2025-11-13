import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'

// صفحات - Import lazy برای بهینه‌سازی
import Dashboard from './pages/Dashboard'
import ProductsList from './pages/products/ProductsList'
import ProductForm from './pages/products/ProductForm'
import ProductVariants from './pages/products/ProductVariants'
import CategoriesPage from './pages/products/CategoriesPage'
import BrandsPage from './pages/products/BrandsPage'
import InventoryPage from './pages/products/InventoryPage'

import OrdersList from './pages/orders/OrdersList'
import OrderDetail from './pages/orders/OrderDetail'
import RMAPage from './pages/orders/RMAPage'
import AbandonedCartsPage from './pages/orders/AbandonedCartsPage'

import CustomersList from './pages/customers/CustomersList'
import CustomerProfile from './pages/customers/CustomerProfile'

import CouponsPage from './pages/finance/CouponsPage'
import ShippingPage from './pages/finance/ShippingPage'

import PagesManagement from './pages/content/PagesManagement'
import BlogPosts from './pages/content/BlogPosts'
import BannersPage from './pages/content/BannersPage'

import TicketsList from './pages/tickets/TicketsList'
import TicketDetail from './pages/tickets/TicketDetail'

import SettingsPage from './pages/settings/SettingsPage'

import SalesReports from './pages/reports/SalesReports'
import ProductsReports from './pages/reports/ProductsReports'
import CustomersReports from './pages/reports/CustomersReports'

import AdminsPage from './pages/admins/AdminsPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Login */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Routes>
                {/* داشبورد */}
                <Route path="/" element={<Dashboard />} />

                {/* محصولات */}
                <Route path="/products" element={<ProductsList />} />
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/edit/:id" element={<ProductForm />} />
                <Route path="/products/:id/variants" element={<ProductVariants />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/brands" element={<BrandsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />

                {/* سفارشات */}
                <Route path="/orders" element={<OrdersList />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/rma" element={<RMAPage />} />
                <Route path="/abandoned-carts" element={<AbandonedCartsPage />} />

                {/* مشتریان */}
                <Route path="/customers" element={<CustomersList />} />
                <Route path="/customers/:id" element={<CustomerProfile />} />

                {/* مالی */}
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/shipping" element={<ShippingPage />} />

                {/* محتوا */}
                <Route path="/pages" element={<PagesManagement />} />
                <Route path="/blog/posts" element={<BlogPosts />} />
                <Route path="/banners" element={<BannersPage />} />

                {/* تیکت‌ها */}
                <Route path="/tickets" element={<TicketsList />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />

                {/* تنظیمات */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* گزارشات */}
                <Route path="/reports/sales" element={<SalesReports />} />
                <Route path="/reports/products" element={<ProductsReports />} />
                <Route path="/reports/customers" element={<CustomersReports />} />

                {/* ادمین‌ها */}
                <Route path="/admins" element={<AdminsPage />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

export default App
