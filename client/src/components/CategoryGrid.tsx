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
    <div className="px-4 py-2">
      <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2 scroll-smooth">
        {/* All Categories Button */}
        <button
          className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-[60px] category-btn ${
            selectedCategory === null 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-muted hover:bg-muted/80'
          }`}
          onClick={() => onCategorySelect(null)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-1 flex items-center justify-center">
            <span className="text-lg">🛍️</span>
          </div>
          <span className="text-xs font-medium text-center">Barchasi</span>
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-[60px] category-btn ${
              selectedCategory === category.id 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={() => onCategorySelect(category.id)}
          >
            <div className="w-10 h-10 rounded-lg mb-1 overflow-hidden bg-background">
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.nameUz}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                  <span className="text-lg">📦</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-center line-clamp-1">
              {category.nameUz}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}