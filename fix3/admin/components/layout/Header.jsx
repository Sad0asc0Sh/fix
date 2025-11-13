"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header({ onOpenMenu }) {
  const router = useRouter();

  const handleLogout = () => {
    try {
      Cookies.remove("admin-token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin-token");
        localStorage.removeItem("adminUser");
      }
    } catch {}
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-background rtl">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-medium">مدیریت</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="اعلان‌ها">
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>سفارش جدید (۰)</DropdownMenuItem>
            <DropdownMenuItem>تیکت جدید (۰)</DropdownMenuItem>
            <DropdownMenuItem>بازگشت کالا (۰)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" variant="destructive" onClick={handleLogout}>
          خروج
        </Button>
      </div>
    </header>
  );
}

