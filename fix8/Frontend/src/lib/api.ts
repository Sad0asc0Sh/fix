import axios from 'axios';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthState {
  state?: {
    token?: string;
  };
}

import { useAuthStore } from '@/store/authStore';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor - Add token to headers from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Function to handle user login.
 * @param credentials - { email, password }
 * @returns Promise with user data and token
 */
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post('/auth/login', credentials);

    return {
      token: response.data.accessToken || response.data.data?.token,
      user: {
        id: response.data.data.user._id,
        name: response.data.data.user.name,
        email: response.data.data.user.email,
        role: response.data.data.user.role,
        avatar: response.data.data.user.avatar,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // برگرداندن پیام مناسب برای نمایش در LoginPage
      throw new Error(error.response?.data?.message || 'خطا در ورود به سیستم.');
    }
    throw error;
  }
};

/**
 * Function to handle user registration.
 * @param userData - { name, email, password }
 * @returns Promise with success message
 */
export const registerUser = async (userData: RegisterData): Promise<ApiResponse<User>> => {
  try {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // این خطا در RegisterPage با error.response?.data?.message خوانده می‌شود
      throw error;
    }
    throw error;
  }
};

/**
 * Function to request a password reset link.
 * @param email - The user's email.
 * @returns Promise with success message
 */
export const forgotPassword = async (email: string): Promise<ApiResponse<null>> => {
  try {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در ارسال لینک بازیابی رمز عبور.');
    }
    throw error;
  }
};

/**
 * Function to reset the password using a token.
 * @param token - The reset token
 * @param password - The new password
 * @returns Promise with success message
 */
export const resetPassword = async (
  token: string,
  password: string,
): Promise<ApiResponse<null>> => {
  try {
    if (!token) {
      throw new Error('توکن بازیابی رمز عبور معتبر نیست.');
    }

    const { data } = await apiClient.post('/auth/reset-password', {
      token,
      password,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در بازیابی رمز عبور.');
    }
    throw error;
  }
};

/**
 * Fetches products, with optional query parameters.
 * @param params - Optional query parameters (e.g., { limit: 4, isFeatured: true })
 * @returns Promise with an array of products
 */
export const getProducts = async (params?: Record<string, any>): Promise<any[]> => {
  try {
    const { data } = await apiClient.get('/products', { params });
    return data.data || data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت محصولات.');
    }
    throw error;
  }
};

/**
 * Fetch a single product by ID
 * @param id - Product ID
 * @returns Promise with product data
 */
export const getProductById = async (id: string): Promise<any> => {
  try {
    const { data } = await apiClient.get(`/products/${id}`);
    return data.data || data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت محصول.');
    }
    throw error;
  }
};

/**
 * Fetch user profile
 * @returns Promise with user data
 */
export const getUserProfile = async (): Promise<User> => {
  try {
    const { data } = await apiClient.get('/auth/profile');
    return data.data || data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در دریافت اطلاعات کاربر.');
    }
    throw error;
  }
};

/**
 * Update user profile
 * @param userData - Updated user data
 * @returns Promise with updated user data
 */
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const { data } = await apiClient.put('/auth/profile', userData);
    return data.data || data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'خطا در به‌روزرسانی پروفایل.');
    }
    throw error;
  }
};

export default apiClient;

