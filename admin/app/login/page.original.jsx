"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (credentials) => axios.post("/api/auth/login", credentials),
    onSuccess: () => {
      alert("ورود با موفقیت انجام شد!");
      router.push("/"); // Redirect to the main dashboard
    },
    onError: (error) => {
      console.error("Admin login error:", error);
      alert(`خطا در ورود: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("لطفا ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    mutation.mutate({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-sm text-gray-600">برای دسترسی به داشبورد، وارد شوید</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="text-right">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">آدرس ایمیل</label>
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
            />
          </div>
          <div className="text-right">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">رمز عبور</label>
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
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-2 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {mutation.isPending ? "در حال ورود..." : "ورود"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
