import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { hapticFeedback, sendDataToBot } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  address: {
    street: string;
    city: string;
    district?: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    pricePerUnit: string;
    total: string;
    product: {
      nameUz: string;
      image?: string;
    };
  }>;
  deliveryAssignment?: {
    deliveryAgent: {
      firstName: string;
      lastName?: string;
      phoneNumber?: string;
    };
    status: string;
  };
}

export function useOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: activeOrder } = useQuery<Order | null>({
    queryKey: ['/api/orders/active'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      addressId: number;
      paymentMethod: string;
    }) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      hapticFeedback.success();
      
      // Notify Telegram bot about new order
      sendDataToBot({
        type: 'new_order',
        orderId: data.id,
      });
      
      toast({
        title: "Buyurtma yaratildi",
        description: `Buyurtma #${data.id} muvaffaqiyatli yaratildi`,
      });
    },
    onError: () => {
      hapticFeedback.error();
      toast({
        title: "Xatolik",
        description: "Buyurtmani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const getOrderStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      pending: { label: "Kutilayotgan", color: "warning-orange", icon: "clock" },
      accepted: { label: "Qabul qilindi", color: "telegram-blue", icon: "check" },
      packed: { label: "Tayyorlandi", color: "telegram-blue", icon: "box" },
      on_the_way: { label: "Yo'lda", color: "warning-orange", icon: "truck" },
      delivered: { label: "Yetkazildi", color: "success-green", icon: "check-circle" },
      cancelled: { label: "Bekor qilindi", color: "destructive", icon: "x-circle" },
    };
    return statusMap[status] || statusMap.pending;
  };

  return {
    orders,
    activeOrder,
    isLoading,
    createOrder: createOrderMutation.mutate,
    isCreatingOrder: createOrderMutation.isPending,
    getOrderStatus,
  };
}
