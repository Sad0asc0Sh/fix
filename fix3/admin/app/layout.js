"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";
import QueryProvider from "./components/QueryProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Centralized auth check function
function checkAuthentication() {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage tokens
  const adminToken = localStorage.getItem('adminToken');
  const adminToken2 = localStorage.getItem('admin-token');
  
  // Check client-readable cookie
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('admin-token-client='))
    ?.split('=')[1];
  
  return !!(adminToken || adminToken2 || cookieToken);
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const authCheckRef = useRef(false);

  // Mount component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle authentication check only once per pathname change
  useEffect(() => {
    if (!mounted) return;

    // Reset auth check flag when pathname changes
    authCheckRef.current = false;
    
    // If on login page, skip auth check
    if (pathname === '/login') {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    // Prevent multiple simultaneous auth checks
    if (authCheckRef.current) return;
    authCheckRef.current = true;

    // Perform authentication check with a small delay to ensure storage is ready
    const checkAuth = () => {
      const isAuth = checkAuthentication();
      
      console.log('🔍 Auth Check:', {
        pathname,
        isAuthenticated: isAuth,
        localStorage: {
          adminToken: localStorage.getItem('adminToken')?.substring(0, 20) + '...',
          adminToken2: localStorage.getItem('admin-token')?.substring(0, 20) + '...',
        },
        cookies: document.cookie.includes('admin-token-client'),
      });

      setIsAuthenticated(isAuth);
      setIsChecking(false);

      // Redirect to login if not authenticated
      if (!isAuth) {
        console.log('❌ Not authenticated - redirecting to login');
        router.replace('/login');
      } else {
        console.log('✅ Authenticated - access granted');
      }
    };

    // Small delay to ensure cookies/localStorage are fully set
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname, mounted, router]);

  // Return login page layout (no auth required)
  if (pathname === '/login') {
    return (
      <html lang="fa" dir="rtl">
        <head>
          <title>ورود به پنل مدیریت</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    );
  }

  // Show loading screen while checking authentication
  if (!mounted || isChecking) {
    return (
      <html lang="fa" dir="rtl">
        <head>
          <title>در حال بارگذاری...</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <QueryProvider>
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
                <p className="mt-4 text-lg text-gray-600">در حال بررسی احراز هویت...</p>
              </div>
            </div>
          </QueryProvider>
        </body>
      </html>
    );
  }

  // Render authenticated layout with sidebar
  if (isAuthenticated) {
    return (
      <html lang="fa" dir="rtl">
        <head>
          <title>پنل مدیریت فروشگاه</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <QueryProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-grow bg-gray-50">{children}</main>
            </div>
          </QueryProvider>
        </body>
      </html>
    );
  }

  // Fallback: redirecting state (shouldn't normally reach here)
  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>در حال هدایت...</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
              <p className="mt-4 text-lg text-gray-600">در حال هدایت به صفحه ورود...</p>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}