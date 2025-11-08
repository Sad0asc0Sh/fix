import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  type LucideIcon,
  Package,
  Search,
  ShoppingCart,
  Menu,
  Sun,
  Moon,
  User as UserIcon,
  Camera,
  Shield,
  Smartphone,
  Home,
  Lightbulb,
  Layers,
  Laptop,
  Cpu,
  CircuitBoard,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/authStore";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import apiClient from "@/lib/api";
import { cn } from "@/lib/utils";

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
  { to: "/products", label: "محصولات", hasMegaMenu: true },
  { to: "/about", label: "درباره ما" },
];

type CategoryTreeNode = {
  _id: string;
  name: string;
  slug?: string;
  icon?: string;
  children?: CategoryTreeNode[];
};

const normalizeIconKey = (value?: string | null) =>
  value?.toString().toLowerCase().replace(/[\s_-]/g, "") ?? "";

const categoryIconMap: Record<string, LucideIcon> = {
  camera: Camera,
  cctv: Camera,
  security: Shield,
  alarm: Shield,
  smart: Lightbulb,
  smarthome: Lightbulb,
  home: Home,
  mobile: Smartphone,
  phone: Smartphone,
  laptop: Laptop,
  digital: Laptop,
  computer: Laptop,
  layers: Layers,
  network: Layers,
  cpu: Cpu,
  electronics: CircuitBoard,
};

const fallbackIcons: LucideIcon[] = [Camera, Shield, Smartphone, Home, Lightbulb, Layers, Laptop, Cpu];

const getCategoryIcon = (category: CategoryTreeNode, index: number) => {
  const candidates = [category.icon, category.slug];

  for (const candidate of candidates) {
    const normalized = normalizeIconKey(candidate);
    if (normalized && categoryIconMap[normalized]) {
      return categoryIconMap[normalized];
    }
  }

  return fallbackIcons[index % fallbackIcons.length] ?? Circle;
};

const buildCategoryPath = (category: CategoryTreeNode) =>
  category.slug ? `/category/${category.slug}` : `/category/${category._id}`;

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const navigate = useNavigate();
  const productsNavItem = navLinks.find((link) => link.hasMegaMenu);
  const regularNavLinks = navLinks.filter((link) => !link.hasMegaMenu);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
        const { data } = await apiClient.get<{ data?: CategoryTreeNode[] }>("/categories/tree");
        if (!isMounted) return;
        const fetchedCategories = Array.isArray(data?.data) ? data.data : [];
        setCategoryTree(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setActiveParentId(fetchedCategories[0]._id);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("خطا در دریافت دسته\u200cبندی\u200cها", error);
        setCategoryError("خطا در دریافت دسته\u200cبندی\u200cها");
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const activeParentCategory = useMemo(
    () => categoryTree.find((category) => category._id === activeParentId),
    [categoryTree, activeParentId],
  );

  return (
    <header dir="rtl" className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold text-lg">E-Shop</span>
          </Link>
          <NavigationMenu dir="rtl" className="flex-1 justify-start">
            <NavigationMenuList className="space-x-0 gap-2 justify-start">
              {regularNavLinks.map((link) => (
                <NavigationMenuItem key={link.to}>
                  <NavigationMenuLink asChild>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        cn(
                          "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              {productsNavItem && (
                <NavigationMenuItem key={productsNavItem.to} value="products">
                  <NavigationMenuTrigger className="text-sm font-medium">
                    {productsNavItem.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="lg:w-[920px]">
                    <div
                      className="w-full rounded-2xl border bg-popover/95 p-6 text-right shadow-xl backdrop-blur"
                      dir="rtl"
                    >
                      {isLoadingCategories ? (
                        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]" dir="ltr">
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <div
                                key={`parent-skeleton-${index}`}
                                className="h-10 w-full animate-pulse rounded-xl bg-muted/60"
                              />
                            ))}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                              <div
                                key={`child-skeleton-${index}`}
                                className="h-28 animate-pulse rounded-2xl border border-dashed border-border/60 bg-muted/40"
                              />
                            ))}
                          </div>
                        </div>
                      ) : categoryError ? (
                        <div className="py-8 text-center text-sm text-destructive">{categoryError}</div>
                      ) : categoryTree.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">دسته‌بندی فعالی یافت نشد.</div>
                      ) : (
                        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]" dir="ltr">
                          <div
                            dir="rtl"
                            className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-2"
                          >
                            <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">دسته‌بندی‌های اصلی</p>
                            <div className="flex max-h-[360px] flex-col overflow-y-auto">
                              {categoryTree.map((category, index) => {
                                const Icon = getCategoryIcon(category, index);
                                const isActive = category._id === activeParentId;
                                return (
                                  <button
                                    key={category._id}
                                    type="button"
                                    onMouseEnter={() => setActiveParentId(category._id)}
                                    onFocus={() => setActiveParentId(category._id)}
                                    className={cn(
                                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                                      isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground hover:bg-muted/60",
                                    )}
                                    aria-pressed={isActive}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {category.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div dir="rtl" className="space-y-5">
                            {activeParentCategory ? (
                              <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">زیرمجموعه‌ها</p>
                                    <h4 className="text-lg font-semibold text-foreground">{activeParentCategory.name}</h4>
                                  </div>
                                  <Button asChild variant="link" className="px-0 text-primary">
                                    <Link to={productsNavItem.to}>مشاهده همه</Link>
                                  </Button>
                                </div>
                                {activeParentCategory.children && activeParentCategory.children.length > 0 ? (
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    {activeParentCategory.children.map((child) => (
                                      <div
                                        key={child._id}
                                        className="rounded-2xl border border-border/70 p-4 transition hover:border-primary/40"
                                      >
                                        <Link
                                          to={buildCategoryPath(child)}
                                          className="text-base font-semibold text-foreground transition hover:text-primary"
                                        >
                                          {child.name}
                                        </Link>
                                        {child.children && child.children.length > 0 ? (
                                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                            {child.children.map((subChild) => (
                                              <li key={subChild._id}>
                                                <Link
                                                  to={buildCategoryPath(subChild)}
                                                  className="transition hover:text-primary"
                                                >
                                                  {subChild.name}
                                                </Link>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="mt-2 text-sm text-muted-foreground/80">بدون زیرمجموعهٔ بیشتر</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                                    زیرمجموعه‌ای برای این دسته ثبت نشده است.
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="py-8 text-center text-sm text-muted-foreground">
                                دسته‌بندی‌ای انتخاب نشده است.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="باز کردن منوی اصلی">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto" dir="rtl">
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
                {productsNavItem && (
                  <div className="border-t pt-4">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">دسته‌بندی محصولات</p>
                    {isLoadingCategories ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`mobile-category-skeleton-${index}`}
                            className="h-10 animate-pulse rounded-lg bg-muted/70"
                          />
                        ))}
                      </div>
                    ) : categoryError ? (
                      <p className="text-sm text-destructive">{categoryError}</p>
                    ) : categoryTree.length === 0 ? (
                      <p className="text-sm text-muted-foreground">دسته‌بندی فعالی ثبت نشده است.</p>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {categoryTree.map((category, index) => {
                          const Icon = getCategoryIcon(category, index);
                          return (
                            <AccordionItem key={category._id} value={category._id}>
                              <AccordionTrigger className="text-right">
                                <span className="flex items-center gap-2 text-sm">
                                  <Icon className="h-4 w-4" />
                                  {category.name}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 pr-1">
                                  {category.children && category.children.length > 0 ? (
                                    category.children.map((child) => (
                                      <div key={child._id} className="space-y-1">
                                        <Link
                                          to={buildCategoryPath(child)}
                                          className="block text-sm font-medium text-foreground transition hover:text-primary"
                                          onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                          {child.name}
                                        </Link>
                                        {child.children && child.children.length > 0 && (
                                          <ul className="space-y-1 pr-3 text-xs text-muted-foreground">
                                            {child.children.map((subChild) => (
                                              <li key={subChild._id}>
                                                <Link
                                                  to={buildCategoryPath(subChild)}
                                                  className="transition hover:text-primary"
                                                  onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                  {subChild.name}
                                                </Link>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">زیرمجموعه‌ای ثبت نشده است.</p>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </div>
                )}
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
