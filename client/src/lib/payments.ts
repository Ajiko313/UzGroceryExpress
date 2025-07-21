// Payment Methods Configuration
export interface PaymentMethod {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  icon: string;
  enabled: boolean;
  requiresPhone?: boolean;
  description?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    nameUz: 'Naqd pul',
    nameRu: 'Наличные',
    nameEn: 'Cash',
    icon: '💵',
    enabled: true,
    description: 'Buyurtma yetkazib berilganda to\'lash'
  },
  {
    id: 'telegram_pay',
    nameUz: 'Telegram Pay',
    nameRu: 'Telegram Pay',
    nameEn: 'Telegram Pay',
    icon: '💳',
    enabled: true,
    description: 'Telegram ilovasi orqali to\'lash'
  },
  {
    id: 'payme',
    nameUz: 'Payme',
    nameRu: 'Payme',
    nameEn: 'Payme',
    icon: '🔵',
    enabled: true,
    requiresPhone: true,
    description: 'Payme karta yoki hisobi orqali'
  },
  {
    id: 'click',
    nameUz: 'Click',
    nameRu: 'Click',
    nameEn: 'Click',
    icon: '🟡',
    enabled: true,
    requiresPhone: true,
    description: 'Click karta yoki hisobi orqali'
  }
];

// Payment Gateway APIs
interface PaymentRequest {
  amount: number;
  orderId: string;
  phone?: string;
  description?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

// Payme Integration
export class PaymeService {
  private merchantId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID || '';
    this.secretKey = import.meta.env.VITE_PAYME_SECRET_KEY || '';
    this.baseUrl = import.meta.env.VITE_PAYME_BASE_URL || 'https://checkout.paycom.uz';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.merchantId || !this.secretKey) {
        throw new Error('Payme API keys not configured');
      }

      const paymentUrl = `${this.baseUrl}/${this.merchantId}?` + new URLSearchParams({
        amount: (request.amount * 100).toString(), // Convert to tiyin
        account: JSON.stringify({
          order_id: request.orderId
        }),
        description: request.description || 'Oziq-ovqat buyurtmasi',
        return_url: `${window.location.origin}/order-tracking?orderId=${request.orderId}`,
        lang: 'uz'
      }).toString();

      return {
        success: true,
        redirectUrl: paymentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; paid: boolean }> {
    // In production, this would make API calls to Payme servers
    // For now, return a placeholder implementation
    return {
      status: 'pending',
      paid: false
    };
  }
}

// Click Integration  
export class ClickService {
  private merchantId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = import.meta.env.VITE_CLICK_MERCHANT_ID || '';
    this.secretKey = import.meta.env.VITE_CLICK_SECRET_KEY || '';
    this.baseUrl = import.meta.env.VITE_CLICK_BASE_URL || 'https://my.click.uz/services/pay';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.merchantId || !this.secretKey) {
        throw new Error('Click API keys not configured');
      }

      const paymentUrl = `${this.baseUrl}?` + new URLSearchParams({
        service_id: this.merchantId,
        merchant_id: this.merchantId,
        amount: request.amount.toString(),
        transaction_param: request.orderId,
        return_url: `${window.location.origin}/order-tracking?orderId=${request.orderId}`,
        merchant_user_id: request.phone || '',
      }).toString();

      return {
        success: true,
        redirectUrl: paymentUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; paid: boolean }> {
    // Production implementation would call Click API
    return {
      status: 'pending',
      paid: false
    };
  }
}

// Telegram Payment Integration
export class TelegramPayService {
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Check if Telegram WebApp is available
      if (!window.Telegram?.WebApp) {
        throw new Error('Telegram WebApp not available');
      }

      // In production, this would integrate with Telegram Payments API
      const invoiceParams = {
        title: 'Oziq-ovqat buyurtmasi',
        description: request.description || 'Grocery delivery order',
        payload: request.orderId,
        provider_token: import.meta.env.VITE_TELEGRAM_PAYMENT_TOKEN || '',
        currency: 'UZS',
        prices: [{ label: 'Jami', amount: request.amount * 100 }], // Convert to tiyin
        need_phone_number: true,
        need_shipping_address: true
      };

      return {
        success: true,
        paymentId: `tg_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Telegram payment failed'
      };
    }
  }
}

// Payment Service Factory
export class PaymentService {
  private payme = new PaymeService();
  private click = new ClickService();
  private telegram = new TelegramPayService();

  async processPayment(method: string, request: PaymentRequest): Promise<PaymentResponse> {
    switch (method) {
      case 'cash':
        return { success: true, paymentId: `cash_${Date.now()}` };
      
      case 'payme':
        return this.payme.createPayment(request);
      
      case 'click':
        return this.click.createPayment(request);
      
      case 'telegram_pay':
        return this.telegram.createPayment(request);
      
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  async checkPaymentStatus(method: string, paymentId: string) {
    switch (method) {
      case 'payme':
        return this.payme.checkPaymentStatus(paymentId);
      case 'click':
        return this.click.checkPaymentStatus(paymentId);
      default:
        return { status: 'completed', paid: true };
    }
  }

  getAvailableMethods(): PaymentMethod[] {
    return PAYMENT_METHODS.filter(method => method.enabled);
  }
}

export const paymentService = new PaymentService();