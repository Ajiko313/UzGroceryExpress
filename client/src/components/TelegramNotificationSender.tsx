import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export function TelegramNotificationSender() {
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendNotification = async () => {
    if (!message.trim()) {
      toast({
        title: "Xatolik",
        description: "Xabar matnini kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          userRole: userRole === 'all' ? undefined : userRole,
        }),
      });

      if (response.ok) {
        toast({
          title: "Muvaffaqiyat",
          description: "Xabar Telegram foydalanuvchilariga yuborildi",
        });
        setMessage('');
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xabar yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Telegram Bildirishnomalari
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Kimga yuborish
          </label>
          <Select value={userRole} onValueChange={setUserRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha foydalanuvchilar</SelectItem>
              <SelectItem value="customer">Mijozlar</SelectItem>
              <SelectItem value="delivery_agent">Yetkazuvchilar</SelectItem>
              <SelectItem value="admin">Adminlar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Xabar matni
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bu yerga xabar matnini yozing..."
            rows={4}
          />
        </div>

        <Button 
          onClick={sendNotification} 
          disabled={isLoading || !message.trim()}
          className="w-full"
        >
          {isLoading ? 'Yuborilmoqda...' : 'Xabarni Yuborish'}
        </Button>
      </CardContent>
    </Card>
  );
}