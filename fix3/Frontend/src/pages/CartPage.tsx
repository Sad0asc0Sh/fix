import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCartStore();

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">سبد خرید شما خالی است</h1>
        <p className="text-muted-foreground mb-8">به نظر می‌رسد هنوز محصولی به سبد خرید خود اضافه نکرده‌اید.</p>
        <Link to="/products">
          <Button>مشاهده محصولات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8 text-right">سبد خرید شما</h1>
      <div className="space-y-4">
        {items.map((item) => {
          // Defensive check to prevent crash if an item is somehow null/undefined
          if (!item) return null;

          return (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground"
            >
              <div className="flex items-center gap-4">
                <img 
                  src={item.images?.[0]?.url || "/placeholder.svg"} 
                  alt={item.name || "Product Image"}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="text-right">
                  <h2 className="font-semibold">{item.name || "بدون نام"}</h2>
                  <p className="text-sm text-muted-foreground">{(item.price || 0).toLocaleString()} تومان</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</Button>
                  <span>{item.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</Button>
                </div>
                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeFromCart(item._id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 pt-8 border-t flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">جمع کل: {getTotalPrice().toLocaleString()} تومان</h2>
        </div>
        <Button size="lg" className="bg-green-600 hover:bg-green-700">ادامه فرآیند خرید</Button>
      </div>
    </div>
  );
};

export default CartPage;