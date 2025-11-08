import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

const QuantitySelector = () => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon">
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        className="w-16 text-center"
        defaultValue={1}
        readOnly
      />
      <Button variant="outline" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;
