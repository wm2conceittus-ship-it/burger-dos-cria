/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Screen, Product, CartItem, Order, StoreSettings, CustomerProfile } from './types';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_RESTAURANT_TABLES, INITIAL_EMPLOYEES } from './data/mockData';
import {
  testFirestoreConnection,
  subscribeToOrders,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  updateOrderInFirestore,
  subscribeToStoreSettings,
  saveStoreSettingsToFirestore,
  saveCustomerProfileToFirestore,
  subscribeToProducts,
  saveProductToFirestore,
  saveAllProductsToFirestore,
} from './services/firebase';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('burger_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return PRODUCTS;
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
    whatsappSupport: '(11) 98765-4321',
    openingHours: 'Terça a Domingo, 18h - 00h',
    pixKey: '11987654321',
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
    managerPin: '1234',
    deliveryArea: {
      baseAddress: 'Rua Augusta, 1000 - Consolação, São Paulo - SP',
      radiusKm: 7,
      freeDeliveryThreshold: 120.0,
      allowPickup: true,
      zones: [
        { id: 'zone-1', name: 'Consolação', fee: 5.0, estimatedTime: '20-30 min', active: true },
        { id: 'zone-2', name: 'Bela Vista / Bixiga', fee: 6.0, estimatedTime: '25-35 min', active: true },
        { id: 'zone-3', name: 'Centro Histórico', fee: 7.0, estimatedTime: '30-40 min', active: true },
        { id: 'zone-4', name: 'Jardins / Cerqueira César', fee: 8.0, estimatedTime: '30-45 min', active: true },
        { id: 'zone-5', name: 'Higienópolis', fee: 7.5, estimatedTime: '25-35 min', active: true },
        { id: 'zone-6', name: 'Pinheiros', fee: 9.0, estimatedTime: '35-50 min', active: true },
        { id: 'zone-7', name: 'Vila Madalena', fee: 10.0, estimatedTime: '40-55 min', active: true },
      ],
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
  
  // Initial cart populated with the exact 2 items from the reference cart screen
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'cart-init-1',
      product: PRODUCTS[0], // Gourmet Truffle Burger
      quantity: 1,
      meatDoneness: 'Ao ponto',
      additionals: [{ id: 'bacon', name: 'Bacon extra', price: 6.00 }],
      totalPrice: 54.90,
    },
    {
      id: 'cart-init-2',
      product: PRODUCTS.find(p => p.id === 'batata-rustica') || PRODUCTS[4],
      quantity: 1,
      additionals: [],
      totalPrice: 18.90,
    }
  ]);

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order>(INITIAL_ORDERS[4]); // #1234
  const [deliveryAddress, setDeliveryAddress] = useState('Rua das Flores, 123 - Apto 42, Centro, São Paulo - SP');

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
    if (isManagerAuthenticated) {
      setCurrentScreen('kitchen');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsManagerAuthenticated(true);
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

  // Se o cliente ainda não se cadastrou, exibe o cadastro ao abrir o cardápio
  useEffect(() => {
    if (!customerProfile) {
      const timer = setTimeout(() => {
        setIsCustomerRegisterOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (customerProfile.address) {
      setDeliveryAddress(customerProfile.address);
    }
  }, []);

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

  // Firebase Real-time Synchronization on Mount
  useEffect(() => {
    testFirestoreConnection();

    // Subscribe to orders in Firestore
    const unsubscribeOrders = subscribeToOrders(firestoreOrders => {
      if (firestoreOrders && firestoreOrders.length > 0) {
        setOrders(firestoreOrders);
      }
    });

    // Subscribe to store settings in Firestore
    const unsubscribeSettings = subscribeToStoreSettings(remoteSettings => {
      if (remoteSettings && remoteSettings.storeName) {
        const cleanedEmployees = remoteSettings.employees
          ? remoteSettings.employees.filter((e: any) => e.role !== 'motoboy')
          : undefined;
        setStoreSettings(prev => ({
          ...prev,
          ...remoteSettings,
          employees: cleanedEmployees || prev.employees,
        }));
      }
    });

    // Subscribe to products in Firestore
    const unsubscribeProducts = subscribeToProducts(firestoreProducts => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        setProducts(prev => {
          const map = new Map<string, Product>();
          prev.forEach(p => map.set(p.id, p));
          firestoreProducts.forEach(p => map.set(p.id, p));
          const merged = Array.from(map.values());
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

  // Checkout -> Create new order and go to tracking
  const handleCheckout = (
    paymentMethod: string,
    discountAmount: number,
    changeFor?: string,
    mercadoPagoPaymentId?: string,
    orderType: 'Delivery' | 'Retirada' | 'Mesa' = 'Delivery',
    tableNumber?: number
  ) => {
    if (!customerProfile) {
      setIsCustomerRegisterOpen(true);
      showToast('Por favor, conclua seu cadastro para enviar o pedido!');
      return;
    }

    const isTableOrder = orderType === 'Mesa';
    const isPickupOrder = orderType === 'Retirada';
    const subtotal = cartItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const deliveryFee = isTableOrder || isPickupOrder ? 0.00 : storeSettings.defaultDeliveryFee;
    const total = Math.max(0, subtotal + deliveryFee - discountAmount);
    const newOrderNum = isTableOrder
      ? `#MESA-${tableNumber || 1}`
      : `#${Math.floor(1000 + Math.random() * 9000)}`;

    const isAutoAccept = Boolean(storeSettings.autoAcceptOrders);
    const activeCouriers = (storeSettings.couriers || []).filter(c => c.active);
    const assignedCourier = !isTableOrder && !isPickupOrder && activeCouriers.length > 0 ? activeCouriers[0] : undefined;

    const effectiveAddress = isTableOrder
      ? `Consumo no Local • Mesa ${tableNumber || 1}`
      : isPickupOrder
      ? 'Retirada no Balcão da Loja'
      : customerProfile.address || deliveryAddress;

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
      paymentMethod,
      changeFor,
      mercadoPagoPaymentId,
      paymentStatus:
        mercadoPagoPaymentId ||
        paymentMethod.toLowerCase().includes('online') ||
        paymentMethod.toLowerCase().includes('pix')
          ? 'aprovado'
          : 'pendente',
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
    };

    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder);

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
    updateOrderStatusInFirestore(orderId, 'preparando');
    showToast('Pedido aceito na cozinha! Preparando...');
  };

  const handleKitchenRejectOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'recusado' } : o))
    );
    updateOrderStatusInFirestore(orderId, 'recusado');
    showToast('Pedido recusado.');
  };

  const handleKitchenAdvanceToReady = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'pronto' } : o))
    );
    updateOrderStatusInFirestore(orderId, 'pronto');
    showToast('Pedido pronto para retirada ou entrega!');
  };

  const handleKitchenAdvanceToDelivery = (
    orderId: string,
    courierInfo?: { name: string; phone?: string; avatar?: string; vehicle?: string; plate?: string }
  ) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'em_entrega',
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
    if (courierInfo) {
      updateOrderInFirestore(orderId, {
        status: 'em_entrega',
        courierName: courierInfo.name,
        courierPhone: courierInfo.phone,
        courierAvatar: courierInfo.avatar,
        courierVehicle: courierInfo.vehicle,
        courierPlate: courierInfo.plate,
      });
      showToast(`Pedido despachado com ${courierInfo.name}! 🛵`);
    } else {
      updateOrderStatusInFirestore(orderId, 'em_entrega');
      showToast('Pedido despachado para entrega!');
    }
  };

  const handleKitchenCompleteOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'entregue' } : o))
    );
    updateOrderStatusInFirestore(orderId, 'entregue');
    showToast('Pedido marcado como Entregue!');
  };

  const handleManualOrderAdd = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder);
    showToast(`Pedido ${newOrder.orderNumber} adicionado e sincronizado no Firebase!`);
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

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] font-['Be_Vietnam_Pro'] antialiased selection:bg-[#ff5722] selection:text-white">
      {/* Quick Screen Switcher Banner for review */}
      <ScreenSwitcherBanner
        currentScreen={currentScreen}
        onNavigate={handleNavigateScreen}
        cartCount={cartItems.length}
      />

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
        />
      )}

      {currentScreen === 'product_detail' && (
        <ProductDetailScreen
          product={selectedProduct}
          onBack={() => setCurrentScreen('menu')}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setCurrentScreen('cart')}
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
          onBack={() => setCurrentScreen('menu')}
          onOpenAddressModal={() => setIsCustomerRegisterOpen(true)}
          onOpenChat={() => setIsDriverChatOpen(true)}
          onCheckout={handleCheckout}
        />
      )}

      {currentScreen === 'tracking' && (
        <OrderTrackingScreen
          order={activeTrackingOrder}
          onBack={() => setCurrentScreen('menu')}
          onOpenChatWithDriver={() => setIsDriverChatOpen(true)}
          onOpenHelp={() => showToast('Suporte Burger Dash: Atendimento 24h via WhatsApp.')}
        />
      )}

      {currentScreen === 'kitchen' && (
        <KitchenManagerScreen
          orders={orders}
          products={products}
          storeSettings={storeSettings}
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
        />
      )}

      {/* Modals */}
      {isPinModalOpen && (
        <ManagerPinModal
          correctPin={storeSettings.managerPin || '1234'}
          onSuccess={handlePinSuccess}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}
      {isDriverChatOpen && (
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
          canClose={true}
          onSave={handleSaveCustomerProfile}
          onClose={() => setIsCustomerRegisterOpen(false)}
        />
      )}

      {isAddressModalOpen && (
        <AddressModal
          currentAddress={deliveryAddress}
          onSave={setDeliveryAddress}
          onClose={() => setIsAddressModalOpen(false)}
        />
      )}

      {isManualOrderOpen && (
        <ManualOrderModal
          products={products}
          onAddOrder={handleManualOrderAdd}
          onClose={() => setIsManualOrderOpen(false)}
        />
      )}

      {isProductModalOpen && (
        <ProductFormModal
          initialProduct={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
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
