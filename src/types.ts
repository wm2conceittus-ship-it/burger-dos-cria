export type Screen = 'menu' | 'product_detail' | 'cart' | 'tracking' | 'kitchen';

export interface CustomerProfile {
  id?: string;
  name: string;
  phone: string;
  address: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  reference?: string;
  city?: string;
  cep?: string;
  registeredAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'burgers' | 'combos' | 'salgados' | 'bebidas' | 'pizzas' | 'sucos';
  subCategory?: 'refrigerantes';
  price: number;
  originalPrice?: number;
  costPrice?: number; // Preço de custo / CMV unitário dos insumos
  description: string;
  image: string;
  tag?: string;
  rating?: number;
  ingredients?: string[];
  isAvailable?: boolean;
  options?: {
    meatDoneness?: boolean;
    additionals?: { id: string; name: string; subtitle: string; price: number }[];
  };
}

export interface MercadoPagoConfig {
  isEnabled: boolean;
  publicKey: string;
  accessToken: string;
  environment: 'sandbox' | 'production';
  allowPix: boolean;
  allowCreditCard: boolean;
  allowCheckoutPro: boolean;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: 'moto' | 'bike' | 'carro' | 'a_pe';
  vehicleModel?: string;
  plate?: string;
  pixKey?: string;
  feePerDelivery?: number;
  dailyRate?: number;
  active: boolean;
  avatar?: string;
  totalDeliveries?: number;
  notes?: string;
}

export interface StoreSettings {
  isOpen: boolean;
  storeName: string;
  defaultDeliveryFee: number;
  estimatedDeliveryTime: string;
  autoPrintReceipts: boolean;
  soundAlerts: boolean;
  allowManualOrders: boolean;
  autoAcceptOrders?: boolean;
  whatsappSupport: string;
  openingHours: string;
  pixKey?: string;
  acceptedPaymentMethods?: string[];
  mercadoPago?: MercadoPagoConfig;
  couriers?: Courier[];
  managerPin?: string;
}

export type PizzaSize = 'P' | 'M' | 'G' | 'Família';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  meatDoneness?: 'Mal passado' | 'Ao ponto' | 'Bem passado';
  pizzaSize?: PizzaSize;
  pizzaSlices?: string;
  additionals: { id: string; name: string; price: number }[];
  notes?: string;
  totalPrice: number;
}

export type OrderStatus = 'recebido' | 'novo' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'recusado';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  type: 'Delivery' | 'Retirada' | 'Mesa';
  status: OrderStatus;
  items: {
    name: string;
    quantity: number;
    price: number;
    pizzaSize?: PizzaSize;
    notes?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  changeFor?: string;
  mercadoPagoPaymentId?: string;
  paymentStatus?: 'pendente' | 'aprovado' | 'recusado';
  address: string;
  timeAgo: string;
  isUrgent?: boolean;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierVehicle?: string;
  courierPlate?: string;
  notes?: string;
  createdAt: string;
}
