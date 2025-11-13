"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function AuthProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("admin-token");

    if (!token && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (token && pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

  return <>{children}</>;
}

