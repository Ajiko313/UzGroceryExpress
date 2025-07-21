import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { ProductCard } from "@/components/ProductCard";
import { SpecialOffersBanner } from "@/components/SpecialOffersBanner";
import { CategoryGrid } from "@/components/CategoryGrid";
import { useCart } from "@/hooks/useCart";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

interface Category {
  id: number;
  nameUz: string;
  nameRu?: string;
  nameEn?: string;
  image?: string;
  isActive: boolean;
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

interface SearchFilters {
  query: string;
  priceRange: string;
  sortBy: string;
  category: string;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    priceRange: 'all',
    sortBy: 'name',
    category: 'all'
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCategoryGrid, setShowCategoryGrid] = useState(true);
  
  const { addToCart, isAddingToCart } = useCart();
  const { user, isLoading: authLoading } = useTelegramAuth();

  // Handle scroll for sticky headers
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', filters.category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.category !== 'all') {
        params.append('categoryId', filters.category);
      }
      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      return fetch(url).then(res => res.json());
    },
  });

  // Apply filters and sorting - ensure products is an array
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    // Category filter
    const categoryFilter = filters.category === 'all' || product.categoryId === parseInt(filters.category);
    
    // Search filter
    const searchFilter = !filters.query || 
      product.nameUz.toLowerCase().includes(filters.query.toLowerCase());
    
    // Price filter
    let priceFilter = true;
    if (filters.priceRange !== 'all') {
      const price = parseInt(product.price);
      switch (filters.priceRange) {
        case '0-10000':
          priceFilter = price >= 0 && price <= 10000;
          break;
        case '10000-20000':
          priceFilter = price > 10000 && price <= 20000;
          break;
        case '20000-50000':
          priceFilter = price > 20000 && price <= 50000;
          break;
        case '50000+':
          priceFilter = price > 50000;
          break;
      }
    }
    
    return categoryFilter && searchFilter && priceFilter && product.isAvailable;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        return parseInt(a.price) - parseInt(b.price);
      case 'price-high':
        return parseInt(b.price) - parseInt(a.price);
      case 'popular':
        return Math.random() - 0.5; // Placeholder for popularity
      default:
        return a.nameUz.localeCompare(b.nameUz);
    }
  }) : [];

  return (
    <div className="pb-20">
      {/* Special Offers Banner */}
      <div className="px-4 pt-4">
        <SpecialOffersBanner />
      </div>

      {/* Category Tabs - Always show */}
      <CategoryGrid 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={(categoryId) => {
          setSelectedCategory(categoryId);
          setFilters(prev => ({ 
            ...prev, 
            category: categoryId ? categoryId.toString() : 'all' 
          }));
        }}
      />

      {/* Sticky Search Section - Moved up to close gap */}
      <div className={`sticky top-16 z-40 transition-all duration-300 bg-background border-b border-border/50 -mt-2`}>
        <div className="px-4 py-3">
          <AdvancedSearch 
            filters={filters} 
            onFiltersChange={setFilters} 
            categories={categories}
          />
        </div>
      </div>



      {/* Results Summary */}
      {!isLoading && (
        <div className="px-4 py-2 border-b border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredProducts.length} ta mahsulot topildi</span>
            {filters.query && (
              <span>"{filters.query}" bo'yicha qidiruv</span>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-3 animate-pulse">
                <div className="bg-muted h-32 rounded-lg mb-2"></div>
                <div className="bg-muted h-3 rounded mb-1"></div>
                <div className="bg-muted h-3 rounded mb-1 w-2/3"></div>
                <div className="bg-muted h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={(productId) => addToCart({ productId })}
                  isAddingToCart={isAddingToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-medium mb-2">Mahsulot topilmadi</h3>
            <p className="text-muted-foreground">
              {filters.query 
                ? `"${filters.query}" bo'yicha natija yo'q`
                : "Bu kategoriyada mahsulot yo'q"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
