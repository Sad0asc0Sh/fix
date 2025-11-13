"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";

export default function Header({ onOpenMenu }) {
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Remove cookies used for auth
      Cookies.remove("admin-token");
      Cookies.remove("admin-token-client");
    } catch {}
    try {
      // Clean up any localStorage keys used previously
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin-token");
      localStorage.removeItem("adminUser");
    } catch {}
    router.push("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 h-16 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="h-full container mx-auto flex items-center justify-between px-4">
        {/* Right side (RTL): mobile menu trigger */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="منوی کناری">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>منوی مدیریت</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">داشبورد مدیریت</span>
        </div>

        {/* Left side: actions */}
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={handleLogout}>خروج</Button>
        </div>
      </div>
    </header>
  );
}

