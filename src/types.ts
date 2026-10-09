export type Screen = 'menu' | 'product_detail' | 'cart' | 'tracking' | 'kitchen' | 'profile';

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

export interface JuicePrices {
  '300ml': number;
  '500ml': number;
  '1L': number;
}

export interface PizzaPrices {
  P: number;
  M: number;
  G: number;
  Família?: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'burgers' | 'combos' | 'salgados' | 'bebidas' | 'pizzas' | 'sucos';
  subCategory?: 'cervejas' | 'refrigerantes' | 'quentes';
  price: number;
  originalPrice?: number;
  costPrice?: number; // Preço de custo / CMV unitário dos insumos
  description: string;
  image: string;
  tag?: string;
  rating?: number;
  ingredients?: string[];
  isAvailable?: boolean;
  juicePrices?: JuicePrices;
  pizzaPrices?: PizzaPrices;
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

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedTime?: string;
  distanceKm?: number;
  active: boolean;
}

export interface DeliveryAreaConfig {
  baseAddress?: string;
  radiusKm?: number;
  baseFee?: number;
  baseRadiusKm?: number;
  feePerKm?: number;
  freeDeliveryThreshold?: number;
  allowPickup?: boolean;
  calculationMode?: 'dynamic_km' | 'zones' | 'fixed';
  zones?: DeliveryZone[];
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minOrderValue?: number;
  active: boolean;
  usageCount?: number;
}

export type EmployeeRole =
  | 'garcom'
  | 'chapeiro'
  | 'cozinha'
  | 'atendente'
  | 'caixa'
  | 'gerente'
  | 'outros';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  customRoleTitle?: string;
  phone: string;
  email?: string;
  pixKey?: string;
  active: boolean; // No plantão / Ativo hoje
  shift?: 'manha' | 'tarde' | 'noite' | 'integral';
  salary?: number; // Salário mensal ou diária (R$)
  salaryType?: 'diaria' | 'mensal';
  registeredAt?: string;
  notes?: string;
  avatar?: string;
}

export interface StoreSettings {
  isOpen: boolean;
  storeName: string;
  address?: string;
  defaultDeliveryFee: number;
  estimatedDeliveryTime: string;
  autoPrintReceipts: boolean;
  soundAlerts: boolean;
  allowManualOrders: boolean;
  autoAcceptOrders?: boolean;
  allowTableOrders?: boolean;
  serviceFeePercentage?: number;
  tables?: RestaurantTable[];
  employees?: Employee[];
  whatsappSupport: string;
  openingHours: string;
  pixKey?: string;
  acceptedPaymentMethods?: string[];
  mercadoPago?: MercadoPagoConfig;
  couriers?: Courier[];
  managerPin?: string;
  deliveryArea?: DeliveryAreaConfig;
  coupons?: Coupon[];
  customMenuUrl?: string;
}

export type TableStatus = 'livre' | 'ocupada' | 'conta_pedida' | 'reservada';

export interface TableOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  pizzaSize?: PizzaSize;
  juiceSize?: JuiceSize;
  notes?: string;
  orderedAt: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  label: string;
  capacity: number;
  status: TableStatus;
  customerName?: string;
  customerPhone?: string;
  reservationTime?: string;
  peopleCount?: number;
  openedAt?: string;
  waiterName?: string;
  notes?: string;
  items: TableOrderItem[];
  serviceFeeEnabled?: boolean;
}

export type PizzaSize = 'P' | 'M' | 'G' | 'Família';
export type JuiceSize = '300ml' | '500ml' | '1L';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  meatDoneness?: 'Mal passado' | 'Ao ponto' | 'Bem passado';
  pizzaSize?: PizzaSize;
  pizzaSlices?: string;
  juiceSize?: JuiceSize;
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
  tableNumber?: number;
  peopleCount?: number;
  waiterName?: string;
  status: OrderStatus;
  items: {
    name: string;
    quantity: number;
    price: number;
    pizzaSize?: PizzaSize;
    juiceSize?: JuiceSize;
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
