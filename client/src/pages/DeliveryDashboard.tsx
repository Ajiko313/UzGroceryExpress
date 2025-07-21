import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, CheckCircle, Package } from "lucide-react";
import { useDelivery } from "@/hooks/useDelivery";
import { hapticFeedback } from "@/lib/telegram";
import { Link } from "wouter";

export default function DeliveryDashboard() {
  const { 
    assignedOrders, 
    deliveryHistory, 
    deliveryStats, 
    updateDeliveryStatus, 
    isUpdatingStatus 
  } = useDelivery();

  const handleStatusUpdate = (orderId: number, status: 'accepted' | 'picked_up' | 'delivered') => {
    hapticFeedback.medium();
    updateDeliveryStatus({ orderId, status });
  };

  const handleCall = (phoneNumber?: string) => {
    hapticFeedback.light();
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const handleOpenMap = (address: string) => {
    hapticFeedback.light();
    // In a real app, this would open a map with navigation
    window.open(`https://maps.google.com?q=${encodeURIComponent(address)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Salom, Yetkazuvchi!</h1>
            <p className="text-sm opacity-90">
              Bugun: {deliveryStats?.todayDeliveries || 0} ta yetkazildi
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {deliveryStats?.todayEarnings ? 
                `${parseInt(deliveryStats.todayEarnings).toLocaleString()} so'm` : 
                '0 so\'m'}
            </p>
            <p className="text-xs opacity-90">Bugungi daromad</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Active Deliveries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Faol yetkaziblar</h2>
            <Badge variant="secondary" className="bg-warning-orange text-white">
              {assignedOrders.length}
            </Badge>
          </div>

          {assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Hozirda faol yetkaziblar yo'q
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">Buyurtma #{order.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          order.assignmentStatus === 'delivered' ? 'bg-success-green text-white' :
                          order.assignmentStatus === 'picked_up' ? 'bg-warning-orange text-white' :
                          'bg-primary text-white'
                        }
                      >
                        {order.assignmentStatus === 'delivered' ? 'Yetkazildi' :
                         order.assignmentStatus === 'picked_up' ? 'Olingan' :
                         order.assignmentStatus === 'accepted' ? 'Qabul qilindi' :
                         'Tayinlangan'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.address.street}, {order.address.city}
                        </span>
                      </div>
                      {order.estimatedDeliveryTime && (
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(order.estimatedDeliveryTime).toLocaleTimeString('uz-UZ', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} ga yetkazish
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">💰</span>
                        <span>{parseInt(order.total).toLocaleString()} so'm</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {order.assignmentStatus === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'accepted')}
                          disabled={isUpdatingStatus}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Qabul qilish
                        </Button>
                      )}
                      
                      {order.assignmentStatus === 'accepted' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'picked_up')}
                          disabled={isUpdatingStatus}
                          className="flex-1 bg-warning-orange hover:bg-warning-orange/90"
                        >
                          Oldim
                        </Button>
                      )}
                      
                      {order.assignmentStatus === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          disabled={isUpdatingStatus}
                          className="flex-1 bg-success-green hover:bg-success-green/90"
                        >
                          Yetkazildi
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCall(order.customerPhone)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMap(`${order.address.street}, ${order.address.city}`)}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        {deliveryStats && (
          <Card>
            <CardHeader>
              <CardTitle>Daromad statistikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">
                    {parseInt(deliveryStats.todayEarnings || '0').toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Bugun</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-success-green">
                    {parseInt(deliveryStats.weekEarnings || '0').toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Bu hafta</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-warning-orange">
                    {parseInt(deliveryStats.monthEarnings || '0').toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Bu oy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>So'nggi yetkaziblar</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Hali yetkaziblar yo'q
              </p>
            ) : (
              <div className="space-y-3">
                {deliveryHistory.slice(0, 5).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">#{delivery.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {delivery.customerName} - Yetkazildi
                      </p>
                    </div>
                    <span className="text-sm font-medium text-success-green">
                      +{parseInt(delivery.earnings || '0').toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-background border-t border-border px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-1 text-primary">
            <Package className="h-5 w-5" />
            <span className="text-xs mt-1">Yetkaziblar</span>
          </button>
          <button className="flex flex-col items-center py-1 text-muted-foreground">
            <span className="text-lg">📊</span>
            <span className="text-xs mt-1">Statistika</span>
          </button>
          <button className="flex flex-col items-center py-1 text-muted-foreground">
            <span className="text-lg">👤</span>
            <span className="text-xs mt-1">Profil</span>
          </button>
          <Link href="/">
            <button className="flex flex-col items-center py-1 text-muted-foreground">
              <span className="text-lg">🛒</span>
              <span className="text-xs mt-1">Mijoz</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
