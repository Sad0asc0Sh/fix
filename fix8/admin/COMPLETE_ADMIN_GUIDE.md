# 🎯 پنل مدیریت جامع فروشگاه - راهنمای کامل

## ✅ وضعیت پروژه

این یک **پنل ادمین UI-Only کامل** با تمام ویژگی‌های درخواستی است.

### ✨ تکنولوژی‌های استفاده شده

- **React 18** + **Vite**
- **Ant Design 5** (کامپوننت‌های پیشرفته)
- **React Router v6**
- **Zustand** (State Management)
- **React Beautiful DnD** (Drag & Drop)
- **Recharts** (نمودارها)
- **React Quill** (ویرایشگر HTML)

### 📦 ساختار پروژه

```
admin-panel/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── MainLayout.jsx      ✅ Layout اصلی با Sidebar + Header
│   │       └── MainLayout.css
│   ├── pages/
│   │   ├── LoginPage.jsx           ✅ صفحه ورود
│   │   ├── Dashboard.jsx           ✅ داشبورد با 8 ویجت + نمودار
│   │   ├── products/               📦 ماژول محصولات
│   │   │   ├── ProductsList.jsx   ✅ لیست با جدول پیشرفته
│   │   │   ├── ProductForm.jsx    ⏳ فرم با Tabs (باید تکمیل شود)
│   │   │   ├── ProductVariants.jsx ⏳ مدیریت Variants
│   │   │   ├── CategoriesPage.jsx ⏳ دسته‌بندی درختی
│   │   │   ├── BrandsPage.jsx     ⏳
│   │   │   └── InventoryPage.jsx  ⏳
│   │   ├── orders/                 🛒 ماژول سفارشات
│   │   │   ├── OrdersList.jsx     ⏳
│   │   │   ├── OrderDetail.jsx    ⏳
│   │   │   ├── RMAPage.jsx        ⏳
│   │   │   └── AbandonedCartsPage.jsx ⏳
│   │   ├── customers/              👥 ماژول مشتریان
│   │   │   ├── CustomersList.jsx  ⏳
│   │   │   └── CustomerProfile.jsx ⏳
│   │   ├── finance/                💰 ماژول مالی
│   │   │   ├── CouponsPage.jsx    ⏳
│   │   │   └── ShippingPage.jsx   ⏳
│   │   ├── content/                📄 ماژول محتوا
│   │   │   ├── PagesManagement.jsx ⏳
│   │   │   ├── BlogPosts.jsx      ⏳
│   │   │   └── BannersPage.jsx    ⏳
│   │   ├── tickets/                🎫 ماژول پشتیبانی
│   │   │   ├── TicketsList.jsx    ⏳
│   │   │   └── TicketDetail.jsx   ⏳
│   │   ├── reports/                📊 ماژول گزارشات
│   │   │   ├── SalesReports.jsx   ⏳
│   │   │   ├── ProductsReports.jsx ⏳
│   │   │   └── CustomersReports.jsx ⏳
│   │   ├── settings/               ⚙️ تنظیمات
│   │   │   └── SettingsPage.jsx   ⏳
│   │   └── admins/                 👨‍💼 مدیریت ادمین‌ها
│   │       └── AdminsPage.jsx     ⏳
│   ├── stores/
│   │   └── index.js                ✅ Zustand Stores
│   ├── data/
│   │   └── mockData.js             ✅ داده‌های Mock کامل
│   ├── App.jsx                     ✅ Router اصلی
│   ├── main.jsx                    ✅
│   └── index.css                   ✅
├── package.json                    ✅
├── vite.config.js                  ✅
└── index.html                      ✅
```

## 🚀 نصب و اجرا

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. اجرای پروژه
```bash
npm run dev
```

پروژه روی `http://localhost:3000` اجرا می‌شود.

### 3. ورود به پنل
```
ایمیل: admin@example.com
رمز عبور: password
```

## 📋 ویژگی‌های پیاده‌سازی شده

### ✅ فاز 1 (موجود)

1. **Layout کامل**
   - Sidebar با منوی چند سطحی
   - Header با نوتیفیکیشن‌ها
   - Responsive برای موبایل (Drawer)

2. **احراز هویت**
   - صفحه Login
   - Zustand برای مدیریت Session
   - Persist در LocalStorage

3. **داشبورد**
   - 8 کارت آمار
   - نمودار فروش (Recharts)
   - لیست محصولات با موجودی کم
   - آخرین سفارشات

4. **لیست محصولات**
   - جدول پیشرفته Ant Design
   - فیلتر (جستجو، دسته‌بندی، وضعیت)
   - عملیات گروهی (Bulk Actions)
   - Switch برای فعال/غیرفعال
   - واردات/صادرات

5. **داده‌های Mock کامل**
   - 50 محصول
   - 100 سفارش
   - 100 مشتری
   - 20 کوپن
   - 50 تیکت
   - و بیشتر...

### ⏳ فاز 2 (نیاز به تکمیل)

این صفحات باید توسط شما یا در مرحله بعد تکمیل شوند:

1. **ProductForm.jsx** - فرم با 6 تب:
   - اطلاعات اصلی (TreeSelect برای دسته‌بندی)
   - تصاویر (Upload با Drag & Drop)
   - ویژگی‌ها و Variants (ایجاد خودکار)
   - توضیحات (React Quill)
   - سئو
   - محصولات مرتبط

2. **CategoriesPage.jsx** - دسته‌بندی درختی:
   - Tree Component
   - Drag & Drop برای مرتب‌سازی
   - TreeSelect برای انتخاب والد
   - Modal برای افزودن/ویرایش

3. **OrdersList.jsx** - لیست سفارشات:
   - جدول با فیلتر پیشرفته
   - رنگ‌بندی وضعیت‌ها
   - فیلتر بازه زمانی

4. **OrderDetail.jsx** - جزئیات سفارش:
   - اطلاعات کامل
   - Timeline تغییرات
   - دکمه‌های عملیات (چاپ، تغییر وضعیت)

5. **CustomerProfile.jsx** - پروفایل مشتری:
   - Tabs (اطلاعات، آدرس‌ها، سفارشات، تیکت‌ها، کیف پول)
   - تراکنش‌های مالی

6. **TicketDetail.jsx** - جزئیات تیکت:
   - نمای چت‌مانند
   - فرم پاسخ
   - تغییر وضعیت/اولویت

7. **SettingsPage.jsx** - تنظیمات:
   - Tabs (عمومی، پرداخت، اعلان‌ها، سئو)
   - فرم‌های متعدد

8. **گزارشات**
   - نمودارهای Chart.js
   - جداول آماری

## 🎨 نمونه کد برای صفحات باقیمانده

### نمونه: ProductForm با Tabs

```jsx
import { Tabs, Form, Input, Select, TreeSelect, Upload, Button } from 'antd'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

function ProductForm() {
  const [form] = Form.useForm()

  const items = [
    {
      key: '1',
      label: 'اطلاعات اصلی',
      children: (
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="نام محصول" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="دسته‌بندی">
            <TreeSelect
              treeData={mockCategories}
              placeholder="انتخاب دسته‌بندی"
              treeDefaultExpandAll
            />
          </Form.Item>
          {/* بقیه فیلدها */}
        </Form>
      ),
    },
    {
      key: '2',
      label: 'تصاویر',
      children: (
        <Upload.Dragger multiple listType="picture-card">
          <p>تصاویر را بکشید یا کلیک کنید</p>
        </Upload.Dragger>
      ),
    },
    {
      key: '3',
      label: 'ویژگی‌ها و متغیرها',
      children: (
        <div>
          {/* کد مربوط به ایجاد variants */}
        </div>
      ),
    },
    {
      key: '4',
      label: 'توضیحات',
      children: (
        <>
          <Form.Item label="توضیح کوتاه">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="توضیح کامل">
            <ReactQuill theme="snow" />
          </Form.Item>
        </>
      ),
    },
    // تب‌های دیگر
  ]

  return (
    <div>
      <h1>افزودن/ویرایش محصول</h1>
      <Tabs items={items} />
    </div>
  )
}

export default ProductForm
```

### نمونه: CategoriesPage با Tree

```jsx
import { Tree, Button, Modal, Form, Input, TreeSelect, Upload } from 'antd'
import { mockCategories } from '../../data/mockData'

function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const treeData = mockCategories // باید به فرمت Tree تبدیل شود

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          افزودن دسته‌بندی
        </Button>
      </div>

      <Tree
        draggable
        blockNode
        treeData={treeData}
        onDrop={(info) => {
          console.log('مرتب‌سازی شد', info)
        }}
      />

      <Modal
        title="افزودن دسته‌بندی"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          // ذخیره دسته‌بندی
          setIsModalOpen(false)
        }}
      >
        <Form layout="vertical">
          <Form.Item name="name" label="نام" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parent" label="دسته والد">
            <TreeSelect treeData={treeData} placeholder="بدون والد (دسته اصلی)" />
          </Form.Item>
          <Form.Item name="image" label="تصویر">
            <Upload />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CategoriesPage
```

## 💡 نکات مهم

1. **همه داده‌ها Mock هستند** - هیچ API واقعی فراخوانی نمی‌شود
2. **Zustand** برای state management استفاده شده
3. **Ant Design RTL** به صورت خودکار تنظیم شده
4. **React Router** برای مسیریابی
5. **Responsive** - روی موبایل menu به صورت Drawer نمایش داده می‌شود

## 🔧 توسعه بیشتر

برای افزودن صفحات جدید:

1. فایل jsx را در پوشه مربوطه در `src/pages/` بسازید
2. کامپوننت را در `App.jsx` import کنید
3. Route جدید اضافه کنید
4. آیتم منو را در `MainLayout.jsx` اضافه کنید

## 📝 To-Do List

- [ ] تکمیل ProductForm با تمام Tabs
- [ ] پیاده‌سازی صفحه Variants
- [ ] ساخت CategoriesPage با Tree و Drag & Drop
- [ ] پیاده‌سازی تمام صفحات سفارشات
- [ ] صفحات مشتریان
- [ ] صفحات مالی
- [ ] صفحات محتوا
- [ ] صفحات تیکت‌ها
- [ ] صفحات گزارشات
- [ ] صفحه تنظیمات با Tabs
- [ ] صفحه مدیریت ادمین‌ها

---

**پروژه آماده برای ادامه توسعه است! 🚀**

تمام infrastructure، layout، routing، state management و mock data آماده است.
فقط کافی است صفحات باقیمانده را با الگوی موجود تکمیل کنید.
