import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, ShoppingBag, Clock, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { paymentService } from "@/lib/payments";

const checkoutSchema = z.object({
  street: z.string().min(1, "Ko'cha manzili kiritilishi shart"),
  city: z.string().min(1, "Shahar kiritilishi shart"),
  district: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  paymentMethod: z.enum(["cash", "telegram_pay", "payme", "click"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { cartItems, cartTotal, clearCart } = useCart();
  const { createOrder, isCreatingOrder } = useOrders();
  const { toast } = useToast();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      street: "",
      city: "Toshkent", 
      district: "",
      zipCode: "",
      phone: "",
      paymentMethod: "cash",
    },
  });

  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedPhone = form.watch("phone");

  const onSubmit = async (data: CheckoutForm) => {
    try {
      setIsProcessingPayment(true);
      setCurrentStep(2);

      // Validate phone if required for payment method
      if ((data.paymentMethod === 'payme' || data.paymentMethod === 'click') && !data.phone?.trim()) {
        toast({
          title: "Telefon raqami talab qilinadi",
          description: `${data.paymentMethod === 'payme' ? 'Payme' : 'Click'} uchun telefon raqami kiritilishi shart`,
          variant: "destructive",
        });
        setCurrentStep(1);
        setIsProcessingPayment(false);
        return;
      }

      // Create address
      const addressResponse = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: data.street,
          city: data.city,
          district: data.district,
          zipCode: data.zipCode,
          isDefault: true,
        }),
      });

      if (!addressResponse.ok) {
        throw new Error('Failed to create address');
      }

      const address = await addressResponse.json();
      const orderId = `order_${Date.now()}`;

      // Process payment
      const paymentResult = await paymentService.processPayment(data.paymentMethod, {
        amount: cartTotal + 5000, // Including delivery fee
        orderId,
        phone: data.phone,
        description: `Oziq-ovqat buyurtmasi - ${cartItems.length} ta mahsulot`
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // Create order
      createOrder({
        addressId: address.id,
        paymentMethod: data.paymentMethod,
      }, {
        onSuccess: (order) => {
          // Handle payment redirect for external methods
          if (paymentResult.redirectUrl && (data.paymentMethod === 'payme' || data.paymentMethod === 'click')) {
            window.open(paymentResult.redirectUrl, '_blank');
          }
          
          clearCart();
          setCurrentStep(3);
          
          setTimeout(() => {
            setLocation('/order-tracking');
          }, 3000);

          toast({
            title: "Buyurtma muvaffaqiyatli berildi!",
            description: `Buyurtma raqami: #${order.id}`,
          });
        },
      });

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Buyurtma berish jarayonida xatolik yuz berdi",
        variant: "destructive",
      });
      setCurrentStep(1);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const deliveryFee = 5000;
  const total = cartTotal + deliveryFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
        </div>
        <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
        </div>
        <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {currentStep > 3 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
        </div>
      </div>
    </div>
  );

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Buyurtma muvaffaqiyatli berildi!</h2>
            <p className="text-muted-foreground mb-4">
              Buyurtmangiz qabul qilindi va tez orada yetkazib beriladi
            </p>
            <div className="animate-pulse">
              <Clock className="h-4 w-4 inline mr-1" />
              Buyurtmani kuzatish sahifasiga yo'naltirilmoqda...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky-header sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">
            {currentStep === 1 ? 'Buyurtma berish' : currentStep === 2 ? 'To\'lov jarayoni' : 'Tasdiqlash'}
          </h1>
          <div></div>
        </div>
      </header>

      <div className="p-4">
        {renderStepIndicator()}

        {currentStep === 2 && (
          <div className="text-center mb-6 animate-fade-in">
            <div className="text-2xl mb-2">💳</div>
            <h2 className="text-lg font-semibold">To'lov qayta ishlanmoqda...</h2>
            <p className="text-muted-foreground">Iltimos kutib turing</p>
          </div>
        )}

        {currentStep === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Address */}
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Yetkazib berish manzili</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ko'cha manzili</FormLabel>
                        <FormControl>
                          <Input placeholder="Masalan: Amir Temur ko'chasi, 25-uy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shahar</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tuman (ixtiyoriy)</FormLabel>
                          <FormControl>
                            <Input placeholder="Masalan: Yashnobod" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <PaymentMethodSelector
                  selectedMethod={watchedPaymentMethod}
                  onMethodChange={(method) => form.setValue("paymentMethod", method as any)}
                  amount={total}
                  phone={watchedPhone}
                  onPhoneChange={(phone) => form.setValue("phone", phone)}
                />
              </div>

              {/* Order Summary */}
              <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Buyurtma xulosasi</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Mahsulotlar ({cartItems.length} ta)</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Yetkazib berish</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Jami</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full py-6 text-lg animate-slide-up" 
                style={{ animationDelay: '0.3s' }}
                disabled={isProcessingPayment || isCreatingOrder}
              >
                {isProcessingPayment || isCreatingOrder ? 'Qayta ishlanmoqda...' : `${formatPrice(total)} - Buyurtma berish`}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
