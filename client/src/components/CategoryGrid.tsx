import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: number;
  nameUz: string;
  nameRu?: string;
  nameEn?: string;
  image?: string;
  isActive: boolean;
}

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

export function CategoryGrid({ categories, selectedCategory, onCategorySelect }: CategoryGridProps) {
  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-4">Kategoriyalar</h2>
      <div className="grid grid-cols-2 gap-2">
        {/* All Categories Card */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
            selectedCategory === null ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
          }`}
          onClick={() => onCategorySelect(null)}
        >
          <CardContent className="p-2">
            <div className="h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xl">🛍️</span>
            </div>
            <h3 className="font-medium text-xs text-center">Barchasi</h3>
          </CardContent>
        </Card>

        {/* Category Cards */}
        {categories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedCategory === category.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`}
            onClick={() => onCategorySelect(category.id)}
          >
            <CardContent className="p-2">
              <div className="h-16 rounded-lg mb-2 overflow-hidden bg-muted">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.nameUz}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                )}
              </div>
              <h3 className="font-medium text-xs text-center line-clamp-2">
                {category.nameUz}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}