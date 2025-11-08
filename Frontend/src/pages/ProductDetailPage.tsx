import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Star } from "lucide-react";
import QuantitySelector from "@/components/QuantitySelector";

const ProductDetailPage = () => {
  return (
    <div className="container max-w-7xl mx-auto py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <AspectRatio ratio={1 / 1} className="bg-muted rounded-lg">
            {/* Main image placeholder */}
          </AspectRatio>
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="border-2 border-primary rounded-md">
              <AspectRatio ratio={1 / 1} className="bg-muted rounded-md cursor-pointer" />
            </div>
            <AspectRatio ratio={1 / 1} className="bg-muted rounded-md cursor-pointer" />
            <AspectRatio ratio={1 / 1} className="bg-muted rounded-md cursor-pointer" />
            <AspectRatio ratio={1 / 1} className="bg-muted rounded-md cursor-pointer" />
            <AspectRatio ratio={1 / 1} className="bg-muted rounded-md cursor-pointer" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">پوشاک</p>
          <h1 className="text-3xl font-bold mt-2">نام کامل محصول</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <Star className="h-5 w-5 fill-primary text-primary" />
              <Star className="h-5 w-5 fill-primary text-primary" />
              <Star className="h-5 w-5 fill-primary text-primary" />
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <a href="#reviews" className="text-sm text-muted-foreground">(۱۲۰ نظر)</a>
          </div>
          <p className="text-2xl font-bold my-4">۱۹۹,۰۰۰ تومان</p>
          <p className="text-muted-foreground">توضیح کوتاه و جذاب درباره محصول در اینجا قرار می‌گیرد.</p>
          <Separator className="my-6" />
          <div className="flex items-center gap-4">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="رنگ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">آبی</SelectItem>
                <SelectItem value="red">قرمز</SelectItem>
                <SelectItem value="black">مشکی</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="اندازه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s">S</SelectItem>
                <SelectItem value="m">M</SelectItem>
                <SelectItem value="l">L</SelectItem>
                <SelectItem value="xl">XL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6">
            <QuantitySelector />
          </div>
          <div className="mt-6 flex gap-4">
            <Button size="lg">افزودن به سبد خرید</Button>
            <Button size="lg" variant="outline">
              <Heart className="ml-2 h-5 w-5" />
              افزودن به علاقه‌مندی
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">توضیحات کامل</TabsTrigger>
            <TabsTrigger value="specs">مشخصات فنی</TabsTrigger>
            <TabsTrigger value="reviews">نظرات</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="p-4">
            <p>لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد. کتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد.</p>
          </TabsContent>
          <TabsContent value="specs" className="p-4">
            <p>مشخصات فنی محصول در اینجا قرار می‌گیرد.</p>
          </TabsContent>
          <TabsContent value="reviews" className="p-4">
            <p>بخش نظرات به زودی اضافه می‌شود.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetailPage;
