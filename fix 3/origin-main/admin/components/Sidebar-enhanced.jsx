"use client";

import { FiHome, FiBox, FiShoppingCart, FiLogOut, FiUser } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuthData, getAdminUser } from "@/utils/auth";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const adminUser = getAdminUser();
    setUser(adminUser);
  }, []);

  const handleLogout = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) {
      clearAuthData();
      router.push("/login");
    }
  };

  return (
    <div className="sidebar">
      {/* User Info Section */}
      {user && (
        <div className="p-4 border-b border-gray-200 mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <FiUser className="text-2xl text-gray-600" />
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'مدیر سیستم' : user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <Link href="/" className="link">
        <FiHome />
        <span>داشبورد</span>
      </Link>
      
      <Link href="/products" className="link">
        <FiBox />
        <span>محصولات</span>
      </Link>
      
      <Link href="/orders" className="link">
        <FiShoppingCart />
        <span>سفارشات</span>
      </Link>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="link w-full text-red-600 hover:bg-red-50"
        >
          <FiLogOut />
          <span>خروج</span>
        </button>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-xs text-gray-400 mt-4">
          <p>Token: {localStorage.getItem('adminToken') ? '✓' : '✗'}</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
