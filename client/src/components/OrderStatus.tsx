import { CheckCircle, Clock, Package, Truck, Home } from "lucide-react";

interface OrderStatusProps {
  currentStatus: string;
  estimatedDeliveryTime?: string;
}

export function OrderStatus({ currentStatus, estimatedDeliveryTime }: OrderStatusProps) {
  const steps = [
    { key: 'pending', label: 'Buyurtma qabul qilindi', icon: CheckCircle, time: '14:30' },
    { key: 'accepted', label: 'Tasdiq qilindi', icon: CheckCircle, time: '14:32' },
    { key: 'packed', label: 'Mahsulotlar tayyorlandi', icon: Package, time: '14:45' },
    { key: 'on_the_way', label: "Yo'lda", icon: Truck, time: '15:00' },
    { key: 'delivered', label: 'Yetkazildi', icon: Home, time: estimatedDeliveryTime || '15:20' },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(step => step.key === stepKey);
    const currentIndex = steps.findIndex(step => step.key === currentStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const status = getStepStatus(step.key);
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center space-x-3">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                status === 'completed' 
                  ? 'bg-success-green' 
                  : status === 'current' 
                    ? 'bg-warning-orange' 
                    : 'bg-gray-300'
              }`}
            >
              <Icon className={`h-3 w-3 ${
                status === 'pending' ? 'text-gray-600' : 'text-white'
              }`} />
            </div>
            
            <div className={status === 'pending' ? 'opacity-50' : ''}>
              <p className="font-medium text-sm text-foreground">
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {status === 'current' && step.key === 'on_the_way' 
                  ? `${step.time} - hozir` 
                  : step.key === 'delivered' && status === 'pending'
                    ? `Kutilayotgan vaqt: ${step.time}`
                    : step.time
                }
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
