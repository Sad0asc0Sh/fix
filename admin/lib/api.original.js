import axios from "axios";

const apiClient = axios.create({
  // آدرس کامل سرور بکند Node.js خود را وارد کنید
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- توابع مربوط به محصولات ---

/**
 * دریافت لیست تمام محصولات
 * @returns {Promise<Array>} لیستی از محصولات
 */
export const getProducts = async () => {
  const { data } = await apiClient.get("/products");
  return data.data; // FIX: API wraps response in 'data' property
};

/**
 * افزودن محصول جدید
 * @param {FormData} formData - اطلاعات محصول شامل تصاویر
 * @returns {Promise<Object>} محصول اضافه شده
 */
export const addProduct = async (formData) => {
  const { data } = await apiClient.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * دریافت اطلاعات یک محصول خاص
 * @param {string} id - شناسه محصول
 * @returns {Promise<Object>} اطلاعات محصول
 */
export const getProductById = async (id) => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data; // FIX: API wraps response in 'data' property
};

/**
 * به‌روزرسانی محصول
 * @param {{id: string, formData: FormData}} {id, formData} - شناسه محصول و اطلاعات جدید
 * @returns {Promise<Object>} محصول به‌روز شده
 */
export const updateProduct = async ({ id, formData }) => {
  const { data } = await apiClient.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

/**
 * حذف یک محصول
 * @param {string} id - شناسه محصول
 * @returns {Promise<Object>} پیام موفقیت
 */
export const deleteProduct = async (id) => {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data;
};

/**
 * لاگین کاربر ادمین
 * @param {object} credentials - { email, password }
 * @returns {Promise<Object>} پاسخ شامل توکن
 */
export const adminLogin = async (credentials) => {
  const { data } = await apiClient.post("/auth/admin/login", credentials);
  return data;
};


// --- توابع مربوط به دسته‌بندی‌ها ---

/**
 * دریافت لیست تمام دسته‌بندی‌ها
 * @returns {Promise<Array>} لیستی از دسته‌بندی‌ها
 */
export const getCategories = async () => {
  const { data } = await apiClient.get("/categories");
  return data.data; // FIX: API wraps response in 'data' property
};



export default apiClient;
