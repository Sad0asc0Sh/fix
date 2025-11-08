"use client"; // ۱. تبدیل به کامپوننت کلاینت (بسیار مهم)

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api"; // ۲. وارد کردن apiClient (که توکن را از localStorage می‌خواند)
import { enToFaNum } from '@/utils/Utilities'; // (مطمئن شوید نام تابع درست است)

/**
 * تابع fetcher برای react-query
 * این تابع از apiClient استفاده می‌کند که به طور خودکار
 * /proxy-api را اضافه کرده و هدر Authorization را از localStorage می‌خواند.
 */
const fetchOrders = async () => {
  const { data } = await apiClient.get('/admin/orders'); // مسیر درست API بک‌اند

  if (!Array.isArray(data?.data)) {
     console.error("داده دریافتی آرایه نیست:", data);
     throw new Error('ساختار داده‌های دریافتی از سرور معتبر نیست.');
  }
  return data.data; 
};

// کامپوننت اصلی (اکنون به عنوان کلاینت کامپوننت)
export default function Orders() {
  
  // ۳. استفاده از useQuery برای گرفتن اطلاعات در سمت کلاینت
  const { 
    data: ordersData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['admin-orders'], // کلید برای کش کردن اطلاعات
    queryFn: fetchOrders,
    retry: false, // جلوگیری از تلاش مجدد در خطای 401
  });

  // ۴. مدیریت حالت بارگذاری
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>در حال بارگذاری سفارشات...</p>
      </div>
    );
  }

  // ۵. مدیریت حالت خطا
  if (isError) {
    // (interceptor در api.ts باید در خطای 401 به /login هدایت کند)
    return (
      <div style={{ padding: '2rem', color: 'red', textAlign: 'right' }}>
        <h1>خطا در بارگذاری سفارشات</h1>
        <p>{error?.message || 'یک خطای ناشناخته رخ داد.'}</p>
      </div>
    );
  }

  // ۶. نمایش جدول اگر همه چیز موفقیت‌آمیز بود
  return (
    <table>
      <thead>
        <tr>
          <th>نام کاربر</th>
          <th>ایمیل/تلفن</th>
          <th>شهر/کدپستی</th>
          <th>جمع کل</th>
          <th>وضعیت</th>
          <th>تاریخ</th>
          <th>محصولات (تعداد)</th>
        </tr>
      </thead>
      <tbody>
        {ordersData && ordersData.length > 0 ? (
          ordersData.map((order) => (
            <tr key={order._id}>
              <td>{order.shippingAddress?.fullName || 'نامشخص'}</td>
              <td>{order.shippingAddress?.email || order.shippingAddress?.phone || 'نامشخص'}</td>
              <td>{order.shippingAddress?.city}-{order.shippingAddress?.postalCode}</td>
              {/* اطمینان از وجود تابع قبل از فراخوانی */}
              <td>{typeof enToFaNum === 'function' ? enToFaNum(order.totalPrice) : order.totalPrice} تومان</td>
              <td>{order.statusPersian || order.status}</td>
              <td>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td>
              <td>
                {order.orderItems?.map(item => (
                  <span key={item.product}>
                    {item.name} ({typeof enToFaNum === 'function' ? enToFaNum(item.qty) : item.qty})،{' '}
                  </span>
                )) || 'موردی نیست'}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>
              سفارشی یافت نشد.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}