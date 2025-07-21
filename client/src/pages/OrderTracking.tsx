import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Clock, CheckCircle, Package, Truck, Phone, Star, MessageCircle, RefreshCw } from "lucide-react";
import { Link } from "wouter";

interface OrderItem {
  id: number;
  product: {
    nameUz: string;
    price: string;
  };
  quantity: number;
}

interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  estimatedDelivery: string;
  address: {
    street: string;
    city: string;
    district?: string;
  };
  items: OrderItem[];
  deliveryAgent?: {
    name: string;
    phone: string;
    rating: number;
  };
  trackingEvents: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

export default function OrderTracking() {
  const [selectedOrderId] = useState<number>(1001);
  const [mockOrder] = useState<Order>({
    id: selectedOrderId,
    status: 'delivering',
    total: 125000,
    createdAt: '2024-01-15T10:30:00Z',
    estimatedDelivery: '2024-01-15T12:00:00Z',
    address: {
      street: "Amir Temur ko'chasi, 25-uy",
      city: "Toshkent",
      district: "Yashnobod tumani"
    },
    items: [
      {
        id: 1,
        product: { nameUz: "Pomidor", price: "8000" },
        quantity: 2
      },
      {
        id: 2,
        product: { nameUz: "Kartoshka", price: "5000" },
        quantity: 3
      },
      {
        id: 3,
        product: { nameUz: "Sabzi", price: "3000" },
        quantity: 1
      }
    ],
    deliveryAgent: {
      name: "Aziz Karimov",
      phone: "+998901234567",
      rating: 4.8
    },
    trackingEvents: [
      {
        status: 'pending',
        timestamp: '2024-01-15T10:30:00Z',
        description: 'Buyurtma qabul qilindi va tekshirilmoqda'
      },
      {
        status: 'confirmed',
        timestamp: '2024-01-15T10:35:00Z',
        description: 'Buyurtma tasdiqlandi va tayyorlash boshlandi'
      },
      {
        status: 'preparing',
        timestamp: '2024-01-15T10:45:00Z',
        description: 'Mahsulotlar yig\'ilmoqda va qadoqlanmoqda'
      },
      {
        status: 'delivering',
        timestamp: '2024-01-15T11:15:00Z',
        description: 'Yetkazuvchi buyurtmani olib ketdi va yo\'lda'
      }
    ]
  });

  // Simulate real-time updates
  const { data: order = mockOrder, isLoading, refetch } = useQuery<Order>({
    queryKey: ['/api/orders', selectedOrderId],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    initialData: mockOrder,
  });

  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending: { 
        icon: Clock, 
        text: "Kutilmoqda", 
        color: "text-orange-500",
        bgColor: "bg-orange-100 dark:bg-orange-900",
        variant: "secondary" as const
      },
      confirmed: { 
        icon: CheckCircle, 
        text: "Tasdiqlandi", 
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900",
        variant: "default" as const
      },
      preparing: { 
        icon: Package, 
        text: "Tayyorlanmoqda", 
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900",
        variant: "default" as const
      },
      delivering: { 
        icon: Truck, 
        text: "Yetkazilmoqda", 
        color: "text-purple-500",
        bgColor: "bg-purple-100 dark:bg-purple-900",
        variant: "default" as const
      },
      delivered: { 
        icon: CheckCircle, 
        text: "Yetkazildi", 
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900",
        variant: "default" as const
      },
      cancelled: {
        icon: Clock,
        text: "Bekor qilindi",
        color: "text-red-500",
        bgColor: "bg-red-100 dark:bg-red-900",
        variant: "destructive" as const
      }
    };
    
    return statusMap[status];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getTimeRemaining = (estimatedDelivery: string) => {
    const now = new Date();
    const delivery = new Date(estimatedDelivery);
    const diff = delivery.getTime() - now.getTime();
    
    if (diff <= 0) return "Yetib keldi";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} soat ${minutes % 60} daqiqa`;
    }
    return `${minutes} daqiqa`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Buyurtma ma'lumotlari yuklanmoqda...</p>
          <p className="text-sm text-muted-foreground mt-2">Iltimos kutib turing</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Buyurtma topilmadi</h2>
            <p className="text-muted-foreground mb-4">
              Ushbu buyurtma mavjud emas yoki o'chirilgan
            </p>
            <Link href="/">
              <Button className="w-full">Bosh sahifaga qaytish</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky-header sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Buyurtmani kuzatish</h1>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Order Status Card */}
        <Card className="animate-slide-up">
          <CardContent className="p-6 text-center">
            <div className={`w-20 h-20 ${statusInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
              <StatusIcon className={`h-10 w-10 ${statusInfo.color}`} />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h2 className="text-xl font-semibold">Buyurtma #{order.id}</h2>
              <Badge variant={statusInfo.variant}>
                {statusInfo.text}
              </Badge>
            </div>
            {order.status === 'delivering' && (
              <div className="bg-muted rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Taxminiy yetib kelish vaqti</p>
                <p className="text-lg font-semibold text-primary">
                  {getTimeRemaining(order.estimatedDelivery)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Tracking Timeline */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Buyurtma jarayoni</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.trackingEvents.map((event, index) => {
                const eventStatusInfo = getStatusInfo(event.status as Order['status']);
                const EventIcon = eventStatusInfo.icon;
                
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${eventStatusInfo.bgColor}`}>
                      <EventIcon className={`h-4 w-4 ${eventStatusInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Agent Info */}
        {order.deliveryAgent && order.status === 'delivering' && (
          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Yetkazuvchi ma'lumotlari</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{order.deliveryAgent.name}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{order.deliveryAgent.rating}</span>
                    <span className="text-xs text-muted-foreground">reyting</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{order.deliveryAgent.phone}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Qo'ng'iroq
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Xabar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Yetkazib berish manzili</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{order.address.street}</p>
              <p className="text-sm text-muted-foreground">
                {order.address.city}
                {order.address.district && `, ${order.address.district}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Buyurtma tarkibi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.nameUz}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(parseInt(item.product.price))} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(parseInt(item.product.price) * item.quantity)}
                  </p>
                </div>
              ))}
              
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Jami:</span>
                <span className="text-lg font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          {order.status === 'delivered' && (
            <Button className="w-full" variant="default">
              <Star className="h-4 w-4 mr-2" />
              Buyurtmani baholash
            </Button>
          )}
          
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button variant="outline" className="w-full">
              Buyurtmani bekor qilish
            </Button>
          )}
          
          <Button variant="outline" className="w-full">
            <MessageCircle className="h-4 w-4 mr-2" />
            Yordam markazi
          </Button>
          
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Bosh sahifaga qaytish
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}