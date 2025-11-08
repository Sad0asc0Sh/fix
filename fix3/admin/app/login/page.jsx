"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { saveAuthData } from "../../utils/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // First try the local API route
      try {
        const response = await axios.post("/api/auth/login", credentials);
        return response.data;
      } catch (error) {
        // If local API fails, try direct backend connection
        if (error.response?.status === 502 || error.response?.status === 500) {
          console.log("Trying direct backend connection...");
          const backendResponse = await axios.post(
            "http://localhost:5000/api/auth/admin/login",
            credentials,
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Handle the backend response format
          const data = backendResponse.data;
          if (data.accessToken) {
            // Save auth data
            saveAuthData(data.accessToken, data.data?.user);
            return {
              success: true,
              user: data.data?.user,
              token: data.accessToken
            };
          }
          throw new Error("No token received from backend");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      
      // If we got a token from the backend directly
      if (data.token || data.accessToken) {
        saveAuthData(data.token || data.accessToken, data.user || data.data?.user);
      }
      
      // Debug authentication state after login
      setTimeout(() => {
        console.log('Post-login auth check:');
        console.log('adminToken:', localStorage.getItem('adminToken'));
        console.log('admin-token:', localStorage.getItem('admin-token'));
        console.log('adminUser:', localStorage.getItem('adminUser'));
      }, 100);
      
      alert("ورود با موفقیت انجام شد!");
      
      // Add a small delay before redirect to ensure storage is complete
      setTimeout(() => {
        router.push("/");
      }, 500);
    },
    onError: (error) => {
      console.error("Admin login error:", error);
      
      let errorMessage = "خطا در ورود";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error messages
      if (errorMessage.includes("role")) {
        errorMessage = "شما دسترسی ادمین ندارید. لطفا با حساب ادمین وارد شوید.";
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
    setError("حساب تست: ابتدا یک کاربر عادی ثبت‌نام کنید و role آن را در MongoDB به admin تغییر دهید");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-sm text-gray-600">برای دسترسی به داشبورد، وارد شوید</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="text-right">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              dir="ltr"
              placeholder="admin@example.com"
            />
          </div>
          
          <div className="text-right">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              dir="ltr"
              placeholder="********"
            />
          </div>
          
          <div className="space-y-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-2 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {mutation.isPending ? "در حال ورود..." : "ورود"}
            </button>
            
            <button
              type="button"
              onClick={fillTestAccount}
              className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              پر کردن با حساب تست
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-xs text-center text-gray-500">
          <p>برای ایجاد حساب ادمین:</p>
          <ol className="mt-2 text-right">
            <li>1. از طریق Frontend یک کاربر ثبت‌نام کنید</li>
            <li>2. در MongoDB نقش کاربر را به admin تغییر دهید</li>
            <li>3. با همان اطلاعات وارد شوید</li>
          </ol>
        </div>
      </div>
    </div>
  );
}