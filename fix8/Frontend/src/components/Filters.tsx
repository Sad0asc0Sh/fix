import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const Filters = () => {
  return (
    <div className="p-4 border-r h-full">
      <h3 className="text-lg font-semibold mb-4">فیلترها</h3>
      <Accordion type="multiple" defaultValue={["category", "brand", "price"]}>
        <AccordionItem value="category">
          <AccordionTrigger>دسته‌بندی</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="cat-clothing" />
                <label htmlFor="cat-clothing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">پوشاک</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cat-digital" />
                <label htmlFor="cat-digital" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">دیجیتال</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cat-home" />
                <label htmlFor="cat-home" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">خانه</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cat-watch" />
                <label htmlFor="cat-watch" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ساعت</label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="brand">
          <AccordionTrigger>برند</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="brand-a" />
                <label htmlFor="brand-a" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">برند A</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="brand-b" />
                <label htmlFor="brand-b" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">برند B</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="brand-c" />
                <label htmlFor="brand-c" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">برند C</label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
          <AccordionTrigger>محدوده قیمت</AccordionTrigger>
          <AccordionContent>
            <Slider defaultValue={[500000]} max={1000000} step={50000} />
            <div className="text-sm text-muted-foreground mt-2">تا 500,000 تومان</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex gap-2 mt-6">
        <Button className="flex-1">اعمال فیلتر</Button>
        <Button variant="outline" className="flex-1">پاک کردن</Button>
      </div>
    </div>
  );
};

export default Filters;
