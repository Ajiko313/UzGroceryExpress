import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { CartItem } from "@/components/CartItem";
import { useCart } from "@/hooks/useCart";
import { backButton } from "@/lib/telegram";
import { useEffect } from "react";

export default function Cart() {
  const { cartItems, cartTotal, updateQuantity, isUpdatingQuantity, clearCart } = useCart();

  useEffect(() => {
    backButton.show();
    return () => backButton.hide();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold mb-2">Savat bo'sh</h2>
            <p className="text-muted-foreground mb-4">
              Mahsulotlarni savatchaga qo'shing
            </p>
            <Link href="/">
              <Button className="w-full">
                Xarid qilishni boshlang
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold">Savatcha</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => clearCart()}
            className="text-destructive"
          >
            Tozalash
          </Button>
        </div>
      </header>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(cartItemId, quantity) => updateQuantity({ cartItemId, quantity })}
                isUpdating={isUpdatingQuantity}
              />
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyurtma xulosasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Mahsulotlar:</span>
              <span>{cartTotal.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Yetkazib berish:</span>
              <span>5,000 so'm</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-border pt-3">
              <span>Jami:</span>
              <span className="text-primary">
                {(cartTotal + 5000).toLocaleString()} so'm
              </span>
            </div>
          </CardContent>
        </Card>

        <Link href="/checkout">
          <Button className="w-full py-3 text-lg font-medium">
            Buyurtma berish
          </Button>
        </Link>
      </div>
    </div>
  );
}
