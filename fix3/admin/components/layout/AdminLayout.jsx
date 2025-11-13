"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/layout/Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Do not render persistent layout on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background rtl">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:sticky lg:top-0 lg:right-0">
        <Sidebar />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        <Sheet open={open} onOpenChange={setOpen}>
          {/* Header with mobile trigger */}
          <Header onOpenMenu={() => setOpen(true)} />

          {/* Mobile Sheet Sidebar */}
          <SheetContent side="right" className="p-0 lg:hidden w-72">
            <Sidebar className="w-full h-full" />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
