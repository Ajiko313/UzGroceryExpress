import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initTelegramApp } from "./lib/telegram";

// Pages
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderTracking from "@/pages/OrderTracking";
import DeliveryLogin from "@/pages/DeliveryLogin";
import DeliveryDashboard from "@/pages/DeliveryDashboard";
import NotFound from "@/pages/not-found";

// Layout Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, Bell, ShoppingCart, Home as HomeIcon, Receipt, User, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";

function BottomNavigation() {
  const [location] = useLocation();
  const { cartItemCount } = useCart();

  // Don't show navigation on delivery pages
  if (location.startsWith('/delivery')) {
    return null;
  }

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-background border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around">
        <Link href="/">
          <button className={`flex flex-col items-center py-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
            <HomeIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Bosh sahifa</span>
          </button>
        </Link>
        
        <Link href="/orders">
          <button className={`flex flex-col items-center py-1 ${isActive('/orders') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Receipt className="h-5 w-5" />
            <span className="text-xs mt-1">Buyurtmalar</span>
          </button>
        </Link>
        
        <Link href="/profile">
          <button className={`flex flex-col items-center py-1 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profil</span>
          </button>
        </Link>
        
        <Link href="/delivery-login">
          <button className={`flex flex-col items-center py-1 ${location.startsWith('/delivery') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Truck className="h-5 w-5" />
            <span className="text-xs mt-1">Yetkazuvchi</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}

function AppHeader() {
  const [location] = useLocation();
  const { cartItemCount } = useCart();

  // Don't show header on certain pages
  if (location.startsWith('/delivery') || location === '/checkout' || location === '/cart' || location === '/order-tracking') {
    return null;
  }

  return (
    <header className="bg-background border-b border-border px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingBasket className="text-primary h-6 w-6" />
          <h1 className="text-lg font-semibold">Oziq-ovqat yetkazib berish</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge className="absolute -top-1 -right-1 bg-warning-orange text-white text-xs w-4 h-4 flex items-center justify-center p-0">
              3
            </Badge>
          </Button>
          
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="relative p-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs min-w-[1.25rem] h-5 flex items-center justify-center p-0">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <AppHeader />
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-tracking" component={OrderTracking} />
        <Route path="/delivery-login" component={DeliveryLogin} />
        <Route path="/delivery-dashboard" component={DeliveryDashboard} />
        
        {/* Placeholder routes */}
        <Route path="/orders">
          <div className="p-4 pb-20">
            <h1 className="text-xl font-semibold mb-4">Buyurtmalar</h1>
            <p className="text-muted-foreground">Bu yerda buyurtmalar tarixi ko'rsatiladi</p>
          </div>
        </Route>
        
        <Route path="/profile">
          <div className="p-4 pb-20">
            <h1 className="text-xl font-semibold mb-4">Profil</h1>
            <p className="text-muted-foreground">Bu yerda profil ma'lumotlari ko'rsatiladi</p>
          </div>
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      
      <BottomNavigation />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize Telegram Mini App
    initTelegramApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
