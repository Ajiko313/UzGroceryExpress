import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

const checkoutSchema = z.object({
  street: z.string().min(1, "Ko'cha manzili kiritilishi shart"),
  city: z.string().min(1, "Shahar kiritilishi shart"),
  district: z.string().optional(),
  zipCode: z.string().optional(),
  paymentMethod: z.enum(["cash", "telegram_pay", "payme", "click"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
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
      paymentMethod: "cash",
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    try {
      // First create address
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

      // Then create order
      createOrder({
        addressId: address.id,
        paymentMethod: data.paymentMethod,
      }, {
        onSuccess: () => {
          clearCart();
          setLocation('/order-tracking');
        },
      });

    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmani yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const deliveryFee = 5000;
  const total = cartTotal + deliveryFee;

  const paymentOptions = [
    { 
      value: "cash", 
      label: "Naqd pul", 
      icon: Banknote,
      description: "Yetkazib berish vaqtida to'lang" 
    },
    { 
      value: "telegram_pay", 
      label: "Telegram Pay", 
      icon: Smartphone,
      description: "Telegram orqali to'lov" 
    },
    { 
      value: "payme", 
      label: "Payme UZ", 
      icon: CreditCard,
      description: "Payme kartasi orqali" 
    },
    { 
      value: "click", 
      label: "Click UZ", 
      icon: Smartphone,
      description: "Click ilovasi orqali" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Buyurtma berish</h1>
          <div></div>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Yetkazib berish manzili</CardTitle>
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
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pochta indeksi</FormLabel>
                      <FormControl>
                        <Input placeholder="100000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>To'lov usuli</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {paymentOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <div key={option.value} className="flex items-center space-x-3 border border-input rounded-lg p-3 cursor-pointer hover:bg-accent">
                              <RadioGroupItem value={option.value} id={option.value} />
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <label htmlFor={option.value} className="font-medium cursor-pointer">
                                  {option.label}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Buyurtma xulosasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.nameUz} x{item.quantity}</span>
                    <span>{(parseFloat(item.product.price) * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mahsulotlar:</span>
                  <span>{cartTotal.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Yetkazib berish:</span>
                  <span>{deliveryFee.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Jami:</span>
                  <span className="text-primary">{total.toLocaleString()} so'm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full py-3 text-lg font-medium"
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? "Yaratilmoqda..." : "Buyurtmani tasdiqlash"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
