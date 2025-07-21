import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { hapticFeedback } from "@/lib/telegram";

interface CartItemProps {
  item: {
    id: number;
    quantity: number;
    product: {
      id: number;
      nameUz: string;
      price: string;
      image?: string;
      unit: string;
    };
  };
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  isUpdating?: boolean;
}

export function CartItem({ item, onUpdateQuantity, isUpdating }: CartItemProps) {
  const handleDecrease = () => {
    hapticFeedback.light();
    onUpdateQuantity(item.id, item.quantity - 1);
  };

  const handleIncrease = () => {
    hapticFeedback.light();
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const itemTotal = parseFloat(item.product.price) * item.quantity;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        {item.product.image && (
          <img 
            src={item.product.image} 
            alt={item.product.nameUz}
            className="w-12 h-12 object-cover rounded-lg"
          />
        )}
        <div>
          <h3 className="font-medium text-sm text-foreground">
            {item.product.nameUz}
          </h3>
          <p className="text-sm text-primary font-medium">
            {parseInt(item.product.price).toLocaleString()} so'm/{item.product.unit}
          </p>
          <p className="text-sm font-semibold text-foreground">
            Jami: {itemTotal.toLocaleString()} so'm
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          className="w-8 h-8 rounded-full p-0"
          onClick={handleDecrease}
          disabled={isUpdating}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <span className="text-sm font-medium px-2">
          {item.quantity}
        </span>
        
        <Button
          size="sm"
          className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
          onClick={handleIncrease}
          disabled={isUpdating}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
