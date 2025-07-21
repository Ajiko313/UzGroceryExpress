import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/hooks/useCart";

interface Category {
  id: number;
  nameUz: string;
}

interface Product {
  id: number;
  categoryId: number;
  nameUz: string;
  descriptionUz?: string;
  price: string;
  unit: string;
  image?: string;
  isAvailable: boolean;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { addToCart, isAddingToCart } = useCart();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', selectedCategory, searchQuery],
  });

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.nameUz.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.isAvailable;
  });

  return (
    <div className="pb-20">
      {/* Search Bar */}
      <div className="px-4 py-3 bg-card-bg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Mahsulotlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-input focus:border-primary rounded-xl"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 bg-background border-b border-border">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={selectedCategory === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap rounded-full"
          >
            Barchasi
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap rounded-full"
            >
              {category.nameUz}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(productId) => addToCart({ productId })}
                isAddingToCart={isAddingToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? "Qidiruv natijasi topilmadi" : "Mahsulotlar topilmadi"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
