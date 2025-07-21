import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { hapticFeedback } from "@/lib/telegram";

interface Product {
  id: number;
  nameUz: string;
  descriptionUz?: string;
  price: string;
  unit: string;
  image?: string;
  isAvailable: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
  isAddingToCart?: boolean;
}

export function ProductCard({ product, onAddToCart, isAddingToCart }: ProductCardProps) {
  const handleAddToCart = () => {
    hapticFeedback.light();
    onAddToCart(product.id);
  };

  return (
    <Card className="bg-card-bg border border-gray-100 rounded-xl overflow-hidden product-card">
      <CardContent className="p-3">
        {product.image && (
          <img 
            src={product.image} 
            alt={product.nameUz}
            className="w-full h-24 object-cover rounded-lg mb-2"
          />
        )}
        
        <h3 className="font-medium text-sm mb-1 text-foreground">
          {product.nameUz}
        </h3>
        
        {product.descriptionUz && (
          <p className="text-xs text-muted-foreground mb-2">
            {product.descriptionUz}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary">
              {parseInt(product.price).toLocaleString()} so'm
            </span>
            <span className="text-xs text-muted-foreground">
              {product.unit}
            </span>
          </div>
          
          <Button
            size="sm"
            className="w-6 h-6 rounded-full p-0 bg-primary hover:bg-primary/90"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAddingToCart}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
