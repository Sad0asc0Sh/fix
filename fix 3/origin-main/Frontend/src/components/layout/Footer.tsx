import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col">
            <h3 className="mb-2 text-lg font-bold text-foreground">E-Shop</h3>
            <p className="text-sm">ارائه بهترین محصولات با بالاترین کیفیت</p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">دسترسی سریع</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-foreground">خانه</Link></li>
              <li><Link to="/products" className="hover:text-foreground">محصولات</Link></li>
              <li><Link to="/about" className="hover:text-foreground">درباره ما</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">تماس با ما</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">پشتیبانی</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="hover:text-foreground">سوالات متداول</Link></li>
              <li><Link to="/return-policy" className="hover:text-foreground">سیاست مرجوعی</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-foreground">حریم خصوصی</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">عضویت در خبرنامه</h4>
            <p className="mb-2 text-sm">از آخرین تخفیف‌ها باخبر شوید.</p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="ایمیل شما" />
              <Button type="submit">ثبت</Button>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col items-center justify-between sm:flex-row">
          <p className="text-sm">© 2025 E-Shop. تمام حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;