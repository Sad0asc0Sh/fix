import axios from "axios";
import { getToken, clearAuthData } from "@/utils/auth";

const apiClient = axios.create({
  // استفاده از proxy تنظیم شده در next.config.mjs
  baseURL: '/proxy-api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // برای ارسال کوکی‌ها
});

// Add request interceptor to include auth token if exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- توابع مربوط به محصولات ---

/**
 * دریافت لیست تمام محصولات
 * @returns {Promise<Array>} لیستی از محصولات
 */
export const getProducts = async () => {
  const { data } = await apiClient.get("/products");
  return data.data; // API wraps response in 'data' property
};

/**
 * Admin: fetch all products (uses /v1/admin)
 */
export const getAdminProducts = async (params = {}) => {
  const { data } = await apiClient.get("/v1/admin/products", { params });
  return data.data;
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
 * Admin: create product with images (uses /v1/admin)
 */
export const addAdminProduct = async (formData) => {
  const { data } = await apiClient.post("/v1/admin/products", formData, {
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
  return data.data; // API wraps response in 'data' property
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
 * Admin: delete product (uses /v1/admin)
 */
export const deleteAdminProduct = async (id) => {
  const { data } = await apiClient.delete(`/v1/admin/products/${id}`);
  return data;
};

/**
 * لاگین کاربر ادمین
 * @param {object} credentials - { email, password }
 * @returns {Promise<Object>} پاسخ شامل توکن
 */
export const adminLogin = async (credentials) => {
  // استفاده از همان endpoint عادی login
  const { data } = await apiClient.post("/auth/admin/login", credentials);
  
  // Backend returns accessToken, not token
  if (data.accessToken) {
    // Store in both locations for compatibility
    localStorage.setItem('adminToken', data.accessToken);
    localStorage.setItem('admin-token', data.accessToken);
    
    // Also store user info if needed
    if (data.data?.user) {
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
    }
  }
  
  return data;
};

/**
 * لاگ‌آوت ادمین
 * @returns {Promise<Object>} پیام موفقیت
 */
export const adminLogout = async () => {
  try {
    const { data } = await apiClient.post("/auth/logout");
    localStorage.removeItem('adminToken');
    return data;
  } catch (error) {
    localStorage.removeItem('adminToken');
    throw error;
  }
};

/**
 * دریافت اطلاعات پروفایل ادمین
 * @returns {Promise<Object>} اطلاعات کاربر
 */
export const getAdminProfile = async () => {
  const { data } = await apiClient.get("/auth/profile");
  return data.data;
};

// --- توابع مربوط به دسته‌بندی‌ها ---

/**
 * دریافت لیست تمام دسته‌بندی‌ها
 * @returns {Promise<Array>} لیستی از دسته‌بندی‌ها
 */
export const getCategories = async () => {
  const { data } = await apiClient.get("/categories");
  return data.data; // API wraps response in 'data' property
};

/**
 * افزودن دسته‌بندی جدید
 * @param {object} categoryData - اطلاعات دسته‌بندی
 * @returns {Promise<Object>} دسته‌بندی اضافه شده
 */
export const addCategory = async (categoryData) => {
  const { data } = await apiClient.post("/categories", categoryData);
  return data;
};

/**
 * به‌روزرسانی دسته‌بندی
 * @param {string} id - شناسه دسته‌بندی
 * @param {object} categoryData - اطلاعات جدید
 * @returns {Promise<Object>} دسته‌بندی به‌روز شده
 */
export const updateCategory = async (id, categoryData) => {
  const { data } = await apiClient.put(`/categories/${id}`, categoryData);
  return data;
};

/**
 * حذف دسته‌بندی
 * @param {string} id - شناسه دسته‌بندی
 * @returns {Promise<Object>} پیام موفقیت
 */
export const deleteCategory = async (id) => {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
};

// --- توابع مربوط به سفارشات ---

/**
 * دریافت لیست سفارشات
 * @param {object} params - پارامترهای query
 * @returns {Promise<Array>} لیستی از سفارشات
 */
export const getOrders = async (params = {}) => {
  const { data } = await apiClient.get("/orders", { params });
  return data.data;
};

/**
 * دریافت یک سفارش خاص
 * @param {string} id - شناسه سفارش
 * @returns {Promise<Object>} اطلاعات سفارش
 */
export const getOrderById = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data;
};

/**
 * به‌روزرسانی وضعیت سفارش
 * @param {string} id - شناسه سفارش
 * @param {string} status - وضعیت جدید
 * @returns {Promise<Object>} سفارش به‌روز شده
 */
export const updateOrderStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data;
};

// --- توابع مربوط به کاربران ---

/**
 * دریافت لیست کاربران
 * @param {object} params - پارامترهای query
 * @returns {Promise<Array>} لیستی از کاربران
 */
export const getUsers = async (params = {}) => {
  const { data } = await apiClient.get("/users", { params });
  return data.data;
};

/**
 * دریافت یک کاربر خاص
 * @param {string} id - شناسه کاربر
 * @returns {Promise<Object>} اطلاعات کاربر
 */
export const getUserById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data.data;
};

/**
 * به‌روزرسانی نقش کاربر
 * @param {string} id - شناسه کاربر
 * @param {string} role - نقش جدید
 * @returns {Promise<Object>} کاربر به‌روز شده
 */
export const updateUserRole = async (id, role) => {
  const { data } = await apiClient.patch(`/users/${id}/role`, { role });
  return data;
};

/**
 * مسدود/فعال کردن کاربر
 * @param {string} id - شناسه کاربر
 * @param {boolean} isActive - وضعیت فعال بودن
 * @returns {Promise<Object>} کاربر به‌روز شده
 */
export const toggleUserStatus = async (id, isActive) => {
  const { data } = await apiClient.patch(`/users/${id}/status`, { isActive });
  return data;
};

// --- توابع مربوط به آمار و گزارشات ---

/**
 * دریافت آمار داشبورد
 * @returns {Promise<Object>} آمار داشبورد
 */
export const getDashboardStats = async () => {
  const { data } = await apiClient.get("/admin/dashboard");
  return data.data;
};

/**
 * دریافت آمار فروش
 * @param {object} params - پارامترهای زمانی
 * @returns {Promise<Object>} آمار فروش
 */
export const getSalesStats = async (params = {}) => {
  const { data } = await apiClient.get("/admin/stats/sales", { params });
  return data.data;
};

export default apiClient;
