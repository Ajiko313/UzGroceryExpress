import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Clock, Percent } from "lucide-react";

interface SpecialOffer {
  id: number;
  title: string;
  description: string;
  discountPercentage: number;
  categoryId?: number;
  productId?: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export function SpecialOffersBanner() {
  const { data: offers = [], isLoading } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/special-offers'],
    refetchInterval: 60000, // Refetch every minute to keep offers fresh
  });

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} soat qoldi`;
    } else {
      return `${Math.floor(diffInHours / 24)} kun qoldi`;
    }
  };

  if (isLoading || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Maxsus takliflar 🔥
        </h2>
      </div>
      
      <div className="grid gap-3">
        {offers.slice(0, 2).map((offer) => (
          <Card key={offer.id} className="overflow-hidden border-orange-200 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950 dark:via-red-950 dark:to-pink-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      {offer.title}
                    </h3>
                    <Badge className="bg-red-500 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      {offer.discountPercentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                    {offer.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeRemaining(offer.endsAt)}</span>
                  </div>
                </div>
                <div className="text-4xl ml-4">
                  {offer.categoryId === 1 ? '🥕' : offer.categoryId === 3 ? '🥛' : '🛒'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}