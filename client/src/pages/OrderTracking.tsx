import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import { OrderStatus } from "@/components/OrderStatus";
import { useOrders } from "@/hooks/useOrders";
import { backButton, hapticFeedback } from "@/lib/telegram";

export default function OrderTracking() {
  const { activeOrder, isLoading } = useOrders();

  useEffect(() => {
    backButton.show();
    return () => backButton.hide();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">Faol buyurtma yo'q</h2>
            <p className="text-muted-foreground mb-4">
              Hozirda faol buyurtmangiz mavjud emas
            </p>
            <Link href="/">
              <Button className="w-full">
                Bosh sahifaga qaytish
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCallDelivery = () => {
    hapticFeedback.light();
    if (activeOrder.deliveryAssignment?.deliveryAgent?.phoneNumber) {
      window.open(`tel:${activeOrder.deliveryAssignment.deliveryAgent.phoneNumber}`);
    }
  };

  const handleOpenMap = () => {
    hapticFeedback.light();
    // In a real app, this would open a map with delivery tracking
    alert("Xarita ochiladi...");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Buyurtma holati</h1>
          <div></div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeOrder.status === 'delivered' ? 'bg-success-green' :
                activeOrder.status === 'on_the_way' ? 'bg-warning-orange' :
                'bg-primary'
              }`}>
                <span className="text-white text-lg">
                  {activeOrder.status === 'delivered' ? '✓' :
                   activeOrder.status === 'on_the_way' ? '🚚' :
                   '⏱️'}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg">
                  {activeOrder.status === 'delivered' ? 'Yetkazildi' :
                   activeOrder.status === 'on_the_way' ? "Yo'lda" :
                   activeOrder.status === 'packed' ? 'Tayyorlandi' :
                   activeOrder.status === 'accepted' ? 'Qabul qilindi' :
                   'Kutilayotgan'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Buyurtma #{activeOrder.id}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OrderStatus 
              currentStatus={activeOrder.status}
              estimatedDeliveryTime={activeOrder.estimatedDeliveryTime}
            />
          </CardContent>
        </Card>

        {/* Delivery Person Info */}
        {activeOrder.deliveryAssignment && (
          <Card>
            <CardHeader>
              <CardTitle>Yetkazuvchi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {activeOrder.deliveryAssignment.deliveryAgent.firstName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {activeOrder.deliveryAssignment.deliveryAgent.firstName} {activeOrder.deliveryAssignment.deliveryAgent.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ⭐ 4.8 (120 sharh)
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleCallDelivery}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenMap}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle>Yetkazib berish manzili</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{activeOrder.address.street}</p>
                <p className="text-sm text-muted-foreground">
                  {activeOrder.address.district && `${activeOrder.address.district}, `}
                  {activeOrder.address.city}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Buyurtma tarkibi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {item.product.image && (
                      <img 
                        src={item.product.image} 
                        alt={item.product.nameUz}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="text-sm">
                      {item.product.nameUz} x{item.quantity}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {parseFloat(item.total).toLocaleString()} so'm
                  </span>
                </div>
              ))}
              
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Jami:</span>
                  <span className="text-primary">
                    {parseFloat(activeOrder.total).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
