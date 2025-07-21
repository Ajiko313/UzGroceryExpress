import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Truck, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { auth } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("To'g'ri email manzil kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function DeliveryLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { user, error } = await auth.signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: "Xatolik",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (user?.role !== 'delivery_agent') {
        toast({
          title: "Ruxsat berilmagan",
          description: "Siz yetkazuvchi emassiz",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Muvaffaqiyatli",
        description: "Tizimga kirildi",
      });

      setLocation('/delivery-dashboard');
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tizimga kirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Yetkazuvchi portali</CardTitle>
          <p className="text-muted-foreground">Hisobingizga kiring</p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email manzil</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="delivery@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parol</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Kirilmoqda..." : "Kirish"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mijoz sifatida davom etish
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
