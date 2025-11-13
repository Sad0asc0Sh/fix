import { Card, Alert } from 'antd'

function ProductVariants() {
  return (
    <div>
      <h1>ProductVariants</h1>
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

export default ProductVariants
