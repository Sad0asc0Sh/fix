import { useState } from "react";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Product Types
interface ProductImage {
  url: string;
  alt?: string;
}

interface ProductCategory {
  _id: string;
  name: string;
  slug?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: ProductImage[];
  image?: string; // برای سازگاری با API های مختلف
  category?: ProductCategory | string;
  description?: string;
  stock?: number;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  showWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showWishlist = false }) => {
  const { addToCart } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const price = product.price || 0;

  // محاسبه قیمت نهایی با تخفیف
  const finalPrice = product.discount
    ? price - (price * product.discount) / 100
    : price;

  // گرفتن اولین تصویر محصول
  const getProductImage = (): string | undefined => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    if (product.image) {
      return product.image;
    }
    return undefined;
  };

  // گرفتن نام دسته‌بندی
  const getCategoryName = (): string | undefined => {
    if (!product.category) return undefined;
    if (typeof product.category === "string") return product.category;
    return product.category.name;
  };

  // افزودن به سبد خرید
    const handleAddToCart = () => {
      addToCart({
        _id: product._id,
        name: product.name,
        price: isNaN(finalPrice) ? 0 : finalPrice,
        images: product.images || [],
      });
      
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    };

  // افزودن به علاقه‌مندی‌ها
  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // اینجا می‌توانید لاجیک ذخیره در سرور یا localStorage را اضافه کنید
  };

  const productImage = getProductImage();
  const categoryName = getCategoryName();

  return (
    <Card className="group overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
      {/* Product Image */}
      <Link 
        to={`/products/${product._id}`} 
        className="relative block overflow-hidden"
      >
        <AspectRatio ratio={1 / 1}>
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-20" />
            </div>
          )}
        </AspectRatio>

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            {product.discount}% تخفیف
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.stock !== undefined && product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white px-4 py-2 rounded-md font-semibold text-sm">
              ناموجود
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <CardContent className="p-2 sm:p-4 flex-grow">
        <Link to={`/products/${product._id}`}>
          <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </Link>

        {/* Category */}
        {categoryName && (
          <p className="text-xs text-muted-foreground mt-1">
            {categoryName}
          </p>
        )}

        {/* Price Section */}
        <div className="mt-3">
          {product.discount && product.discount > 0 ? (
            <div className="flex items-center gap-2">
              <p className="font-bold text-base sm:text-lg text-primary">
                {finalPrice.toLocaleString()} تومان
              </p>
              <p className="text-sm text-muted-foreground line-through">
                {product.price.toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="font-bold text-base sm:text-lg">
              {(product.price || 0).toLocaleString()} تومان
            </p>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-2 sm:p-4 pt-0 flex gap-2">
        <Button
          onClick={handleAddToCart}
          disabled={isAdded || product.stock === 0}
          className={cn(
            "flex-1 transition-all duration-300",
            isAdded && "bg-green-500 hover:bg-green-600"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isAdded ? "added" : "add"}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-2"
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>اضافه شد</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">افزودن به سبد</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </Button>

        {/* Wishlist Button */}
        {showWishlist && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleWishlist}
            className={cn(
              "transition-colors",
              isWishlisted && "text-red-500 border-red-500 bg-red-50"
            )}
            aria-label="افزودن به علاقه‌مندی‌ها"
          >
            <Heart
              className={cn("h-5 w-5", isWishlisted && "fill-current")}
            />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;