"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";
import QueryProvider from "./components/QueryProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, getAdminUser } from "@/utils/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Authentication check - runs only once when client is ready or pathname changes
  useEffect(() => {
    if (!isClient) return;

    // Don't check auth on login page
    if (pathname === '/login') {
      setIsLoading(false);
      setIsAuthed(false);
      return;
    }

    // Check authentication
    const authenticated = isAuthenticated();
    
    console.log('Auth check:', {
      pathname,
      authenticated,
      adminToken: localStorage.getItem('adminToken'),
      adminToken2: localStorage.getItem('admin-token'),
      user: getAdminUser()
    });

    if (!authenticated) {
      console.log('Not authenticated, redirecting to login...');
      setIsAuthed(false);
      setIsLoading(false);
      router.replace('/login');
    } else {
      console.log('User is authenticated');
      setIsAuthed(true);
      setIsLoading(false);
    }
  }, [pathname, isClient]); // Removed router from dependencies to prevent loop

  // Don't render protected layout for login page
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

  // Show loading while checking auth
  if (isLoading) {
    return (
      <html lang="fa" dir="rtl">
        <head>
          <title>در حال بارگذاری...</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <QueryProvider>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">در حال بررسی احراز هویت...</p>
              </div>
            </div>
          </QueryProvider>
        </body>
      </html>
    );
  }

  // Render authenticated layout
  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>پنل مدیریت فروشگاه</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          {isAuthed ? (
            <div className="flex">
              <Sidebar />
              <main className="flex-grow">{children}</main>
            </div>
          ) : null}
        </QueryProvider>
      </body>
    </html>
  );
}