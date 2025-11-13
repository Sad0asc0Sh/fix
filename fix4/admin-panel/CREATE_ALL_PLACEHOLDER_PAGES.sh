#!/bin/bash

cd /home/claude/admin-panel/src/pages

# Placeholder template
create_placeholder() {
  local file=$1
  local title=$2
  
  cat > "$file" << EOF
import { Card, Alert } from 'antd'

function ${title//.jsx/}() {
  return (
    <div>
      <h1>$title</h1>
      <Card>
        <Alert
          message="این صفحه در حال توسعه است"
          description="لطفاً با استفاده از مستندات و نمونه کدها، این صفحه را تکمیل کنید."
          type="info"
          showIcon
        />
        <div style={{ marginTop: 24, padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
          <h3>راهنمای پیاده‌سازی:</h3>
          <p>1. از داده‌های mock در <code>/src/data/mockData.js</code> استفاده کنید</p>
          <p>2. از کامپوننت‌های Ant Design استفاده کنید</p>
          <p>3. مستندات کامل در فایل COMPLETE_ADMIN_GUIDE.md موجود است</p>
        </div>
      </Card>
    </div>
  )
}

export default ${title//.jsx/}
EOF
}

# Products
create_placeholder "products/ProductForm.jsx" "ProductForm"
create_placeholder "products/ProductVariants.jsx" "ProductVariants"
create_placeholder "products/CategoriesPage.jsx" "CategoriesPage"
create_placeholder "products/BrandsPage.jsx" "BrandsPage"
create_placeholder "products/InventoryPage.jsx" "InventoryPage"

# Orders
create_placeholder "orders/OrdersList.jsx" "OrdersList"
create_placeholder "orders/OrderDetail.jsx" "OrderDetail"
create_placeholder "orders/RMAPage.jsx" "RMAPage"
create_placeholder "orders/AbandonedCartsPage.jsx" "AbandonedCartsPage"

# Customers
create_placeholder "customers/CustomersList.jsx" "CustomersList"
create_placeholder "customers/CustomerProfile.jsx" "CustomerProfile"

# Finance
create_placeholder "finance/CouponsPage.jsx" "CouponsPage"
create_placeholder "finance/ShippingPage.jsx" "ShippingPage"

# Content
create_placeholder "content/PagesManagement.jsx" "PagesManagement"
create_placeholder "content/BlogPosts.jsx" "BlogPosts"
create_placeholder "content/BannersPage.jsx" "BannersPage"

# Tickets
create_placeholder "tickets/TicketsList.jsx" "TicketsList"
create_placeholder "tickets/TicketDetail.jsx" "TicketDetail"

# Reports
create_placeholder "reports/SalesReports.jsx" "SalesReports"
create_placeholder "reports/ProductsReports.jsx" "ProductsReports"
create_placeholder "reports/CustomersReports.jsx" "CustomersReports"

# Settings
create_placeholder "settings/SettingsPage.jsx" "SettingsPage"

# Admins
create_placeholder "admins/AdminsPage.jsx" "AdminsPage"

echo "✅ همه placeholder صفحات ایجاد شد!"

