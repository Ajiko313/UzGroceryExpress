import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { hapticFeedback } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';

interface DeliveryOrder {
  id: number;
  status: string;
  total: string;
  customerName: string;
  customerPhone?: string;
  address: {
    street: string;
    city: string;
    district?: string;
  };
  estimatedDeliveryTime?: string;
  assignmentStatus: string;
  earnings?: string;
  items: Array<{
    quantity: number;
    product: {
      nameUz: string;
    };
  }>;
}

interface DeliveryStats {
  todayDeliveries: number;
  todayEarnings: string;
  weekEarnings: string;
  monthEarnings: string;
}

export function useDelivery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignedOrders = [], isLoading } = useQuery<DeliveryOrder[]>({
    queryKey: ['/api/delivery/assigned'],
  });

  const { data: deliveryHistory = [] } = useQuery<DeliveryOrder[]>({
    queryKey: ['/api/delivery/history'],
  });

  const { data: deliveryStats } = useQuery<DeliveryStats>({
    queryKey: ['/api/delivery/stats'],
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ 
      orderId, 
      status 
    }: { 
      orderId: number; 
      status: 'accepted' | 'picked_up' | 'delivered' 
    }) => {
      const response = await apiRequest('PATCH', `/api/delivery/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/assigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/stats'] });
      hapticFeedback.success();
      toast({
        title: "Holat yangilandi",
        description: "Buyurtma holati muvaffaqiyatli yangilandi",
      });
    },
    onError: () => {
      hapticFeedback.error();
      toast({
        title: "Xatolik",
        description: "Holatni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const getDeliveryStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      assigned: { label: "Tayinlangan", color: "telegram-blue", icon: "clock" },
      accepted: { label: "Qabul qilindi", color: "telegram-blue", icon: "check" },
      picked_up: { label: "Olingan", color: "warning-orange", icon: "package" },
      delivered: { label: "Yetkazildi", color: "success-green", icon: "check-circle" },
    };
    return statusMap[status] || statusMap.assigned;
  };

  return {
    assignedOrders,
    deliveryHistory,
    deliveryStats,
    isLoading,
    updateDeliveryStatus: updateDeliveryStatusMutation.mutate,
    isUpdatingStatus: updateDeliveryStatusMutation.isPending,
    getDeliveryStatusInfo,
  };
}
