import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'delivery';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('PATCH', '/api/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}