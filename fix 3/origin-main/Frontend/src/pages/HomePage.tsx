// src/pages/HomePage.tsx

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard"; // مطمئن شوید این فایل وجود دارد
import { Card } from "@/components/ui/card";
import { Watch, Shirt, Laptop, Home as HomeIcon, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api"; // مطمئن شوید این فایل و تابع وجود دارند
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface Product {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
  image?: string;
  category?: string;
  description?: string;
}

interface Category {
  name: string;
  icon: JSX.Element;
  slug: string;
}

// Categories Data
const categories: Category[] = [
  { name: "ساعت", icon: <Watch className="h-8 w-8" />, slug: "watch" },
  { name: "پوشاک", icon: <Shirt className="h-8 w-8" />, slug: "clothing" },
  { name: "دیجیتال", icon: <Laptop className="h-8 w-8" />, slug: "digital" },
  { name: "خانه", icon: <HomeIcon className="h-8 w-8" />, slug: "home" },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      // cast type to any to satisfy motion-dom/framer-motion type expectations
      type: "spring" as any,
      stiffness: 100,
    },
  },
};

// Loading Skeleton Component
const ProductSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

const HomePage = () => {
  const {
    data: featuredProducts,
    isLoading,
    isError,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["featuredProducts"],
    queryFn: async () => {
      const products = await getProducts({ limit: 4 });
      return Array.isArray(products) ? (products as Product[]) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full bg-gradient-to-r from-primary/10 to-background overflow-hidden">
        <div className="container mx-auto flex h-full max-w-7xl items-center px-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold md:text-6xl lg:text-7xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              فصل جدید، سبک جدید
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              جدیدترین محصولات فصل را کاوش کنید.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/products">همین حالا خرید کنید</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">محصولات ویژه</h2>
            <Button asChild variant="outline">
              <Link to="/products">مشاهده همه</Link>
            </Button>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>
                {error?.message || "خطا در دریافت محصولات ویژه. لطفاً دوباره تلاش کنید."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && featuredProducts && featuredProducts.length > 0 && (
            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {featuredProducts.map((product) => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && !isError && (!featuredProducts || featuredProducts.length === 0) && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">هیچ محصول ویژه‌ای یافت نشد.</p>
              <Button asChild className="mt-4">
                <Link to="/products">مشاهده همه محصولات</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="bg-muted/40 py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">خرید بر اساس دسته‌بندی</h2>
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {categories.map((category) => (
              <motion.div key={category.slug} variants={itemVariants}>
                <Link to={`/category/${category.slug}`} className="block">
                  <Card className="group flex h-full flex-col items-center justify-center p-6 transition-all hover:scale-105 hover:shadow-lg md:p-8">
                    <div className="text-primary transition-transform group-hover:scale-110">
                      {category.icon}
                    </div>
                    <p className="mt-2 text-sm font-semibold md:text-base">{category.name}</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center md:p-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">به خبرنامه ما بپیوندید</h2>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              از جدیدترین محصولات و تخفیف‌های ویژه باخبر شوید
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="ایمیل خود را وارد کنید"
                className="flex-1 rounded-md border border-input bg-background px-4 py-2"
                aria-label="ایمیل"
              />
              <Button>عضویت</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;