import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import Filters from "@/components/Filters";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Filter, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { motion, Variants } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { useIsMobile } from "@/hooks/use-mobile";

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

type SortOption = "newest" | "price-asc" | "price-desc";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
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

const ProductsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Sort products
  const sortedProducts = products ? [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
      default:
        return 0;
    }
  }) : [];

  // Pagination logic
  const itemsPerPage = isMobile ? 5 : 12;
  const totalPages = Math.ceil((sortedProducts?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">محصولات</h1>
        <p className="mt-2 text-muted-foreground">
          {sortedProducts.length > 0 && `${sortedProducts.length} محصول یافت شد`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Desktop Filters */}
        <div className="hidden md:block">
          <Filters />
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Filter className="ml-2 h-4 w-4" />
                    فیلترها
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <Filters />
                </SheetContent>
              </Sheet>
            </div>

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="مرتب‌سازی بر اساس:" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">جدیدترین</SelectItem>
                <SelectItem value="price-asc">قیمت: ارزان به گران</SelectItem>
                <SelectItem value="price-desc">قیمت: گران به ارزان</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>
                {error?.message || "خطا در دریافت محصولات. لطفاً دوباره تلاش کنید."}
              </AlertDescription>
            </Alert>
          )}

          {/* Products Grid */}
          {!isLoading && !isError && currentProducts.length > 0 && (
            <motion.div
              className="grid grid-cols-2 gap-4 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {currentProducts.map((product) => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && currentProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Filter className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">محصولی یافت نشد</h3>
              <p className="text-muted-foreground">
                لطفاً فیلترهای دیگری را امتحان کنید
              </p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages && handlePageChange(currentPage + 1)
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;