"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onOpenMenu={() => setOpen(true)} />

      {/* Mobile sheet renders Sidebar content; desktop shows fixed sidebar */}
      <div className="flex">
        {/* Desktop Sidebar (RTL: place on right) */}
        <aside className="hidden md:block fixed top-0 right-0 h-screen w-64 pt-16 border-l bg-card">
          <div className="h-full overflow-y-auto p-4">
            <Sidebar />
          </div>
        </aside>

        {/* Content area: add right padding to account for fixed sidebar on desktop */}
        <main className="flex-1 w-full pt-16 md:pr-64 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

