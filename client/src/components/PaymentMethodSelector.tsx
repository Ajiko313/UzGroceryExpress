import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS, PaymentMethod } from "@/lib/payments";
import { Shield, Smartphone, CreditCard, Banknote } from "lucide-react";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  amount: number;
  phone?: string;
  onPhoneChange?: (phone: string) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  amount,
  phone = '',
  onPhoneChange,
  className = ''
}: PaymentMethodSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const availableMethods = PAYMENT_METHODS.filter(method => method.enabled);
  const selectedMethodData = availableMethods.find(m => m.id === selectedMethod);
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'telegram_pay':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'payme':
        return <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">P</div>;
      case 'click':
        return <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">To'lov usuli</h3>
          </div>
          <Badge variant="secondary">{formatAmount(amount)}</Badge>
        </div>

        {/* Currently Selected Method */}
        {selectedMethodData && (
          <div className="mb-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
              <div className="flex items-center space-x-3">
                {getMethodIcon(selectedMethodData.id)}
                <div>
                  <p className="font-medium">{selectedMethodData.nameUz}</p>
                  <p className="text-sm text-muted-foreground">{selectedMethodData.description}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                O'zgartirish
              </Button>
            </div>
          </div>
        )}

        {/* Phone Number Input for Payme/Click */}
        {selectedMethodData?.requiresPhone && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <Label htmlFor="phone" className="text-sm font-medium">
              Telefon raqami
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => onPhoneChange?.(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMethodData.id === 'payme' 
                ? 'Payme hisobingiz bilan bog\'langan telefon raqami'
                : 'Click hisobingiz bilan bog\'langan telefon raqami'
              }
            </p>
          </div>
        )}

        {/* All Payment Methods */}
        {(isExpanded || !selectedMethodData) && (
          <div className="space-y-3">
            <Separator />
            <h4 className="text-sm font-medium text-muted-foreground">Mavjud to'lov usullari</h4>
            
            <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
              <div className="space-y-2">
                {availableMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <label htmlFor={method.id} className="flex-1 flex items-center space-x-3 cursor-pointer">
                      {getMethodIcon(method.id)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{method.nameUz}</p>
                          {method.id === 'cash' && (
                            <Badge variant="secondary" className="text-xs">Tavsiya etiladi</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {isExpanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(false)}
                className="w-full"
              >
                Yashirish
              </Button>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-green-800 dark:text-green-200 font-medium">Xavfsiz to'lov</p>
              <p className="text-green-700 dark:text-green-300">
                Barcha to'lovlar SSL shifrlash bilan himoyalangan
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}