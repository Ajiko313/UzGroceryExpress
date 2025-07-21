import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { hapticFeedback } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    nameUz: string;
    price: string;
    image?: string;
    unit: string;
  };
}

export function useCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart', user?.id],
    queryFn: async () => {
      const telegramId = user?.id?.toString();
      const url = telegramId ? `/api/cart?telegramId=${telegramId}` : '/api/cart';
      const response = await fetch(url);
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      const response = await apiRequest('POST', '/api/cart', { 
        productId, 
        quantity, 
        telegramId: user?.id?.toString() 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', user?.id] });
      hapticFeedback.light();
      toast({
        title: "Mahsulot qo'shildi",
        description: "Mahsulot savatchaga muvaffaqiyatli qo'shildi",
      });
    },
    onError: () => {
      hapticFeedback.error();
      toast({
        title: "Xatolik",
        description: "Mahsulotni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      if (quantity <= 0) {
        const response = await apiRequest('DELETE', `/api/cart/${cartItemId}`);
        return response.json();
      } else {
        const response = await apiRequest('PATCH', `/api/cart/${cartItemId}`, { 
          quantity, 
          telegramId: user?.id?.toString() 
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', user?.id] });
      hapticFeedback.selection();
    },
    onError: () => {
      hapticFeedback.error();
      toast({
        title: "Xatolik",
        description: "Miqdorni o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart', { 
        telegramId: user?.id?.toString() 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', user?.id] });
      hapticFeedback.success();
    },
  });

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return {
    cartItems,
    isLoading,
    cartTotal,
    cartItemCount,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
  };
}
