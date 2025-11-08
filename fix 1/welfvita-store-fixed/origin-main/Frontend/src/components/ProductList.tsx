// src/components/ProductList.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';

// برای امنیت و خوانایی بیشتر، یک نوع (type) برای محصول تعریف می‌کنیم
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  // می‌توانی بقیه فیلدها را هم اینجا اضافه کنی
}

// نوع پاسخ دریافتی از API
interface ApiResponse {
  success: boolean;
  message: string;
  data: Product[];
}

// تابعی برای گرفتن داده‌ها از API
const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('http://localhost:5000/api/products');
  
  if (!response.ok) {
    throw new Error(`خطا در شبکه: ${response.status}`);
  }

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'داده‌ای از سرور دریافت نشد.');
  }
  
  return result.data;
};

const ProductList: React.FC = () => {
  // استفاده از هوک useQuery برای مدیریت وضعیت‌های مختلف
  const { data: products, isLoading, error } = useQuery<Product[], Error>({
    queryKey: ['products'], // یک کلید منحصر به فرد برای این کوئری
    queryFn: fetchProducts, // تابعی که داده‌ها را می‌گیرد
    // staleTime: 5 * 60 * 1000, // اختیاری: داده‌ها به مدت ۵ دقیقه تازه در نظر گرفته می‌شوند
  });

  // نمایش پیام در حین بارگذاری (React Query این وضعیت را مدیریت می‌کند)
  if (isLoading) {
    return <div>در حال بارگذاری محصولات...</div>;
  }

  // نمایش پیام در صورت بروز خطا (React Query این وضعیت را مدیریت می‌کند)
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center' }}>خطا در بارگذاری: {error.message}</div>;
  }

  // نمایش لیست محصولات
  return (
    <div style={{ padding: '20px' }}>
      <h1>لیست محصولات</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products?.map(product => (
          <div key={product._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <img 
              src={product.images && product.images.length > 0 
                ? `http://localhost:5000/${product.images[0]}` 
                : 'https://via.placeholder.com/250x150?text=No+Image'} 
              alt={product.name} 
              style={{ maxWidth: '100%', height: '150px', objectFit: 'contain' }} 
            />
            <h3>{product.name}</h3>
            <p>قیمت: {product.price.toLocaleString('fa-IR')} تومان</p>
            {/* می‌توانی از لینک React Router برای مسیریابی استفاده کنی */}
            {/* <Link to={`/product/${product.slug}`}>مشاهده محصول</Link> */}
            <a href={`/product/${product.slug}`}>مشاهده محصول</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;