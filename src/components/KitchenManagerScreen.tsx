import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Product, StoreSettings, Courier, DeliveryZone, Coupon } from '../types';
import { APP_IMAGES } from '../data/mockData';
import {
  Timer,
  Soup,
  Printer,
  Zap,
  TrendingUp,
  Plus,
  Share2,
  MessageSquare,
  User,
  Users,
  Settings,
  Receipt,
  UtensilsCrossed,
  BarChart3,
  CheckCircle,
  Check,
  HelpCircle,
  Layers,
  Power,
  Edit2,
  DollarSign,
  Clock,
  ShoppingBag,
  Sparkles,
  Download,
  AlertTriangle,
  TrendingDown,
  Trash2,
  Wallet,
  FileText,
  PieChart,
  BookOpen,
  X,
  ShieldCheck,
  Lock,
  ExternalLink,
  Radio,
  Copy,
  Bike,
  Phone,
  MapPin,
  Navigation,
  Car,
  FileSpreadsheet,
  Flame,
  GlassWater,
  Beer,
  Ticket,
  Percent,
  Tag,
  CreditCard,
  Banknote,
  Kanban,
  LayoutGrid,
  GalleryHorizontal,
  GripVertical,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  CheckCheck,
  Volume2,
  VolumeX,
  Globe,
  Upload,
  Camera,
  Search,
  RotateCcw,
  Package,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  SlidersHorizontal,
  QrCode,
  Smartphone,
  Building2,
  Key,
  Mail,
} from 'lucide-react';
import { generatePixPayload, getPixQrCodeUrl } from '../utils/pixPayload';
import { compressImageFile } from '../utils/imageUpload';
import { playNewOrderSound, unlockAudioContext } from '../utils/audioAlert';
import { ManagementGuideModal } from './ManagementGuideModal';
import { DailyOrdersReportModal } from './DailyOrdersReportModal';
import { FinancialPdfModal } from './FinancialPdfModal';
import { DeliveryRadiusControl } from './DeliveryRadiusControl';
import { TableManagementView } from './TableManagementView';
import { EmployeeManagementView } from './EmployeeManagementView';
import { FinancialReportsDashboard } from './FinancialReportsDashboard';
import { ShareMenuModal } from './ShareMenuModal';
import { getPublicMenuUrl, copyToClipboard } from '../utils/shareUtils';
import { mercadoPagoApi } from '../services/mercadoPagoService';

interface KitchenManagerScreenProps {
  orders: Order[];
  products: Product[];
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
  onToggleProductAvailability: (productId: string) => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenAddProduct: () => void;
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onAdvanceToReady: (orderId: string) => void;
  onAdvanceToDelivery: (orderId: string, courier?: { name: string; phone?: string; avatar?: string; vehicle?: string; plate?: string }) => void;
  onCompleteOrder: (orderId: string) => void;
  onOpenManualOrder: () => void;
  onAddOrder?: (newOrder: Order) => void;
  onPrintOrder: (order: Order) => void;
  onOpenChat: () => void;
  onNavigateToMenu: () => void;
  onLockManager?: () => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: any) => void;
  onDeleteProduct?: (productId: string) => void;
  onClearOrders?: () => void;
  initialTab?: 'pedidos' | 'mesas' | 'cardapio' | 'relatorios' | 'configuracoes';
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: 'insumos' | 'bebidas' | 'motoboy' | 'embalagens' | 'gas' | 'operacional' | 'fixo' | 'outros';
  amount: number;
  time: string;
}

const INITIAL_EXPENSES: ExpenseItem[] = [];

export const KitchenManagerScreen: React.FC<KitchenManagerScreenProps> = ({
  orders,
  products,
  storeSettings,
  onUpdateStoreSettings,
  onToggleProductAvailability,
  onOpenEditProduct,
  onOpenAddProduct,
  onAcceptOrder,
  onRejectOrder,
  onAdvanceToReady,
  onAdvanceToDelivery,
  onCompleteOrder,
  onOpenManualOrder,
  onAddOrder,
  onPrintOrder,
  onOpenChat,
  onNavigateToMenu,
  onLockManager,
  onUpdateOrderStatus,
  onDeleteProduct,
  onClearOrders,
  initialTab,
}) => {
  // Main Sub-Tab: 'pedidos' | 'mesas' | 'cardapio' | 'relatorios' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<'pedidos' | 'mesas' | 'cardapio' | 'relatorios' | 'configuracoes'>(
    initialTab || 'pedidos'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Product, Courier, Coupon deletion modals
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [courierToDelete, setCourierToDelete] = useState<{ id: string; name: string } | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);

  const [mainFilter, setMainFilter] = useState<'abertos' | 'agendados'>('abertos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'novos' | 'preparando' | 'prontos' | 'em_entrega' | 'historico'>('novos');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [cardapioFilter, setCardapioFilter] = useState<'all' | 'burgers' | 'pizzas' | 'salgados' | 'sucos' | 'bebidas'>('all');
  const [managerPinInput, setManagerPinInput] = useState(storeSettings.managerPin || '123456');
  const [pinToast, setPinToast] = useState<string | null>(null);
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);

  // Layout mode for orders: 'carousel' | 'kanban' | 'grid'
  const [ordersLayoutMode, setOrdersLayoutMode] = useState<'carousel' | 'kanban' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('kitchen_kds_layout');
      if (saved === 'grid') return 'grid';
      if (saved === 'kanban') return 'carousel'; // Migrated to carousel per user request
      if (saved === 'carousel') return 'carousel';
      return 'carousel';
    } catch {
      return 'carousel';
    }
  });

  // Carousel navigation state
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Drag and drop state for Kanban (Desktop Mouse & Mobile Touch)
  interface TouchDragState {
    order: Order;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    hoverColumn: 'novo' | 'preparando' | 'pronto' | 'em_entrega' | 'concluido' | null;
  }
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);
  const touchDragRef = useRef<TouchDragState | null>(null);
  touchDragRef.current = touchDrag;

  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'novo' | 'preparando' | 'pronto' | 'em_entrega' | 'concluido' | null>(null);
  const [kdsToast, setKdsToast] = useState<string | null>(null);

  // Kanban filters & options
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanTypeFilter, setKanbanTypeFilter] = useState<'todos' | 'Delivery' | 'Retirada' | 'Mesa'>('todos');
  const [showFinishedKanban, setShowFinishedKanban] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kitchen_kanban_show_finished') === 'true';
    } catch {
      return false;
    }
  });
  const [quickMoveOrderId, setQuickMoveOrderId] = useState<string | null>(null);
  const [rejectOrderTarget, setRejectOrderTarget] = useState<Order | null>(null);

  const handleSelectOrdersLayoutMode = (mode: 'carousel' | 'kanban' | 'grid') => {
    setOrdersLayoutMode(mode);
    try {
      localStorage.setItem('kitchen_kds_layout', mode);
    } catch {
      // ignore
    }
  };

  const handleToggleShowFinishedKanban = () => {
    setShowFinishedKanban(prev => {
      const next = !prev;
      try {
        localStorage.setItem('kitchen_kanban_show_finished', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Densidade/Tamanho dos cards (compacto vs padrão, padrão inicial compacto conforme solicitado)
  const [cardDensity, setCardDensity] = useState<'compact' | 'normal'>(() => {
    try {
      const saved = localStorage.getItem('kitchen_kds_card_density');
      if (saved === 'compact' || saved === 'normal') return saved;
      return 'compact';
    } catch {
      return 'compact';
    }
  });

  const handleToggleCardDensity = () => {
    setCardDensity(prev => {
      const next = prev === 'compact' ? 'normal' : 'compact';
      try {
        localStorage.setItem('kitchen_kds_card_density', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const executeMoveOrder = (
    order: Order,
    targetCol: 'novo' | 'preparando' | 'pronto' | 'em_entrega' | 'concluido'
  ) => {
    const currentCol =
      order.status === 'novo' || order.status === 'recebido'
        ? 'novo'
        : order.status === 'preparando'
        ? 'preparando'
        : order.status === 'pronto'
        ? 'pronto'
        : order.status === 'em_entrega'
        ? 'em_entrega'
        : 'concluido';

    if (currentCol === targetCol) return;

    if (targetCol === 'novo') {
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.id, 'novo');
      }
      setKdsToast(`Pedido #${order.orderNumber} movido para Novos! 🔥`);
    } else if (targetCol === 'preparando') {
      if (order.status === 'novo' || order.status === 'recebido') {
        onAcceptOrder(order.id);
      } else if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.id, 'preparando');
      } else {
        onAcceptOrder(order.id);
      }
      setKdsToast(`Pedido #${order.orderNumber} em preparo na chapa! 🍳`);
    } else if (targetCol === 'pronto') {
      if (order.status === 'preparando') {
        onAdvanceToReady(order.id);
      } else if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.id, 'pronto');
      } else {
        onAdvanceToReady(order.id);
      }
      setKdsToast(`Pedido #${order.orderNumber} marcado como Pronto! 📦`);
    } else if (targetCol === 'em_entrega') {
      const activeCouriers = (storeSettings.couriers || []).filter(c => c.active);
      if (activeCouriers.length > 1) {
        setDispatchOrderTarget(order);
      } else if (activeCouriers.length === 1) {
        const c = activeCouriers[0];
        onAdvanceToDelivery(order.id, {
          name: c.name,
          phone: c.phone,
          avatar: c.avatar,
          vehicle: c.vehicleModel || (c.vehicle ? `Veículo (${c.vehicle})` : undefined),
          plate: c.plate,
        });
        setKdsToast(`Pedido #${order.orderNumber} despachado com ${c.name}! 🛵`);
      } else {
        onAdvanceToDelivery(order.id);
        setKdsToast(`Pedido #${order.orderNumber} despachado para entrega! 🛵`);
      }
    } else if (targetCol === 'concluido') {
      onCompleteOrder(order.id);
      setKdsToast(`Pedido #${order.orderNumber} finalizado com sucesso! ✅`);
    }

    setQuickMoveOrderId(null);
    setTimeout(() => setKdsToast(null), 3500);
  };

  const handleDropOnColumn = (targetCol: 'novo' | 'preparando' | 'pronto' | 'em_entrega' | 'concluido') => {
    const orderId = draggedOrderId;
    setDraggedOrderId(null);
    setDragOverColumn(null);
    if (!orderId) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    executeMoveOrder(order, targetCol);

    if (ordersLayoutMode === 'carousel') {
      const targetIdx = kanbanColumns.findIndex(c => c.key === targetCol);
      if (targetIdx !== -1) {
        scrollToCarouselIndex(targetIdx);
      }
    }
  };

  // Financial Management State - starts 100% clean / zeroed out
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      // Clear legacy mock expenses so the user starts with 100% clean finances
      const legacyCleaned = localStorage.getItem('burger_cleaned_legacy_expenses_v5');
      if (!legacyCleaned) {
        localStorage.removeItem('burger_manager_expenses');
        localStorage.setItem('burger_cleaned_legacy_expenses_v5', 'true');
        return [];
      }
      const saved = localStorage.getItem('burger_manager_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('burger_manager_expenses', JSON.stringify(expenses));
    } catch {
      // ignore
    }
  }, [expenses]);

  const [showClearExpensesConfirm, setShowClearExpensesConfirm] = useState(false);
  const [showClearOrdersConfirm, setShowClearOrdersConfirm] = useState(false);

  const handleClearAllExpenses = () => {
    setExpenses([]);
    try {
      localStorage.removeItem('burger_manager_expenses');
    } catch {
      // ignore
    }
    setShowClearExpensesConfirm(false);
    setFinancialToast('Todas as despesas foram zeradas com sucesso! Caixa limpo 🟢');
    setTimeout(() => setFinancialToast(null), 3000);
  };

  const handleConfirmClearOrders = () => {
    if (onClearOrders) {
      onClearOrders();
    }
    setShowClearOrdersConfirm(false);
    setFinancialToast('Histórico de pedidos e faturamento zerados com sucesso! 🟢');
    setTimeout(() => setFinancialToast(null), 3000);
  };

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showFinancialGuide, setShowFinancialGuide] = useState(false);
  const [showFinancialPdfModal, setShowFinancialPdfModal] = useState(false);
  const [financialToast, setFinancialToast] = useState<string | null>(null);
  const [financialSubTab, setFinancialSubTab] = useState<'graficos' | 'dre'>('graficos');

  // New expense form
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState<'insumos' | 'bebidas' | 'motoboy' | 'embalagens' | 'gas' | 'operacional' | 'fixo' | 'outros'>('insumos');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Payment methods in store settings
  const [configTab, setConfigTab] = useState<'gateway' | 'geral' | 'funcionarios' | 'area' | 'entregadores' | 'formas' | 'cupons'>('geral');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [newPaymentMethodInput, setNewPaymentMethodInput] = useState('');
  const [mpTestStatus, setMpTestStatus] = useState<string | null>(null);
  const [isTestingMp, setIsTestingMp] = useState(false);

  // Pix Key state for Manager configuration
  const [pixKeyInput, setPixKeyInput] = useState<string>(() => storeSettings.pixKey ?? '');
  const [pixKeyType, setPixKeyType] = useState<'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria'>(() => {
    const k = (storeSettings.pixKey || '').trim();
    if (k.includes('@')) return 'email';
    const digits = k.replace(/\D/g, '');
    if (digits.length === 14) return 'cnpj';
    if (digits.length === 11 && !k.startsWith('+55') && !k.includes('(')) return 'cpf';
    if (k.length > 20 && k.includes('-')) return 'aleatoria';
    return 'telefone';
  });
  const [pixSavedToast, setPixSavedToast] = useState(false);
  const [pixCopiedToast, setPixCopiedToast] = useState(false);

  // Sync pixKeyInput whenever storeSettings.pixKey updates from Firebase
  useEffect(() => {
    if (storeSettings.pixKey !== undefined) {
      setPixKeyInput(storeSettings.pixKey);
    }
  }, [storeSettings.pixKey]);

  const handleSavePixKey = (keyToSave?: string) => {
    const raw = keyToSave !== undefined ? keyToSave : pixKeyInput;
    const trimmed = raw.trim();
    onUpdateStoreSettings({
      ...storeSettings,
      pixKey: trimmed,
    });
    setPixSavedToast(true);
    setTimeout(() => setPixSavedToast(false), 3500);
  };

  // Coupon Management State
  const [couponToast, setCouponToast] = useState<string | null>(null);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');

  // Delivery Area & Zones State
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('');
  const [newZoneTime, setNewZoneTime] = useState('25-35 min');
  const [areaToast, setAreaToast] = useState<string | null>(null);

  // Courier Management State
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [courierSearch, setCourierSearch] = useState('');
  const [courierToast, setCourierToast] = useState<string | null>(null);
  const [dispatchOrderTarget, setDispatchOrderTarget] = useState<Order | null>(null);

  // Courier Form State
  const [cFormName, setCFormName] = useState('');
  const [cFormPhone, setCFormPhone] = useState('');
  const [cFormVehicle, setCFormVehicle] = useState<'moto' | 'bike' | 'carro' | 'a_pe'>('moto');
  const [cFormVehicleModel, setCFormVehicleModel] = useState('');
  const [cFormPlate, setCFormPlate] = useState('');
  const [cFormPixKey, setCFormPixKey] = useState('');
  const [cFormFeePerDelivery, setCFormFeePerDelivery] = useState('7.00');
  const [cFormDailyRate, setCFormDailyRate] = useState('60.00');
  const [cFormActive, setCFormActive] = useState(true);
  const [cFormAvatar, setCFormAvatar] = useState(APP_IMAGES.driverAvatar);
  const [cFormNotes, setCFormNotes] = useState('');

  const COURIER_AVATAR_PRESETS = [
    { label: 'Ricardo', url: APP_IMAGES.driverAvatar },
    { label: 'Matheus', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Felipe', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Lucas', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: 'Camila', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { label: 'Thiago', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  ];

  const handleOpenAddCourier = () => {
    setEditingCourier(null);
    setCFormName('');
    setCFormPhone('');
    setCFormVehicle('moto');
    setCFormVehicleModel('Honda CG 160 Titan');
    setCFormPlate('');
    setCFormPixKey('');
    setCFormFeePerDelivery('7.00');
    setCFormDailyRate('60.00');
    setCFormActive(true);
    setCFormAvatar(APP_IMAGES.driverAvatar);
    setCFormNotes('');
    setShowCourierModal(true);
  };

  const handleOpenEditCourier = (c: Courier) => {
    setEditingCourier(c);
    setCFormName(c.name);
    setCFormPhone(c.phone);
    setCFormVehicle(c.vehicle);
    setCFormVehicleModel(c.vehicleModel || '');
    setCFormPlate(c.plate || '');
    setCFormPixKey(c.pixKey || '');
    setCFormFeePerDelivery(c.feePerDelivery !== undefined ? String(c.feePerDelivery) : '7.00');
    setCFormDailyRate(c.dailyRate !== undefined ? String(c.dailyRate) : '60.00');
    setCFormActive(c.active);
    setCFormAvatar(c.avatar || APP_IMAGES.driverAvatar);
    setCFormNotes(c.notes || '');
    setShowCourierModal(true);
  };

  const handleSaveCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cFormName.trim()) {
      alert('Por favor, informe o nome do entregador.');
      return;
    }
    if (!cFormPhone.trim()) {
      alert('Por favor, informe o telefone/WhatsApp do entregador.');
      return;
    }

    const currentCouriers = storeSettings.couriers || [];
    let updatedCouriers: Courier[];

    if (editingCourier) {
      updatedCouriers = currentCouriers.map(c =>
        c.id === editingCourier.id
          ? {
              ...c,
              name: cFormName.trim(),
              phone: cFormPhone.trim(),
              vehicle: cFormVehicle,
              vehicleModel: cFormVehicleModel.trim() || undefined,
              plate: cFormPlate.trim().toUpperCase() || undefined,
              pixKey: cFormPixKey.trim() || undefined,
              feePerDelivery: parseFloat(cFormFeePerDelivery) || 0,
              dailyRate: parseFloat(cFormDailyRate) || 0,
              active: cFormActive,
              avatar: cFormAvatar,
              notes: cFormNotes.trim() || undefined,
            }
          : c
      );
      setCourierToast(`Entregador ${cFormName} atualizado com sucesso!`);
    } else {
      const newCourier: Courier = {
        id: `cour-${Date.now()}`,
        name: cFormName.trim(),
        phone: cFormPhone.trim(),
        vehicle: cFormVehicle,
        vehicleModel: cFormVehicleModel.trim() || undefined,
        plate: cFormPlate.trim().toUpperCase() || undefined,
        pixKey: cFormPixKey.trim() || undefined,
        feePerDelivery: parseFloat(cFormFeePerDelivery) || 0,
        dailyRate: parseFloat(cFormDailyRate) || 0,
        active: cFormActive,
        avatar: cFormAvatar,
        totalDeliveries: 0,
        notes: cFormNotes.trim() || undefined,
      };
      updatedCouriers = [...currentCouriers, newCourier];
      setCourierToast(`Entregador ${cFormName} cadastrado com sucesso! 🛵`);
    }

    onUpdateStoreSettings({
      ...storeSettings,
      couriers: updatedCouriers,
    });
    setShowCourierModal(false);
    setTimeout(() => setCourierToast(null), 3500);
  };

  const handleToggleCourierActive = (courierId: string) => {
    const currentCouriers = storeSettings.couriers || [];
    const updatedCouriers = currentCouriers.map(c =>
      c.id === courierId ? { ...c, active: !c.active } : c
    );
    const target = updatedCouriers.find(c => c.id === courierId);
    onUpdateStoreSettings({
      ...storeSettings,
      couriers: updatedCouriers,
    });
    setCourierToast(
      target?.active
        ? `${target.name} está em plantão ativo hoje! 🟢`
        : `${target?.name} foi pausado das entregas.`
    );
    setTimeout(() => setCourierToast(null), 3000);
  };

  const handleDeleteCourier = (courierId: string, name: string) => {
    setCourierToDelete({ id: courierId, name });
  };

  const confirmDeleteCourier = () => {
    if (!courierToDelete) return;
    const { id: courierId, name } = courierToDelete;
    const currentCouriers = storeSettings.couriers || [];
    const updatedCouriers = currentCouriers.filter(c => c.id !== courierId);
    onUpdateStoreSettings({
      ...storeSettings,
      couriers: updatedCouriers,
    });
    setCourierToast(`Entregador ${name} removido.`);
    setTimeout(() => setCourierToast(null), 3000);
    setCourierToDelete(null);
  };

  const handleCopyWebhook = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/api/mercadopago/webhook`);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleTestMercadoPago = async () => {
    setIsTestingMp(true);
    setMpTestStatus(null);
    try {
      const res = await mercadoPagoApi.testConnection(storeSettings.mercadoPago?.accessToken);
      setIsTestingMp(false);
      if (res.success) {
        setMpTestStatus(
          `✅ ${res.message || 'Conexão validada com sucesso!'} (${res.methodsCount || 0} métodos de pagamento disponíveis na sua conta Mercado Pago • Modo ${res.mode})`
        );
      } else {
        setMpTestStatus(
          `⚠️ ${res.error || 'Não foi possível validar o token na API Mercado Pago.'}`
        );
      }
    } catch (err: any) {
      setIsTestingMp(false);
      setMpTestStatus(`❌ Erro ao conectar com o servidor: ${err.message}`);
    }
  };

  const handleAddMethodFromManager = () => {
    const trimmed = newPaymentMethodInput.trim();
    if (!trimmed) return;
    const current = storeSettings.acceptedPaymentMethods || [
      'Pix',
      'Cartão de Crédito',
      'Cartão de Débito',
      'Dinheiro',
      'Vale Refeição (VR / Sodexo / Alelo)',
    ];
    if (!current.includes(trimmed)) {
      onUpdateStoreSettings({
        ...storeSettings,
        acceptedPaymentMethods: [...current, trimmed],
      });
    }
    setNewPaymentMethodInput('');
  };

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    const feeNum = parseFloat(newZoneFee.replace(',', '.')) || (storeSettings.defaultDeliveryFee || 7.0);
    const newZone: DeliveryZone = {
      id: 'zone-' + Date.now(),
      name: newZoneName.trim(),
      fee: feeNum,
      estimatedTime: newZoneTime.trim() || '25-35 min',
      active: true,
    };
    const currentZones = storeSettings.deliveryArea?.zones || [];
    onUpdateStoreSettings({
      ...storeSettings,
      deliveryArea: {
        ...(storeSettings.deliveryArea || {
          baseAddress: 'Rua Augusta, 1000 - Consolação, São Paulo - SP',
          radiusKm: 7,
          freeDeliveryThreshold: 120,
          allowPickup: true,
        }),
        zones: [...currentZones, newZone],
      },
    });
    setNewZoneName('');
    setNewZoneFee('');
    setAreaToast(`Bairro "${newZone.name}" adicionado com sucesso!`);
    setTimeout(() => setAreaToast(null), 3000);
  };

  const handleToggleZone = (zoneId: string) => {
    const currentZones = storeSettings.deliveryArea?.zones || [];
    onUpdateStoreSettings({
      ...storeSettings,
      deliveryArea: {
        ...(storeSettings.deliveryArea || {}),
        zones: currentZones.map(z => (z.id === zoneId ? { ...z, active: !z.active } : z)),
      },
    });
  };

  const handleDeleteZone = (zoneId: string, name: string) => {
    const currentZones = storeSettings.deliveryArea?.zones || [];
    onUpdateStoreSettings({
      ...storeSettings,
      deliveryArea: {
        ...(storeSettings.deliveryArea || {}),
        zones: currentZones.filter(z => z.id !== zoneId),
      },
    });
    setAreaToast(`Bairro "${name}" removido.`);
    setTimeout(() => setAreaToast(null), 3000);
  };

  // Coupon Handlers
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      alert('Por favor, informe o código do cupom (ex: CRIAS10).');
      return;
    }

    const currentCoupons = storeSettings.coupons || [];
    if (currentCoupons.some(c => c.code.toUpperCase() === cleanCode)) {
      alert(`Já existe um cupom com o código "${cleanCode}". Escolha outro código.`);
      return;
    }

    const parsedVal = parseFloat(newCouponValue) || 0;
    const parsedMin = parseFloat(newCouponMinOrder) || 0;

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      description: newCouponDesc.trim() || undefined,
      discountType: newCouponType,
      discountValue: newCouponType === 'free_shipping' ? 0 : parsedVal,
      minOrderValue: parsedMin > 0 ? parsedMin : undefined,
      active: true,
      usageCount: 0,
    };

    onUpdateStoreSettings({
      ...storeSettings,
      coupons: [newCoupon, ...currentCoupons],
    });

    setCouponToast(`Cupom "${cleanCode}" criado com sucesso!`);
    setTimeout(() => setCouponToast(null), 3500);
    setNewCouponCode('');
    setNewCouponDesc('');
    setNewCouponValue('10');
    setNewCouponMinOrder('');
    setShowAddCouponModal(false);
  };

  const handleToggleCoupon = (couponId: string) => {
    const currentCoupons = storeSettings.coupons || [];
    const updated = currentCoupons.map(c =>
      c.id === couponId ? { ...c, active: !c.active } : c
    );
    onUpdateStoreSettings({
      ...storeSettings,
      coupons: updated,
    });
  };

  const handleDeleteCoupon = (couponId: string, code: string) => {
    setCouponToDelete({ id: couponId, code });
  };

  const confirmDeleteCoupon = () => {
    if (!couponToDelete) return;
    const { id: couponId, code } = couponToDelete;
    const currentCoupons = storeSettings.coupons || [];
    onUpdateStoreSettings({
      ...storeSettings,
      coupons: currentCoupons.filter(c => c.id !== couponId),
    });
    setCouponToast(`Cupom "${code}" excluído.`);
    setTimeout(() => setCouponToast(null), 3000);
    setCouponToDelete(null);
  };

  // Stats calculation
  const novosOrders = orders.filter(o => o.status === 'novo' || o.status === 'recebido');
  const preparandoOrders = orders.filter(o => o.status === 'preparando');
  const prontosOrders = orders.filter(o => o.status === 'pronto');
  const emEntregaOrders = orders.filter(o => o.status === 'em_entrega');
  const historicoOrders = orders.filter(o => o.status === 'entregue' || o.status === 'recusado');
  const abertosOrders = orders.filter(o => o.status !== 'entregue' && o.status !== 'recusado');

  // Filtered orders specifically for the Kanban board
  const filteredKanbanOrders = useMemo(() => {
    return orders.filter(order => {
      // Channel type filter
      if (kanbanTypeFilter !== 'todos') {
        if (order.type !== kanbanTypeFilter) return false;
      }
      // Search query across multiple fields
      if (kanbanSearch.trim()) {
        const q = kanbanSearch.trim().toLowerCase();
        const numMatch = (order.orderNumber || '').toLowerCase().includes(q);
        const nameMatch = (order.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (order.customerPhone || '').toLowerCase().includes(q);
        const addrMatch = (order.address || '').toLowerCase().includes(q);
        const tableMatch = order.tableNumber ? String(order.tableNumber).includes(q) : false;
        const itemMatch = (order.items || []).some(it => it.name.toLowerCase().includes(q));
        if (!numMatch && !nameMatch && !phoneMatch && !addrMatch && !tableMatch && !itemMatch) {
          return false;
        }
      }
      return true;
    });
  }, [orders, kanbanTypeFilter, kanbanSearch]);

  const kanbanNovosOrders = useMemo(
    () => filteredKanbanOrders.filter(o => o.status === 'novo' || o.status === 'recebido'),
    [filteredKanbanOrders]
  );
  const kanbanPreparandoOrders = useMemo(
    () => filteredKanbanOrders.filter(o => o.status === 'preparando'),
    [filteredKanbanOrders]
  );
  const kanbanProntosOrders = useMemo(
    () => filteredKanbanOrders.filter(o => o.status === 'pronto'),
    [filteredKanbanOrders]
  );
  const kanbanEmEntregaOrders = useMemo(
    () => filteredKanbanOrders.filter(o => o.status === 'em_entrega'),
    [filteredKanbanOrders]
  );
  const kanbanConcluidosOrders = useMemo(
    () => filteredKanbanOrders.filter(o => o.status === 'entregue' || o.status === 'recusado'),
    [filteredKanbanOrders]
  );

  const handleAcceptAllNewOrders = () => {
    if (kanbanNovosOrders.length === 0) return;
    kanbanNovosOrders.forEach(o => onAcceptOrder(o.id));
    setKdsToast(`🔥 ${kanbanNovosOrders.length} pedido(s) aceitos e enviados para preparo!`);
    setTimeout(() => setKdsToast(null), 3500);
  };

  const kanbanColumns = useMemo(
    () => [
      {
        key: 'novo' as const,
        title: 'Novos',
        subtitle: 'Aguardando aceite',
        icon: Flame,
        colorText: 'text-[#ff8a65]',
        topBar: 'bg-[#ff5722]',
        headerBg: 'bg-gradient-to-r from-[#ff5722]/20 to-[#ff5722]/5',
        borderColor: 'border-[#ff5722]/40',
        activeRing: 'ring-2 ring-[#ff5722] bg-[#ff5722]/10 border-[#ff5722]',
        badgeBg: 'bg-[#ff5722]/20 text-[#ff8a65] border-[#ff5722]/40',
        orders: kanbanNovosOrders,
      },
      {
        key: 'preparando' as const,
        title: 'Em Preparo',
        subtitle: 'Na chapa e cozinha',
        icon: Soup,
        colorText: 'text-amber-400',
        topBar: 'bg-amber-500',
        headerBg: 'bg-gradient-to-r from-amber-500/20 to-amber-500/5',
        borderColor: 'border-amber-500/40',
        activeRing: 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        orders: kanbanPreparandoOrders,
      },
      {
        key: 'pronto' as const,
        title: 'Pronto',
        subtitle: 'Embalado / Balcão',
        icon: Package,
        colorText: 'text-emerald-400',
        topBar: 'bg-emerald-500',
        headerBg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5',
        borderColor: 'border-emerald-500/40',
        activeRing: 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        orders: kanbanProntosOrders,
      },
      {
        key: 'em_entrega' as const,
        title: 'Em Rota',
        subtitle: 'Despachado / Entrega',
        icon: Bike,
        colorText: 'text-sky-400',
        topBar: 'bg-sky-500',
        headerBg: 'bg-gradient-to-r from-sky-500/20 to-sky-500/5',
        borderColor: 'border-sky-500/40',
        activeRing: 'ring-2 ring-sky-500 bg-sky-500/10 border-sky-500',
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        orders: kanbanEmEntregaOrders,
      },
      ...(showFinishedKanban
        ? [
            {
              key: 'concluido' as const,
              title: 'Finalizados',
              subtitle: 'Entregues hoje',
              icon: CheckCircle2,
              colorText: 'text-slate-300',
              topBar: 'bg-slate-500',
              headerBg: 'bg-gradient-to-r from-slate-600/20 to-slate-600/5',
              borderColor: 'border-slate-500/40',
              activeRing: 'ring-2 ring-slate-400 bg-slate-500/10 border-slate-400',
              badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
              orders: kanbanConcluidosOrders,
            },
          ]
        : []),
    ],
    [
      kanbanNovosOrders,
      kanbanPreparandoOrders,
      kanbanProntosOrders,
      kanbanEmEntregaOrders,
      kanbanConcluidosOrders,
      showFinishedKanban,
    ]
  );

  const safeCarouselIndex = Math.min(carouselActiveIndex, Math.max(0, kanbanColumns.length - 1));

  const scrollToCarouselIndex = (index: number) => {
    if (!carouselTrackRef.current) return;
    const container = carouselTrackRef.current;
    const clamped = Math.max(0, Math.min(index, kanbanColumns.length - 1));
    const child = container.children[clamped] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setCarouselActiveIndex(clamped);
    }
  };

  const handleCarouselScroll = () => {
    if (!carouselTrackRef.current) return;
    const container = carouselTrackRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const columns = Array.from(container.children) as HTMLElement[];
    if (columns.length === 0) return;

    const centerPoint = scrollLeft + containerWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    columns.forEach((col, idx) => {
      const colCenter = col.offsetLeft + col.offsetWidth / 2;
      const dist = Math.abs(colCenter - centerPoint);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (closestIndex !== carouselActiveIndex) {
      setCarouselActiveIndex(closestIndex);
    }
  };

  // Início do arrasto por toque com o dedo (Mobile Touch Drag para celulares)
  const handleTouchDragStart = (e: React.TouchEvent, order: Order) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const initialDrag: TouchDragState = {
      order,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      hoverColumn: null,
    };
    setTouchDrag(initialDrag);
    setDraggedOrderId(order.id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore
      }
    }
  };

  // Efeito global de touchmove e touchend durante o arrasto com o dedo no celular
  useEffect(() => {
    if (!touchDrag) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!touchDragRef.current || e.touches.length === 0) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropTarget = targetElem?.closest('[data-drop-column]')?.getAttribute('data-drop-column') as
        | 'novo'
        | 'preparando'
        | 'pronto'
        | 'em_entrega'
        | 'concluido'
        | null;

      // Auto-rolagem horizontal do carrossel ao arrastar próximo às bordas da tela
      if (carouselTrackRef.current) {
        const edgeThreshold = 65;
        if (touch.clientX > window.innerWidth - edgeThreshold) {
          carouselTrackRef.current.scrollBy({ left: 14, behavior: 'auto' });
        } else if (touch.clientX < edgeThreshold) {
          carouselTrackRef.current.scrollBy({ left: -14, behavior: 'auto' });
        }
      }

      const prevHover = touchDragRef.current.hoverColumn;
      if (dropTarget !== prevHover && dropTarget && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(20);
        } catch {
          // ignore
        }
      }

      setTouchDrag(prev =>
        prev
          ? {
              ...prev,
              currentX: touch.clientX,
              currentY: touch.clientY,
              hoverColumn: dropTarget || null,
            }
          : null
      );

      setDragOverColumn(dropTarget || null);
    };

    const handleGlobalTouchEnd = () => {
      const current = touchDragRef.current;
      if (current) {
        const finalCol = current.hoverColumn;
        if (finalCol) {
          executeMoveOrder(current.order, finalCol);
          if (ordersLayoutMode === 'carousel') {
            const targetIdx = kanbanColumns.findIndex(c => c.key === finalCol);
            if (targetIdx !== -1) {
              scrollToCarouselIndex(targetIdx);
            }
          }
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([40, 30, 60]);
            } catch {
              // ignore
            }
          }
        }
      }

      setTouchDrag(null);
      setDraggedOrderId(null);
      setDragOverColumn(null);
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [touchDrag !== null, ordersLayoutMode, kanbanColumns]);

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'novos') return order.status === 'novo' || order.status === 'recebido';
    if (statusFilter === 'preparando') return order.status === 'preparando';
    if (statusFilter === 'prontos') return order.status === 'pronto';
    if (statusFilter === 'em_entrega') return order.status === 'em_entrega';
    if (statusFilter === 'historico') return order.status === 'entregue' || order.status === 'recusado';
    return true;
  });

  // Financial calculations
  const validOrders = orders.filter(o => o.status !== 'recusado');
  const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
  const averageTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Expenses & DRE calculations
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const insumosExpenses = expenses.filter(e => e.category === 'insumos').reduce((acc, e) => acc + e.amount, 0);
  const bebidasExpenses = expenses.filter(e => e.category === 'bebidas').reduce((acc, e) => acc + e.amount, 0);
  const motoboyExpenses = expenses.filter(e => e.category === 'motoboy').reduce((acc, e) => acc + e.amount, 0);
  const embalagensExpenses = expenses.filter(e => e.category === 'embalagens').reduce((acc, e) => acc + e.amount, 0);
  const gasExpenses = expenses.filter(e => e.category === 'gas').reduce((acc, e) => acc + e.amount, 0);
  const operacionalExpenses = expenses.filter(e => e.category === 'operacional').reduce((acc, e) => acc + e.amount, 0);
  const fixosExpenses = expenses.filter(e => e.category === 'fixo').reduce((acc, e) => acc + e.amount, 0);
  const outrosExpenses = expenses.filter(e => e.category === 'outros').reduce((acc, e) => acc + e.amount, 0);

  const cmvPercentage = totalRevenue > 0 ? ((insumosExpenses + bebidasExpenses) / totalRevenue) * 100 : 0;

  // Breakdown by payment methods calculated from REAL orders
  const pixTotal = validOrders
    .filter(o => o.paymentMethod?.toLowerCase().includes('pix'))
    .reduce((acc, o) => acc + (o.total || 0), 0);
  const cardTotal = validOrders
    .filter(o => {
      const pm = (o.paymentMethod || '').toLowerCase();
      return pm.includes('cart') || pm.includes('créd') || pm.includes('cred') || pm.includes('déb') || pm.includes('deb');
    })
    .reduce((acc, o) => acc + (o.total || 0), 0);
  const cashTotal = validOrders
    .filter(o => (o.paymentMethod || '').toLowerCase().includes('dinheiro'))
    .reduce((acc, o) => acc + (o.total || 0), 0);
  const pixPercent = totalRevenue > 0 ? Math.round((pixTotal / totalRevenue) * 100) : 0;
  const cardPercent = totalRevenue > 0 ? Math.round((cardTotal / totalRevenue) * 100) : 0;
  const cashPercent = totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0;

  const deliveryFeeRevenue = validOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
  const productSalesRevenue = Math.max(0, totalRevenue - deliveryFeeRevenue);

  // Real items breakdown (Curva ABC de produtos) from valid orders
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; count: number; total: number }>();
    validOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const existing = itemMap.get(it.name) || { name: it.name, count: 0, total: 0 };
        existing.count += it.quantity || 1;
        existing.total += (it.price || 0) * (it.quantity || 1);
        itemMap.set(it.name, existing);
      });
    });
    return Array.from(itemMap.values()).sort((a, b) => b.total - a.total);
  }, [validOrders]);

  // Handler for adding expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newExpenseAmount.replace(',', '.'));
    if (!newExpenseDesc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: newExpenseDesc.trim(),
      category: newExpenseCat,
      amount: parsedAmount,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenses(prev => [newExpense, ...prev]);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
    setShowAddExpenseModal(false);
    setFinancialToast('Despesa registrada com sucesso!');
    setTimeout(() => setFinancialToast(null), 3000);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setFinancialToast('Despesa removida do caixa.');
    setTimeout(() => setFinancialToast(null), 3000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvRows = [
      ['RELATÓRIO FINANCEIRO & FECHAMENTO DE CAIXA - BURGER DOS CRIAS'],
      ['Data de Emissao', new Date().toLocaleString('pt-BR')],
      ['Status da Operacao', storeSettings.isOpen ? 'Loja Aberta' : 'Loja Fechada'],
      [''],
      ['1. RESUMO GERAL DO TURNO'],
      ['Faturamento Bruto', `R$ ${totalRevenue.toFixed(2)}`],
      ['Total de Pedidos', validOrders.length.toString()],
      ['Ticket Medio', `R$ ${averageTicket.toFixed(2)}`],
      ['Total de Despesas / Saidas', `R$ ${totalExpenses.toFixed(2)}`],
      ['Lucro Liquido Operacional', `R$ ${netProfit.toFixed(2)}`],
      ['Margem Liquida Real', `${netMargin.toFixed(1)}%`],
      ['CMV Insumos (%)', `${cmvPercentage.toFixed(1)}%`],
      [''],
      ['2. CONCILIACAO POR FORMAS DE PAGAMENTO'],
      ['Pix (Conta Corrente)', `R$ ${pixTotal.toFixed(2)}`],
      ['Cartoes de Credito/Debito (Maquininha)', `R$ ${cardTotal.toFixed(2)}`],
      ['Dinheiro / Especie (Gaveta)', `R$ ${cashTotal.toFixed(2)}`],
      [''],
      ['3. REGISTRO DE DESPESAS E SAIDAS DO CAIXA'],
      ['Horario', 'Descricao', 'Categoria', 'Valor (R$)'],
      ...expenses.map(e => [
        e.time,
        e.description,
        e.category === 'gas'
          ? 'Gás de Cozinha'
          : e.category === 'bebidas'
          ? 'Bebidas & Cervejas'
          : e.category === 'operacional'
          ? 'Custo Operacional Diário'
          : e.category === 'fixo'
          ? 'Custo Fixo (Aluguel/Luz/Água/Net)'
          : e.category === 'insumos'
          ? 'Insumos & Carnes'
          : e.category === 'motoboy'
          ? 'Entregas / Motoboy'
          : e.category === 'embalagens'
          ? 'Embalagens'
          : 'Outros',
        `R$ ${e.amount.toFixed(2)}`
      ]),
      [''],
      ['4. PEDIDOS DO TURNO'],
      ['Numero', 'Cliente', 'Tipo', 'Pagamento', 'Status', 'Valor (R$)'],
      ...validOrders.map(o => [o.orderNumber, o.customerName, o.type, o.paymentMethod || 'Pix', o.status, `R$ ${o.total.toFixed(2)}`])
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fechamento-caixa-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFinancialToast('Relatório financeiro exportado em CSV com sucesso!');
    setTimeout(() => setFinancialToast(null), 3500);
  };

  // Filtered products for Menu Management
  const filteredProducts = products.filter(p => {
    if (cardapioFilter === 'all') return true;
    return p.category === cardapioFilter;
  });

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-32">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#131313] border-b border-[#353535]/40 h-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToMenu}
              className="flex items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/40 shadow-sm flex-shrink-0">
                <img
                  src={APP_IMAGES.logo}
                  alt="Burgue dos Crias Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-['Montserrat'] font-bold text-sm text-white">
                  Burguer dos Crias
                </span>
                <span className="text-[10px] text-[#ff8a65] font-medium">
                  PAINEL DE GESTÃO GERAL
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Botão Rápido de Alerta Sonoro / Beep de Novo Pedido */}
            <button
              type="button"
              onClick={() => {
                const nextState = !storeSettings.soundAlerts;
                onUpdateStoreSettings({
                  ...storeSettings,
                  soundAlerts: nextState,
                });
                if (nextState) {
                  unlockAudioContext();
                  playNewOrderSound();
                  setFinancialToast('🔔 Alerta sonoro ativado! (Beep de teste reproduzido)');
                } else {
                  setFinancialToast('🔕 Alerta sonoro desativado (silencioso).');
                }
                setTimeout(() => setFinancialToast(null), 3000);
              }}
              className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-['Montserrat'] font-bold active:scale-95 shadow-sm ${
                storeSettings.soundAlerts
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
              }`}
              title={
                storeSettings.soundAlerts
                  ? 'Alerta sonoro ativo para novos pedidos (Clique para silenciar ou testar)'
                  : 'Alerta sonoro desativado (Clique para ativar o beep)'
              }
            >
              {storeSettings.soundAlerts ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline text-[11px]">Beep Ativo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span className="hidden sm:inline text-[11px]">Mudo</span>
                </>
              )}
            </button>

            <button
              onClick={async () => {
                const url = getPublicMenuUrl();
                await copyToClipboard(url);
                setLinkCopiedToast(true);
                setShowShareModal(true);
                setTimeout(() => setLinkCopiedToast(false), 2500);
              }}
              className="text-[#b4b5b5] hover:text-[#ffb5a0] p-1.5 transition-colors relative"
              title="Copiar Link Público do Cardápio para Clientes"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenChat}
              className="text-[#b4b5b5] hover:text-[#ffb5a0] p-1.5 transition-colors"
              title="WhatsApp Suporte"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {onLockManager && (
              <button
                onClick={onLockManager}
                className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 px-2.5 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                title="Bloquear Painel do Gestor (Exigir PIN novamente)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear Gestor</span>
                <span className="sm:hidden">Sair</span>
              </button>
            )}

            <div className="w-8 h-8 rounded-full bg-[#353535] flex items-center justify-center text-white" title="Gestor Logado">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* PIN Toast */}
      {pinToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-lg text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{pinToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="pt-20 px-4 md:px-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Management Module Tabs */}
        <section className="flex items-center justify-between border-b border-[#353535]/50 pb-2 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            {[
              { id: 'pedidos' as const, label: 'Pedidos (KDS)', icon: Receipt, badge: novosOrders.length },
              {
                id: 'mesas' as const,
                label: 'Mesas & Salão',
                icon: UtensilsCrossed,
                badge: (storeSettings.tables || []).filter(t => t.status === 'ocupada' || t.status === 'conta_pedida').length,
              },
              { id: 'cardapio' as const, label: 'Cardápio & Estoque', icon: Layers },
              { id: 'relatorios' as const, label: 'Finanças & Gráficos', icon: BarChart3 },
              { id: 'configuracoes' as const, label: 'Configurações', icon: Settings },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-['Montserrat'] font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ff5722] text-white shadow-[0_2px_12px_rgba(255,87,34,0.35)]'
                      : 'bg-[#20201f] text-[#b4b5b5] hover:text-white hover:bg-[#2a2a2a] border border-[#353535]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-[#ff5722] text-[10px] flex items-center justify-center font-extrabold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                storeSettings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-[#b4b5b5] font-semibold">
              {storeSettings.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            </span>
          </div>
        </section>

        {/* ================= ABA 1: PEDIDOS (KDS) ================= */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            {/* Header Summary & Operational Toolbar */}
            <section className="bg-[#1b1a19] border border-[#353535] rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
              {/* Linha Superior: Título & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="font-['Montserrat'] text-xl md:text-2xl font-black text-white tracking-tight">
                      Gestor de Pedidos (KDS)
                    </h1>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ao Vivo
                    </span>
                  </div>
                  <p className="text-xs text-[#b4b5b5] font-light">
                    Controle de fila de produção, tempos de chapa e despacho de motoboys.
                  </p>
                </div>

                <div className="text-[11px] text-[#8e8f8f] font-['Montserrat'] font-medium hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cozinha Sincronizada em Tempo Real</span>
                </div>
              </div>

              {/* Linha de Baixo: Seletor Pedidos Abertos & Botões de Ação */}
              <div className="pt-3 border-t border-[#353535]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Segmented View Switch: Abertos vs Agendados */}
                <div className="inline-flex items-center p-1 bg-[#141414] rounded-xl border border-[#353535] shadow-inner shrink-0 self-start lg:self-auto">
                  <button
                    onClick={() => setMainFilter('abertos')}
                    className={`h-7 px-3.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 ${
                      mainFilter === 'abertos'
                        ? 'bg-[#ff5722] text-white shadow-md'
                        : 'text-[#b4b5b5] hover:text-white'
                    }`}
                  >
                    <span>Pedidos Abertos</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      mainFilter === 'abertos' ? 'bg-white/20 text-white' : 'bg-[#252525] text-[#8e8f8f]'
                    }`}>
                      {abertosOrders.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMainFilter('agendados')}
                    className={`h-7 px-3.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 ${
                      mainFilter === 'agendados'
                        ? 'bg-[#ff5722] text-white shadow-md'
                        : 'text-[#b4b5b5] hover:text-white'
                    }`}
                  >
                    <span>Agendados</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      mainFilter === 'agendados' ? 'bg-white/20 text-white' : 'bg-[#252525] text-[#8e8f8f]'
                    }`}>
                      3
                    </span>
                  </button>
                </div>

                {/* Botões de Ação na mesma sequência */}
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setShowDailyReportModal(true)}
                    className="h-9 px-3.5 bg-[#242322] hover:bg-[#2e2d2c] text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-['Montserrat'] font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm leading-none shrink-0"
                    title="Ver e exportar lista detalhada de pedidos do dia"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Relatório do Dia</span>
                  </button>

                  <button
                    onClick={onOpenManualOrder}
                    className="h-9 px-3.5 btn-flame text-white border border-[#ff5722]/50 rounded-xl text-xs font-['Montserrat'] font-bold inline-flex items-center justify-center gap-1.5 shadow-md shadow-[#ff5722]/30 active:scale-95 transition-all leading-none shrink-0"
                    title="Lançar pedido presencial ou telefônico no sistema"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Pedido Balcão</span>
                  </button>

                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="h-9 px-3 bg-[#242322] hover:bg-[#2e2d2c] text-[#ff8a65] border border-[#ff5722]/40 rounded-xl text-xs font-['Montserrat'] font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm leading-none shrink-0"
                    title="Como Fazer a Gestão"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                    <span>Guia de Gestão</span>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        autoAcceptOrders: !storeSettings.autoAcceptOrders,
                      })
                    }
                    className={`h-9 px-3.5 rounded-xl text-xs font-['Montserrat'] font-bold border inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm leading-none shrink-0 ${
                      storeSettings.autoAcceptOrders
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/70'
                        : 'bg-[#242322] border-[#383838] text-[#8e8f8f] hover:text-white hover:border-[#555]'
                    }`}
                    title="Clique para alternar o aceite automático de pedidos da cozinha"
                  >
                    <Zap className={`w-3.5 h-3.5 ${storeSettings.autoAcceptOrders ? 'text-emerald-400 fill-emerald-400' : 'text-[#8e8f8f]'}`} />
                    <span>Auto-Aceite:</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-black uppercase ${
                      storeSettings.autoAcceptOrders ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2a2a2a] text-[#888]'
                    }`}>
                      {storeSettings.autoAcceptOrders ? 'ATIVADO' : 'MANUAL'}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Barra de Filtros e Seletor de Modo (Carrossel vs Kanban vs Grade) */}
            {ordersLayoutMode === 'carousel' || ordersLayoutMode === 'kanban' ? (
              /* Toolbar Dedicada do Modo Carrossel & Kanban */
              <section className="bg-[#1b1a19] border border-[#353535] rounded-2xl p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md">
                {/* Esquerda: Busca rápida e Filtro por Canal de Atendimento */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                  {/* Campo de Busca Rápida */}
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 text-[#8e8f8f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={kanbanSearch}
                      onChange={e => setKanbanSearch(e.target.value)}
                      placeholder="Buscar pedido #, cliente, item, mesa..."
                      className="w-full bg-[#141414] border border-[#353535] focus:border-[#ff5722] text-white text-xs pl-9 pr-8 py-2 rounded-xl focus:outline-none transition-colors placeholder:text-[#6e6e6e]"
                    />
                    {kanbanSearch && (
                      <button
                        type="button"
                        onClick={() => setKanbanSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e8f8f] hover:text-white p-0.5"
                        title="Limpar busca"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtros por Canal (Todos, Delivery, Balcão, Mesas) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                    {(
                      [
                        { id: 'todos', label: 'Todos os Canais' },
                        { id: 'Delivery', label: 'Delivery', icon: Bike },
                        { id: 'Retirada', label: 'Balcão', icon: ShoppingBag },
                        { id: 'Mesa', label: 'Mesas', icon: UtensilsCrossed },
                      ] as const
                    ).map(f => {
                      const Icon = 'icon' in f ? f.icon : null;
                      const isSel = kanbanTypeFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setKanbanTypeFilter(f.id as any)}
                          className={`h-8 px-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap active:scale-95 ${
                            isSel
                              ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm'
                              : 'bg-[#141414] text-[#b4b5b5] border-[#353535] hover:text-white hover:border-[#4d4d4d]'
                          }`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direita: Toggle Finalizados + Seletor de Modo (Carrossel / Kanban / Grade) */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 flex-wrap sm:flex-nowrap border-t lg:border-t-0 pt-2 lg:pt-0 border-[#353535]/50">
                  {/* Toggle Coluna Finalizados */}
                  <button
                    type="button"
                    onClick={handleToggleShowFinishedKanban}
                    className={`h-8 px-3 rounded-xl text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                      showFinishedKanban
                        ? 'bg-slate-700/50 text-slate-200 border-slate-500 shadow-sm'
                        : 'bg-[#141414] text-[#8e8f8f] border-[#353535] hover:text-white hover:border-[#4d4d4d]'
                    }`}
                    title={showFinishedKanban ? 'Ocultar coluna de finalizados' : 'Exibir coluna de pedidos finalizados'}
                  >
                    {showFinishedKanban ? <Eye className="w-3.5 h-3.5 text-slate-300" /> : <EyeOff className="w-3.5 h-3.5 text-[#8e8f8f]" />}
                    <span>Finalizados</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-black/40 text-slate-300 border border-white/10">
                      {kanbanConcluidosOrders.length}
                    </span>
                  </button>

                  {/* Toggle Tamanho do Card (Pequenos / Médios) */}
                  <button
                    type="button"
                    onClick={handleToggleCardDensity}
                    className={`h-8 px-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                      cardDensity === 'compact'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-[#141414] text-[#8e8f8f] border-[#353535] hover:text-white hover:border-[#4d4d4d]'
                    }`}
                    title={cardDensity === 'compact' ? 'Cards em tamanho reduzido (clique para tamanho padrão)' : 'Cards em tamanho padrão (clique para diminuir tamanho)'}
                  >
                    {cardDensity === 'compact' ? (
                      <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-[#8e8f8f]" />
                    )}
                    <span className="hidden sm:inline">Cards:</span>
                    <span>{cardDensity === 'compact' ? 'Pequenos' : 'Médios'}</span>
                  </button>

                  {/* Seletor de Modo (Carrossel vs Kanban vs Grade) */}
                  <div className="inline-flex items-center p-0.5 bg-[#141414] rounded-xl border border-[#353535] shadow-inner shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectOrdersLayoutMode('carousel')}
                      className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 ${
                        ordersLayoutMode === 'carousel'
                          ? 'bg-[#ff5722] text-white shadow-md'
                          : 'text-[#b4b5b5] hover:text-white'
                      }`}
                      title="Modo Carrossel focado com navegação por etapas"
                    >
                      <GalleryHorizontal className="w-3.5 h-3.5" />
                      <span>Carrossel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOrdersLayoutMode('kanban')}
                      className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 ${
                        ordersLayoutMode === 'kanban'
                          ? 'bg-[#ff5722] text-white shadow-md'
                          : 'text-[#b4b5b5] hover:text-white'
                      }`}
                      title="Quadro Kanban com todas as colunas lado a lado"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Kanban</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOrdersLayoutMode('grid')}
                      className="h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 text-[#b4b5b5] hover:text-white"
                      title="Modo Grade tradicional"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grade</span>
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* Toolbar Tradicional do Modo Grade */
              <section className="bg-[#1b1a19] border border-[#353535] rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  <span className="text-[10px] font-bold uppercase text-[#8e8f8f] pl-1 font-['Montserrat'] whitespace-nowrap hidden sm:inline">
                    Filtrar:
                  </span>

                  <button
                    onClick={() => setStatusFilter('todos')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'todos'
                        ? 'bg-[#ff5722] text-white shadow-sm font-bold'
                        : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <span>Todos</span>
                    <span className="text-[10px] opacity-80 font-mono">({orders.length})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('novos')}
                    className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      statusFilter === 'novos'
                        ? 'border-[#ff5722] bg-[#ff5722]/20 text-[#ff8a65] shadow-sm ring-1 ring-[#ff5722]/40'
                        : 'border-transparent text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <span className="w-2 h-2 bg-[#ff5722] rounded-full animate-ping" />
                    <span>Novos</span>
                    <span className="text-[10px] font-mono text-[#ff8a65] font-black">({novosOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('preparando')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      statusFilter === 'preparando'
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-transparent text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    <span>Preparando</span>
                    <span className="text-[10px] font-mono opacity-80">({preparandoOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('prontos')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      statusFilter === 'prontos'
                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'border-transparent text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span>Prontos</span>
                    <span className="text-[10px] font-mono opacity-80">({prontosOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('em_entrega')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      statusFilter === 'em_entrega'
                        ? 'border-blue-500/60 bg-blue-500/20 text-blue-300 font-bold'
                        : 'border-transparent text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Em Entrega</span>
                    <span className="text-[10px] font-mono opacity-80">({emEntregaOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setStatusFilter('historico')}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      statusFilter === 'historico'
                        ? 'border-[#ff5722]/50 bg-[#ff5722]/15 text-[#ff8a65] font-bold'
                        : 'border-transparent text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <span>Histórico</span>
                    <span className="text-[10px] font-mono opacity-80">({historicoOrders.length})</span>
                  </button>
                </div>

                <div className="inline-flex items-center p-0.5 bg-[#141414] rounded-xl border border-[#353535] shadow-inner shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectOrdersLayoutMode('carousel')}
                    className="h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 text-[#b4b5b5] hover:text-white"
                    title="Modo Carrossel"
                  >
                    <GalleryHorizontal className="w-3.5 h-3.5" />
                    <span>Carrossel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOrdersLayoutMode('kanban')}
                    className="h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 text-[#b4b5b5] hover:text-white"
                    title="Quadro Kanban"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Kanban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOrdersLayoutMode('grid')}
                    className="h-7 px-2.5 sm:px-3 rounded-lg text-xs font-['Montserrat'] font-bold transition-all flex items-center gap-1.5 bg-[#ff5722] text-white shadow-md"
                    title="Modo Grade"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grade</span>
                  </button>
                </div>
              </section>
            )}

            {/* Visualização dos Pedidos: Carrossel / Kanban Organizado vs Bento Grid */}
            {ordersLayoutMode === 'carousel' || ordersLayoutMode === 'kanban' ? (
              /* ================= MODO CARROSSEL & KANBAN COMPLETO ================= */
              <div className="space-y-3.5">
                {/* Banner Informativo & Resumo Operacional */}
                <div className="bg-[#1b1a19] border border-[#353535] px-4 py-3 rounded-2xl shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#ff5722]/15 border border-[#ff5722]/40 flex items-center justify-center shrink-0">
                      {ordersLayoutMode === 'carousel' ? (
                        <GalleryHorizontal className="w-4 h-4 text-[#ff5722]" />
                      ) : (
                        <Kanban className="w-4 h-4 text-[#ff5722]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white text-xs font-['Montserrat'] font-black">
                          {ordersLayoutMode === 'carousel' ? 'Gestor KDS • Modo Carrossel' : 'Gestor KDS • Quadro Kanban'}
                        </strong>
                        <span className="text-[11px] text-[#b4b5b5] font-light">
                          {ordersLayoutMode === 'carousel'
                            ? 'Navegue pelas etapas ou deslize as colunas para focar na produção de cada fase.'
                            : 'Arraste os cards entre colunas ou use os botões rápidos de avanço.'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8e8f8f] font-mono mt-0.5">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          {abertosOrders.length} em aberto (R$ {abertosOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2).replace('.', ',')})
                        </span>
                        {kanbanNovosOrders.length > 0 && (
                          <span className="flex items-center gap-1 text-[#ff8a65] font-bold">
                            <Flame className="w-3 h-3 text-[#ff5722]" />
                            {kanbanNovosOrders.length} aguardando aceite
                          </span>
                        )}
                        {ordersLayoutMode === 'carousel' && kanbanColumns[safeCarouselIndex] && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-sky-400 font-bold">
                            Etapa {safeCarouselIndex + 1} de {kanbanColumns.length}: {kanbanColumns[safeCarouselIndex]?.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ação Rápida: Aceitar todos os novos em lote se houver múltiplos */}
                  {kanbanNovosOrders.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAcceptAllNewOrders}
                      className="btn-flame text-white text-xs font-['Montserrat'] font-bold px-3 py-1.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 self-start md:self-auto"
                      title="Aceitar todos os pedidos novos pendentes de uma vez"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Aceitar Todos ({kanbanNovosOrders.length})</span>
                    </button>
                  )}
                </div>

                {/* Barra de Navegação Dedicada do Carrossel (Abas & Setas) */}
                {ordersLayoutMode === 'carousel' && (
                  <div className="bg-[#181716] border border-[#353535] rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-inner">
                    {/* Botão Anterior */}
                    <button
                      type="button"
                      data-drop-column={safeCarouselIndex > 0 ? kanbanColumns[safeCarouselIndex - 1].key : undefined}
                      disabled={safeCarouselIndex === 0}
                      onClick={() => scrollToCarouselIndex(safeCarouselIndex - 1)}
                      onDragOver={e => {
                        e.preventDefault();
                        if (safeCarouselIndex > 0) {
                          const prevKey = kanbanColumns[safeCarouselIndex - 1].key;
                          if (dragOverColumn !== prevKey) setDragOverColumn(prevKey);
                        }
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        if (safeCarouselIndex > 0) {
                          handleDropOnColumn(kanbanColumns[safeCarouselIndex - 1].key);
                        }
                      }}
                      className={`flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl text-xs font-['Montserrat'] font-bold border transition-all active:scale-95 shrink-0 ${
                        safeCarouselIndex === 0
                          ? 'opacity-30 cursor-not-allowed bg-[#141414] text-[#666] border-[#2c2b2a]'
                          : 'bg-[#222120] text-white border-[#3e3d3c] hover:bg-[#ff5722] hover:border-[#ff5722] shadow-sm'
                      }`}
                      title="Etapa anterior no carrossel (ou solte o card aqui)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Abas das Etapas com contadores e Drop direto */}
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1 justify-start sm:justify-center py-0.5 px-1">
                      {kanbanColumns.map((col, idx) => {
                        const isActive = safeCarouselIndex === idx;
                        const isColDragOver = dragOverColumn === col.key;
                        const Icon = col.icon;
                        return (
                          <button
                            key={col.key}
                            type="button"
                            data-drop-column={col.key}
                            onClick={() => scrollToCarouselIndex(idx)}
                            onDragOver={e => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverColumn !== col.key) {
                                setDragOverColumn(col.key);
                              }
                            }}
                            onDragLeave={e => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setDragOverColumn(null);
                              }
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              handleDropOnColumn(col.key);
                            }}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all border shrink-0 active:scale-95 ${
                              isColDragOver
                                ? 'bg-[#ff5722] text-white ring-2 ring-white border-white scale-110 shadow-lg animate-pulse'
                                : isActive
                                ? `${col.topBar} text-white shadow-md ring-2 ring-white/20 border-white/30 scale-105`
                                : draggedOrderId
                                ? 'bg-[#222] text-white border-dashed border-[#ff5722]/60 hover:bg-[#ff5722]/30'
                                : 'bg-[#141414] text-[#b4b5b5] border-[#323232] hover:text-white hover:border-[#4d4d4d]'
                            }`}
                            title={`Mudar para etapa ${col.title} (ou solte o card aqui)`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{idx + 1}. {col.title}</span>
                            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                              isActive ? 'bg-black/40 text-white font-black' : 'bg-black/30 text-[#888]'
                            }`}>
                              {col.orders.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botão Próximo */}
                    <button
                      type="button"
                      data-drop-column={safeCarouselIndex < kanbanColumns.length - 1 ? kanbanColumns[safeCarouselIndex + 1].key : undefined}
                      disabled={safeCarouselIndex === kanbanColumns.length - 1}
                      onClick={() => scrollToCarouselIndex(safeCarouselIndex + 1)}
                      onDragOver={e => {
                        e.preventDefault();
                        if (safeCarouselIndex < kanbanColumns.length - 1) {
                          const nextKey = kanbanColumns[safeCarouselIndex + 1].key;
                          if (dragOverColumn !== nextKey) setDragOverColumn(nextKey);
                        }
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        if (safeCarouselIndex < kanbanColumns.length - 1) {
                          handleDropOnColumn(kanbanColumns[safeCarouselIndex + 1].key);
                        }
                      }}
                      className={`flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl text-xs font-['Montserrat'] font-bold border transition-all active:scale-95 shrink-0 ${
                        safeCarouselIndex === kanbanColumns.length - 1
                          ? 'opacity-30 cursor-not-allowed bg-[#141414] text-[#666] border-[#2c2b2a]'
                          : 'bg-[#222120] text-white border-[#3e3d3c] hover:bg-[#ff5722] hover:border-[#ff5722] shadow-sm'
                      }`}
                      title="Próxima etapa no carrossel (ou solte o card aqui)"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Colunas do Carrossel / Kanban com Scroll Suave & Botões Flutuantes */}
                <div className="relative">
                  {/* Botão Flutuante Esquerdo (Desktop Carrossel) */}
                  {ordersLayoutMode === 'carousel' && safeCarouselIndex > 0 && (
                    <button
                      type="button"
                      data-drop-column={kanbanColumns[safeCarouselIndex - 1].key}
                      onClick={() => scrollToCarouselIndex(safeCarouselIndex - 1)}
                      onDragOver={e => {
                        e.preventDefault();
                        const prevKey = kanbanColumns[safeCarouselIndex - 1].key;
                        if (dragOverColumn !== prevKey) setDragOverColumn(prevKey);
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        handleDropOnColumn(kanbanColumns[safeCarouselIndex - 1].key);
                      }}
                      className="hidden xl:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#1e1d1c]/95 hover:bg-[#ff5722] text-white border border-[#444] hover:border-[#ff5722] shadow-2xl items-center justify-center transition-all hover:scale-110 active:scale-95"
                      title="Etapa anterior (ou solte o card aqui)"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}

                  {/* Botão Flutuante Direito (Desktop Carrossel) */}
                  {ordersLayoutMode === 'carousel' && safeCarouselIndex < kanbanColumns.length - 1 && (
                    <button
                      type="button"
                      data-drop-column={kanbanColumns[safeCarouselIndex + 1].key}
                      onClick={() => scrollToCarouselIndex(safeCarouselIndex + 1)}
                      onDragOver={e => {
                        e.preventDefault();
                        const nextKey = kanbanColumns[safeCarouselIndex + 1].key;
                        if (dragOverColumn !== nextKey) setDragOverColumn(nextKey);
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        handleDropOnColumn(kanbanColumns[safeCarouselIndex + 1].key);
                      }}
                      className="hidden xl:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#1e1d1c]/95 hover:bg-[#ff5722] text-white border border-[#444] hover:border-[#ff5722] shadow-2xl items-center justify-center transition-all hover:scale-110 active:scale-95"
                      title="Próxima etapa (ou solte o card aqui)"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}

                  {/* Banner Informativo enquanto arrasta um card (Dedo no Celular ou Mouse no PC) */}
                  {draggedOrderId && (
                    <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-[#ff5722]/15 border border-[#ff5722]/60 text-white flex items-center justify-between gap-2 text-xs shadow-lg animate-pulse">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">👆</span>
                        <span className="font-semibold text-white text-[11px] sm:text-xs truncate">
                          Arrastando com o dedo/mouse: Solte em qualquer aba do topo, coluna ou na barra de etapas abaixo!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDraggedOrderId(null);
                          setTouchDrag(null);
                          setDragOverColumn(null);
                        }}
                        className="text-[10px] bg-black/50 hover:bg-black/80 px-2.5 py-1 rounded text-[#ffdad6] hover:text-white shrink-0 font-bold border border-white/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Ghost Flutuante que acompanha o dedo na tela do celular */}
                  {touchDrag && (
                    <div
                      style={{
                        left: `${touchDrag.currentX}px`,
                        top: `${touchDrag.currentY}px`,
                      }}
                      className="fixed pointer-events-none z-[99999] -translate-x-1/2 -translate-y-full -mt-6 w-[260px] sm:w-[280px] bg-[#1e1d1c]/95 backdrop-blur-xl border-2 border-[#ff5722] rounded-2xl p-3 shadow-2xl shadow-black/90 text-white select-none transition-transform rotate-2 scale-105 ring-4 ring-[#ff5722]/30"
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-['Montserrat'] font-black text-xs bg-black/60 px-2 py-0.5 rounded border border-[#ff5722]/40 font-mono text-[#ff8a65]">
                            #{touchDrag.order.orderNumber}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[120px]">
                            {touchDrag.order.customerName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 whitespace-nowrap shrink-0">
                          R$&nbsp;{Number(touchDrag.order.total || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Indicador de destino do toque */}
                      <div
                        className={`p-2 rounded-xl text-center text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          touchDrag.hoverColumn
                            ? 'bg-[#ff5722] text-white shadow-lg animate-pulse ring-2 ring-white/60'
                            : 'bg-black/60 text-[#b4b5b5] border border-white/10'
                        }`}
                      >
                        {touchDrag.hoverColumn ? (
                          <>
                            <span className="text-sm">⬇</span>
                            <span>Soltar em:</span>
                            <span className="uppercase tracking-wider underline">
                              {kanbanColumns.find(c => c.key === touchDrag.hoverColumn)?.title || touchDrag.hoverColumn}
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px]">
                            <span>👆</span>
                            <span>Arraste até uma coluna, aba ou barra</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dock Flutuante de Destino Rápido (Perfeito para celular e toque com os dedos) */}
                  {draggedOrderId && (
                    <div className="fixed bottom-3 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-[620px] z-50 bg-[#161615]/95 backdrop-blur-xl border-2 border-[#ff5722] rounded-2xl p-2 sm:p-2.5 shadow-2xl shadow-black/90 flex flex-col gap-1.5 animate-in slide-in-from-bottom duration-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white px-1">
                        <span className="flex items-center gap-1.5 text-[#ff8a65]">
                          <span className="w-2 h-2 rounded-full bg-[#ff5722] animate-ping" />
                          Solte o dedo na etapa desejada:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDraggedOrderId(null);
                            setTouchDrag(null);
                            setDragOverColumn(null);
                          }}
                          className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                        {kanbanColumns.map((col, idx) => {
                          const isTarget = dragOverColumn === col.key;
                          const Icon = col.icon;
                          return (
                            <div
                              key={col.key}
                              data-drop-column={col.key}
                              onDragOver={e => {
                                e.preventDefault();
                                if (dragOverColumn !== col.key) setDragOverColumn(col.key);
                              }}
                              onDrop={e => {
                                e.preventDefault();
                                handleDropOnColumn(col.key);
                              }}
                              onClick={() => {
                                const orderId = draggedOrderId || touchDrag?.order.id;
                                if (orderId) {
                                  const order = orders.find(o => o.id === orderId);
                                  if (order) {
                                    executeMoveOrder(order, col.key);
                                    if (ordersLayoutMode === 'carousel') {
                                      scrollToCarouselIndex(idx);
                                    }
                                  }
                                  setDraggedOrderId(null);
                                  setTouchDrag(null);
                                  setDragOverColumn(null);
                                }
                              }}
                              className={`cursor-pointer rounded-xl p-1.5 sm:p-2 text-center transition-all flex flex-col items-center justify-center gap-1 border select-none ${
                                isTarget
                                  ? 'bg-[#ff5722] text-white border-white scale-105 shadow-xl ring-2 ring-white animate-pulse'
                                  : 'bg-[#222120] text-[#b4b5b5] border-[#383736] hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isTarget ? 'text-white' : col.colorText}`} />
                              <span className="text-[10px] sm:text-xs font-bold font-['Montserrat'] truncate w-full leading-tight">
                                {col.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    ref={carouselTrackRef}
                    onScroll={handleCarouselScroll}
                    className={`flex items-start overflow-x-auto pb-4 pt-1 hide-scrollbar snap-x snap-mandatory select-none scroll-smooth ${
                      ordersLayoutMode === 'carousel'
                        ? 'gap-5 sm:gap-6 px-1 sm:px-2'
                        : 'gap-4'
                    }`}
                  >
                  {kanbanColumns.map((col, idx) => {
                    const isDragOver = dragOverColumn === col.key;
                    const colTotal = col.orders.reduce((sum, o) => sum + (o.total || 0), 0);

                    return (
                      <div
                        key={col.key}
                        data-drop-column={col.key}
                        onDragOver={e => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverColumn !== col.key) {
                            setDragOverColumn(col.key);
                          }
                        }}
                        onDragLeave={e => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDragOverColumn(null);
                          }
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          handleDropOnColumn(col.key);
                        }}
                        className={`rounded-2xl border transition-all flex flex-col shadow-xl overflow-hidden ${
                          ordersLayoutMode === 'carousel'
                            ? cardDensity === 'compact'
                              ? 'w-[86vw] sm:w-[320px] md:w-[340px] lg:w-[350px] shrink-0 snap-center shadow-xl'
                              : 'w-[90vw] sm:w-[380px] md:w-[410px] lg:w-[430px] shrink-0 snap-center shadow-2xl'
                            : cardDensity === 'compact'
                              ? 'w-[260px] sm:w-[275px] xl:w-[285px] shrink-0 snap-start'
                              : 'w-[295px] sm:w-[310px] xl:w-[320px] shrink-0 snap-start'
                        } ${
                          isDragOver ? col.activeRing : `${col.borderColor} bg-[#181716]`
                        }`}
                      >
                        {/* Top Line Accent */}
                        <div className={`h-1.5 w-full ${col.topBar}`} />

                        {/* Cabeçalho da Coluna */}
                        <div className={`p-2.5 sm:p-3 border-b border-[#353535] ${col.headerBg} flex items-center justify-between`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                              <col.icon className={`w-3.5 h-3.5 ${col.colorText}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-['Montserrat'] font-black text-white text-xs sm:text-sm tracking-tight truncate">
                                  {col.title}
                                </h3>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black border ${col.badgeBg}`}>
                                  {col.orders.length}
                                </span>
                                {ordersLayoutMode === 'carousel' && (
                                  <span className="text-[9.5px] text-[#8e8f8f] font-mono hidden sm:inline">
                                    ({idx + 1}/{kanbanColumns.length})
                                  </span>
                                )}
                              </div>
                              <p className="text-[9.5px] text-[#b4b5b5] font-light truncate">
                                {col.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Subtotal da Coluna em R$ + Controles rápidos de navegação no Carrossel */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="text-[8.5px] uppercase tracking-wider text-[#8e8f8f] block font-bold leading-tight">
                                Subtotal
                              </span>
                              <span className="text-xs font-mono font-bold text-white">
                                R$ {colTotal.toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {/* No modo carrossel, pequenas setas para mudar de etapa rapidamente */}
                            {ordersLayoutMode === 'carousel' && (
                              <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => scrollToCarouselIndex(idx - 1)}
                                  className="w-5 h-5 rounded-md bg-black/30 hover:bg-black/60 text-[#b4b5b5] hover:text-white flex items-center justify-center disabled:opacity-20 disabled:hover:bg-black/30 transition-colors"
                                  title="Etapa anterior"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === kanbanColumns.length - 1}
                                  onClick={() => scrollToCarouselIndex(idx + 1)}
                                  className="w-5 h-5 rounded-md bg-black/30 hover:bg-black/60 text-[#b4b5b5] hover:text-white flex items-center justify-center disabled:opacity-20 disabled:hover:bg-black/30 transition-colors"
                                  title="Próxima etapa"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cards na Coluna com Scroll Independente */}
                        <div className="p-2 sm:p-2.5 space-y-2 min-h-[380px] max-h-[calc(100vh-270px)] overflow-y-auto hide-scrollbar flex flex-col">
                          {/* Placeholder quando arrastando por cima */}
                          {draggedOrderId && isDragOver && (
                            <div className="border-2 border-dashed border-white/60 bg-white/5 rounded-xl p-2.5 text-center text-xs font-bold text-white animate-pulse">
                              ⬇ Solte para mover para {col.title}
                            </div>
                          )}

                          {col.orders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-5 text-center border-2 border-dashed border-[#2f2e2d] rounded-xl text-[#7a7a7a] text-xs m-1">
                              <col.icon className="w-7 h-7 mb-1.5 opacity-30" />
                              <span className="font-medium text-white/60 text-[11px]">
                                {kanbanSearch || kanbanTypeFilter !== 'todos'
                                  ? 'Nenhum pedido filtrado'
                                  : `Nenhum pedido em ${col.title}`}
                              </span>
                              <span className="text-[10px] text-[#8e8f8f] mt-0.5">
                                {draggedOrderId ? 'Solte o card aqui para mover' : 'Entrará aqui automaticamente'}
                              </span>
                            </div>
                          ) : (
                            col.orders.map(order => {
                              const isOnlinePaid =
                                order.paymentStatus === 'aprovado' ||
                                Boolean(
                                  order.paymentMethod &&
                                    (order.paymentMethod.toLowerCase().includes('online') ||
                                      order.paymentMethod.toLowerCase().includes('pix'))
                                );

                              const isNeedMachine =
                                Boolean(
                                  order.paymentMethod &&
                                    (order.paymentMethod.toLowerCase().includes('maquininha') ||
                                      order.paymentMethod.toLowerCase().includes('vale') ||
                                      order.paymentMethod.toLowerCase().includes('vr') ||
                                      order.paymentMethod.toLowerCase().includes('crédito') ||
                                      order.paymentMethod.toLowerCase().includes('débito')) &&
                                    !isOnlinePaid
                                );

                              const isCash = Boolean(
                                order.paymentMethod && order.paymentMethod.toLowerCase().includes('dinheiro')
                              );

                              // Elapsed urgency check
                              const tStr = (order.timeAgo || '').toLowerCase();
                              const isOverdue =
                                order.isUrgent ||
                                tStr.includes('h') ||
                                tStr.includes('dia') ||
                                (parseInt(tStr.replace(/\D/g, ''), 10) >= 25);

                              const isQuickMoveOpen = quickMoveOrderId === order.id;

                              return (
                                <div
                                  key={order.id}
                                  draggable={true}
                                  onDragStart={e => {
                                    e.dataTransfer.setData('text/plain', order.id);
                                    setDraggedOrderId(order.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedOrderId(null);
                                    setDragOverColumn(null);
                                  }}
                                  className={`bg-[#20201f] border rounded-xl shadow-md flex flex-col transition-all select-none group/card cursor-grab active:cursor-grabbing relative ${
                                    cardDensity === 'compact'
                                      ? 'p-2.5 gap-1.5'
                                      : 'p-3 gap-2'
                                  } ${
                                    draggedOrderId === order.id || touchDrag?.order.id === order.id
                                      ? 'opacity-40 scale-95 border-dashed border-[#ff5722]'
                                      : order.isUrgent || (isOverdue && col.key !== 'concluido')
                                      ? 'border-[#ff5722]/70 bg-[#241c19] ring-1 ring-[#ff5722]/30 shadow-[#ff5722]/10'
                                      : 'border-[#353535] hover:border-[#4d4d4d]'
                                  }`}
                                >
                                  {/* Linha 1: Grip para arrastar (dedo ou mouse), Número, Nome do Cliente e Impressão */}
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div
                                      onTouchStart={e => handleTouchDragStart(e, order)}
                                      className="flex items-center gap-1 min-w-0 touch-none select-none cursor-grab active:cursor-grabbing group/handle"
                                      title="Arraste com o dedo no celular ou mouse no PC"
                                    >
                                      <div
                                        className="text-[#ff5722] sm:text-[#8e8f8f] group-hover/handle:text-white transition-colors p-1 -ml-1 rounded hover:bg-white/10 active:bg-[#ff5722]/30 shrink-0"
                                      >
                                        <GripVertical className="w-4 h-4 shrink-0" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-['Montserrat'] font-black text-white text-xs sm:text-[13px] tracking-tight bg-black/40 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                                            #{order.orderNumber}
                                          </span>
                                          <span className="font-bold text-xs text-[#f5f5f5] truncate max-w-[110px] sm:max-w-[130px]">
                                            {order.customerName}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Botões do Topo: WhatsApp e Imprimir */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {order.customerPhone && (
                                        <a
                                          href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.customerName}, aqui é da Burguer dos Crias sobre seu pedido #${order.orderNumber}:`)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 rounded bg-[#282828] hover:bg-emerald-600 text-[#b4b5b5] hover:text-white border border-[#404040] transition-colors"
                                          title={`Conversar com cliente no WhatsApp (${order.customerPhone})`}
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation();
                                          onPrintOrder(order);
                                        }}
                                        className="p-1 rounded bg-[#282828] hover:bg-[#ff5722] text-[#ffdad6] hover:text-white border border-[#404040] transition-colors"
                                        title="Imprimir comanda térmica"
                                      >
                                        <Printer className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Linha 2: Badges de Canal (Delivery/Mesa/Balcão), Tempo e Urgência */}
                                  <div className="flex items-center justify-between gap-1 text-[9.5px]">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {/* Canal */}
                                      <span className={`px-1.5 py-0.5 rounded font-['Montserrat'] font-bold flex items-center gap-1 border ${
                                        order.type === 'Delivery'
                                          ? 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                                          : order.type === 'Mesa'
                                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                          : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                      }`}>
                                        {order.type === 'Delivery' && <Bike className="w-2.5 h-2.5" />}
                                        {order.type === 'Retirada' && <ShoppingBag className="w-2.5 h-2.5" />}
                                        {order.type === 'Mesa' && <UtensilsCrossed className="w-2.5 h-2.5" />}
                                        <span>
                                          {order.type === 'Mesa' && order.tableNumber
                                            ? `Mesa #${order.tableNumber}`
                                            : order.type}
                                        </span>
                                      </span>

                                      {/* Tempo Decorrido */}
                                      <span
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-medium ${
                                          isOverdue && col.key !== 'concluido'
                                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                                            : 'bg-[#282828] text-[#b4b5b5]'
                                        }`}
                                        title="Tempo decorrido desde a abertura"
                                      >
                                        <Clock className="w-2.5 h-2.5" />
                                        {order.timeAgo || 'Agora'}
                                      </span>
                                    </div>

                                    {order.isUrgent && (
                                      <span className="bg-[#93000a] text-[#ffdad6] text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse border border-red-500/40">
                                        Urgente
                                      </span>
                                    )}
                                  </div>

                                  {/* Lista de Itens do Pedido */}
                                  <div className="space-y-0.5 text-xs py-1 border-y border-[#353535]/60 max-h-24 sm:max-h-28 overflow-y-auto hide-scrollbar">
                                    {(order.items || []).map((item, idx) => (
                                      <div key={idx} className="space-y-0.5">
                                        <div className="flex justify-between items-start text-white/95 leading-tight">
                                          <span className="font-medium text-[10.5px] truncate">
                                            <strong className="text-[#ff5722] font-mono mr-1">{item.quantity}x</strong>
                                            {item.name}
                                            {item.pizzaSize && (
                                              <span className="text-[9px] text-[#ff8a65] ml-1 font-bold">({item.pizzaSize})</span>
                                            )}
                                            {item.juiceSize && (
                                              <span className="text-[9px] text-[#ff8a65] ml-1 font-bold">({item.juiceSize})</span>
                                            )}
                                          </span>
                                          <span className="text-[10px] text-[#ff8a65] font-mono shrink-0 ml-1 font-bold">
                                            R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                                          </span>
                                        </div>
                                        {/* Observação Específica do Item */}
                                        {item.notes && (
                                          <div className="text-[9px] font-medium text-amber-300 bg-amber-500/10 border-l-2 border-amber-400 px-1.5 py-0.5 rounded-r">
                                            ⚠️ Obs: "{item.notes}"
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    {/* Observação Geral do Pedido */}
                                    {order.notes && (
                                      <div className="text-[9px] font-medium text-amber-200 bg-amber-950/40 border border-amber-500/30 px-1.5 py-1 rounded mt-0.5">
                                        💬 Obs: "{order.notes}"
                                      </div>
                                    )}
                                  </div>

                                  {/* Endereço Delivery e Rota no Google Maps */}
                                  {order.type === 'Delivery' && order.address && (
                                    <div className="flex items-center justify-between gap-1 text-[9px] text-[#b4b5b5] bg-[#161616] p-1.5 rounded-lg border border-[#303030]">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <MapPin className="w-2.5 h-2.5 text-[#ff5722] shrink-0" />
                                        <span className="truncate text-white font-medium">{order.address}</span>
                                      </div>
                                      <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#86cfff] hover:text-white shrink-0 flex items-center gap-0.5 font-bold bg-[#019ad8]/15 hover:bg-[#019ad8]/30 px-1.5 py-0.5 rounded border border-[#019ad8]/30 transition-colors"
                                        title="Abrir rota no Google Maps GPS"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <Navigation className="w-2 h-2 text-[#019ad8]" />
                                        <span>GPS</span>
                                      </a>
                                    </div>
                                  )}

                                  {/* Motoboy Atribuído (Nas colunas de Entrega ou Pronto) */}
                                  {order.courierName && (
                                    <div className="p-1.5 bg-[#181818] rounded-lg border border-[#353535] text-[9px] space-y-0.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-white font-bold truncate flex items-center gap-1">
                                          <Bike className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                                          {order.courierName}
                                        </span>
                                        {order.courierPhone && (() => {
                                          const courierMsg = [
                                            `*🛵 NOVA ENTREGA - ${storeSettings.storeName || 'BURGUER DOS CRIAS'}*`,
                                            `*Pedido:* #${order.orderNumber}`,
                                            `*Cliente:* ${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ''}`,
                                            `*Endereço:* ${order.address || 'Não informado'}`,
                                            order.address ? `*Rota GPS:* https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}` : '',
                                            `*Total a cobrar/receber:* R$ ${(order.total || 0).toFixed(2).replace('.', ',')}`,
                                            isOnlinePaid
                                              ? '✅ *PAGAMENTO:* PAGO ONLINE (NÃO COBRAR DO CLIENTE)'
                                              : isNeedMachine
                                              ? '💳 *PAGAMENTO:* LEVAR MAQUININHA (COBRAR NA ENTREGA)'
                                              : isCash
                                              ? `💵 *PAGAMENTO:* DINHEIRO ${order.changeFor ? `(LEVAR TROCO P/ ${order.changeFor})` : '(SEM TROCO)'}`
                                              : `💰 *PAGAMENTO:* ${order.paymentMethod || 'Cobrar na entrega'}`,
                                            order.notes ? `*Observações:* ${order.notes}` : ''
                                          ].filter(Boolean).join('\n');

                                          return (
                                            <a
                                              href={`https://wa.me/55${order.courierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(courierMsg)}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                                              onClick={e => e.stopPropagation()}
                                              title="Enviar ficha da entrega para o WhatsApp do entregador"
                                            >
                                              <Phone className="w-2 h-2" /> WhatsApp
                                            </a>
                                          );
                                        })()}
                                      </div>
                                      {order.courierVehicle && (
                                        <span className="text-[#8e8f8f] block truncate text-[8.5px]">
                                          {order.courierVehicle} {order.courierPlate ? `• ${order.courierPlate}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Total & Forma de Pagamento */}
                                  <div className="space-y-0.5 pt-0.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#8e8f8f] text-[10px] font-bold uppercase tracking-wider">Total:</span>
                                      <span className="font-['Montserrat'] font-black text-xs sm:text-[13px] text-[#ff5722] whitespace-nowrap shrink-0">
                                        R$&nbsp;{(order.total || 0).toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>

                                    {isOnlinePaid ? (
                                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-md px-1.5 py-0.5 flex items-center justify-between text-[9px]">
                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                          <CheckCircle className="w-2.5 h-2.5" /> PAGO ONLINE
                                        </span>
                                        <span className="text-[7.5px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-black uppercase">
                                          NÃO COBRAR
                                        </span>
                                      </div>
                                    ) : isNeedMachine ? (
                                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-md px-1.5 py-0.5 flex items-center justify-between text-[9px] text-amber-300 font-bold">
                                        <span className="flex items-center gap-1">
                                          <CreditCard className="w-2.5 h-2.5 text-amber-400" /> MAQUININHA
                                        </span>
                                        <span className="text-[7.5px] bg-amber-500/20 px-1 py-0.2 rounded uppercase">
                                          COBRAR
                                        </span>
                                      </div>
                                    ) : isCash ? (
                                      <div className="bg-blue-950/40 border border-blue-500/30 rounded-md px-1.5 py-0.5 flex items-center justify-between text-[9px] text-blue-300 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Banknote className="w-2.5 h-2.5 text-blue-400" /> DINHEIRO
                                        </span>
                                        <span className="text-[8px] text-[#ffdad6]">
                                          {order.changeFor ? `Troco p/ ${order.changeFor}` : 'Sem troco'}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="bg-[#262626] border border-[#383838] rounded-md px-1.5 py-0.5 text-[8.5px] text-[#b4b5b5] flex justify-between">
                                        <span>Pagamento:</span>
                                        <span className="text-white font-medium">{order.paymentMethod || 'A combinar'}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Menu Rápido de Mudança de Etapa (Aparece se clicado em Mover) */}
                                  {isQuickMoveOpen && (
                                    <div className="bg-[#151515] border border-[#444] rounded-xl p-2 space-y-1 shadow-2xl animate-in fade-in duration-150 z-20">
                                      <div className="text-[10px] uppercase font-bold text-[#8e8f8f] px-1 pb-1 border-b border-[#333] flex justify-between items-center">
                                        <span>Mover pedido para:</span>
                                        <button
                                          type="button"
                                          onClick={() => setQuickMoveOrderId(null)}
                                          className="text-[#888] hover:text-white"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'novo')}
                                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#252525] text-[#ff8a65] flex items-center gap-1.5"
                                      >
                                        <Flame className="w-3 h-3" /> 1. Novos
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'preparando')}
                                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#252525] text-amber-300 flex items-center gap-1.5"
                                      >
                                        <Soup className="w-3 h-3" /> 2. Em Preparo
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'pronto')}
                                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#252525] text-emerald-300 flex items-center gap-1.5"
                                      >
                                        <Package className="w-3 h-3" /> 3. Pronto
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'em_entrega')}
                                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#252525] text-sky-300 flex items-center gap-1.5"
                                      >
                                        <Bike className="w-3 h-3" /> 4. Em Rota
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'concluido')}
                                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#252525] text-slate-300 flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 className="w-3 h-3" /> 5. Finalizado
                                      </button>
                                    </div>
                                  )}

                                  {/* Botões de Ação Operacional do Card */}
                                  <div className="pt-1.5 border-t border-[#353535]/60 flex items-center gap-1">
                                    {/* Seta Voltar Etapa (se não for Novo) */}
                                    {col.key !== 'novo' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const prevCol =
                                            col.key === 'preparando'
                                              ? 'novo'
                                              : col.key === 'pronto'
                                              ? 'preparando'
                                              : col.key === 'em_entrega'
                                              ? 'pronto'
                                              : 'em_entrega';
                                          executeMoveOrder(order, prevCol);
                                        }}
                                        className="h-7 w-7 rounded-lg bg-[#262626] hover:bg-[#333] text-[#b4b5b5] hover:text-white border border-[#383838] flex items-center justify-center shrink-0 transition-all active:scale-95"
                                        title="Voltar para etapa anterior"
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Ação Primária da Etapa Atual */}
                                    {col.key === 'novo' ? (
                                      <div className="flex-1 flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setRejectOrderTarget(order)}
                                          className="px-2 py-1 rounded-lg bg-[#2f2020] hover:bg-[#452525] text-red-300 border border-red-500/30 text-[10px] font-semibold transition-colors active:scale-95"
                                          title="Recusar pedido"
                                        >
                                          Recusar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => executeMoveOrder(order, 'preparando')}
                                          className="flex-1 btn-flame text-white py-1 rounded-lg text-[10px] font-bold font-['Montserrat'] shadow transition-all active:scale-95 flex items-center justify-center gap-1"
                                        >
                                          <span>Aceitar</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    ) : col.key === 'preparando' ? (
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'pronto')}
                                        className="flex-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 py-1 rounded-lg text-[10px] font-bold font-['Montserrat'] transition-all active:scale-95 flex items-center justify-center gap-1"
                                      >
                                        <Package className="w-3 h-3" />
                                        <span>Marcar Pronto</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    ) : col.key === 'pronto' ? (
                                      <div className="flex-1 space-y-0.5">
                                        {order.type === 'Delivery' ? (
                                          <button
                                            type="button"
                                            onClick={() => executeMoveOrder(order, 'em_entrega')}
                                            className="w-full bg-[#019ad8]/20 text-[#86cfff] hover:bg-[#019ad8]/30 border border-[#019ad8]/40 py-1 rounded-lg text-[10px] font-bold font-['Montserrat'] transition-all active:scale-95 flex items-center justify-center gap-1"
                                          >
                                            <Bike className="w-3 h-3" />
                                            <span>Despachar Rota</span>
                                            <ArrowRight className="w-2.5 h-2.5" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => executeMoveOrder(order, 'concluido')}
                                            className="w-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 py-1 rounded-lg text-[10px] font-bold font-['Montserrat'] transition-all active:scale-95 flex items-center justify-center gap-1"
                                          >
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Entregar no Balcão</span>
                                          </button>
                                        )}
                                        {order.type === 'Delivery' && (storeSettings.couriers || []).filter(c => c.active).length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => setDispatchOrderTarget(order)}
                                            className="w-full text-[8.5px] text-[#86cfff]/80 hover:text-white text-center underline"
                                          >
                                            Escolher motoboy
                                          </button>
                                        )}
                                      </div>
                                    ) : col.key === 'em_entrega' ? (
                                      <button
                                        type="button"
                                        onClick={() => executeMoveOrder(order, 'concluido')}
                                        className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 py-1 rounded-lg text-[10px] font-bold font-['Montserrat'] transition-all active:scale-95 flex items-center justify-center gap-1"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Concluir Entrega</span>
                                      </button>
                                    ) : (
                                      /* Coluna Finalizados */
                                      <div className="flex-1 flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => executeMoveOrder(order, 'pronto')}
                                          className="flex-1 bg-[#262626] hover:bg-[#333] text-slate-300 border border-[#383838] py-1 rounded-lg text-[9.5px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                                          title="Reabrir pedido caso tenha sido concluído por engano"
                                        >
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>Reabrir</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onPrintOrder(order)}
                                          className="px-1.5 py-1 bg-[#262626] hover:bg-[#333] text-slate-300 border border-[#383838] rounded-lg text-[9.5px] font-bold transition-all"
                                          title="Imprimir segunda via"
                                        >
                                          2ª Via
                                        </button>
                                      </div>
                                    )}

                                    {/* Botão de Menu Rápido Mover */}
                                    <button
                                      type="button"
                                      onClick={() => setQuickMoveOrderId(isQuickMoveOpen ? null : order.id)}
                                      className={`h-7 px-1.5 rounded-lg border text-[9.5px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                                        isQuickMoveOpen
                                          ? 'bg-[#ff5722] text-white border-[#ff5722]'
                                          : 'bg-[#262626] hover:bg-[#333] text-[#b4b5b5] hover:text-white border-[#383838]'
                                      }`}
                                      title="Mover diretamente para qualquer coluna"
                                    >
                                      <SlidersHorizontal className="w-2.5 h-2.5" />
                                      <span className="hidden sm:inline">Mover</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Indicador de Dots / Paginação do Carrossel */}
                {ordersLayoutMode === 'carousel' && (
                  <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                    {kanbanColumns.map((col, idx) => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => scrollToCarouselIndex(idx)}
                        className={`transition-all rounded-full ${
                          safeCarouselIndex === idx
                            ? `w-8 h-2.5 ${col.topBar} shadow-md`
                            : 'w-2.5 h-2.5 bg-[#353535] hover:bg-[#666]'
                        }`}
                        title={`Ir para ${col.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>

                {/* Barra Inferior com Métricas Operacionais e Novo Pedido Manual */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-[#1b1a19] border border-[#353535] rounded-2xl p-4 flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[11px] text-[#8e8f8f] block uppercase tracking-wider font-bold">Ticket Médio</span>
                      <span className="font-['Montserrat'] font-black text-lg text-[#ff5722]">
                        R$ {averageTicket.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#8e8f8f] block uppercase tracking-wider font-bold">Tempo Médio</span>
                      <span className="font-['Montserrat'] font-black text-lg text-white">18 min</span>
                    </div>
                  </div>

                  <div className="bg-[#1b1a19] border border-[#353535] rounded-2xl p-4 flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[11px] text-[#8e8f8f] block uppercase tracking-wider font-bold">Pedidos em Produção</span>
                      <span className="font-['Montserrat'] font-black text-lg text-white">
                        {abertosOrders.length}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#8e8f8f] block uppercase tracking-wider font-bold">Entregues Hoje</span>
                      <span className="font-['Montserrat'] font-black text-lg text-emerald-400">
                        {historicoOrders.length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onOpenManualOrder}
                    className="bg-[#1c1b1b] hover:bg-[#252525] border-2 border-dashed border-[#ff5722]/50 hover:border-[#ff5722] rounded-2xl p-4 flex items-center justify-center gap-2.5 text-white font-['Montserrat'] font-bold text-xs transition-all active:scale-98 shadow-sm group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#ff5722]/15 border border-[#ff5722]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4 text-[#ff5722]" />
                    </div>
                    <span>Criar Pedido Manual (Balcão/Tel)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Bento Grid: Cards Section */
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.length === 0 && (
                <div className="col-span-full bg-[#20201f] rounded-lg p-8 text-center border border-[#353535]/50 text-[#b4b5b5] text-xs">
                  Nenhum pedido com este status no momento.
                </div>
              )}

              {filteredOrders.map(order => {
                const isNovo = order.status === 'novo' || order.status === 'recebido';
                const isPreparando = order.status === 'preparando';
                const isPronto = order.status === 'pronto';
                const isEmEntrega = order.status === 'em_entrega';
                const isEntregue = order.status === 'entregue';
                const isRecusado = order.status === 'recusado';

                const isOnlinePaid =
                  order.paymentStatus === 'aprovado' ||
                  Boolean(
                    order.paymentMethod &&
                      (order.paymentMethod.toLowerCase().includes('online') ||
                        order.paymentMethod.toLowerCase().includes('pix'))
                  );

                const isNeedMachine =
                  Boolean(
                    order.paymentMethod &&
                      (order.paymentMethod.toLowerCase().includes('maquininha') ||
                        order.paymentMethod.toLowerCase().includes('vale') ||
                        order.paymentMethod.toLowerCase().includes('vr') ||
                        order.paymentMethod.toLowerCase().includes('crédito') ||
                        order.paymentMethod.toLowerCase().includes('débito')) &&
                      !isOnlinePaid
                  );

                const isCash = Boolean(
                  order.paymentMethod && order.paymentMethod.toLowerCase().includes('dinheiro')
                );

                if (order.isUrgent) {
                  return (
                    <div
                      key={order.id}
                      className="bg-[#20201f] rounded-lg border border-[#ff5722]/30 shadow-xl overflow-hidden flex flex-col group hover:border-[#ff5722] transition-all"
                    >
                      <div className="h-24 w-full relative overflow-hidden bg-black">
                        <img
                          src={APP_IMAGES.urgentCardBanner}
                          alt="Smash burger urgente"
                          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#20201f] to-transparent" />
                        <div className="absolute bottom-2.5 left-4 flex items-center gap-2">
                          <span className="bg-[#93000a] text-[#ffdad6] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-['Montserrat']">
                            Urgente
                          </span>
                          <span className="text-[10px] text-[#ffb5a0] bg-black/60 px-2 py-0.5 rounded-full">
                            {order.timeAgo}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                                  {order.orderNumber} - {order.customerName}
                                </h3>
                                {isOnlinePaid ? (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                    Pago Online
                                  </span>
                                ) : isNeedMachine ? (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                                    Levar Maquininha
                                  </span>
                                ) : isCash ? (
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                    Dinheiro
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-[#b4b5b5]">
                                {order.timeAgo} • {order.type}
                              </p>
                              {order.type === 'Delivery' && order.address && (
                                <div className="flex items-center gap-1.5 text-[11px] text-[#b4b5b5] mt-1 pt-1 border-t border-[#353535]/40">
                                  <MapPin className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                                  <span className="truncate flex-1 text-white">{order.address}</span>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#86cfff] hover:text-white shrink-0 flex items-center gap-0.5 text-[10px] font-bold bg-[#141414] px-1.5 py-0.5 rounded border border-[#353535]"
                                    title="Abrir rota no Google Maps"
                                  >
                                    <Navigation className="w-2.5 h-2.5 text-[#019ad8]" />
                                    <span>Rota</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => onPrintOrder(order)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#282828] hover:bg-[#ff5722] text-[#ffdad6] hover:text-white rounded-lg text-[11px] font-bold font-['Montserrat'] border border-[#404040] transition-all active:scale-95 shadow-sm"
                                title="Imprimir comanda térmica (58mm/80mm)"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#ff8a65]" />
                                <span>Imprimir</span>
                              </button>
                              <Zap className="w-5 h-5 text-[#ff5722] fill-[#ff5722]" />
                            </div>
                          </div>

                          <div className="space-y-1 mb-3 text-xs text-[#e5e2e1]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="text-[#ff5722] font-semibold">
                                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Payment Instruction Banner */}
                          <div className="mb-3 pt-2.5 border-t border-[#353535]/50 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#8e8f8f] font-medium">Total:</span>
                              <span className="font-['Montserrat'] font-black text-sm text-[#ff5722] whitespace-nowrap shrink-0">
                                R$&nbsp;{order.total.toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {isOnlinePaid ? (
                              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-bold min-w-0">
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">PAGO ONLINE ({order.paymentMethod})</span>
                                </div>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                                  NÃO COBRAR
                                </span>
                              </div>
                            ) : isNeedMachine ? (
                              <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-2 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-amber-300 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>LEVAR MAQUININHA 💳</span>
                                  </span>
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                                    COBRAR NA ENTREGA
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#ffdad6] block truncate">
                                  Forma: {order.paymentMethod}
                                </span>
                              </div>
                            ) : isCash ? (
                              <div className="bg-blue-950/40 border border-blue-500/50 rounded-xl p-2 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-blue-300 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <Banknote className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>COBRAR EM DINHEIRO 💵</span>
                                  </span>
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                                    NA ENTREGA
                                  </span>
                                </div>
                                {order.changeFor ? (
                                  <div className="text-[10px] text-amber-300 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                                    ⚠️ Levar troco para: {order.changeFor}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-blue-300/80 block">Não precisa de troco</span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-[#262626] border border-[#383838] rounded-xl p-2 flex items-center justify-between text-[11px] text-[#b4b5b5]">
                                <span className="truncate">Forma: {order.paymentMethod}</span>
                                <span className="text-[9px] text-white font-semibold shrink-0">Pagar na Entrega</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#353535]/50 flex gap-2">
                          {isNovo ? (
                            <>
                              <button
                                onClick={() => onRejectOrder(order.id)}
                                className="flex-1 bg-[#353535] hover:bg-[#454747] text-white py-2.5 rounded-md text-xs font-semibold font-['Montserrat'] transition-colors"
                              >
                                Recusar
                              </button>
                              <button
                                onClick={() => onAcceptOrder(order.id)}
                                className="flex-1 btn-flame text-white py-2.5 rounded-md text-xs font-bold font-['Montserrat'] transition-all active:scale-95 shadow-md"
                              >
                                Aceitar Agora
                              </button>
                            </>
                          ) : isPreparando ? (
                            <button
                              onClick={() => onAdvanceToReady(order.id)}
                              className="w-full bg-[#2a2a2a] text-[#ff8a65] border border-[#ff5722]/30 hover:bg-[#ff5722]/10 py-2.5 rounded-md text-xs font-bold font-['Montserrat'] transition-all"
                            >
                              Mudar para Pronto
                            </button>
                          ) : isPronto ? (
                            <div className="w-full space-y-1.5">
                              <button
                                onClick={() => {
                                  const activeCouriers = (storeSettings.couriers || []).filter(c => c.active);
                                  if (activeCouriers.length > 1) {
                                    setDispatchOrderTarget(order);
                                  } else if (activeCouriers.length === 1) {
                                    const c = activeCouriers[0];
                                    onAdvanceToDelivery(order.id, {
                                      name: c.name,
                                      phone: c.phone,
                                      avatar: c.avatar,
                                      vehicle: c.vehicleModel || (c.vehicle ? `Veículo (${c.vehicle})` : undefined),
                                      plate: c.plate,
                                    });
                                  } else {
                                    onAdvanceToDelivery(order.id);
                                  }
                                }}
                                className="w-full bg-[#019ad8]/20 text-[#86cfff] py-2.5 rounded-md text-xs font-bold font-['Montserrat'] border border-[#019ad8]/40 hover:bg-[#019ad8]/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                              >
                                <Bike className="w-4 h-4" /> Despachar Entrega Urgente
                              </button>
                              {(storeSettings.couriers || []).filter(c => c.active).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setDispatchOrderTarget(order)}
                                  className="w-full text-[10px] text-[#86cfff]/80 hover:text-white text-center py-0.5 underline transition-colors"
                                >
                                  Escolher entregador
                                </button>
                              )}
                            </div>
                          ) : isEmEntrega ? (
                            <div className="w-full space-y-2">
                              <div className="p-2.5 bg-[#1c1b1b] rounded-lg border border-[#353535] space-y-2 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-[#ff5722]/50 bg-[#252525] flex-shrink-0">
                                      <img
                                        src={order.courierAvatar || APP_IMAGES.driverAvatar}
                                        alt="Entregador"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-white font-bold truncate block">
                                        {order.courierName || 'Entregador Despachado'}
                                      </span>
                                      {order.courierVehicle && (
                                        <span className="text-[10px] text-[#b4b5b5] truncate block">
                                          {order.courierVehicle} {order.courierPlate ? `• ${order.courierPlate}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {order.courierPhone && (
                                    <a
                                      href={`https://wa.me/55${order.courierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.courierName}, tudo bem? Mensagem sobre o pedido URGENTE ${order.orderNumber}:`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] flex items-center gap-1 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30 shrink-0"
                                    >
                                      <Phone className="w-3 h-3" /> WhatsApp
                                    </a>
                                  )}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full bg-[#182026] hover:bg-[#1f2b33] border border-[#019ad8]/40 text-[#86cfff] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-bold text-[10px] transition-colors"
                                >
                                  <Navigation className="w-3.5 h-3.5 text-[#019ad8]" />
                                  <span>Acompanhar Rota no Google Maps</span>
                                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                                </a>
                              </div>
                              <button
                                onClick={() => onCompleteOrder(order.id)}
                                className="w-full bg-emerald-500/20 text-emerald-400 py-2.5 rounded-md text-xs font-bold font-['Montserrat'] border border-emerald-500/40 hover:bg-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="w-4 h-4" /> Finalizar como Entregue
                              </button>
                            </div>
                          ) : isEntregue ? (
                            <div className="w-full py-2 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Pedido Concluído
                            </div>
                          ) : (
                            <div className="w-full py-2 text-center text-xs text-[#ffb4ab] font-semibold flex items-center justify-center gap-1">
                              <AlertTriangle className="w-4 h-4" /> Pedido Recusado
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={order.id}
                    className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#ff5722]/30 transition-all"
                  >
                    {isNovo && (
                      <div className="absolute top-0 right-0 p-2">
                        <span className="bg-[#ff5722] text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-['Montserrat']">
                          Novo
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isNovo
                              ? 'bg-[#ff5722]/10 text-[#ff5722]'
                              : 'bg-[#353535] text-[#ff8a65]'
                          }`}
                        >
                          {isNovo ? (
                            <Timer className="w-5 h-5" />
                          ) : (
                            <Soup className="w-5 h-5 animate-flame-pulse text-[#ff5722]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-['Montserrat'] font-bold text-sm md:text-base text-white">
                              {order.orderNumber} - {order.customerName}
                            </h3>
                            {isOnlinePaid ? (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                Pago Online
                              </span>
                            ) : isNeedMachine ? (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                                Levar Maquininha
                              </span>
                            ) : isCash ? (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                Dinheiro
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-[#b4b5b5]">
                            {order.timeAgo} • {order.type}
                          </p>
                          {order.type === 'Delivery' && order.address && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#b4b5b5] mt-1 pt-1 border-t border-[#353535]/40">
                              <MapPin className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                              <span className="truncate flex-1 text-white">{order.address}</span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#86cfff] hover:text-white shrink-0 flex items-center gap-0.5 text-[10px] font-bold bg-[#141414] px-1.5 py-0.5 rounded border border-[#353535]"
                                title="Abrir rota no Google Maps"
                              >
                                <Navigation className="w-2.5 h-2.5 text-[#019ad8]" />
                                <span>Rota</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onPrintOrder(order)}
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-[#252525] hover:bg-[#ff5722] text-[#b4b5b5] hover:text-white rounded-lg text-[11px] font-bold font-['Montserrat'] border border-[#383838] transition-all active:scale-95 shadow-sm shrink-0"
                          title="Imprimir comanda térmica (58mm/80mm)"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#ff5722]" />
                          <span>Imprimir</span>
                        </button>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4 text-xs">
                        {order.items.map((item, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="text-white font-medium">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-[#ff5722] font-semibold">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="pl-2 border-l-2 border-[#ff5722]/40 italic text-[11px] text-[#ffb5a0]">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Payment Instruction Banner */}
                      <div className="mb-3 pt-2.5 border-t border-[#353535]/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8e8f8f] font-medium">Total:</span>
                          <span className="font-['Montserrat'] font-black text-sm text-[#ff5722] whitespace-nowrap shrink-0">
                            R$&nbsp;{order.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {isOnlinePaid ? (
                          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold min-w-0">
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">PAGO ONLINE ({order.paymentMethod})</span>
                            </div>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                              NÃO COBRAR
                            </span>
                          </div>
                        ) : isNeedMachine ? (
                          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-2 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-amber-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>LEVAR MAQUININHA 💳</span>
                              </span>
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                                COBRAR NA ENTREGA
                              </span>
                            </div>
                            <span className="text-[10px] text-[#ffdad6] block truncate">
                              Forma: {order.paymentMethod}
                            </span>
                          </div>
                        ) : isCash ? (
                          <div className="bg-blue-950/40 border border-blue-500/50 rounded-xl p-2 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-blue-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Banknote className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>COBRAR EM DINHEIRO 💵</span>
                              </span>
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                                NA ENTREGA
                              </span>
                            </div>
                            {order.changeFor ? (
                              <div className="text-[10px] text-amber-300 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                                ⚠️ Levar troco para: {order.changeFor}
                              </div>
                            ) : (
                              <span className="text-[10px] text-blue-300/80 block">Não precisa de troco</span>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#262626] border border-[#383838] rounded-xl p-2 flex items-center justify-between text-[11px] text-[#b4b5b5]">
                            <span className="truncate">Forma: {order.paymentMethod}</span>
                            <span className="text-[9px] text-white font-semibold shrink-0">Pagar na Entrega</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-[#353535]/50 flex gap-2">
                      {isNovo && (
                        <>
                          <button
                            onClick={() => onRejectOrder(order.id)}
                            className="flex-1 bg-[#2a2a2a] hover:bg-[#353535] text-[#e5e2e1] py-2.5 rounded-md text-xs font-medium font-['Montserrat'] transition-colors"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => onAcceptOrder(order.id)}
                            className="flex-1 btn-flame text-white py-2.5 rounded-md text-xs font-bold font-['Montserrat'] shadow-md hover:opacity-95 transition-all active:scale-95"
                          >
                            Aceitar
                          </button>
                        </>
                      )}

                      {isPreparando && (
                        <button
                          onClick={() => onAdvanceToReady(order.id)}
                          className="w-full bg-[#2a2a2a] text-[#ff8a65] py-2.5 rounded-md text-xs font-bold font-['Montserrat'] border border-[#ff5722]/20 hover:bg-[#ff5722]/10 transition-all active:scale-95"
                        >
                          Mudar para Pronto
                        </button>
                      )}

                      {isPronto && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              const activeCouriers = (storeSettings.couriers || []).filter(c => c.active);
                              if (activeCouriers.length > 1) {
                                setDispatchOrderTarget(order);
                              } else if (activeCouriers.length === 1) {
                                const c = activeCouriers[0];
                                onAdvanceToDelivery(order.id, {
                                  name: c.name,
                                  phone: c.phone,
                                  avatar: c.avatar,
                                  vehicle: c.vehicleModel || (c.vehicle ? `Veículo (${c.vehicle})` : undefined),
                                  plate: c.plate,
                                });
                              } else {
                                onAdvanceToDelivery(order.id);
                              }
                            }}
                            className="w-full bg-[#019ad8]/20 text-[#86cfff] py-2.5 rounded-md text-xs font-bold font-['Montserrat'] border border-[#019ad8]/40 hover:bg-[#019ad8]/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Bike className="w-4 h-4" /> Despachar Entrega
                          </button>
                          {(storeSettings.couriers || []).filter(c => c.active).length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDispatchOrderTarget(order)}
                              className="w-full text-[10px] text-[#86cfff]/80 hover:text-white text-center py-0.5 underline transition-colors"
                            >
                              Escolher entregador
                            </button>
                          )}
                        </div>
                      )}

                      {isEmEntrega && (
                        <div className="space-y-2">
                          <div className="p-2.5 bg-[#1c1b1b] rounded-lg border border-[#353535] space-y-2 text-[11px]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#ff5722]/50 bg-[#252525] flex-shrink-0">
                                  <img
                                    src={order.courierAvatar || APP_IMAGES.driverAvatar}
                                    alt="Entregador"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-white font-bold truncate block">
                                    {order.courierName || 'Entregador Despachado'}
                                  </span>
                                  {order.courierVehicle && (
                                    <span className="text-[10px] text-[#b4b5b5] truncate block">
                                      {order.courierVehicle} {order.courierPlate ? `• ${order.courierPlate}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {order.courierPhone && (
                                <a
                                  href={`https://wa.me/55${order.courierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.courierName}, tudo bem? Mensagem da cozinha sobre o pedido ${order.orderNumber}:`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] flex items-center gap-1 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30 shrink-0"
                                >
                                  <Phone className="w-3 h-3" /> WhatsApp
                                </a>
                              )}
                            </div>

                            {/* Live Route Link for Manager */}
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full bg-[#182026] hover:bg-[#1f2b33] border border-[#019ad8]/40 text-[#86cfff] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-bold text-[10px] transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5 text-[#019ad8]" />
                              <span>Acompanhar Rota no Google Maps</span>
                              <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                            </a>
                          </div>
                          <button
                            onClick={() => onCompleteOrder(order.id)}
                            className="w-full bg-emerald-500/20 text-emerald-400 py-2.5 rounded-md text-xs font-bold font-['Montserrat'] border border-emerald-500/40 hover:bg-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> Finalizar como Entregue
                          </button>
                        </div>
                      )}

                      {isEntregue && (
                        <div className="w-full py-2 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Pedido Concluído
                        </div>
                      )}

                      {isRecusado && (
                        <div className="w-full py-2 text-center text-xs text-[#ffb4ab] font-semibold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Pedido Recusado
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Stats Bento Widget */}
              <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 flex flex-col justify-between shadow-md">
                <div>
                  <h4 className="text-[11px] font-bold text-[#b4b5b5] uppercase tracking-wider font-['Montserrat'] mb-3">
                    Resumo do Turno
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#b4b5b5]">Ticket Médio</span>
                      <span className="font-bold text-[#ff5722] font-['Montserrat'] text-sm">
                        R$ {averageTicket.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b4b5b5]">Tempo Médio Prep.</span>
                      <span className="font-bold text-white font-['Montserrat']">
                        18 min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b4b5b5]">Pedidos Concluídos</span>
                      <span className="font-bold text-white font-['Montserrat']">
                        {orders.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#353535]/50 flex items-center gap-1.5 text-[#ff8a65] text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">+12% em relação a ontem</span>
                </div>
              </div>

              {/* Criar Pedido Manual Card */}
              <button
                onClick={onOpenManualOrder}
                className="bg-[#1c1b1b] rounded-lg p-6 border-2 border-dashed border-[#353535] hover:border-[#ff5722] flex flex-col items-center justify-center text-center group cursor-pointer transition-all active:scale-98 min-h-[160px]"
              >
                <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#353535] group-hover:border-[#ff5722] group-hover:bg-[#ff5722]/10 flex items-center justify-center mb-2.5 transition-colors">
                  <Plus className="w-5 h-5 text-[#b4b5b5] group-hover:text-[#ff5722]" />
                </div>
                <p className="font-['Montserrat'] font-bold text-xs text-white group-hover:text-[#ff5722]">
                  Criar Pedido Manual
                </p>
                <p className="text-[10px] text-[#b4b5b5] mt-0.5">Balcão ou Telefone</p>
              </button>
            </section>
            )}
          </div>
        )}

        {/* ================= ABA 2: MESAS & SALÃO ================= */}
        {activeTab === 'mesas' && (
          <TableManagementView
            storeSettings={storeSettings}
            products={products}
            orders={orders}
            onUpdateStoreSettings={onUpdateStoreSettings}
            onAddOrder={onAddOrder}
            onPrintOrder={onPrintOrder}
          />
        )}

        {/* ================= ABA 3: CARDÁPIO & ESTOQUE ================= */}
        {activeTab === 'cardapio' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold text-white">
                  Controle do Cardápio & Estoque
                </h2>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Ative ou pause itens esgotados e edite preços em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddProduct}
                  className="btn-flame text-white px-4 py-2.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Novo Item no Cardápio
                </button>
              </div>
            </div>

            {/* Filter categories */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {[
                { id: 'all' as const, label: 'Todos os Itens' },
                { id: 'burgers' as const, label: 'Burgers' },
                { id: 'pizzas' as const, label: 'Pizzas' },
                { id: 'salgados' as const, label: 'Salgados' },
                { id: 'sucos' as const, label: 'Sucos Natural' },
                { id: 'bebidas' as const, label: 'Bebidas' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCardapioFilter(cat.id)}
                  className={`px-4 py-1.5 rounded-md text-xs font-['Montserrat'] font-semibold transition-all ${
                    cardapioFilter === cat.id
                      ? 'bg-[#ff5722] text-white shadow-sm'
                      : 'bg-[#20201f] text-[#b4b5b5] hover:text-white border border-[#353535]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Guia & Dica Rápida de Gestão do Cardápio */}
            <div className="bg-[#1c1b1b] border border-[#ff5722]/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff8a65] shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-['Montserrat'] font-bold text-xs text-white block">
                    Como gerenciar e apagar itens do cardápio:
                  </span>
                  <p className="text-[11px] text-[#b4b5b5] mt-0.5">
                    Para pausar itens esgotados clique em <strong>Em Estoque / Pausado</strong>. Para alterar preço ou detalhes clique em <strong>Editar</strong>. Para remover definitivamente, clique em <strong>Excluir</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="px-3.5 py-2 rounded-md btn-flame text-white text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#ff5722]/20 shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Produto
              </button>
            </div>

            {/* Product Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProducts.map(product => {
                const isAvailable = product.isAvailable !== false;
                return (
                  <div
                    key={product.id}
                    className={`bg-[#20201f] rounded-lg p-4 border transition-all flex items-center gap-3.5 ${
                      isAvailable ? 'border-[#353535]/60' : 'border-red-900/40 bg-[#191515] opacity-80'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[#1c1b1b] flex-shrink-0 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-bold text-red-400 font-['Montserrat'] text-center px-1">
                          ESGOTADO
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h4 className="font-['Montserrat'] font-bold text-xs text-white truncate">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-[#b4b5b5] truncate mt-0.5 font-light">
                            {product.description}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 whitespace-nowrap pl-2">
                          <span className="font-['Montserrat'] font-bold text-xs text-[#ff5722] block whitespace-nowrap">
                            R$&nbsp;{product.price.toFixed(2).replace('.', ',')}
                          </span>
                          {product.costPrice !== undefined && product.costPrice > 0 ? (
                            <span className="text-[9.5px] text-emerald-400 font-mono block" title={`Lucro de R$ ${(product.price - product.costPrice).toFixed(2).replace('.', ',')}`}>
                              Custo: R$ {product.costPrice.toFixed(2).replace('.', ',')}
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#71717a] block">
                              Sem custo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#353535]/40">
                        {/* Toggle Available */}
                        <button
                          onClick={() => onToggleProductAvailability(product.id)}
                          className={`text-[10px] font-['Montserrat'] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                            isAvailable
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isAvailable ? 'Em Estoque' : 'Pausado'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenEditProduct(product)}
                            className="text-[#b4b5b5] hover:text-[#ff8a65] text-[11px] flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>

                          {onDeleteProduct && (
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="text-[#8e8f8f] hover:text-red-400 hover:bg-red-500/15 text-[11px] px-2 py-1 rounded flex items-center gap-1 font-semibold transition-colors border border-transparent hover:border-red-500/30"
                              title="Excluir item permanentemente do cardápio"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400/80" />
                              <span className="hidden sm:inline">Excluir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= ABA 3: GESTÃO FINANCEIRA, DRE & CAIXA ================= */}
        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="font-['Montserrat'] text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-[#ff5722]" /> Gestão Financeira & Fechamento de Caixa
                </h2>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  DRE em tempo real, controle de insumos (CMV), conciliação de formas de pagamento e fluxo de caixa.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowFinancialGuide(true)}
                  className="bg-[#20201f] border border-[#ff5722]/40 hover:border-[#ff5722] text-[#ff8a65] px-3.5 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <BookOpen className="w-4 h-4 text-[#ff5722]" />
                  <span>Guia do Dono: Finanças</span>
                </button>

                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="btn-flame text-white px-3.5 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Lançar Despesa / Saída
                </button>

                {expenses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearExpensesConfirm(true)}
                    className="bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-500/40 px-3.5 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    title="Zerar e apagar todas as despesas lançadas"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Zerar Despesas ({expenses.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setShowFinancialPdfModal(true)}
                  className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-white px-3.5 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  title="Visualizar e exportar relatório financeiro em PDF"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* Sub-abas de Relatórios Financeiros */}
            <div className="w-full bg-[#1c1b1b] rounded-xl border border-[#353535] p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => setFinancialSubTab('graficos')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-2 transition-all ${
                  financialSubTab === 'graficos'
                    ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>📊 Painel de Gráficos (Diário, Semanal & Mensal)</span>
              </button>

              <button
                type="button"
                onClick={() => setFinancialSubTab('dre')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-2 transition-all ${
                  financialSubTab === 'dre'
                    ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📑 DRE Operacional & Saídas de Caixa</span>
              </button>
            </div>

            {financialSubTab === 'graficos' && (
              <FinancialReportsDashboard
                orders={orders}
                storeSettings={storeSettings}
                products={products}
              />
            )}

            {financialSubTab === 'dre' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#b4b5b5]">Faturamento Bruto</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-['Montserrat'] font-extrabold text-xl text-[#ff5722]">
                  R$ {totalRevenue.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {validOrders.length} pedidos no turno
                </span>
              </div>

              <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#b4b5b5]">Despesas / Saídas</span>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <span className="font-['Montserrat'] font-extrabold text-xl text-white">
                  R$ {totalExpenses.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-[#b4b5b5] block mt-1">
                  {expenses.length} lançamentos hoje
                </span>
              </div>

              <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#b4b5b5]">Lucro Líquido do Caixa</span>
                  <Wallet className={`w-4 h-4 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <span
                  className={`font-['Montserrat'] font-extrabold text-xl ${
                    netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  R$ {netProfit.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  Margem Líquida: {netMargin.toFixed(1)}%
                </span>
              </div>

              <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#b4b5b5]">CMV Insumos Estimado</span>
                  <PieChart className="w-4 h-4 text-[#ff8a65]" />
                </div>
                <span
                  className={`font-['Montserrat'] font-extrabold text-xl ${
                    cmvPercentage <= 35 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {cmvPercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#b4b5b5] block mt-1">
                  Meta ideal: 28% a 35%
                </span>
              </div>
            </div>

            {/* DRE Simplificado & Registro de Despesas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* DRE Simplificado do Turno */}
              <div className="bg-[#20201f] rounded-md p-5 border border-[#353535]/50 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-[#353535] pb-2.5">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ff5722]" /> DRE Operacional do Turno
                  </h3>
                  <div className="flex items-center gap-2">
                    {orders.length > 0 && onClearOrders && (
                      <button
                        type="button"
                        onClick={() => setShowClearOrdersConfirm(true)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
                        title="Zerar e apagar pedidos de teste para começar faturamento do zero"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Zerar Faturamento
                      </button>
                    )}
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      Ao Vivo
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#e5e2e1]">
                    <span className="font-sans font-medium text-emerald-400">(+) Receita de Vendas de Burgers & Cardápio</span>
                    <span className="font-bold">R$ {productSalesRevenue.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#e5e2e1]">
                    <span className="font-sans font-medium text-emerald-400">(+) Receita com Taxas de Entrega</span>
                    <span className="font-bold">R$ {deliveryFeeRevenue.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1.5 font-bold text-white bg-[#1c1b1b] px-2.5 rounded-lg border border-[#353535]/50 font-sans">
                    <span>(=) Faturamento Bruto</span>
                    <span className="text-[#ff5722] font-mono">R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-red-400">(-) Insumos e Carnes (Açougue & Padaria)</span>
                    <span className="font-mono text-red-400">- R$ {insumosExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-amber-400 flex items-center gap-1">
                      <Beer className="w-3.5 h-3.5 text-amber-400" />
                      (-) Bebidas & Cervejas (Estoque Revenda)
                    </span>
                    <span className="font-mono text-amber-400 font-semibold">- R$ {bebidasExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-red-400">(-) Diárias e Entregas (Motoboys)</span>
                    <span className="font-mono text-red-400">- R$ {motoboyExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-red-400">(-) Embalagens e Descartáveis</span>
                    <span className="font-mono text-red-400">- R$ {embalagensExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-[#ff7043] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#ff7043]" />
                      (-) Gás de Cozinha (GLP / Botijão / Encanado)
                    </span>
                    <span className="font-mono text-[#ff7043] font-semibold">- R$ {gasExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-red-400">(-) Custos Operacionais Diários (Limpeza & Materiais)</span>
                    <span className="font-mono text-red-400">- R$ {operacionalExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                    <span className="font-sans font-medium text-indigo-400">(-) Custos Fixos (Aluguel, Energia, Água, Internet)</span>
                    <span className="font-mono text-indigo-400 font-semibold">- R$ {fixosExpenses.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {outrosExpenses > 0 && (
                    <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#b4b5b5]">
                      <span className="font-sans font-medium text-red-400">(-) Outras Despesas Diversas</span>
                      <span className="font-mono text-red-400">- R$ {outrosExpenses.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 font-bold bg-[#1c1b1b] px-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 font-sans text-sm mt-3">
                    <span>(=) Lucro Líquido Operacional</span>
                    <span className="font-mono">R$ {netProfit.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              {/* Registro de Despesas / Saídas do Caixa */}
              <div className="bg-[#20201f] rounded-md p-5 border border-[#353535]/50 shadow-md space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-[#353535] pb-2.5 mb-3">
                    <div>
                      <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" /> Saídas e Despesas do Turno
                      </h3>
                      <p className="text-[10px] text-[#b4b5b5]">Controle de compras do dia e pagamentos imediatos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {expenses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowClearExpensesConfirm(true)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
                          title="Zerar e limpar todas as despesas"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Zerar Tudo
                        </button>
                      )}
                      <button
                        onClick={() => setShowAddExpenseModal(true)}
                        className="text-xs text-[#ff8a65] hover:text-white font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto hide-scrollbar">
                    {expenses.length === 0 ? (
                      <p className="text-xs text-[#8e8f8f] text-center py-6">
                        Nenhuma despesa registrada hoje. Clique em "+ Lançar Despesa" acima.
                      </p>
                    ) : (
                      expenses.map(expense => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-2.5 rounded-md bg-[#1c1b1b] border border-[#353535]/40 hover:border-[#ff5722]/30 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                expense.category === 'insumos'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : expense.category === 'bebidas'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : expense.category === 'motoboy'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : expense.category === 'embalagens'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : expense.category === 'gas'
                                  ? 'bg-orange-500/20 text-[#ff7043] border border-[#ff5722]/40'
                                  : expense.category === 'operacional'
                                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                  : expense.category === 'fixo'
                                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-zinc-500/15 text-zinc-300 border border-zinc-500/30'
                              }`}
                            >
                              {expense.category === 'gas' && <Flame className="w-2.5 h-2.5" />}
                              {expense.category === 'bebidas' && <Beer className="w-2.5 h-2.5" />}
                              <span>
                                {expense.category === 'insumos'
                                  ? 'Insumos'
                                  : expense.category === 'bebidas'
                                  ? 'Cervejas & Bebidas'
                                  : expense.category === 'motoboy'
                                  ? 'Motoboy'
                                  : expense.category === 'embalagens'
                                  ? 'Embalagens'
                                  : expense.category === 'gas'
                                  ? 'Gás de Cozinha'
                                  : expense.category === 'operacional'
                                  ? 'Operacional'
                                  : expense.category === 'fixo'
                                  ? 'Custo Fixo (Aluguel/Luz)'
                                  : 'Outros'}
                              </span>
                            </span>
                            <div>
                              <p className="font-medium text-white">{expense.description}</p>
                              <span className="text-[10px] text-[#8e8f8f]">{expense.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-red-400 font-mono">
                              - R$ {expense.amount.toFixed(2).replace('.', ',')}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-[#8e8f8f] hover:text-red-400 p-1 transition-colors"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535] flex justify-between items-center text-xs">
                  <span className="text-[#b4b5b5] font-medium">Total de Saídas no Turno:</span>
                  <span className="font-bold text-red-400 font-mono text-sm">
                    R$ {totalExpenses.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdowns: Formas de Pagamento & Mais Vendidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formas de Pagamento */}
              <div className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 space-y-3.5 shadow-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Conciliação por Forma de Pagamento
                  </h3>
                  <span className="text-[10px] text-[#b4b5b5]">Conferir no banco e gaveta</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535]/50">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ff5722]" /> Pix ({pixPercent}% das vendas)
                      </span>
                      <span className="font-bold text-[#ff5722] font-mono">
                        R$ {pixTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Cai direto na conta corrente da hamburgueria (0% de taxa).</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#ff5722] rounded-full" style={{ width: `${pixPercent}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535]/50">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#019ad8]" /> Cartão Crédito/Débito ({cardPercent}%)
                      </span>
                      <span className="font-bold text-white font-mono">
                        R$ {cardTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Conferir fechamento das maquininhas no fim da noite.</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#019ad8] rounded-full" style={{ width: `${cardPercent}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535]/50">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Dinheiro em Espécie ({cashPercent}%)
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        R$ {cashTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Contar notas na gaveta de caixa e realizar sangria.</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cashPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Itens Mais Vendidos - 100% Real */}
              <div className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Mais Vendidos & Rentabilidade
                  </h3>
                  <span className="text-[10px] text-[#b4b5b5]">Curva ABC real de vendas</span>
                </div>

                {topSellingItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8e8f8f] bg-[#1c1b1b] rounded-lg border border-[#353535]/40">
                    <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-[#666]" />
                    <p className="font-medium text-white mb-0.5">Nenhuma venda registrada ainda</p>
                    <p className="text-[10px] text-[#8e8f8f]">O ranking dos produtos mais vendidos e faturamento aparecerá aqui em tempo real assim que os pedidos forem recebidos.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {topSellingItems.slice(0, 5).map((top: { name: string; count: number; total: number }, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2.5 rounded-md bg-[#1c1b1b] border border-[#353535]/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#ff5722]/15 text-[#ff8a65] font-bold text-[10px] flex items-center justify-center font-['Montserrat']">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-medium text-white block">{top.name}</span>
                            <span className="text-[10px] text-emerald-400">
                              {totalRevenue > 0 ? Math.round((top.total / totalRevenue) * 100) : 0}% do faturamento
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#b4b5b5] mr-2">{top.count} un</span>
                          <span className="font-bold text-[#ff5722] font-mono">
                            R$ {top.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </>
          )}
          </div>
        )}

        {/* ================= ABA 4: CONFIGURAÇÕES DA LOJA ================= */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            <div className="text-center sm:text-left">
              <h2 className="font-['Montserrat'] text-2xl font-bold text-white">
                Configurações da Hamburgueria
              </h2>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Defina os parâmetros de funcionamento da sua operação e gateways de pagamento.
              </p>
            </div>

            {/* Sub-abas dentro das Configurações - Alinhamento sempre à esquerda (justify-start) para nunca cortar o primeiro botão */}
            <div className="w-full overflow-hidden bg-[#1c1b1b] rounded-xl border border-[#353535] p-1.5">
              <div className="flex gap-2 overflow-x-auto justify-start items-center scrollbar-thin pb-1 sm:pb-0 px-0.5">
                <button
                  type="button"
                  onClick={() => setConfigTab('geral')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'geral'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <Settings className="w-4 h-4 text-white" />
                  <span>Geral & Operação</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('funcionarios')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'funcionarios'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Funcionários & Funções</span>
                  {((storeSettings.employees || []).filter(e => e.active).length > 0) && (
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                      {(storeSettings.employees || []).filter(e => e.active).length} no plantão
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('area')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'area'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Área de Atuação</span>
                  <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    {storeSettings.deliveryArea?.radiusKm || 7} km
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('entregadores')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'entregadores'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Entregadores & Motoboys</span>
                  {((storeSettings.couriers || []).filter(c => c.active).length > 0) && (
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                      {(storeSettings.couriers || []).filter(c => c.active).length} no plantão
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('formas')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'formas'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Formas de Pagamento Locais</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('cupons')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'cupons'
                      ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>Cupons & Promoções</span>
                  {((storeSettings.coupons || []).filter(c => c.active).length > 0) && (
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                      {(storeSettings.coupons || []).filter(c => c.active).length} ativos
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('gateway')}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    configTab === 'gateway'
                      ? 'bg-[#009ee3] text-white shadow-lg shadow-[#009ee3]/25 ring-1 ring-[#009ee3]'
                      : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  <div className="w-4 h-4 rounded bg-white text-[#009ee3] text-[9px] font-black flex items-center justify-center shadow-sm">
                    MP
                  </div>
                  <span>Gateway Mercado Pago</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                    API
                  </span>
                </button>
              </div>
            </div>

            {/* Toast da Área de Atuação */}
            {areaToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{areaToast}</span>
              </div>
            )}

            {/* Toast de Cupons */}
            {couponToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{couponToast}</span>
              </div>
            )}

            {/* ABA FUNCIONÁRIOS & FUNÇÕES */}
            {configTab === 'funcionarios' && (
              <EmployeeManagementView
                storeSettings={storeSettings}
                onUpdateStoreSettings={onUpdateStoreSettings}
              />
            )}

            {/* ABA ÁREA DE ATUAÇÃO & ENTREGAS (COMPONENTE VISUAL DINÂMICO FIREBASE) */}
            {configTab === 'area' && (
              <DeliveryRadiusControl
                storeSettings={storeSettings}
                onUpdateStoreSettings={onUpdateStoreSettings}
              />
            )}

            {/* ABA GERAL */}
            {configTab === 'geral' && (
              <div className="bg-[#20201f] rounded-md p-5 border border-[#353535]/50 space-y-4 shadow-md text-xs">
              {/* Store Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#1c1b1b] rounded-lg border border-[#353535]">
                <div>
                  <h4 className="font-['Montserrat'] font-bold text-sm text-white">
                    Status da Hamburgueria
                  </h4>
                  <p className="text-[#b4b5b5] text-[11px]">
                    {storeSettings.isOpen
                      ? 'A loja está ABERTA e aceitando pedidos pelo cardápio.'
                      : 'A loja está FECHADA para novos pedidos.'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateStoreSettings({ ...storeSettings, isOpen: !storeSettings.isOpen })
                  }
                  className={`px-4 py-2 rounded-md font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 transition-all ${
                    storeSettings.isOpen
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-red-500 text-white shadow-md'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{storeSettings.isOpen ? 'Aberta' : 'Fechada'}</span>
                </button>
              </div>

              {/* Store Identity & Physical Address Section */}
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#353535] space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[#353535]/50">
                  <MapPin className="w-4 h-4 text-[#ff5722]" />
                  <h4 className="font-['Montserrat'] font-bold text-xs sm:text-sm text-white">
                    Identificação & Endereço do Estabelecimento
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[#b4b5b5] mb-1 font-semibold">
                      Nome da Hamburgueria / Loja
                    </label>
                    <input
                      type="text"
                      value={storeSettings.storeName}
                      onChange={e =>
                        onUpdateStoreSettings({
                          ...storeSettings,
                          storeName: e.target.value,
                        })
                      }
                      placeholder="Ex: Burguer dos Crias"
                      className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#b4b5b5] mb-1 font-semibold">
                      Horário de Funcionamento
                    </label>
                    <input
                      type="text"
                      value={storeSettings.openingHours || ''}
                      onChange={e =>
                        onUpdateStoreSettings({
                          ...storeSettings,
                          openingHours: e.target.value,
                        })
                      }
                      placeholder="Ex: Terça a Domingo, 18h - 00h"
                      className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>
                </div>

                {/* Endereço Completo da Loja Física */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#b4b5b5] font-semibold flex items-center gap-1.5">
                      <span>Endereço Completo do Estabelecimento (Loja Física / Cozinha)</span>
                    </label>
                    {(storeSettings.address || storeSettings.deliveryArea?.baseAddress) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          storeSettings.address || storeSettings.deliveryArea?.baseAddress || ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#86cfff] hover:text-white text-[10px] font-bold flex items-center gap-1"
                      >
                        <span>Ver no Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSettings.address || storeSettings.deliveryArea?.baseAddress || ''}
                      onChange={e => {
                        const newAddr = e.target.value;
                        onUpdateStoreSettings({
                          ...storeSettings,
                          address: newAddr,
                          deliveryArea: {
                            ...storeSettings.deliveryArea,
                            baseAddress: newAddr,
                          },
                        });
                      }}
                      placeholder="Ex: Rua Augusta, 1000 - Consolação, São Paulo - SP"
                      className="w-full bg-[#121212] border border-[#353535] rounded-lg pl-9 pr-3 py-2.5 text-white font-medium focus:outline-none focus:border-[#ff5722] text-xs"
                    />
                    <MapPin className="w-4 h-4 text-[#ff5722] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-[#8e8f8f] mt-1 block">
                    📍 Este endereço é a base de saída dos motoboys e o local de retirada pelos clientes.
                  </span>
                </div>
              </div>

              {/* Delivery and Kitchen times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[#b4b5b5] mb-1">Tempo Estimado de Entrega</label>
                  <input
                    type="text"
                    value={storeSettings.estimatedDeliveryTime}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        estimatedDeliveryTime: e.target.value,
                      })
                    }
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b5b5] mb-1">Taxa Padrão de Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={storeSettings.defaultDeliveryFee}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        defaultDeliveryFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-2 border-t border-[#353535]">
                {/* Auto Accept Orders Toggle */}
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-[#1c1b1b] border border-[#353535]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#ff5722]" />
                      <span className="font-semibold text-white block">
                        Aceite Automático de Pedidos (Auto-Aceitar)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#b4b5b5] block mt-0.5">
                      Novos pedidos entram direto em preparo na cozinha, sem você precisar clicar em "Aceitar Pedido" manualmente.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSettings.autoAcceptOrders || false}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        autoAcceptOrders: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[#ff5722] cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold text-white block">
                      Impressão Automática de Comandas
                    </span>
                    <span className="text-[11px] text-[#b4b5b5]">
                      Gera e imprime a comanda na chapa assim que o pedido for aceito.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSettings.autoPrintReceipts}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        autoPrintReceipts: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[#ff5722]"
                  />
                </div>

                <div className="flex justify-between items-center py-2 border-t border-[#353535]/40">
                  <div>
                    <span className="font-semibold text-white block flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#ff5722]" />
                      Alerta Sonoro para Novos Pedidos (Beep Automático)
                    </span>
                    <span className="text-[11px] text-[#b4b5b5]">
                      Toca sinal acústico contínuo na cozinha e pisca a aba a cada pedido recebido, mesmo em segundo plano.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudioContext();
                        playNewOrderSound();
                        setFinancialToast('🔔 Beep de teste reproduzido com sucesso!');
                        setTimeout(() => setFinancialToast(null), 3000);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#252525] hover:bg-[#353535] text-white text-xs font-bold border border-[#353535] flex items-center gap-1 active:scale-95 transition-all"
                      title="Testar o som do beep agora"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Testar Som</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={storeSettings.soundAlerts}
                      onChange={e =>
                        onUpdateStoreSettings({
                          ...storeSettings,
                          soundAlerts: e.target.checked,
                        })
                      }
                      className="h-5 w-5 accent-[#ff5722] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Contact */}
              <div className="pt-2 border-t border-[#353535]">
                <label className="block text-[#b4b5b5] mb-1">WhatsApp de Suporte / Atendimento</label>
                <input
                  type="text"
                  value={storeSettings.whatsappSupport}
                  onChange={e =>
                    onUpdateStoreSettings({
                      ...storeSettings,
                      whatsappSupport: e.target.value,
                    })
                  }
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              {/* Link Público Oficial do Cardápio para Clientes */}
              <div className="pt-3 border-t border-[#353535] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-white font-bold flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#ff5722]" />
                    Link Público Oficial do Cardápio (Para Clientes)
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    100% Livre Sem Login
                  </span>
                </div>
                <p className="text-[11px] text-[#b4b5b5] leading-relaxed">
                  Este é o link oficial que os clientes conseguem abrir diretamente no WhatsApp, celular ou Instagram sem precisar de senha ou login.
                </p>
                <div className="flex items-center gap-2 bg-[#141414] border border-[#353535] rounded-lg p-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicMenuUrl('', storeSettings.customMenuUrl)}
                    className="bg-transparent text-[#ff8a65] font-mono text-xs w-full focus:outline-none select-all truncate"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const url = getPublicMenuUrl('', storeSettings.customMenuUrl);
                      await copyToClipboard(url);
                      setFinancialToast('Link público copiado com sucesso! 🔗');
                      setTimeout(() => setFinancialToast(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-md bg-[#ff5722] hover:bg-[#ff7043] text-white text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                  <a
                    href={getPublicMenuUrl('', storeSettings.customMenuUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-md bg-[#252525] hover:bg-[#333] text-white text-xs font-bold shrink-0 flex items-center gap-1 border border-[#444] active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </a>
                </div>
              </div>
            </div>
            )}

            {/* ABA FORMAS DE PAGAMENTO LOCAIS */}
            {configTab === 'formas' && (
            <div className="bg-[#20201f] rounded-md p-5 border border-[#353535]/50 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#ff5722]" />
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Formas de Pagamento Locais Aceitas
                  </h3>
                </div>
                <span className="text-[10px] text-[#ff8a65] font-semibold bg-[#ff5722]/15 px-2 py-0.5 rounded-md border border-[#ff5722]/30">
                  {(storeSettings.acceptedPaymentMethods || []).length} ativas
                </span>
              </div>
              <p className="text-[11px] text-[#b4b5b5]">
                Configure quais formas de pagamento aparecem para os clientes no carrinho (Pix, cartões na maquininha, dinheiro, vales-refeição).
              </p>

                {/* Chave Pix Config - Painel Completo e Confiável */}
                <div className="bg-[#1c1b1b] border-2 border-[#ff5722]/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5722]/5 rounded-bl-full pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#353535] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff5722] to-[#e64a19] flex items-center justify-center text-white shadow-md">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                          Chave Pix Oficial da Hamburgueria
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                            storeSettings.pixKey
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {storeSettings.pixKey ? 'Configurada' : 'Pendente'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#b4b5b5]">
                          Usada para gerar o QR Code Dinâmico e Chave Copia e Cola no Carrinho e nos Pedidos.
                        </p>
                      </div>
                    </div>

                    {/* Feedback de Salvo */}
                    {pixSavedToast && (
                      <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Chave salva com sucesso!</span>
                      </div>
                    )}
                  </div>

                  {/* Seletor do Tipo de Chave */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8f8f] uppercase mb-1.5">
                      1. Tipo de Chave Pix:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'telefone', label: 'Celular', icon: Smartphone },
                        { id: 'cpf', label: 'CPF', icon: User },
                        { id: 'cnpj', label: 'CNPJ', icon: Building2 },
                        { id: 'email', label: 'E-mail', icon: Mail },
                        { id: 'aleatoria', label: 'Aleatória (EVP)', icon: Key },
                      ].map(type => {
                        const Icon = type.icon;
                        const isSelected = pixKeyType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setPixKeyType(type.id as any)}
                            className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                              isSelected
                                ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm font-bold'
                                : 'bg-[#252525] text-[#b4b5b5] border-[#353535] hover:text-white hover:bg-[#2e2e2e]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input de Chave Pix com Ações Integradas */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-white">
                        2. Digite ou Cole a sua Chave Pix:
                      </label>
                      {pixKeyInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setPixKeyInput('');
                            handleSavePixKey('');
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Limpar chave
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={pixKeyInput}
                        onChange={e => setPixKeyInput(e.target.value)}
                        onBlur={() => handleSavePixKey()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSavePixKey();
                          }
                        }}
                        placeholder={
                          pixKeyType === 'telefone'
                            ? 'Ex: (11) 98765-4321 ou 11987654321'
                            : pixKeyType === 'cpf'
                            ? 'Ex: 123.456.789-00 ou 12345678900'
                            : pixKeyType === 'cnpj'
                            ? 'Ex: 12.345.678/0001-90 ou 12345678000190'
                            : pixKeyType === 'email'
                            ? 'Ex: financeiro@hamburgueria.com.br'
                            : 'Ex: 123e4567-e89b-12d3-a456-426614174000'
                        }
                        className="w-full bg-[#252525] border-2 border-[#3d3d3d] rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722] transition-colors pr-24"
                      />

                      {/* Botão Salvar dentro do input */}
                      <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSavePixKey()}
                          className="btn-flame text-white px-3 py-1.5 rounded-md text-xs font-bold font-['Montserrat'] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#b4b5b5] gap-1 pt-0.5">
                      <span>
                        Aceita qualquer formato (com ou sem pontuação). Salva automaticamente ao sair do campo.
                      </span>
                      {storeSettings.pixKey ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Ativa no Cardápio: {storeSettings.pixKey}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Nenhuma chave cadastrada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview ao Vivo do QR Code e Cópia */}
                  <div className="bg-[#252525] rounded-lg p-3 border border-[#353535] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-16 h-16 bg-white p-1 rounded-md shrink-0 flex items-center justify-center shadow-sm">
                        <img
                          src={getPixQrCodeUrl(
                            generatePixPayload({
                              pixKey: pixKeyInput || storeSettings.pixKey || '11987654321',
                              merchantName: storeSettings.storeName || 'BURGER DOS CRIAS',
                              merchantCity: 'SAO PAULO',
                              amount: 25.0,
                            }),
                            120
                          )}
                          alt="QR Code Pix Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff8a65] block">
                          Como o cliente vê no Carrinho:
                        </span>
                        <p className="text-xs font-mono font-bold text-white truncate max-w-[260px]">
                          {pixKeyInput || storeSettings.pixKey || '(Digite sua chave acima)'}
                        </p>
                        <p className="text-[10px] text-[#8e8f8f]">
                          Favorecido: {storeSettings.storeName || 'BURGER DOS CRIAS'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const k = (pixKeyInput || storeSettings.pixKey || '').trim();
                          if (!k) return;
                          navigator.clipboard.writeText(k);
                          setPixCopiedToast(true);
                          setTimeout(() => setPixCopiedToast(false), 2500);
                        }}
                        className="px-3 py-1.5 bg-[#1c1b1b] hover:bg-[#333] text-white border border-[#3d3d3d] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        {pixCopiedToast ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#ff8a65]" />
                            <span>Testar Cópia</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSavePixKey()}
                        className="btn-flame text-white px-4 py-1.5 rounded-lg text-xs font-bold font-['Montserrat'] flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Salvar no Firebase</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de formas ativas e remoção */}
                <div className="space-y-1.5">
                  {(storeSettings.acceptedPaymentMethods || [
                    'Pix',
                    'Cartão de Crédito',
                    'Cartão de Débito',
                    'Dinheiro',
                    'Vale Refeição (VR / Sodexo / Alelo)',
                  ]).map(method => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-2.5 bg-[#1c1b1b] border border-[#353535] rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-white">{method}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const current = storeSettings.acceptedPaymentMethods || [
                            'Pix',
                            'Cartão de Crédito',
                            'Cartão de Débito',
                            'Dinheiro',
                            'Vale Refeição (VR / Sodexo / Alelo)',
                          ];
                          if (current.length <= 1) return;
                          onUpdateStoreSettings({
                            ...storeSettings,
                            acceptedPaymentMethods: current.filter(m => m !== method),
                          });
                        }}
                        className="text-[#b4b5b5] hover:text-red-400 p-1 text-[11px] transition-colors"
                        title="Remover forma de pagamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input para adicionar nova forma de pagamento no gestor */}
                <div className="pt-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Ticket Restaurante, PicPay, Alelo..."
                      value={newPaymentMethodInput}
                      onChange={e => setNewPaymentMethodInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMethodFromManager();
                        }
                      }}
                      className="flex-grow bg-[#1c1b1b] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                    />
                    <button
                      type="button"
                      onClick={handleAddMethodFromManager}
                      className="btn-flame text-white px-3.5 py-2 rounded-lg text-xs font-bold font-['Montserrat'] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pix', 'Vale Refeição (VR)', 'Ticket Restaurante', 'Alelo', 'Sodexo / Pluxee', 'PicPay', 'Caju / Flash'].map(
                      sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            const current = storeSettings.acceptedPaymentMethods || [
                              'Pix',
                              'Cartão de Crédito',
                              'Cartão de Débito',
                              'Dinheiro',
                              'Vale Refeição (VR / Sodexo / Alelo)',
                            ];
                            if (!current.includes(sug)) {
                              onUpdateStoreSettings({
                                ...storeSettings,
                                acceptedPaymentMethods: [...current, sug],
                              });
                            }
                          }}
                          className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
                        >
                          + {sug}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA CUPONS DE DESCONTO */}
            {configTab === 'cupons' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="bg-[#20201f] rounded-2xl p-5 border border-[#353535]/50 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-['Montserrat'] font-bold text-base text-white flex items-center gap-2">
                          <span>Gestão de Cupons Promocionais</span>
                          <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] px-2 py-0.5 rounded-full font-bold">
                            {(storeSettings.coupons || []).length} cadastrado(s)
                          </span>
                        </h3>
                        <p className="text-xs text-[#b4b5b5] mt-0.5">
                          Crie códigos de desconto em porcentagem (%), valor em reais (R$) ou frete grátis para atrair e fidelizar clientes.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddCouponModal(true)}
                      className="btn-flame text-white px-4 py-2.5 rounded-xl font-['Montserrat'] font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Criar Novo Cupom</span>
                    </button>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#353535]/50 text-xs">
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
                      <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Total de Cupons</span>
                      <span className="text-lg font-black text-white mt-0.5 block font-mono">
                        {(storeSettings.coupons || []).length}
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
                      <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Cupons Ativos</span>
                      <span className="text-lg font-black text-emerald-400 mt-0.5 block font-mono">
                        {(storeSettings.coupons || []).filter(c => c.active).length}
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
                      <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Mais Usado</span>
                      <span className="text-sm font-black text-[#ff8a65] mt-1 block font-mono truncate">
                        {(storeSettings.coupons || []).slice().sort((a,b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.code || 'N/A'}
                      </span>
                    </div>

                    <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
                      <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Uso no Carrinho</span>
                      <span className="text-xs font-semibold text-white mt-1 block">
                        Validação instantânea
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form inline / modal to add coupon */}
                {showAddCouponModal && (
                  <form
                    onSubmit={handleSaveCoupon}
                    className="bg-[#242322] rounded-2xl p-5 border-2 border-[#ff5722]/50 shadow-2xl space-y-4 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#353535]">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#ff5722]" />
                        <h4 className="font-['Montserrat'] font-bold text-sm text-white">
                          Cadastrar Novo Cupom de Desconto
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCouponModal(false)}
                        className="text-[#8e8f8f] hover:text-white p-1 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[#b4b5b5] font-semibold mb-1">
                          Código do Cupom *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCouponCode}
                          onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                          placeholder="Ex: QUINTA15, BURGERTOP"
                          className="w-full bg-[#181818] border border-[#353535] rounded-xl px-3 py-2 text-white font-mono font-bold uppercase focus:outline-none focus:border-[#ff5722]"
                        />
                        <span className="text-[10px] text-[#8e8f8f] mt-0.5 block">
                          Sem espaços. O cliente digitará esse código.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[#b4b5b5] font-semibold mb-1">
                          Tipo de Desconto *
                        </label>
                        <select
                          value={newCouponType}
                          onChange={e => setNewCouponType(e.target.value as any)}
                          className="w-full bg-[#181818] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                        >
                          <option value="percentage">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo em Reais (R$)</option>
                          <option value="free_shipping">Frete Grátis (R$ 0,00)</option>
                        </select>
                      </div>

                      {newCouponType !== 'free_shipping' ? (
                        <div>
                          <label className="block text-[#b4b5b5] font-semibold mb-1">
                            Valor do Desconto *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              step="0.5"
                              min="1"
                              value={newCouponValue}
                              onChange={e => setNewCouponValue(e.target.value)}
                              placeholder={newCouponType === 'percentage' ? '10' : '15.00'}
                              className="w-full bg-[#181818] border border-[#353535] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#ff5722]"
                            />
                            <span className="absolute right-3 top-2 font-bold text-[#8e8f8f]">
                              {newCouponType === 'percentage' ? '%' : 'R$'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[#b4b5b5] font-semibold mb-1">
                            Benefício
                          </label>
                          <div className="bg-[#181818] border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5">
                            <Bike className="w-4 h-4" />
                            <span>100% Taxa de Entrega Grátis</span>
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-[#b4b5b5] font-semibold mb-1">
                          Descrição / Regra (Exibida para o cliente)
                        </label>
                        <input
                          type="text"
                          value={newCouponDesc}
                          onChange={e => setNewCouponDesc(e.target.value)}
                          placeholder="Ex: 15% de desconto em pedidos acima de R$ 40"
                          className="w-full bg-[#181818] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#b4b5b5] font-semibold mb-1">
                          Pedido Mínimo (R$)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={newCouponMinOrder}
                          onChange={e => setNewCouponMinOrder(e.target.value)}
                          placeholder="0 (Sem pedido mínimo)"
                          className="w-full bg-[#181818] border border-[#353535] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#ff5722]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#353535]/50">
                      <button
                        type="button"
                        onClick={() => setShowAddCouponModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-[#b4b5b5] hover:text-white bg-[#1c1b1b] border border-[#353535]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-flame text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salvar e Ativar Cupom</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Coupons List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(!storeSettings.coupons || storeSettings.coupons.length === 0) ? (
                    <div className="col-span-full bg-[#20201f] rounded-2xl p-8 text-center border border-[#353535] text-[#b4b5b5] space-y-2">
                      <Ticket className="w-8 h-8 text-[#ff5722] mx-auto opacity-60" />
                      <p className="font-bold text-white text-sm">Nenhum cupom cadastrado ainda</p>
                      <p className="text-xs">Clique no botão acima para criar seu primeiro cupom de desconto!</p>
                    </div>
                  ) : (
                    storeSettings.coupons.map(coupon => {
                      const discountBadge =
                        coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : coupon.discountType === 'fixed'
                          ? `R$ ${coupon.discountValue.toFixed(2)} OFF`
                          : 'Frete Grátis';

                      return (
                        <div
                          key={coupon.id}
                          className={`bg-[#20201f] rounded-2xl p-4 border transition-all space-y-3 shadow-md ${
                            coupon.active
                              ? 'border-[#353535] hover:border-[#ff5722]/50'
                              : 'border-[#2d2d2d] opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-white bg-[#141414] px-2.5 py-1 rounded-lg border border-[#353535] tracking-wider">
                                  {coupon.code}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    coupon.discountType === 'free_shipping'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                      : 'bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40'
                                  }`}
                                >
                                  {discountBadge}
                                </span>
                              </div>
                              <p className="text-xs text-[#b4b5b5] mt-1.5 leading-snug">
                                {coupon.description || 'Desconto aplicado diretamente no checkout.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleCoupon(coupon.id)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                coupon.active
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-[#2a2a2a] text-[#8e8f8f] border border-[#383838]'
                              }`}
                              title={coupon.active ? 'Clique para pausar cupom' : 'Clique para reativar'}
                            >
                              {coupon.active ? 'Ativo' : 'Pausado'}
                            </button>
                          </div>

                          <div className="pt-2 border-t border-[#353535]/50 flex items-center justify-between text-[11px] text-[#8e8f8f]">
                            <div className="space-y-0.5">
                              {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                                <span className="block text-amber-400 font-medium">
                                  Mínimo: R$ {coupon.minOrderValue.toFixed(2)}
                                </span>
                              ) : (
                                <span className="block">Sem valor mínimo</span>
                              )}
                              <span className="block text-[10px]">
                                {coupon.usageCount || 0} pedido(s) usaram
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  setCouponToast(`Código "${coupon.code}" copiado!`);
                                  setTimeout(() => setCouponToast(null), 2500);
                                }}
                                className="p-1.5 bg-[#181818] hover:bg-[#252525] text-[#b4b5b5] hover:text-white rounded-lg border border-[#353535] transition-colors"
                                title="Copiar código"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                className="p-1.5 bg-[#181818] hover:bg-red-500/20 text-[#8e8f8f] hover:text-red-400 rounded-lg border border-[#353535] transition-colors"
                                title="Excluir cupom"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ABA ENTREGADORES & MOTOBOYS */}
            {configTab === 'entregadores' && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="bg-[#20201f] rounded-md p-5 border border-[#353535]/50 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center">
                          <Bike className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-['Montserrat'] font-bold text-base text-white">
                            Equipe de Entregadores & Motoboys
                          </h3>
                          <p className="text-[11px] text-[#b4b5b5]">
                            Cadastre seus motoboys, ative quem está no plantão e defina taxas por corrida.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddCourier}
                      className="btn-flame text-white px-4 py-2 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Entregador</span>
                    </button>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#353535]/50">
                    <div className="bg-[#1c1b1b] p-3 rounded-lg border border-[#353535]">
                      <span className="text-[10px] text-[#b4b5b5] block">Total Cadastrados</span>
                      <span className="text-lg font-black text-white font-['Montserrat']">
                        {(storeSettings.couriers || []).length}
                      </span>
                    </div>
                    <div className="bg-[#1c1b1b] p-3 rounded-lg border border-[#353535]">
                      <span className="text-[10px] text-[#b4b5b5] block">Em Plantão Hoje</span>
                      <span className="text-lg font-black text-emerald-400 font-['Montserrat'] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {(storeSettings.couriers || []).filter(c => c.active).length}
                      </span>
                    </div>
                    <div className="bg-[#1c1b1b] p-3 rounded-lg border border-[#353535] col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-[#b4b5b5] block">Entregas Realizadas</span>
                      <span className="text-lg font-black text-[#ff8a65] font-['Montserrat']">
                        {(storeSettings.couriers || []).reduce((acc, c) => acc + (c.totalDeliveries || 0), 0)}
                      </span>
                    </div>
                  </div>

                  {/* Search input if multiple couriers */}
                  {(storeSettings.couriers || []).length > 2 && (
                    <div className="mt-3.5">
                      <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou placa..."
                        value={courierSearch}
                        onChange={e => setCourierSearch(e.target.value)}
                        className="w-full bg-[#1c1b1b] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/50 focus:outline-none focus:border-[#ff5722]"
                      />
                    </div>
                  )}
                </div>

                {/* Courier Toast */}
                {courierToast && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-between animate-fade-in">
                    <span>{courierToast}</span>
                    <button
                      type="button"
                      onClick={() => setCourierToast(null)}
                      className="text-emerald-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {(storeSettings.couriers || []).length === 0 && (
                  <div className="bg-[#20201f] rounded-md p-8 border border-[#353535]/50 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#ff5722]/10 text-[#ff5722] mx-auto flex items-center justify-center">
                      <Bike className="w-6 h-6" />
                    </div>
                    <h4 className="font-['Montserrat'] font-bold text-white text-base">
                      Nenhum entregador cadastrado ainda
                    </h4>
                    <p className="text-xs text-[#b4b5b5] max-w-sm mx-auto">
                      Cadastre os motoboys e entregadores que realizam as entregas da sua hamburgueria para acompanhar corridas e repasses.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddCourier}
                      className="btn-flame text-white px-5 py-2 rounded-lg font-['Montserrat'] font-bold text-xs inline-flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Cadastrar Primeiro Entregador
                    </button>
                  </div>
                )}

                {/* Courier List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(storeSettings.couriers || [])
                    .filter(c => {
                      if (!courierSearch.trim()) return true;
                      const q = courierSearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.phone.toLowerCase().includes(q) ||
                        (c.plate && c.plate.toLowerCase().includes(q)) ||
                        (c.vehicleModel && c.vehicleModel.toLowerCase().includes(q))
                      );
                    })
                    .map(courier => {
                      const cleanPhone = courier.phone.replace(/\D/g, '');
                      const waLink = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${courier.name}, tudo bem? Mensagem do Burger dos Crias:`)}`;

                      return (
                        <div
                          key={courier.id}
                          className={`bg-[#20201f] rounded-md border p-4 space-y-3 transition-all shadow-md ${
                            courier.active
                              ? 'border-[#ff5722]/30 shadow-sm'
                              : 'border-[#353535]/60 opacity-80'
                          }`}
                        >
                          {/* Top Row: Avatar, Name, Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#ff5722]/40 bg-[#1c1b1b]">
                                  <img
                                    src={courier.avatar || APP_IMAGES.driverAvatar}
                                    alt={courier.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span
                                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#20201f] ${
                                    courier.active ? 'bg-emerald-500' : 'bg-[#555]'
                                  }`}
                                  title={courier.active ? 'Em plantão hoje' : 'Pausado hoje'}
                                />
                              </div>

                              <div>
                                <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-1.5">
                                  <span>{courier.name}</span>
                                  {courier.active && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] bg-[#ff5722]/15 text-[#ff8a65] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {courier.vehicle === 'moto'
                                      ? '🏍️ Motoboy'
                                      : courier.vehicle === 'bike'
                                      ? '🚲 Ciclista'
                                      : courier.vehicle === 'carro'
                                      ? '🚗 Carro'
                                      : '🚶 A pé'}
                                  </span>
                                  {courier.plate && (
                                    <span className="text-[10px] bg-[#1c1b1b] border border-[#444] px-1.5 py-0.5 rounded font-mono font-bold text-white">
                                      {courier.plate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Active Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleCourierActive(courier.id)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-['Montserrat'] flex items-center gap-1 transition-all ${
                                courier.active
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-[#353535]/50 text-[#b4b5b5] border border-[#444] hover:text-white'
                              }`}
                              title="Clique para alternar presença no plantão de hoje"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  courier.active ? 'bg-emerald-400 animate-pulse' : 'bg-[#777]'
                                }`}
                              />
                              <span>{courier.active ? 'Plantão Hoje' : 'Pausado'}</span>
                            </button>
                          </div>

                          {/* Vehicle Model & Notes */}
                          {(courier.vehicleModel || courier.notes) && (
                            <div className="bg-[#1c1b1b] rounded-lg p-2.5 border border-[#353535] text-[11px] space-y-1">
                              {courier.vehicleModel && (
                                <p className="text-white font-medium flex items-center gap-1.5">
                                  <Bike className="w-3.5 h-3.5 text-[#ff8a65]" />
                                  <span>{courier.vehicleModel}</span>
                                </p>
                              )}
                              {courier.notes && (
                                <p className="text-[#b4b5b5] text-[10px] italic">
                                  "{courier.notes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Contact & Pix details */}
                          <div className="space-y-1.5 text-xs">
                            {/* WhatsApp & Phone row */}
                            <div className="flex items-center justify-between bg-[#1c1b1b] p-2 rounded-lg border border-[#353535]">
                              <div className="flex items-center gap-1.5 text-[#b4b5b5] text-[11px]">
                                <Phone className="w-3.5 h-3.5 text-[#ff8a65]" />
                                <span>{courier.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="p-1 rounded-md bg-[#252525] text-[#b4b5b5] hover:text-white transition-colors"
                                  title="Ligar para entregador"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" /> WhatsApp
                                </a>
                              </div>
                            </div>

                            {/* Pix key row */}
                            {courier.pixKey && (
                              <div className="flex items-center justify-between bg-[#1c1b1b] p-2 rounded-lg border border-[#353535]">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-[#ff8a65] font-bold font-mono text-[9px] bg-[#ff5722]/15 px-1 py-0.5 rounded">
                                    PIX
                                  </span>
                                  <span className="font-mono text-white text-[10px] truncate max-w-[170px]">
                                    {courier.pixKey}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(courier.pixKey || '');
                                    setCourierToast(`Chave Pix de ${courier.name} copiada!`);
                                    setTimeout(() => setCourierToast(null), 2500);
                                  }}
                                  className="text-[10px] text-[#ff8a65] hover:text-white font-medium flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Copiar
                                </button>
                              </div>
                            )}

                            {/* Financial agreed rates */}
                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="bg-[#1c1b1b] p-2 rounded-lg border border-[#353535]">
                                <span className="text-[#b4b5b5] text-[10px] block">Taxa/Corrida</span>
                                <span className="font-bold text-white">
                                  R$ {(courier.feePerDelivery || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="bg-[#1c1b1b] p-2 rounded-lg border border-[#353535]">
                                <span className="text-[#b4b5b5] text-[10px] block">Diária Fixa</span>
                                <span className="font-bold text-white">
                                  R$ {(courier.dailyRate || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Edit and Delete buttons */}
                          <div className="pt-2 border-t border-[#353535] flex items-center justify-between">
                            <span className="text-[10px] text-[#b4b5b5]">
                              Entregas feitas: <strong className="text-white">{courier.totalDeliveries || 0}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCourier(courier)}
                                className="px-2.5 py-1 rounded-md bg-[#252525] hover:bg-[#353535] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourier(courier.id, courier.name)}
                                className="p-1 text-[#b4b5b5] hover:text-red-400 rounded-md hover:bg-[#252525] transition-colors"
                                title="Excluir entregador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ABA GATEWAY DE PAGAMENTO */}
            {configTab === 'gateway' && (
            <div className="bg-[#20201f] rounded-md p-5 border border-[#009ee3]/30 space-y-4 shadow-xl text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#353535]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#009ee3] flex items-center justify-center text-white font-black text-xs shadow-md">
                    MP
                  </div>
                  <div>
                    <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-1.5">
                      Gateway Mercado Pago
                      <span className="text-[10px] bg-[#009ee3]/20 text-[#009ee3] px-2 py-0.5 rounded-full font-bold border border-[#009ee3]/40">
                        API Oficial
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#b4b5b5]">
                      Receba pagamentos com baixa automática via Pix QR Code, Cartão de Crédito e Checkout Pro.
                    </p>
                  </div>
                </div>

                  {/* Switch Ativo/Inativo */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeSettings.mercadoPago?.isEnabled ?? true}
                      onChange={e =>
                        onUpdateStoreSettings({
                          ...storeSettings,
                          mercadoPago: {
                            ...(storeSettings.mercadoPago || {
                              publicKey: 'TEST-98a72b4c-9f82-411a-ba73-1029837465ab',
                              accessToken: 'TEST-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746',
                              environment: 'sandbox',
                              allowPix: true,
                              allowCreditCard: true,
                              allowCheckoutPro: true,
                            }),
                            isEnabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#353535] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009ee3]" />
                  </label>
                </div>

                <div className="bg-[#12242e] border border-[#009ee3]/40 rounded-lg p-4 space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between text-xs bg-[#183240] p-2.5 rounded-md border border-[#009ee3]/30">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      Status da Conexão: <strong className="text-emerald-400">Ativa e Pronta</strong>
                    </span>
                    <span className="font-mono text-[10px] text-[#009ee3] bg-[#009ee3]/10 px-2 py-0.5 rounded border border-[#009ee3]/30">
                      Modo {storeSettings.mercadoPago?.environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX / TESTE'}
                    </span>
                  </div>

                  {/* Environment Selector */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-white">
                      Ambiente de Operação
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStoreSettings({
                            ...storeSettings,
                            mercadoPago: {
                              ...(storeSettings.mercadoPago || {
                                isEnabled: true,
                                publicKey: 'TEST-98a72b4c-9f82-411a-ba73-1029837465ab',
                                accessToken: 'TEST-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746',
                                allowPix: true,
                                allowCreditCard: true,
                                allowCheckoutPro: true,
                              }),
                              environment: 'sandbox',
                            },
                          })
                        }
                        className={`p-2.5 rounded-md font-bold border transition-all text-center ${
                          (storeSettings.mercadoPago?.environment ?? 'sandbox') === 'sandbox'
                            ? 'bg-[#009ee3] text-white border-[#009ee3]'
                            : 'bg-[#1c1b1b] text-[#b4b5b5] border-[#353535]'
                        }`}
                      >
                        🧪 Modo Teste (Sandbox)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStoreSettings({
                            ...storeSettings,
                            mercadoPago: {
                              ...(storeSettings.mercadoPago || {
                                isEnabled: true,
                                publicKey: 'APP_USR-98a72b4c-9f82-411a-ba73-1029837465ab',
                                accessToken: 'APP_USR-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746',
                                allowPix: true,
                                allowCreditCard: true,
                                allowCheckoutPro: true,
                              }),
                              environment: 'production',
                            },
                          })
                        }
                        className={`p-2.5 rounded-md font-bold border transition-all text-center ${
                          storeSettings.mercadoPago?.environment === 'production'
                            ? 'bg-[#009ee3] text-white border-[#009ee3]'
                            : 'bg-[#1c1b1b] text-[#b4b5b5] border-[#353535]'
                        }`}
                      >
                        🚀 Produção (Real)
                      </button>
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[#e5e2e1] font-semibold">
                          Public Key (Chave Pública)
                        </label>
                        <span className="text-[10px] text-[#b4b5b5]">Visível no checkout</span>
                      </div>
                      <input
                        type="text"
                        value={
                          storeSettings.mercadoPago?.publicKey ||
                          'TEST-98a72b4c-9f82-411a-ba73-1029837465ab'
                        }
                        onChange={e =>
                          onUpdateStoreSettings({
                            ...storeSettings,
                            mercadoPago: {
                              ...(storeSettings.mercadoPago || {
                                isEnabled: true,
                                accessToken: 'TEST-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746',
                                environment: 'sandbox',
                                allowPix: true,
                                allowCreditCard: true,
                                allowCheckoutPro: true,
                              }),
                              publicKey: e.target.value,
                            },
                          })
                        }
                        placeholder="TEST-... ou APP_USR-..."
                        className="w-full bg-[#181818] border border-[#353535] rounded-md px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#009ee3]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[#e5e2e1] font-semibold">
                          Access Token (Token de Acesso)
                        </label>
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Privado & Seguro
                        </span>
                      </div>
                      <input
                        type="password"
                        value={
                          storeSettings.mercadoPago?.accessToken ||
                          'TEST-8291039847120938-092714-a9f82b7c6d5e4a3b2c1d-19283746'
                        }
                        onChange={e =>
                          onUpdateStoreSettings({
                            ...storeSettings,
                            mercadoPago: {
                              ...(storeSettings.mercadoPago || {
                                isEnabled: true,
                                publicKey: 'TEST-98a72b4c-9f82-411a-ba73-1029837465ab',
                                environment: 'sandbox',
                                allowPix: true,
                                allowCreditCard: true,
                                allowCheckoutPro: true,
                              }),
                              accessToken: e.target.value,
                            },
                          })
                        }
                        placeholder="TEST-... ou APP_USR-..."
                        className="w-full bg-[#181818] border border-[#353535] rounded-md px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#009ee3]"
                      />
                    </div>
                  </div>

                  {/* Features checkboxes */}
                  <div className="pt-2 border-t border-[#353535]/60 space-y-2 text-xs">
                    <span className="font-semibold text-white block">
                      Métodos Habilitados no Checkout:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-[#181818] rounded-md border border-[#353535] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettings.mercadoPago?.allowPix ?? true}
                          onChange={e =>
                            onUpdateStoreSettings({
                              ...storeSettings,
                              mercadoPago: {
                                ...(storeSettings.mercadoPago || {
                                  isEnabled: true,
                                  publicKey: 'TEST-...',
                                  accessToken: 'TEST-...',
                                  environment: 'sandbox',
                                  allowCreditCard: true,
                                  allowCheckoutPro: true,
                                }),
                                allowPix: e.target.checked,
                              },
                            })
                          }
                          className="accent-[#009ee3] w-4 h-4 rounded"
                        />
                        <span className="text-[#e5e2e1] font-medium">Pix QR Code</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-[#181818] rounded-md border border-[#353535] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettings.mercadoPago?.allowCreditCard ?? true}
                          onChange={e =>
                            onUpdateStoreSettings({
                              ...storeSettings,
                              mercadoPago: {
                                ...(storeSettings.mercadoPago || {
                                  isEnabled: true,
                                  publicKey: 'TEST-...',
                                  accessToken: 'TEST-...',
                                  environment: 'sandbox',
                                  allowPix: true,
                                  allowCheckoutPro: true,
                                }),
                                allowCreditCard: e.target.checked,
                              },
                            })
                          }
                          className="accent-[#009ee3] w-4 h-4 rounded"
                        />
                        <span className="text-[#e5e2e1] font-medium">Cartão Online</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-[#181818] rounded-md border border-[#353535] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettings.mercadoPago?.allowCheckoutPro ?? true}
                          onChange={e =>
                            onUpdateStoreSettings({
                              ...storeSettings,
                              mercadoPago: {
                                ...(storeSettings.mercadoPago || {
                                  isEnabled: true,
                                  publicKey: 'TEST-...',
                                  accessToken: 'TEST-...',
                                  environment: 'sandbox',
                                  allowPix: true,
                                  allowCreditCard: true,
                                }),
                                allowCheckoutPro: e.target.checked,
                              },
                            })
                          }
                          className="accent-[#009ee3] w-4 h-4 rounded"
                        />
                        <span className="text-[#e5e2e1] font-medium">Checkout Pro</span>
                      </label>
                    </div>
                  </div>

                  {/* Test Connection Button & Result */}
                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isTestingMp}
                      onClick={handleTestMercadoPago}
                      className="bg-[#009ee3] hover:bg-[#0086c3] text-white py-2.5 px-4 rounded-md font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
                    >
                      {isTestingMp ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Testando comunicação com Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Testar Conexão com Mercado Pago</span>
                        </>
                      )}
                    </button>

                    {mpTestStatus && (
                      <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-md text-xs text-emerald-300 font-semibold text-center animate-in fade-in">
                        {mpTestStatus}
                      </div>
                    )}
                  </div>

                  {/* Webhook API URL Box */}
                  <div className="bg-[#181818] p-3.5 rounded-md border border-[#353535] space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#009ee3]" /> URL do Webhook (Notificações IPN):
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        POST /api/mercadopago/webhook
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-emerald-400 font-mono bg-black/50 px-2.5 py-1.5 rounded-lg border border-[#353535] flex-grow truncate">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/api/mercadopago/webhook`
                          : 'https://.../api/mercadopago/webhook'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyWebhook}
                        className="bg-[#009ee3] hover:bg-[#0086c3] text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-sm flex-shrink-0"
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#b4b5b5] leading-relaxed">
                      Cadastre a URL acima nas notificações do painel Mercado Pago Developers para receber avisos imediatos de pagamento.
                    </p>
                  </div>

                  {/* Help Link */}
                  <div className="text-[11px] text-[#b4b5b5] bg-[#181818] p-2.5 rounded-md border border-[#353535] flex items-center justify-between">
                    <span>Onde obter suas credenciais?</span>
                    <a
                      href="https://www.mercadopago.com.br/developers/panel/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#009ee3] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Painel Developers Mercado Pago</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* PIN de Segurança do Gestor */}
            <div className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-['Montserrat'] text-white flex items-center gap-2">
                      <span>PIN de Segurança do Gestor</span>
                      <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40 px-2 py-0.5 rounded font-extrabold uppercase">
                        Acesso Restrito
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#b4b5b5]">
                      Senha numérica de 4 dígitos necessária para entrar neste painel de gestão de pedidos e finanças.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#353535]/50">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#b4b5b5]">
                    Alterar PIN de Acesso (6 dígitos numéricos)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      value={managerPinInput}
                      onChange={e => setManagerPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ex: 123456"
                      className="w-36 bg-[#181818] border border-[#353535] rounded-md px-3 py-2 text-white font-mono text-center tracking-widest text-lg font-bold focus:border-[#ff5722] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (managerPinInput.length !== 6) {
                          alert('O PIN deve conter exatamente 6 dígitos numéricos.');
                          return;
                        }
                        onUpdateStoreSettings({
                          ...storeSettings,
                          managerPin: managerPinInput,
                        });
                        setPinToast('PIN de segurança do gestor atualizado com sucesso!');
                        setTimeout(() => setPinToast(null), 3500);
                      }}
                      className="bg-[#ff5722] hover:bg-[#d84315] text-white px-4 py-2 rounded-md font-['Montserrat'] font-bold text-xs transition-colors active:scale-95 shadow-sm"
                    >
                      Salvar Novo PIN
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8e8e8e]">
                    PIN ativo no momento: <strong className="text-white font-mono">{storeSettings.managerPin || '123456'}</strong>
                  </p>
                </div>

                <div className="bg-[#181818] p-3.5 rounded-lg border border-[#353535] text-xs text-[#b4b5b5] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Proteção contra clientes e visitantes</span>
                  </div>
                  <p className="leading-relaxed">
                    Nenhum cliente conseguirá ver os relatórios de faturamento, pedidos da cozinha ou custos sem digitar esse PIN de 6 dígitos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Guide Modal */}
      {showGuideModal && (
        <ManagementGuideModal
          onClose={() => setShowGuideModal(false)}
          onNavigateTab={tab => {
            setActiveTab(tab);
            setShowGuideModal(false);
          }}
        />
      )}

      {/* Modal: Confirmar Zerar Todas as Despesas */}
      {showClearExpensesConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Zerar Todas as Despesas?
                </h3>
                <p className="text-xs text-[#b4b5b5] leading-relaxed">
                  Tem certeza que deseja apagar todos os {expenses.length} lançamentos de saídas/despesas do caixa? O DRE voltará a ficar 100% zerado para você começar do zero.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#353535]">
              <button
                type="button"
                onClick={() => setShowClearExpensesConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] text-[#b4b5b5] hover:text-white hover:bg-[#2a2a2a] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAllExpenses}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Zerar Pedidos / Faturamento */}
      {showClearOrdersConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Zerar Pedidos & Faturamento?
                </h3>
                <p className="text-xs text-[#b4b5b5] leading-relaxed">
                  Tem certeza que deseja apagar todos os {orders.length} pedidos de teste do banco de dados? O faturamento e o histórico voltarão a ficar 100% zerados para você começar do zero na vida real.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#353535]">
              <button
                type="button"
                onClick={() => setShowClearOrdersConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] text-[#b4b5b5] hover:text-white hover:bg-[#2a2a2a] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearOrders}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Zerar Pedidos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lançar Nova Despesa / Saída */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#20201f] border border-[#353535] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Lançar Despesa / Saída do Caixa
                  </h3>
                  <p className="text-[10px] text-[#b4b5b5]">Registrar compra do dia ou pagamento imediato</p>
                </div>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-[#b4b5b5] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-medium">Descrição do Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Pães Brioche, Diária Motoboy Lucas..."
                  value={newExpenseDesc}
                  onChange={e => setNewExpenseDesc(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Categoria *</label>
                  <select
                    value={newExpenseCat}
                    onChange={e => setNewExpenseCat(e.target.value as any)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
                  >
                    <option value="insumos">Insumos & Carnes</option>
                    <option value="bebidas">Cervejas & Bebidas (Estoque Revenda / Distribuidora)</option>
                    <option value="motoboy">Entregas / Motoboy</option>
                    <option value="embalagens">Embalagens & Sacolas</option>
                    <option value="gas">Gás de Cozinha (GLP / Botijão / Encanado)</option>
                    <option value="operacional">Custos Operacionais Diários (Limpeza, Bobinas)</option>
                    <option value="fixo">Custos Fixos Mensais (Aluguel, Energia, Água, Internet)</option>
                    <option value="outros">Outras Despesas Diversas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    placeholder="0,00"
                    value={newExpenseAmount}
                    onChange={e => setNewExpenseAmount(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white focus:outline-none focus:border-[#ff5722] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#353535]">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-md text-white bg-[#353535] hover:bg-[#404040] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-flame text-white px-5 py-2 rounded-md font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Salvar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Guia Completo de Gestão Financeira para Hamburgueria */}
      {showFinancialGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#20201f] border border-[#353535] rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-base text-white">
                    Como Fazer Toda a Gestão Financeira da Hamburgueria
                  </h3>
                  <p className="text-[11px] text-[#b4b5b5]">
                    Manual prático para maximizar lucro, controlar custos e não perder dinheiro
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFinancialGuide(false)} className="text-[#b4b5b5] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#e5e2e1] hide-scrollbar leading-relaxed">
              {/* Pillar 1 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#ff8a65] font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#ff5722] text-white flex items-center justify-center text-xs">1</span>
                  CMV (Custo de Mercadoria Vendida) - O Indicador Nº 1
                </div>
                <p className="text-[#b4b5b5]">
                  O CMV mede quanto porcento da sua receita é gasta comprando carne, pão, queijo, molhos e embalagens.
                </p>
                <div className="bg-[#20201f] p-3 rounded-md border border-[#353535] font-mono text-[11px] text-[#ffb5a0]">
                  Fórmula: CMV (%) = (Gasto com Insumos ÷ Faturamento Bruto) × 100
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[#b4b5b5]">
                  <li><strong className="text-emerald-400">28% a 34%:</strong> Excelente! Hamburgueria altamente rentável.</li>
                  <li><strong className="text-amber-400">35% a 38%:</strong> Alerta! Pode haver desperdício ou gramaturas erradas na montagem.</li>
                  <li><strong className="text-red-400">Acima de 40%:</strong> Prejuízo no fim do mês. Revise os fornecedores e aumente os preços.</li>
                </ul>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#ff8a65] font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#ff5722] text-white flex items-center justify-center text-xs">2</span>
                  Ficha Técnica & Formação de Preço (Markup)
                </div>
                <p className="text-[#b4b5b5]">
                  Nunca precifique "olhando o vizinho". Tenha uma ficha técnica exata de cada hambúrguer (gramatura do blend, fatias de queijo, bacon e molho).
                </p>
                <div className="bg-[#20201f] p-3 rounded-md border border-[#353535] text-[11px] space-y-1">
                  <p className="font-semibold text-white">Regra de Ouro do Markup em Hamburgueria (2.8x a 3.3x):</p>
                  <p className="text-[#b4b5b5]">
                    Se o custo dos ingredientes do burger for <strong className="text-white">R$ 12,00</strong>:
                    <br />
                    Preço de Venda = R$ 12,00 × 3,0 = <strong className="text-emerald-400 font-mono">R$ 36,00</strong>.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#ff8a65] font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#ff5722] text-white flex items-center justify-center text-xs">3</span>
                  Fluxo de Caixa Diário & Saídas do Caixa
                </div>
                <p className="text-[#b4b5b5]">
                  Toda compra do dia precisa ser registrada no sistema (como as compras de açougue ou a diária do motoboy). Use o botão <strong>"+ Lançar Despesa"</strong> para ter o Lucro Líquido Real instantâneo.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#ff8a65] font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#ff5722] text-white flex items-center justify-center text-xs">4</span>
                  Conferência de Caixa por Meio de Pagamento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2.5 bg-[#20201f] rounded-md border border-[#353535]">
                    <strong className="text-[#ff5722] block mb-0.5">Pix:</strong>
                    Conferir no extrato da conta PJ do banco antes de liberar o pedido.
                  </div>
                  <div className="p-2.5 bg-[#20201f] rounded-md border border-[#353535]">
                    <strong className="text-[#019ad8] block mb-0.5">Cartão:</strong>
                    Tirar o relatório diário das maquininhas (POS) no fechamento.
                  </div>
                  <div className="p-2.5 bg-[#20201f] rounded-md border border-[#353535]">
                    <strong className="text-emerald-400 block mb-0.5">Dinheiro:</strong>
                    Contar a gaveta, separar o troco fixo e fazer a sangria de caixa.
                  </div>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#ff8a65] font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#ff5722] text-white flex items-center justify-center text-xs">5</span>
                  Separação de Pessoa Física x Pessoa Jurídica
                </div>
                <p className="text-[#b4b5b5]">
                  O maior erro de donos de hamburgueria é pagar contas de casa com o dinheiro do caixa da loja. Defina um <strong className="text-white">Pró-labore fixo mensal</strong> para você. O restante é o capital de giro e lucro retido da hamburgueria.
                </p>
              </div>

              {/* Pillar 6 */}
              <div className="bg-[#1c1b1b] border border-[#353535]/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-['Montserrat'] font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">6</span>
                  Custos Fixos Mensais (Aluguel, Luz, Água, Internet) & Ponto de Equilíbrio
                </div>
                <p className="text-[#b4b5b5]">
                  Diferente da carne e pão (que só são gastos quando você vende), as contas estruturais chegam todo mês independentemente do faturamento:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-center">
                  <div className="p-2 bg-[#20201f] border border-[#353535] rounded-md">🏢 Aluguel do Ponto</div>
                  <div className="p-2 bg-[#20201f] border border-[#353535] rounded-md">⚡ Energia dos Freezers/Coifa</div>
                  <div className="p-2 bg-[#20201f] border border-[#353535] rounded-md">💧 Água da Cozinha</div>
                  <div className="p-2 bg-[#20201f] border border-[#353535] rounded-md">📶 Internet & Sistema</div>
                </div>
                <div className="bg-[#20201f] p-3 rounded-md border border-[#353535] space-y-1.5 text-[11px]">
                  <p className="font-semibold text-white">Como lançar no Burger Dash:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[#b4b5b5]">
                    <li><strong>No vencimento das faturas:</strong> Lance o boleto pago clicando em <em>"+ Lançar Despesa"</em> e selecione a categoria <em>"Custos Fixos Mensais"</em>.</li>
                    <li><strong>Rateio Diário (Meta da Noite):</strong> Divida a soma dos custos fixos mensais pelos dias que a loja abre no mês (ex: R$ 3.000 ÷ 26 noites = ~R$ 115/noite). Essa é a quantia que a operação precisa pagar por turno para empatar as contas (Ponto de Equilíbrio / Breakeven).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#353535] bg-[#1c1b1b] flex justify-between items-center">
              <span className="text-[11px] text-[#b4b5b5]">
                Você pode exportar a planilha de fechamento clicando em "Exportar CSV".
              </span>
              <button
                onClick={() => setShowFinancialGuide(false)}
                className="btn-flame text-white px-5 py-2 rounded-md text-xs font-['Montserrat'] font-bold shadow-md"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Financial Toast */}
      {financialToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#20201f] border border-[#ff5722] text-white text-xs font-['Montserrat'] font-bold px-4 py-2.5 rounded-md shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{financialToast}</span>
        </div>
      )}

      {/* Floating Link Copied Toast */}
      {linkCopiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-['Montserrat'] font-bold px-4 py-2.5 rounded-md shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4" />
          <span>Link do cardápio copiado para a área de transferência!</span>
        </div>
      )}

      {/* Floating KDS Kanban Toast */}
      {kdsToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1e1d1c] border-2 border-[#ff5722] text-white text-xs font-['Montserrat'] font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-4 h-4 text-[#ff5722] shrink-0" />
          <span>{kdsToast}</span>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Entregador */}
      {showCourierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#20201f] border border-[#353535] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-base text-white">
                    {editingCourier ? 'Editar Dados do Entregador' : 'Cadastrar Novo Entregador'}
                  </h3>
                  <p className="text-[11px] text-[#b4b5b5]">
                    {editingCourier ? 'Atualize as informações do entregador' : 'Adicione um novo motoboy ou ciclista à sua equipe'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourierModal(false)}
                className="text-[#b4b5b5] hover:text-white p-1 rounded-full hover:bg-[#353535]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCourier} className="p-5 space-y-4 text-xs">
              {/* Nome */}
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-medium">Nome Completo / Apelido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ricardo Souza (Cria 01)"
                  value={cFormName}
                  onChange={e => setCFormName(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-medium">Celular / WhatsApp com DDD *</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 98765-4321"
                  value={cFormPhone}
                  onChange={e => setCFormPhone(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
                <span className="text-[10px] text-[#b4b5b5] block mt-1">
                  Permite que a cozinha e o cliente conversem no WhatsApp diretamente pelo app.
                </span>
              </div>

              {/* Tipo de Veículo */}
              <div>
                <label className="block text-[#b4b5b5] mb-1.5 font-medium">Tipo de Veículo de Entrega</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'moto', label: 'Moto', icon: '🏍️' },
                    { id: 'bike', label: 'Bicicleta', icon: '🚲' },
                    { id: 'carro', label: 'Carro', icon: '🚗' },
                    { id: 'a_pe', label: 'A pé', icon: '🚶' },
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setCFormVehicle(v.id as any)}
                      className={`p-2 rounded-md border text-center transition-all flex flex-col items-center gap-1 ${
                        cFormVehicle === v.id
                          ? 'bg-[#ff5722]/15 border-[#ff5722] text-white shadow-sm'
                          : 'bg-[#1c1b1b] border-[#353535] text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                      }`}
                    >
                      <span className="text-base">{v.icon}</span>
                      <span className="text-[10px] font-bold font-['Montserrat']">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modelo e Placa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Modelo do Veículo</label>
                  <input
                    type="text"
                    placeholder="Ex: Honda CG 160 Titan (Preta)"
                    value={cFormVehicleModel}
                    onChange={e => setCFormVehicleModel(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Placa do Veículo</label>
                  <input
                    type="text"
                    placeholder="Ex: BRA-2E19"
                    value={cFormPlate}
                    onChange={e => setCFormPlate(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white uppercase font-mono placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              {/* Chave Pix */}
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-medium">Chave Pix do Entregador (Para Repasses)</label>
                <input
                  type="text"
                  placeholder="CPF, Telefone, E-mail ou Chave Aleatória"
                  value={cFormPixKey}
                  onChange={e => setCFormPixKey(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white font-mono placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              {/* Taxa por corrida e Diária fixa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Taxa por Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={cFormFeePerDelivery}
                    onChange={e => setCFormFeePerDelivery(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#ff5722]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-medium">Diária Fixa (R$)</label>
                  <input
                    type="number"
                    step="5.00"
                    min="0"
                    value={cFormDailyRate}
                    onChange={e => setCFormDailyRate(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#ff5722]"
                  />
                </div>
              </div>

              {/* Foto de Perfil / Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#b4b5b5] font-medium">Foto de Perfil do Entregador</label>
                  <label className="text-[10px] text-[#ff8a65] hover:text-[#ff5722] cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="w-3 h-3" />
                    <span>Upload do Dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file, 400, 400, 0.85);
                            setCFormAvatar(compressed);
                          } catch (err: any) {
                            alert(err?.message || 'Erro ao carregar imagem');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {COURIER_AVATAR_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCFormAvatar(preset.url)}
                      className={`relative w-9 h-9 rounded-md overflow-hidden border-2 transition-all ${
                        cFormAvatar === preset.url
                          ? 'border-[#ff5722] ring-2 ring-[#ff5722]/50 scale-105'
                          : 'border-[#353535] hover:border-[#666]'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Ou cole o link de uma foto personalizada (URL)"
                  value={cFormAvatar}
                  onChange={e => setCFormAvatar(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2 text-white placeholder:text-[#b4b5b5]/40 text-[11px] focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-medium">Observações / Disponibilidade</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Turno da noite, possui bag grande com compartimento de pizzas..."
                  value={cFormNotes}
                  onChange={e => setCFormNotes(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3.5 py-2 text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              {/* Status Ativo / Plantão Hoje */}
              <div className="flex items-center justify-between p-3 bg-[#1c1b1b] rounded-md border border-[#353535]">
                <div>
                  <h4 className="font-['Montserrat'] font-bold text-white text-xs">
                    Disponível no Plantão de Hoje
                  </h4>
                  <p className="text-[10px] text-[#b4b5b5]">
                    Permite atribuir pedidos da cozinha para este entregador hoje.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCFormActive(!cFormActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cFormActive
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-[#353535] text-[#b4b5b5]'
                  }`}
                >
                  {cFormActive ? 'Em Plantão 🟢' : 'Pausado ⏸️'}
                </button>
              </div>

              {/* Botões do Modal */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[#353535]">
                <button
                  type="button"
                  onClick={() => setShowCourierModal(false)}
                  className="px-4 py-2.5 rounded-md text-white bg-[#353535] hover:bg-[#404040] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-flame text-white px-5 py-2.5 rounded-md font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCourier ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Dispatch Modal */}
      {dispatchOrderTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#20201f] border border-[#353535] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#353535]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-[#019ad8]/20 text-[#86cfff] flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Despachar Pedido {dispatchOrderTarget.orderNumber}
                  </h3>
                  <p className="text-[11px] text-[#b4b5b5]">
                    Qual entregador em plantão levará a bag?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrderTarget(null)}
                className="p-1.5 text-[#b4b5b5] hover:text-white rounded-full hover:bg-[#353535]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(storeSettings.couriers || [])
                .filter(c => c.active)
                .map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onAdvanceToDelivery(dispatchOrderTarget.id, {
                        name: c.name,
                        phone: c.phone,
                        avatar: c.avatar,
                        vehicle: c.vehicleModel || (c.vehicle ? `Veículo (${c.vehicle})` : undefined),
                        plate: c.plate,
                      });
                      setDispatchOrderTarget(null);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-[#1c1b1b] hover:bg-[#252525] border border-[#353535] hover:border-[#ff5722] rounded-md text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/50 bg-[#252525] flex-shrink-0">
                        <img
                          src={c.avatar || APP_IMAGES.driverAvatar}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-['Montserrat'] font-bold text-xs text-white group-hover:text-[#ff8a65] transition-colors">
                          {c.name}
                        </h4>
                        <p className="text-[11px] text-[#b4b5b5]">
                          {c.vehicleModel || c.vehicle} {c.plate ? `• ${c.plate}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#86cfff] font-bold font-['Montserrat'] px-2.5 py-1 rounded-lg bg-[#019ad8]/15 border border-[#019ad8]/30">
                      Entregar 🛵
                    </span>
                  </button>
                ))}
            </div>

            <div className="pt-2 flex justify-between items-center gap-2 border-t border-[#353535]">
              <button
                type="button"
                onClick={() => {
                  onAdvanceToDelivery(dispatchOrderTarget.id);
                  setDispatchOrderTarget(null);
                }}
                className="text-xs text-[#b4b5b5] hover:text-white py-1.5 px-2 rounded-lg hover:bg-[#252525]"
              >
                Despachar sem atribuir
              </button>
              <button
                type="button"
                onClick={() => setDispatchOrderTarget(null)}
                className="text-xs text-white bg-[#353535] hover:bg-[#444] px-4 py-2 rounded-md font-bold font-['Montserrat']"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Recusar Pedido */}
      {rejectOrderTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#20201f] border border-[#353535] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/40">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-black text-white text-base">
                  Recusar Pedido #{rejectOrderTarget.orderNumber}?
                </h3>
                <p className="text-xs text-[#b4b5b5] font-light">
                  Cliente: {rejectOrderTarget.customerName}
                </p>
              </div>
            </div>

            <div className="bg-[#161616] rounded-xl p-3 border border-[#303030] text-xs space-y-1.5 text-[#b4b5b5]">
              <div className="flex justify-between text-white font-medium">
                <span>Total do Pedido:</span>
                <span className="text-[#ff5722] font-black font-['Montserrat']">
                  R$ {(rejectOrderTarget.total || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <p className="text-[11px] text-[#8e8f8f] leading-relaxed">
                Ao recusar, o pedido será cancelado no sistema e arquivado no histórico de hoje.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#353535]">
              <button
                type="button"
                onClick={() => setRejectOrderTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] text-[#b4b5b5] hover:text-white bg-[#2a2a2a] hover:bg-[#333] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onRejectOrder(rejectOrderTarget.id);
                  setRejectOrderTarget(null);
                  setKdsToast(`Pedido #${rejectOrderTarget.orderNumber} cancelado.`);
                  setTimeout(() => setKdsToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Montserrat'] text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório Detalhado de Pedidos do Dia */}
      {showDailyReportModal && (
        <DailyOrdersReportModal
          isOpen={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          orders={orders}
          storeSettings={storeSettings}
          onPrintOrder={onPrintOrder}
        />
      )}

      {/* Modal Relatório Financeiro e Fechamento em PDF */}
      {showFinancialPdfModal && (
        <FinancialPdfModal
          isOpen={showFinancialPdfModal}
          onClose={() => setShowFinancialPdfModal(false)}
          orders={orders}
          expenses={expenses}
          storeSettings={storeSettings}
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          netMargin={netMargin}
          averageTicket={averageTicket}
          pixTotal={pixTotal}
          cardTotal={cardTotal}
          cashTotal={cashTotal}
          cmvPercentage={cmvPercentage}
        />
      )}

      {/* Modal de Confirmação de Exclusão de Produto */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Excluir item do cardápio?
                </h3>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Esta ação removerá o produto permanentemente do cardápio e do banco de dados Firebase.
                </p>
              </div>
            </div>

            {/* Resumo do produto */}
            <div className="bg-[#141414] border border-[#353535] rounded-xl p-3 flex items-center gap-3 mb-5">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                className="w-14 h-14 rounded-lg object-cover bg-[#20201f] shrink-0 border border-[#353535]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{productToDelete.name}</h4>
                <span className="text-xs font-bold text-[#ff5722] block mt-0.5">
                  R$ {productToDelete.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-[#8e8f8f] uppercase font-mono">
                  Categoria: {productToDelete.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#353535] text-white text-xs font-['Montserrat'] font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = productToDelete.id;
                  setProductToDelete(null);
                  if (onDeleteProduct) {
                    onDeleteProduct(id);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Sim, Excluir Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Entregador */}
      {courierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Remover entregador?
                </h3>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Deseja remover <strong>{courierToDelete.name}</strong> da equipe de entregas?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCourierToDelete(null)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#353535] text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCourier}
                className="flex-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Cupom */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Excluir cupom?
                </h3>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Deseja realmente apagar o cupom <strong>"{couponToDelete.code}"</strong>?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#353535] text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCoupon}
                className="flex-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento do Link Público do Cardápio */}
      <ShareMenuModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        customBaseUrl={storeSettings.customMenuUrl}
        onSaveCustomBaseUrl={url =>
          onUpdateStoreSettings({
            ...storeSettings,
            customMenuUrl: url,
          })
        }
      />
    </div>
  );
};
