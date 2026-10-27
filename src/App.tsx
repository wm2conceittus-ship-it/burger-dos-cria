/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Screen, Product, CartItem, Order, StoreSettings, CustomerProfile } from './types';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_RESTAURANT_TABLES, INITIAL_EMPLOYEES, INITIAL_DELIVERY_ZONES } from './data/mockData';
import { DEFAULT_WEEKLY_SCHEDULE } from './utils/scheduleUtils';
import { getDeliveryFeeForNeighborhood } from './utils/deliveryFee';
import {
  testFirestoreConnection,
  subscribeToOrders,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  updateOrderInFirestore,
  deleteOrderFromFirestore,
  clearAllOrdersFromFirestore,
  clearAllExpensesFromFirestore,
  subscribeToStoreSettings,
  saveStoreSettingsToFirestore,
  saveCustomerProfileToFirestore,
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveAllProductsToFirestore,
} from './services/firebase';
import {
  playNewOrderSound,
  playPixConfirmedSound,
  startTabNotificationBlink,
  startPixConfirmedTabNotification,
  unlockAudioContext,
} from './utils/audioAlert';
import { getManagerWhatsAppNotificationUrl, getCustomerRejectedWhatsAppUrl, openWhatsAppLink } from './utils/whatsappNotification';
import { MenuScreen } from './components/MenuScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CartScreen } from './components/CartScreen';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { KitchenManagerScreen } from './components/KitchenManagerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import { ScreenSwitcherBanner } from './components/ScreenSwitcherBanner';
import { ContactDriverModal } from './components/ContactDriverModal';
import { AddressModal } from './components/AddressModal';
import { CustomerRegisterModal } from './components/CustomerRegisterModal';
import { ManagerPinModal } from './components/ManagerPinModal';
import { ManualOrderModal } from './components/ManualOrderModal';
import { PrintModal } from './components/PrintModal';
import { ProductFormModal } from './components/ProductFormModal';
import { Toast } from './components/Toast';
import { mercadoPagoApi } from './services/mercadoPagoService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [kitchenTab, setKitchenTab] = useState<'pedidos' | 'mesas' | 'cardapio' | 'relatorios' | 'configuracoes'>('pedidos');
  const [products, setProducts] = useState<Product[]>(() => {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('burger_deleted_products') || '[]');
    } catch {
      deletedIds = [];
    }
    const isNotDeleted = (p: Product) => !deletedIds.includes(p.id);

    try {
      const cached = localStorage.getItem('burger_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = parsed.map((p: Product) => {
            const defaultProd = PRODUCTS.find(dp => dp.id === p.id);
            if (defaultProd) {
              return {
                ...p,
                stock: p.stock !== undefined ? p.stock : defaultProd.stock,
                minStock: p.minStock !== undefined ? p.minStock : defaultProd.minStock,
              };
            }
            return p;
          });
          return merged.filter(isNotDeleted);
        }
      }
    } catch {
      // fallback
    }
    return PRODUCTS.filter(isNotDeleted);
  });
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]); // Gourmet Truffle Burger

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    isOpen: true,
    storeName: 'Burguer dos Crias',
    address: 'Rua Augusta, 1000 - Consolação, São Paulo - SP',
    defaultDeliveryFee: 7.00,
    estimatedDeliveryTime: '20-30 min',
    autoPrintReceipts: true,
    soundAlerts: true,
    allowManualOrders: true,
    autoAcceptOrders: false,
    allowTableOrders: true,
    serviceFeePercentage: 10,
    tables: INITIAL_RESTAURANT_TABLES,
    employees: INITIAL_EMPLOYEES,
    whatsappSupport: '(88) 99217-6318',
    whatsappManagerAlert: '(88) 99217-6318',
    autoSendWhatsappAlertToManager: true,
    autoSendWhatsappOnDispatch: true,
    openingHours: 'Terça a Domingo, 18h - 00h',
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    scheduleMode: 'auto',
    pixKey: '11987654321',
    pixApprovalMode: 'automatic',
    acceptedPaymentMethods: [
      'Pix',
      'Cartão de Crédito',
      'Cartão de Débito',
      'Dinheiro',
      'Vale Refeição (VR / Sodexo / Alelo)',
    ],
    mercadoPago: {
      isEnabled: true,
      publicKey: 'TEST-98a72b4c-9f82-411a-ba73-1029837465ab',
      accessToken: 'TEST-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746',
      environment: 'sandbox',
      allowPix: true,
      allowCreditCard: true,
      allowCheckoutPro: true,
    },
    couriers: [
      {
        id: 'cour-1',
        name: 'Ricardo Souza (Cria 01)',
        phone: '(11) 98765-1122',
        vehicle: 'moto',
        vehicleModel: 'Honda CG 160 Titan (Preta)',
        plate: 'BRA-2E19',
        pixKey: 'ricardo.entregas@pix.com',
        feePerDelivery: 7.00,
        dailyRate: 60.00,
        active: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        totalDeliveries: 48,
        notes: 'Entregador oficial do turno da noite',
      },
      {
        id: 'cour-2',
        name: 'Matheus Santos (Cria Veloz)',
        phone: '(11) 97654-3344',
        vehicle: 'moto',
        vehicleModel: 'Yamaha Fazer 250 (Azul)',
        plate: 'SP-9A82',
        pixKey: '11976543344',
        feePerDelivery: 8.00,
        dailyRate: 70.00,
        active: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        totalDeliveries: 35,
        notes: 'Especialista em rotas expressas',
      },
      {
        id: 'cour-3',
        name: 'Felipe Rocha (Bike Express)',
        phone: '(11) 96123-9988',
        vehicle: 'bike',
        vehicleModel: 'Bicicleta Caloi Aro 29 c/ Bag',
        plate: '',
        pixKey: 'felipe.bike@pix.com',
        feePerDelivery: 5.00,
        dailyRate: 40.00,
        active: false,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        totalDeliveries: 19,
        notes: 'Entregas locais até 3km',
      },
    ],
    managerPin: '123456',
    deliveryArea: {
      baseAddress: 'Rua Augusta, 1000 - Consolação, São Paulo - SP',
      radiusKm: 7,
      freeDeliveryThreshold: 120.0,
      allowPickup: true,
      zones: INITIAL_DELIVERY_ZONES,
    },
    coupons: [
      {
        id: 'coup-1',
        code: 'CRIAS10',
        description: '10% de desconto em todo o pedido',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 30,
        active: true,
        usageCount: 142,
      },
      {
        id: 'coup-2',
        code: 'FOGO20',
        description: '20% OFF exclusivo para novos clientes',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 45,
        active: true,
        usageCount: 89,
      },
      {
        id: 'coup-3',
        code: 'FRETEGRATIS',
        description: 'Taxa de entrega grátis para compras acima de R$ 50',
        discountType: 'free_shipping',
        discountValue: 0,
        minOrderValue: 50,
        active: true,
        usageCount: 64,
      },
      {
        id: 'coup-4',
        code: 'BURGER15',
        description: 'R$ 15,00 de desconto no combo',
        discountType: 'fixed',
        discountValue: 15,
        minOrderValue: 60,
        active: true,
        usageCount: 31,
      },
    ],
  });
  
  // Initial cart: starts 100% empty so customers always receive a clean menu with 0 items selected
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Garantir 100% que nenhum item residual de sessões ou caches antigos persista ao abrir o app
  useEffect(() => {
    try {
      localStorage.removeItem('burger_cart_items');
      sessionStorage.removeItem('burger_cart_items');
    } catch {
      // ignore
    }
    setCartItems([]);
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('Rua das Flores, 123 - Apto 42, Centro, São Paulo - SP - CEP: 01001-000');

  // Customer Profile State (Persisted in localStorage and synced to Firestore)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() => {
    try {
      const saved = localStorage.getItem('burger_customer_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore parse errors
    }
    return null;
  });
  const [isCustomerRegisterOpen, setIsCustomerRegisterOpen] = useState(false);

  // Manager Authentication & PIN Protection State
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Detecção de Modo Cliente vs Modo Gestor:
  // Se o link contiver ?cliente=1 (ou cliente=true, mesa=...), vier do WhatsApp, ou estiver no link público compartilhado,
  // oculta completamente o ícone do gestor para o cliente.
  // O ícone do gestor é exibido apenas no site do app web para o gestor (com ?gestor=1 ou se autenticado com PIN).
  const [isClientMode, setIsClientMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    const referrer = (document.referrer || '').toLowerCase();
    const userAgent = (navigator.userAgent || '').toLowerCase();

    // Se o gestor explicitamente acessou com o link de gestão (?gestor=1 ou ?admin=1)
    if (params.get('gestor') === '1' || params.get('admin') === '1') {
      try { sessionStorage.removeItem('burger_client_mode'); } catch {}
      return false;
    }

    // Se veio do WhatsApp ou de links compartilhados para clientes
    const isFromWhatsApp =
      referrer.includes('whatsapp') ||
      referrer.includes('wa.me') ||
      userAgent.includes('whatsapp') ||
      params.get('origem') === 'whatsapp' ||
      params.get('utm_source') === 'whatsapp';

    const isClientUrl =
      params.get('cliente') === '1' ||
      params.get('cliente') === 'true' ||
      params.get('modo') === 'cliente' ||
      params.has('mesa');

    if (isFromWhatsApp || isClientUrl) {
      try { sessionStorage.setItem('burger_client_mode', '1'); } catch {}
      return true;
    }

    // Se já foi marcado como cliente nesta sessão
    try {
      if (sessionStorage.getItem('burger_client_mode') === '1') {
        return true;
      }
    } catch {}

    // No Shared App URL (ais-pre-*) enviado aos clientes, sempre trata como cliente por padrão para ocultar o gestor
    const isSharedPublicUrl = window.location.hostname.includes('ais-pre-');
    if (isSharedPublicUrl) {
      try { sessionStorage.setItem('burger_client_mode', '1'); } catch {}
      return true;
    }

    // No app web do gestor (desenvolvimento / localhost / ais-dev-*), o gestor tem acesso ao ícone
    return false;
  });

  // Modals state
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleOpenKitchen = () => {
    setKitchenTab('pedidos');
    if (isManagerAuthenticated) {
      setCurrentScreen('kitchen');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleOpenManageMenu = () => {
    setKitchenTab('cardapio');
    if (isManagerAuthenticated) {
      setCurrentScreen('kitchen');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsManagerAuthenticated(true);
    setIsClientMode(false);
    try {
      sessionStorage.removeItem('burger_client_mode');
    } catch {}
    setIsPinModalOpen(false);
    setCurrentScreen('kitchen');
    showToast('Acesso de Gestor autenticado! 🔥');
  };

  const handleLockManager = () => {
    setIsManagerAuthenticated(false);
    setCurrentScreen('menu');
    showToast('Painel do Gestor bloqueado com segurança!');
  };

  const handleNavigateScreen = (screen: Screen) => {
    if (screen === 'kitchen') {
      handleOpenKitchen();
    } else {
      setCurrentScreen(screen);
    }
  };

  // Sincroniza endereço caso perfil já exista
  useEffect(() => {
    if (customerProfile?.address) {
      setDeliveryAddress(customerProfile.address);
    }
  }, [customerProfile]);

  // Persiste itens do carrinho na sessão do cliente apenas se houver itens
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        sessionStorage.setItem('burger_cart_items', JSON.stringify(cartItems));
      } else {
        sessionStorage.removeItem('burger_cart_items');
      }
    } catch {
      // ignore
    }
  }, [cartItems]);

  const handleSaveCustomerProfile = (profile: CustomerProfile) => {
    setCustomerProfile(profile);
    setDeliveryAddress(profile.address);
    try {
      localStorage.setItem('burger_customer_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
    saveCustomerProfileToFirestore(profile);
    setIsCustomerRegisterOpen(false);
    showToast(`Cadastro salvo com sucesso! Bem-vindo(a), ${profile.name.split(' ')[0]}! 🔥`);
  };

  // Rastreamento para disparo de alerta sonoro em novos pedidos e confirmação de PIX
  const isInitialOrdersLoad = useRef(true);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const knownPaymentStatuses = useRef<Map<string, string>>(new Map());

  // Firebase Real-time Synchronization on Mount
  useEffect(() => {
    testFirestoreConnection();

    // Subscribe to orders in Firestore
    const unsubscribeOrders = subscribeToOrders(firestoreOrders => {
      // Filter out any legacy mock test orders from Firestore
      const legacyMockIds = ['ord-2489', 'ord-2487', 'ord-2486', 'ord-2490', 'ord-1234', 'ord-mesa-01', 'ord-mesa-03'];
      const realOrders = (firestoreOrders || []).filter(
        o => !legacyMockIds.includes(o.id) && !o.id.startsWith('ord-24') && o.id !== 'ord-1234'
      );

      if (isInitialOrdersLoad.current) {
        isInitialOrdersLoad.current = false;
        knownOrderIds.current = new Set(realOrders.map(o => o.id));
        realOrders.forEach(o => {
          knownPaymentStatuses.current.set(o.id, o.paymentStatus || 'pendente');
        });
      } else {
        // Detecta novos pedidos que entraram no Firebase em tempo real (inclusive se auto-aceito para 'preparando')
        const incomingOrders = realOrders.filter(
          o => !knownOrderIds.current.has(o.id) && (o.status === 'novo' || o.status === 'recebido' || o.status === 'preparando')
        );

        if (incomingOrders.length > 0) {
          if (storeSettings.soundAlerts !== false) {
            playNewOrderSound();
            startTabNotificationBlink(incomingOrders[0].orderNumber);
          }
          showToast(`🔔 Novo pedido #${incomingOrders[0].orderNumber} recebido na cozinha!`);
        }

        // Detecta Pix confirmado pelo banco em tempo real (mudança de pendente para aprovado)
        realOrders.forEach(o => {
          const isPix = Boolean(o.paymentMethod && o.paymentMethod.toLowerCase().includes('pix'));
          const prevStatus = knownPaymentStatuses.current.get(o.id);
          const currentStatus = o.paymentStatus;

          if (isPix && currentStatus === 'aprovado' && prevStatus && prevStatus !== 'aprovado') {
            if (storeSettings.soundAlerts !== false) {
              playPixConfirmedSound();
              startPixConfirmedTabNotification(o.orderNumber, o.total);
            }
            showToast(`💰 PIX CONFIRMADO PELO BANCO! Pedido #${o.orderNumber} (R$ ${(o.total || 0).toFixed(2).replace('.', ',')})`);
          }

          if (currentStatus) {
            knownPaymentStatuses.current.set(o.id, currentStatus);
          }
        });

        knownOrderIds.current = new Set(realOrders.map(o => o.id));
      }

      setOrders(realOrders);
      setActiveTrackingOrder(prev => {
        if (!prev) return null;
        const fresh = realOrders.find(o => o.id === prev.id);
        return fresh || prev;
      });
    });

    // Subscribe to store settings in Firestore
    const unsubscribeSettings = subscribeToStoreSettings(remoteSettings => {
      if (remoteSettings && remoteSettings.storeName) {
        const cleanedEmployees = remoteSettings.employees
          ? remoteSettings.employees.filter((e: any) => e.role !== 'motoboy')
          : undefined;

        // Clean any legacy mock occupied tables from Firestore test seeds (e.g. Mariana Costa, Lucas Rocha, conta_pedida, etc.)
        const hasCleanedLegacyTables = sessionStorage.getItem('burger_cleaned_legacy_tables_v3');
        let hadLegacyMockTables = false;
        const cleanedTables = remoteSettings.tables?.map((table: any) => {
          const rawName = (table.customerName || '').toLowerCase();
          const isMockCustomer =
            rawName.includes('lucas') ||
            rawName.includes('mariana') ||
            rawName.includes('gustavo') ||
            rawName.includes('silveira') ||
            rawName.includes('albuquerque') ||
            rawName.includes('cliente') ||
            rawName.includes('teste');

          const isStaleContaPedida = table.status === 'conta_pedida';
          const isStaleOccupied = table.status === 'ocupada' && (isMockCustomer || !hasCleanedLegacyTables);

          if (isMockCustomer || isStaleContaPedida || isStaleOccupied) {
            hadLegacyMockTables = true;
            return {
              ...table,
              status: 'livre',
              customerName: undefined,
              customerPhone: undefined,
              peopleCount: undefined,
              openedAt: undefined,
              waiterName: undefined,
              notes: undefined,
              reservationTime: undefined,
              serviceFeeEnabled: true,
              items: [],
            };
          }
          return table;
        });

        if (hadLegacyMockTables && cleanedTables) {
          sessionStorage.setItem('burger_cleaned_legacy_tables_v3', 'true');
          saveStoreSettingsToFirestore({
            ...remoteSettings,
            tables: cleanedTables,
          });
        }

        const normalizedPin = remoteSettings.managerPin
          ? remoteSettings.managerPin.length === 6
            ? remoteSettings.managerPin
            : remoteSettings.managerPin === '1234'
            ? '123456'
            : remoteSettings.managerPin.padEnd(6, '0')
          : '123456';

        setStoreSettings(prev => {
          const mergedDeliveryArea = {
            ...(prev.deliveryArea || {}),
            ...(remoteSettings.deliveryArea || {}),
            zones:
              remoteSettings.deliveryArea?.zones && remoteSettings.deliveryArea.zones.length > 0
                ? remoteSettings.deliveryArea.zones
                : prev.deliveryArea?.zones && prev.deliveryArea.zones.length > 0
                ? prev.deliveryArea.zones
                : INITIAL_DELIVERY_ZONES,
          };

          return {
            ...prev,
            ...remoteSettings,
            deliveryArea: mergedDeliveryArea,
            whatsappSupport: remoteSettings.whatsappSupport || prev.whatsappSupport || '(88) 99217-6318',
            whatsappManagerAlert: remoteSettings.whatsappManagerAlert || remoteSettings.whatsappSupport || prev.whatsappManagerAlert || '(88) 99217-6318',
            autoSendWhatsappAlertToManager: remoteSettings.autoSendWhatsappAlertToManager !== false,
            autoSendWhatsappOnDispatch: remoteSettings.autoSendWhatsappOnDispatch !== false,
            managerPin: normalizedPin,
            tables: cleanedTables || prev.tables,
            employees: cleanedEmployees || prev.employees,
          };
        });
      }
    });

    // Subscribe to products in Firestore
    const unsubscribeProducts = subscribeToProducts(firestoreProducts => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('burger_deleted_products') || '[]');
        } catch {
          deletedIds = [];
        }
        const isNotDeleted = (p: Product) => !deletedIds.includes(p.id);

        setProducts(prev => {
          const map = new Map<string, Product>();
          prev.filter(isNotDeleted).forEach(p => map.set(p.id, p));
          firestoreProducts.filter(isNotDeleted).forEach(p => map.set(p.id, p));
          const merged = Array.from(map.values()).filter(isNotDeleted);
          try {
            localStorage.setItem('burger_products', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSettings();
      unsubscribeProducts();
    };
  }, []);

  const handleUpdateStoreSettings = (newSettings: StoreSettings) => {
    const cleanedSettings: StoreSettings = {
      ...newSettings,
      employees: newSettings.employees
        ? newSettings.employees.filter((e: any) => e.role !== 'motoboy')
        : newSettings.employees,
    };
    setStoreSettings(cleanedSettings);
    saveStoreSettingsToFirestore(cleanedSettings);
    showToast('Configurações sincronizadas no Firebase!');
  };

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
    showToast(`Adicionado ao carrinho: ${item.product.name}!`);
    setCurrentScreen('cart');
  };

  const handleQuickAdd = (product: Product) => {
    if (product.isAvailable === false) {
      showToast('Item temporariamente esgotado!');
      return;
    }
    if (product.category === 'sucos' || product.category === 'pizzas') {
      setSelectedProduct(product);
      setCurrentScreen('product_detail');
      return;
    }
    const newItem: CartItem = {
      id: `cart-quick-${Date.now()}`,
      product,
      quantity: 1,
      meatDoneness: product.options?.meatDoneness ? 'Ao ponto' : undefined,
      additionals: [],
      totalPrice: product.price,
    };
    setCartItems(prev => [...prev, newItem]);
    showToast(`${product.name} adicionado ao carrinho!`);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const singlePrice = item.totalPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalPrice: singlePrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
    showToast('Item removido do carrinho');
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      sessionStorage.removeItem('burger_cart_items');
      localStorage.removeItem('burger_cart_items');
    } catch {
      // ignore
    }
    showToast('Carrinho esvaziado com sucesso!');
  };

  // Checkout -> Create new order and go to tracking
  const handleCheckout = (
    paymentMethod: string,
    discountAmount: number,
    changeFor?: string,
    mercadoPagoPaymentId?: string,
    orderType: 'Delivery' | 'Retirada' | 'Mesa' = 'Delivery',
    tableNumber?: number,
    pixReceiptUrl?: string,
    customPaymentStatus?: 'pendente' | 'aprovado' | 'recusado',
    customDeliveryFee?: number,
    chosenNeighborhood?: string
  ) => {
    if (!customerProfile) {
      setIsCustomerRegisterOpen(true);
      showToast('Por favor, conclua seu cadastro para enviar o pedido!');
      return;
    }

    const isTableOrder = orderType === 'Mesa';
    const isPickupOrder = orderType === 'Retirada';
    const subtotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);

    // Cálculo da taxa de entrega cobrada por Bairro
    const neighborhoodFeeResult = getDeliveryFeeForNeighborhood(
      chosenNeighborhood || customerProfile.neighborhood || customerProfile.address || deliveryAddress,
      storeSettings
    );

    const deliveryFee = isTableOrder || isPickupOrder
      ? 0.00
      : customDeliveryFee !== undefined
      ? customDeliveryFee
      : neighborhoodFeeResult.fee;

    const total = Math.max(0, subtotal + deliveryFee - discountAmount);
    const newOrderNum = isTableOrder
      ? `#MESA-${tableNumber || 1}`
      : `#${Math.floor(1000 + Math.random() * 9000)}`;

    const isAutoAccept = Boolean(storeSettings.autoAcceptOrders);
    const activeCouriers = (storeSettings.couriers || []).filter(c => c.active);
    const assignedCourier = !isTableOrder && !isPickupOrder && activeCouriers.length > 0 ? activeCouriers[0] : undefined;

    // Se já existir um pedido especificamente vinculado a este ID de pagamento Mercado Pago, atualiza o status de pagamento
    const existingOrder = mercadoPagoPaymentId
      ? orders.find(o => o.mercadoPagoPaymentId === mercadoPagoPaymentId)
      : null;

    if (existingOrder) {
      const finalPaymentStatus =
        customPaymentStatus ||
        (mercadoPagoPaymentId ? 'aprovado' : existingOrder.paymentStatus || 'pendente');

      const updatedOrder: Order = {
        ...existingOrder,
        paymentStatus: finalPaymentStatus,
        paymentMethod: paymentMethod || existingOrder.paymentMethod,
        changeFor: changeFor || existingOrder.changeFor,
        mercadoPagoPaymentId: mercadoPagoPaymentId || existingOrder.mercadoPagoPaymentId,
        pixReceiptUrl: pixReceiptUrl || existingOrder.pixReceiptUrl,
        deliveryFee: existingOrder.deliveryFee ?? deliveryFee,
        total: existingOrder.total ?? total,
        status:
          finalPaymentStatus === 'aprovado' && existingOrder.status === 'novo' && isAutoAccept
            ? 'preparando'
            : existingOrder.status,
      };

      setOrders(prev => prev.map(o => (o.id === existingOrder.id ? updatedOrder : o)));
      updateOrderInFirestore(existingOrder.id, {
        paymentStatus: finalPaymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        mercadoPagoPaymentId: updatedOrder.mercadoPagoPaymentId,
        pixReceiptUrl: updatedOrder.pixReceiptUrl,
        deliveryFee: updatedOrder.deliveryFee,
        total: updatedOrder.total,
        status: updatedOrder.status,
      });

      if (finalPaymentStatus === 'aprovado') {
        if (storeSettings.soundAlerts !== false) {
          playPixConfirmedSound();
          startPixConfirmedTabNotification(updatedOrder.orderNumber, updatedOrder.total);
        }
        showToast(`💰 Pix do Pedido #${updatedOrder.orderNumber} Confirmado!`);
      }

      setActiveTrackingOrder(updatedOrder);
      if (finalPaymentStatus === 'aprovado') {
        setCartItems([]);
      }
      return;
    }

    const neighborhoodLabel = chosenNeighborhood || customerProfile.neighborhood;
    let effectiveAddress = isTableOrder
      ? `Consumo no Local • Mesa ${tableNumber || 1}`
      : isPickupOrder
      ? 'Retirada no Balcão da Loja'
      : customerProfile.address || deliveryAddress;

    if (!isTableOrder && !isPickupOrder && neighborhoodLabel && !effectiveAddress.toLowerCase().includes(neighborhoodLabel.toLowerCase())) {
      effectiveAddress += ` - Bairro: ${neighborhoodLabel}`;
    }

    if (!isTableOrder && !isPickupOrder && customerProfile.cep && !effectiveAddress.toLowerCase().includes('cep:')) {
      effectiveAddress += ` - CEP: ${customerProfile.cep}`;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNum,
      customerName: customerProfile.name,
      customerPhone: customerProfile.phone,
      type: orderType,
      tableNumber: isTableOrder ? tableNumber || 1 : undefined,
      status: isAutoAccept ? 'preparando' : 'novo',
      timeAgo: isAutoAccept ? 'Aceito automaticamente' : 'Acabou de ser feito',
      address: effectiveAddress,
      latitude: !isTableOrder && !isPickupOrder ? customerProfile.latitude : undefined,
      longitude: !isTableOrder && !isPickupOrder ? customerProfile.longitude : undefined,
      paymentMethod,
      changeFor,
      mercadoPagoPaymentId,
      pixReceiptUrl,
      paymentStatus:
        customPaymentStatus ||
        (mercadoPagoPaymentId
          ? 'aprovado'
          : paymentMethod.toLowerCase().includes('online')
          ? 'aprovado'
          : 'pendente'),
      items: cartItems.map(ci => ({
        name: `${ci.product.name}${ci.pizzaSize ? ` [Tam: ${ci.pizzaSize}]` : ''}${ci.juiceSize ? ` [${ci.juiceSize === '1L' ? '1 Litro (1lt)' : ci.juiceSize}]` : ''}${ci.meatDoneness ? ` (${ci.meatDoneness})` : ''}`,
        quantity: ci.quantity,
        price: ci.totalPrice / ci.quantity,
        pizzaSize: ci.pizzaSize,
        juiceSize: ci.juiceSize,
        notes: ci.notes || (ci.additionals.length > 0 ? ci.additionals.map(a => a.name).join(', ') : undefined),
      })),
      subtotal,
      deliveryFee,
      total,
      courierName: assignedCourier?.name,
      courierPhone: assignedCourier?.phone,
      courierAvatar: assignedCourier?.avatar,
      courierVehicle: assignedCourier?.vehicleModel || (assignedCourier?.vehicle ? `Veículo (${assignedCourier.vehicle})` : undefined),
      courierPlate: assignedCourier?.plate,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderDate: new Date().toLocaleDateString('pt-BR'),
    };

    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(err => {
      console.error('Falha ao salvar pedido no Firestore:', err);
      // Segunda tentativa automática em caso de oscilação momentânea de conexão
      setTimeout(() => {
        saveOrderToFirestore(newOrder).catch(retryErr => {
          console.error('Segunda tentativa de salvar no Firestore falhou:', retryErr);
        });
      }, 1200);
    });

    // Deduz estoque em tempo real para itens que possuem controle de estoque
    setProducts(prevProducts => {
      let hasStockChange = false;
      const updated = prevProducts.map(p => {
        const orderedItem = cartItems.find(ci => ci.product.id === p.id);
        if (orderedItem && p.stock !== undefined) {
          hasStockChange = true;
          const newStock = Math.max(0, p.stock - orderedItem.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });
      if (hasStockChange) {
        saveAllProductsToFirestore(updated);
        try {
          localStorage.setItem('burger_manager_products', JSON.stringify(updated));
        } catch {}
      }
      return hasStockChange ? updated : prevProducts;
    });

    // If it's a table order, sync with storeSettings.tables!
    if (isTableOrder && tableNumber) {
      const currentTables = storeSettings.tables || [];
      const updatedTables = currentTables.map(t => {
        if (t.number === tableNumber) {
          const newItems = cartItems.map(ci => ({
            id: `ti-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: ci.product.name,
            quantity: ci.quantity,
            price: ci.product.price,
            notes: ci.notes,
            orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          return {
            ...t,
            status: 'ocupada' as const,
            customerName: customerProfile.name,
            peopleCount: t.peopleCount || 2,
            openedAt: t.openedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: [...t.items, ...newItems],
            serviceFeeEnabled: true,
          };
        }
        return t;
      });
      handleUpdateStoreSettings({ ...storeSettings, tables: updatedTables });
    }

    knownOrderIds.current.add(newOrder.id);
    if (storeSettings.soundAlerts !== false) {
      playNewOrderSound();
    }

    // Alerta automático no WhatsApp do Gestor avisando sobre o novo pedido
    const shouldSendWhatsappAlert = storeSettings.autoSendWhatsappAlertToManager !== false;
    if (shouldSendWhatsappAlert) {
      try {
        const whatsappUrl = getManagerWhatsAppNotificationUrl(newOrder, storeSettings);
        // Abre o link do WhatsApp para envio imediato da notificação ao gestor
        setTimeout(() => {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }, 350);
      } catch (err) {
        console.warn('Erro ao abrir alerta de WhatsApp para o gestor:', err);
      }
    }

    setActiveTrackingOrder(newOrder);
    setCartItems([]);
    showToast(
      isTableOrder
        ? `Pedido da Mesa ${tableNumber || 1} enviado direto para a chapa da cozinha! 🍽️🔥`
        : isAutoAccept
        ? `Pedido ${newOrderNum} realizado e salvo no Firebase! Aceito na cozinha 🔥`
        : `Pedido ${newOrderNum} realizado e sincronizado no Firebase! 🔥`
    );
    setCurrentScreen('tracking');
  };

  // Kitchen operations
  const handleKitchenAcceptOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'preparando' } : o))
    );
    setActiveTrackingOrder(prev => (prev?.id === orderId ? { ...prev, status: 'preparando' } : prev));
    updateOrderStatusInFirestore(orderId, 'preparando');
    showToast('Pedido aceito na cozinha! Preparando...');
  };

  const handleKitchenRejectOrder = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'recusado' } : o))
    );
    setActiveTrackingOrder(prev => (prev?.id === orderId ? { ...prev, status: 'recusado' } : prev));
    updateOrderStatusInFirestore(orderId, 'recusado');

    if (targetOrder && targetOrder.customerPhone) {
      try {
        const rejectionUrl = getCustomerRejectedWhatsAppUrl(targetOrder, storeSettings);
        if (rejectionUrl) {
          openWhatsAppLink(rejectionUrl);
        }
      } catch (err) {
        console.warn('Erro ao abrir WhatsApp de cancelamento:', err);
      }
    }

    showToast('Pedido recusado e aviso enviado ao cliente!');
  };

  const handleKitchenAdvanceToReady = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'pronto' } : o))
    );
    setActiveTrackingOrder(prev => (prev?.id === orderId ? { ...prev, status: 'pronto' } : prev));
    updateOrderStatusInFirestore(orderId, 'pronto');
    showToast('Pedido pronto para retirada ou entrega!');
  };

  const handleKitchenAdvanceToDelivery = (
    orderId: string,
    courierInfo?: { name: string; phone?: string; avatar?: string; vehicle?: string; plate?: string },
    updatedCustomerPhone?: string
  ) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'em_entrega',
            customerPhone: updatedCustomerPhone || o.customerPhone,
            courierName: courierInfo?.name || o.courierName,
            courierPhone: courierInfo?.phone || o.courierPhone,
            courierAvatar: courierInfo?.avatar || o.courierAvatar,
            courierVehicle: courierInfo?.vehicle || o.courierVehicle,
            courierPlate: courierInfo?.plate || o.courierPlate,
          };
        }
        return o;
      })
    );
    setActiveTrackingOrder(prev => {
      if (prev?.id !== orderId) return prev;
      return {
        ...prev,
        status: 'em_entrega',
        customerPhone: updatedCustomerPhone || prev.customerPhone,
        courierName: courierInfo?.name || prev.courierName,
        courierPhone: courierInfo?.phone || prev.courierPhone,
        courierAvatar: courierInfo?.avatar || prev.courierAvatar,
        courierVehicle: courierInfo?.vehicle || prev.courierVehicle,
        courierPlate: courierInfo?.plate || prev.courierPlate,
      };
    });
    const updatePayload: any = {
      status: 'em_entrega',
    };
    if (courierInfo) {
      updatePayload.courierName = courierInfo.name;
      updatePayload.courierPhone = courierInfo.phone;
      updatePayload.courierAvatar = courierInfo.avatar;
      updatePayload.courierVehicle = courierInfo.vehicle;
      updatePayload.courierPlate = courierInfo.plate;
    }
    if (updatedCustomerPhone) {
      updatePayload.customerPhone = updatedCustomerPhone;
    }
    updateOrderInFirestore(orderId, updatePayload);
  };

  const handleKitchenCompleteOrder = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    const shouldMarkReceived = target ? target.paymentStatus !== 'aprovado' : true;
    const finalPaymentStatus: 'aprovado' | 'pendente' | 'recusado' = shouldMarkReceived ? 'aprovado' : (target?.paymentStatus || 'aprovado');

    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'entregue', paymentStatus: finalPaymentStatus } : o))
    );
    setActiveTrackingOrder(prev => (prev?.id === orderId ? { ...prev, status: 'entregue', paymentStatus: finalPaymentStatus } : prev));
    updateOrderInFirestore(orderId, {
      status: 'entregue',
      paymentStatus: finalPaymentStatus,
    });
    showToast('Pedido finalizado e pagamento marcado como Recebido! ✅');
  };

  const handleKitchenUpdateStatus = (orderId: string, newStatus: any) => {
    const isCompleted = newStatus === 'entregue' || newStatus === 'concluido';
    const finalStatus = newStatus === 'concluido' ? 'entregue' : newStatus;

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const updatedPayment = isCompleted && o.paymentStatus !== 'aprovado' ? 'aprovado' : o.paymentStatus;
          return { ...o, status: finalStatus, paymentStatus: updatedPayment };
        }
        return o;
      })
    );
    setActiveTrackingOrder(prev => {
      if (prev?.id !== orderId) return prev;
      const updatedPayment = isCompleted && prev.paymentStatus !== 'aprovado' ? 'aprovado' : prev.paymentStatus;
      return { ...prev, status: finalStatus, paymentStatus: updatedPayment };
    });

    const payload: any = { status: finalStatus };
    if (isCompleted) {
      payload.paymentStatus = 'aprovado';
    }
    updateOrderInFirestore(orderId, payload);
  };

  const handleUpdatePaymentStatus = (orderId: string, status: 'pendente' | 'aprovado' | 'recusado') => {
    const targetOrder = orders.find(o => o.id === orderId);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
    setActiveTrackingOrder(prev => (prev?.id === orderId ? { ...prev, paymentStatus: status } : prev));
    updateOrderInFirestore(orderId, { paymentStatus: status });

    if (status === 'aprovado') {
      if (storeSettings.soundAlerts !== false) {
        playPixConfirmedSound();
        if (targetOrder) {
          startPixConfirmedTabNotification(targetOrder.orderNumber, targetOrder.total);
        }
      }
      const isPix = Boolean(targetOrder?.paymentMethod && targetOrder.paymentMethod.toLowerCase().includes('pix'));
      const isCash = Boolean(targetOrder?.paymentMethod && targetOrder.paymentMethod.toLowerCase().includes('dinheiro'));
      const isCard = Boolean(targetOrder?.paymentMethod && (
        targetOrder.paymentMethod.toLowerCase().includes('cart') ||
        targetOrder.paymentMethod.toLowerCase().includes('créd') ||
        targetOrder.paymentMethod.toLowerCase().includes('deb') ||
        targetOrder.paymentMethod.toLowerCase().includes('maquininha')
      ));

      if (isPix) {
        showToast(targetOrder ? `💰 Pix do Pedido #${targetOrder.orderNumber} Confirmado!` : '✓ Pagamento Pix aprovado!');
      } else if (isCash) {
        showToast(targetOrder ? `💵 Pagamento em Dinheiro do Pedido #${targetOrder.orderNumber} Recebido!` : '✓ Dinheiro recebido!');
      } else if (isCard) {
        showToast(targetOrder ? `💳 Pagamento na Maquininha do Pedido #${targetOrder.orderNumber} Recebido!` : '✓ Cartão recebido!');
      } else {
        showToast(targetOrder ? `✓ Pagamento do Pedido #${targetOrder.orderNumber} marcado como Recebido!` : '✓ Pagamento recebido!');
      }
    } else {
      showToast('Status de pagamento atualizado.');
    }
  };

  // Leitura automática e contínua do status de pagamentos Pix via API do Mercado Pago
  useEffect(() => {
    const isAutoReadEnabled = storeSettings.mercadoPago?.autoPixReadEnabled ?? true;
    if (!isAutoReadEnabled) return;

    const pendingPixOrders = orders.filter(
      o => o.paymentStatus === 'pendente' && o.mercadoPagoPaymentId
    );
    if (pendingPixOrders.length === 0) return;

    const pollInterval = Math.max(2000, (storeSettings.mercadoPago?.autoPixReadInterval || 3) * 1000);

    const interval = setInterval(async () => {
      for (const ord of pendingPixOrders) {
        if (!ord.mercadoPagoPaymentId) continue;
        try {
          const res = await mercadoPagoApi.checkPaymentStatus(
            ord.mercadoPagoPaymentId,
            storeSettings.mercadoPago?.accessToken
          );
          if (res.approved) {
            handleUpdatePaymentStatus(ord.id, 'aprovado');
            showToast(`🎉 Pix do Pedido ${ord.orderNumber} Validado e Recebido via Mercado Pago!`);
          }
        } catch {
          // ignore transient polling errors
        }
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [
    orders,
    storeSettings.mercadoPago?.accessToken,
    storeSettings.mercadoPago?.autoPixReadEnabled,
    storeSettings.mercadoPago?.autoPixReadInterval,
  ]);

  const handleManualOrderAdd = (newOrder: Order) => {
    knownOrderIds.current.add(newOrder.id);
    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder);

    // Deduz estoque em tempo real para itens do pedido manual
    setProducts(prevProducts => {
      let hasStockChange = false;
      const updated = prevProducts.map(p => {
        const orderedItem = newOrder.items.find(
          item => item.name.toLowerCase() === p.name.toLowerCase()
        );
        if (orderedItem && p.stock !== undefined) {
          hasStockChange = true;
          const newStock = Math.max(0, p.stock - orderedItem.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });
      if (hasStockChange) {
        saveAllProductsToFirestore(updated);
        try {
          localStorage.setItem('burger_manager_products', JSON.stringify(updated));
        } catch {}
      }
      return hasStockChange ? updated : prevProducts;
    });

    if (storeSettings.soundAlerts !== false) {
      playNewOrderSound();
    }
    showToast(`Pedido ${newOrder.orderNumber} adicionado e sincronizado no Firebase!`);
  };

  const handleClearOrders = async () => {
    try {
      await clearAllOrdersFromFirestore();
      await clearAllExpensesFromFirestore();
      try {
        localStorage.removeItem('burger_manager_expenses');
      } catch {
        // ignore
      }
      setOrders([]);
      showToast('Histórico de pedidos e faturamento zerados com sucesso! Começando do zero 🟢');
    } catch (err) {
      console.warn('Erro ao zerar pedidos:', err);
    }
  };

  // Product management
  const handleToggleProductAvailability = (productId: string) => {
    let targetProduct: Product | null = null;
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const updated = { ...p, isAvailable: p.isAvailable === false ? true : false };
        targetProduct = updated;
        return updated;
      }
      return p;
    });

    setProducts(updatedProducts);

    try {
      localStorage.setItem('burger_products', JSON.stringify(updatedProducts));
    } catch {
      // ignore
    }

    if (targetProduct) {
      showToast(
        (targetProduct as Product).isAvailable
          ? `${(targetProduct as Product).name} reativado no cardápio!`
          : `${(targetProduct as Product).name} pausado (sem estoque)!`
      );
      saveProductToFirestore(targetProduct);
    }
  };

  const handleSaveProduct = async (savedProduct: Product) => {
    // 1. Update React state immediately using functional updater
    setProducts(prev => {
      const exists = prev.some(p => p.id === savedProduct.id);
      const next = exists
        ? prev.map(p => (p.id === savedProduct.id ? savedProduct : p))
        : [savedProduct, ...prev];

      // 2. Persist to localStorage immediately
      try {
        localStorage.setItem('burger_products', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar produto no localStorage:', err);
      }
      return next;
    });

    // Also update selectedProduct if it is the one being viewed
    setSelectedProduct(prev => (prev.id === savedProduct.id ? savedProduct : prev));

    // 3. Persist to Firestore
    try {
      await saveProductToFirestore(savedProduct);
      showToast(`Produto "${savedProduct.name}" salvo no cardápio e sincronizado no Firebase! 🔥`);
    } catch (error) {
      console.error('Erro ao sincronizar produto no Firebase:', error);
      showToast(`Produto "${savedProduct.name}" salvo com sucesso!`);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    const prodToDelete = products.find(p => p.id === productId);
    const prodName = prodToDelete ? prodToDelete.name : 'Item';

    // Persist deleted product ID so mock/cached data never restores it
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('burger_deleted_products') || '[]');
      if (!deletedIds.includes(productId)) {
        deletedIds.push(productId);
        localStorage.setItem('burger_deleted_products', JSON.stringify(deletedIds));
      }
    } catch {
      // ignore
    }

    // 1. Update React state immediately
    setProducts(prev => {
      const next = prev.filter(p => p.id !== productId);
      try {
        localStorage.setItem('burger_products', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao atualizar localStorage após exclusão:', err);
      }
      return next;
    });

    // Also remove from cart
    setCartItems(prev => prev.filter(it => it.product.id !== productId));

    // Also clear selectedProduct if it was the deleted one
    setSelectedProduct(prev => {
      if (prev.id === productId) {
        const remaining = products.filter(p => p.id !== productId);
        return remaining[0] || prev;
      }
      return prev;
    });

    // 2. Remove from Firestore
    try {
      await deleteProductFromFirestore(productId);
      showToast(`Produto "${prodName}" excluído do cardápio! 🗑️`);
    } catch (err) {
      console.error('Erro ao excluir produto no Firestore:', err);
      showToast(`Produto removido localmente.`);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className={`min-h-screen ${currentScreen === 'kitchen' ? 'manager-light-mode bg-[#F4F6F9] text-slate-900' : 'bg-[#0F0F0F] text-[#e5e2e1]'} font-['Be_Vietnam_Pro'] antialiased selection:bg-[#5C3317] selection:text-white`}>
      {/* Quick Screen Switcher Banner - Oculto quando o cliente abre o link compartilhado */}
      {(!isClientMode || isManagerAuthenticated) && (
        <ScreenSwitcherBanner
          currentScreen={currentScreen}
          onNavigate={handleNavigateScreen}
          cartCount={cartItems.length}
        />
      )}

      {/* Main View Router */}
      {currentScreen === 'menu' && (
        <MenuScreen
          products={products}
          storeSettings={storeSettings}
          deliveryAddress={deliveryAddress}
          customerProfile={customerProfile}
          onOpenCustomerRegister={() => setIsCustomerRegisterOpen(true)}
          onOpenAddressModal={() => setIsCustomerRegisterOpen(true)}
          onSelectProduct={product => {
            setSelectedProduct(product);
            setCurrentScreen('product_detail');
          }}
          onQuickAdd={handleQuickAdd}
          onOpenCart={() => setCurrentScreen('cart')}
          onOpenKitchen={handleOpenKitchen}
          onOpenChat={() => setIsDriverChatOpen(true)}
          cartCount={cartItems.length}
          isManager={isManagerAuthenticated}
          showManagerIcon={!isClientMode || isManagerAuthenticated}
          onOpenManageMenu={handleOpenManageMenu}
          onOpenEditProduct={prod => {
            setEditingProduct(prod);
            setIsProductModalOpen(true);
          }}
          onOpenAddProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onDeleteProduct={handleDeleteProduct}
          onUpdateStoreSettings={handleUpdateStoreSettings}
        />
      )}

      {currentScreen === 'product_detail' && (
        <ProductDetailScreen
          product={selectedProduct}
          onBack={() => setCurrentScreen('menu')}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setCurrentScreen('cart')}
          isManager={isManagerAuthenticated}
          onOpenEditProduct={prod => {
            setEditingProduct(prod);
            setIsProductModalOpen(true);
          }}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {currentScreen === 'cart' && (
        <CartScreen
          items={cartItems}
          deliveryAddress={deliveryAddress}
          customerProfile={customerProfile}
          onOpenCustomerRegister={() => setIsCustomerRegisterOpen(true)}
          storeSettings={storeSettings}
          onUpdateStoreSettings={handleUpdateStoreSettings}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onBack={() => setCurrentScreen('menu')}
          onOpenAddressModal={() => setIsCustomerRegisterOpen(true)}
          onOpenChat={() => setIsDriverChatOpen(true)}
          onCheckout={handleCheckout}
        />
      )}

      {currentScreen === 'tracking' && (
        <OrderTrackingScreen
          order={activeTrackingOrder}
          storeSettings={storeSettings}
          onBack={() => setCurrentScreen('menu')}
          onOpenChatWithDriver={() => setIsDriverChatOpen(true)}
          onOpenHelp={() => showToast('Suporte Burger Dash: Atendimento 24h via WhatsApp.')}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
        />
      )}

      {currentScreen === 'kitchen' && (
        <KitchenManagerScreen
          orders={orders}
          products={products}
          storeSettings={storeSettings}
          initialTab={kitchenTab}
          onUpdateStoreSettings={handleUpdateStoreSettings}
          onToggleProductAvailability={handleToggleProductAvailability}
          onOpenEditProduct={prod => {
            setEditingProduct(prod);
            setIsProductModalOpen(true);
          }}
          onOpenAddProduct={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onAcceptOrder={handleKitchenAcceptOrder}
          onRejectOrder={handleKitchenRejectOrder}
          onAdvanceToReady={handleKitchenAdvanceToReady}
          onAdvanceToDelivery={handleKitchenAdvanceToDelivery}
          onCompleteOrder={handleKitchenCompleteOrder}
          onOpenManualOrder={() => setIsManualOrderOpen(true)}
          onAddOrder={handleManualOrderAdd}
          onPrintOrder={order => setPrintOrder(order)}
          onOpenChat={() => setIsDriverChatOpen(true)}
          onNavigateToMenu={() => setCurrentScreen('menu')}
          onLockManager={handleLockManager}
          onUpdateOrderStatus={handleKitchenUpdateStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onDeleteProduct={handleDeleteProduct}
          onClearOrders={handleClearOrders}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          customerProfile={customerProfile}
          orders={orders}
          storeSettings={storeSettings}
          onEditProfile={() => setIsCustomerRegisterOpen(true)}
          onNavigateToTracking={() => setCurrentScreen('tracking')}
          onNavigateToMenu={() => setCurrentScreen('menu')}
          onReorder={order => {
            const newCartItems: CartItem[] = order.items.map((it, idx) => {
              const matchedProd = products.find(p => p.name === it.name) || products[0];
              return {
                id: `reorder-${order.id}-${idx}-${Date.now()}`,
                product: matchedProd,
                quantity: it.quantity,
                pizzaSize: it.pizzaSize,
                juiceSize: it.juiceSize,
                notes: it.notes,
                additionals: [],
                totalPrice: it.price * it.quantity,
              };
            });
            setCartItems(newCartItems);
            setCurrentScreen('cart');
            showToast('Itens do pedido adicionados ao carrinho! 🔥');
          }}
        />
      )}

      {/* Bottom Navigation */}
      {currentScreen !== 'product_detail' && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigateScreen}
          cartCount={cartItems.length}
          hasActiveOrder={Boolean(activeTrackingOrder)}
          showManagerIcon={!isClientMode || isManagerAuthenticated}
        />
      )}

      {/* Modals */}
      {isPinModalOpen && (
        <ManagerPinModal
          correctPin={storeSettings.managerPin || '123456'}
          onSuccess={handlePinSuccess}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}
      {isDriverChatOpen && activeTrackingOrder && (
        <ContactDriverModal
          onClose={() => setIsDriverChatOpen(false)}
          courierName={activeTrackingOrder.courierName || 'Ricardo'}
          courierPhone={activeTrackingOrder.courierPhone}
          courierAvatar={activeTrackingOrder.courierAvatar}
          courierVehicle={activeTrackingOrder.courierVehicle}
          courierPlate={activeTrackingOrder.courierPlate}
        />
      )}

      {isCustomerRegisterOpen && (
        <CustomerRegisterModal
          initialProfile={customerProfile}
          storeSettings={storeSettings}
          canClose={true}
          onSave={handleSaveCustomerProfile}
          onClose={() => setIsCustomerRegisterOpen(false)}
        />
      )}

      {isAddressModalOpen && (
        <AddressModal
          currentAddress={deliveryAddress}
          storeSettings={storeSettings}
          currentNeighborhood={customerProfile?.neighborhood}
          onSave={(newAddress, chosenNeighborhood, savedCep, coords) => {
            setDeliveryAddress(newAddress);
            if (customerProfile) {
              const updatedProfile: CustomerProfile = {
                ...customerProfile,
                address: newAddress,
                neighborhood: chosenNeighborhood || customerProfile.neighborhood,
                cep: savedCep || customerProfile.cep,
                latitude: coords?.lat ?? customerProfile.latitude,
                longitude: coords?.lng ?? customerProfile.longitude,
              };
              setCustomerProfile(updatedProfile);
              saveCustomerProfileToFirestore(updatedProfile);
            }
            setIsAddressModalOpen(false);
          }}
          onClose={() => setIsAddressModalOpen(false)}
        />
      )}

      {isManualOrderOpen && (
        <div className={currentScreen === 'kitchen' ? 'manager-view manager-light-mode' : ''}>
          <ManualOrderModal
            products={products}
            storeSettings={storeSettings}
            onAddOrder={handleManualOrderAdd}
            onClose={() => setIsManualOrderOpen(false)}
          />
        </div>
      )}

      {isProductModalOpen && (
        <div className={currentScreen === 'kitchen' ? 'manager-view manager-light-mode' : ''}>
          <ProductFormModal
            initialProduct={editingProduct}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            onClose={() => {
              setIsProductModalOpen(false);
              setEditingProduct(null);
            }}
          />
        </div>
      )}

      {printOrder && (
        <PrintModal
          order={printOrder}
          storeSettings={storeSettings}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
