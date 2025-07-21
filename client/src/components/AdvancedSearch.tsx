import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface SearchFilters {
  query: string;
  priceRange: string;
  sortBy: string;
  category: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: Array<{ id: number; nameUz: string }>;
}

export function AdvancedSearch({ filters, onFiltersChange, categories }: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { theme } = useTheme();

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      priceRange: 'all',
      sortBy: 'name',
      category: 'all'
    });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.priceRange !== 'all' || filters.sortBy !== 'name' || filters.category !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Mahsulotlarni qidirish..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10 pr-12 bg-background border-input focus:border-primary rounded-xl transition-all duration-200"
        />
        <Button
          variant="ghost"
          size="sm"
          className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-2 ${hasActiveFilters ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="animate-slide-up border border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filtrlar</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Kategoriya</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.nameUz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Narx oralig'i</label>
                <Select value={filters.priceRange} onValueChange={(value) => updateFilter('priceRange', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Narx oralig'ini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha narxlar</SelectItem>
                    <SelectItem value="0-10000">0 - 10,000 so'm</SelectItem>
                    <SelectItem value="10000-20000">10,000 - 20,000 so'm</SelectItem>
                    <SelectItem value="20000-50000">20,000 - 50,000 so'm</SelectItem>
                    <SelectItem value="50000+">50,000+ so'm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Saralash</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Saralash turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nomi bo'yicha</SelectItem>
                    <SelectItem value="price-low">Narx: Arzondan qimmmatiga</SelectItem>
                    <SelectItem value="price-high">Narx: Qimmatdan arzonga</SelectItem>
                    <SelectItem value="popular">Mashhur mahsulotlar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button onClick={() => setShowFilters(false)} className="flex-1">
                Qo'llash
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Tozalash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {filters.category !== 'all' && (
            <div className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
              Kategoriya: {categories.find(c => c.id.toString() === filters.category)?.nameUz}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto"
                onClick={() => updateFilter('category', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {filters.priceRange !== 'all' && (
            <div className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
              Narx: {filters.priceRange}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto"
                onClick={() => updateFilter('priceRange', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {filters.sortBy !== 'name' && (
            <div className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
              Saralash: {filters.sortBy}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 p-0 h-auto"
                onClick={() => updateFilter('sortBy', 'name')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}