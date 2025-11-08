import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Package, Search, ShoppingCart, Menu, Sun, Moon, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";

type NavLinkItem = {
  to: string;
  label: string;
};

type UserLike =
  | {
      name?: string;
      username?: string;
      firstName?: string;
      email?: string;
      avatar?: string | null;
    }
  | null
  | undefined;

const navLinks: NavLinkItem[] = [
  { to: "/", label: "خانه" },
  { to: "/products", label: "محصولات" },
  { to: "/about", label: "درباره ما" },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getUserName = () => {
    const u = user as UserLike;
    if (!u) return "کاربر";
    return u.name ?? u.username ?? u.firstName ?? "کاربر";
  };

  const getUserEmail = () => {
    const u = user as UserLike;
    return u?.email ?? "";
  };

  const getUserInitial = () => {
    const name = getUserName();
    return name ? name.charAt(0).toUpperCase() : "ک";
  };

  const avatarSrc = (() => {
    const u = user as UserLike;
    return u?.avatar || undefined;
  })();

  return (
    <header dir="rtl" className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold text-lg">E-Shop</span>
          </Link>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="باز کردن منو">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 pb-4 border-b"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package className="h-6 w-6" />
                  <span className="font-bold text-lg">E-Shop</span>
                </Link>
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors hover:text-foreground py-2 ${
                        isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                    <NavLink
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium transition-colors hover:text-foreground py-2 text-muted-foreground"
                    >
                      ورود
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium transition-colors hover:text-foreground py-2 text-muted-foreground"
                    >
                      ثبت‌نام
                    </NavLink>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" aria-label="جستجو">
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart Button (no nested interactive elements) */}
          <Button asChild variant="ghost" size="icon" aria-label="سبد خرید" className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: { type: "spring", stiffness: 500, damping: 30 },
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </Button>

          {/* User Menu / Login Button */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="منوی کاربری">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc} alt={getUserName()} />
                    <AvatarFallback>{getUserInitial()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{getUserName()}</p>
                    {getUserEmail() && (
                      <p className="text-xs leading-none text-muted-foreground">{getUserEmail()}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <UserIcon className="ml-2 h-4 w-4" />
                  پروفایل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer">
                  <Package className="ml-2 h-4 w-4" />
                  سفارش‌های من
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")} size="sm">
              ورود / ثبت‌نام
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="تغییر تم"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;