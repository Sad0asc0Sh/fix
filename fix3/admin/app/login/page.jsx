"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      console.log('🔐 Attempting login...');
      
      // Try the Next.js API route which proxies to backend
      const response = await axios.post("/api/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Login successful:', data);
      
      const token = data.token;
      const user = data.user;
      
      if (!token) {
        setError("خطا: توکن احراز هویت دریافت نشد");
        console.error('❌ No token in response');
        return;
      }

      // Store auth data in localStorage
      try {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('admin-token', token);
        if (user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        }
        
        console.log('💾 Stored to localStorage:', {
          adminToken: localStorage.getItem('adminToken')?.substring(0, 20) + '...',
          adminToken2: localStorage.getItem('admin-token')?.substring(0, 20) + '...',
          adminUser: localStorage.getItem('adminUser')?.substring(0, 50) + '...',
        });
        
        // Verify cookies were set by the API route
        console.log('🍪 Cookies:', document.cookie);
        
        // Show success message briefly
        alert("ورود با موفقیت انجام شد! در حال هدایت به داشبورد...");
        
        // Force a hard navigation to ensure clean state
        // Using window.location instead of router to ensure full page reload
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        
      } catch (err) {
        console.error('❌ Error storing auth data:', err);
        setError("خطا در ذخیره‌سازی اطلاعات ورود");
      }
    },
    onError: (error) => {
      console.error('❌ Login error:', error);
      
      let errorMessage = "خطا در ورود";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = "شما دسترسی ادمین ندارید. لطفا با حساب ادمین وارد شوید.";
      } else if (error.response?.status === 401) {
        errorMessage = "ایمیل یا رمز عبور اشتباه است";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("لطفا ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    
    mutation.mutate({ email, password });
  };

  // Test account info for development
  const fillTestAccount = () => {
    setEmail("admin@example.com");
    setPassword("admin123");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ورود به پنل مدیریت</h1>
            <p className="mt-2 text-sm text-gray-600">برای دسترسی به داشبورد، وارد شوید</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="text-right">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                آدرس ایمیل
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                dir="ltr"
                placeholder="admin@example.com"
              />
            </div>
            
            {/* Password Input */}
            <div className="text-right">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={mutation.isPending}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                dir="ltr"
                placeholder="••••••••"
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 ml-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>در حال ورود...</span>
                </span>
              ) : (
                "ورود"
              )}
            </button>
            
            {/* Test Account Button */}
            <button
              type="button"
              onClick={fillTestAccount}
              disabled={mutation.isPending}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              پر کردن با حساب تست
            </button>
          </form>
        </div>
        
        {/* Helper Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">راهنمای ایجاد حساب ادمین:</p>
          <ol className="text-xs text-blue-800 space-y-1 text-right list-decimal list-inside">
            <li>از طریق Frontend یک کاربر ثبت‌نام کنید</li>
            <li>در MongoDB نقش کاربر (role) را به "admin" تغییر دهید</li>
            <li>با همان ایمیل و رمز عبور وارد شوید</li>
          </ol>
        </div>
      </div>
    </div>
  );
}