"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip protection for login page
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    const token = Cookies.get("admin-token") || Cookies.get("admin-token-client");
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">در حال بررسی احراز هویت...</div>
      </div>
    );
  }

  return children;
}

