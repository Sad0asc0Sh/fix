"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";
import QueryProvider from "./components/QueryProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata is now handled in the component

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem('admin-token');
      if (!token && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router, isClient]);

  // Don't render protected layout for login page
  if (pathname === '/login') {
    return (
      <html lang="fa" dir="rtl">
        <head>
          <title>ورود به پنل مدیریت</title>
        </head>
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    );
  }

  // Render this for authenticated pages
  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>پنل مدیریت فروشگاه</title>
      </head>
      <body>
        <QueryProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-grow">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
