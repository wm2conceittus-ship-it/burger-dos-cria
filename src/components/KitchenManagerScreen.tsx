import React, { useState } from 'react';
import { Order, Product, StoreSettings, Courier, DeliveryZone } from '../types';
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
} from 'lucide-react';
import { ManagementGuideModal } from './ManagementGuideModal';
import { DailyOrdersReportModal } from './DailyOrdersReportModal';
import { FinancialPdfModal } from './FinancialPdfModal';
import { DeliveryRadiusControl } from './DeliveryRadiusControl';
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
  onPrintOrder: (order: Order) => void;
  onOpenChat: () => void;
  onNavigateToMenu: () => void;
  onLockManager?: () => void;
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: 'insumos' | 'bebidas' | 'motoboy' | 'embalagens' | 'gas' | 'operacional' | 'fixo' | 'outros';
  amount: number;
  time: string;
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp-1', description: 'Blend Angus e Pães Brioche (Açougue & Padaria)', category: 'insumos', amount: 380.00, time: '17:30' },
  { id: 'exp-2', description: 'Fardos de Cerveja Heineken, Corona & Ambev (Distribuidora)', category: 'bebidas', amount: 140.00, time: '17:45' },
  { id: 'exp-3', description: 'Diária 2x Entregadores / Motoboys', category: 'motoboy', amount: 160.00, time: '18:00' },
  { id: 'exp-4', description: 'Embalagens Térmicas & Papel Acoplado', category: 'embalagens', amount: 75.00, time: '18:15' },
  { id: 'exp-5', description: 'Recarga Botijão P45 / Gás de Cozinha GLP', category: 'gas', amount: 145.00, time: '18:25' },
  { id: 'exp-6', description: 'Hortifruti (Tomate, Rúcula, Cebola, Queijo)', category: 'insumos', amount: 94.00, time: '18:40' },
  { id: 'exp-7', description: 'Bobinas Térmicas & Material de Limpeza', category: 'operacional', amount: 55.00, time: '19:10' },
];

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
  onPrintOrder,
  onOpenChat,
  onNavigateToMenu,
  onLockManager,
}) => {
  // Main Sub-Tab: 'pedidos' | 'cardapio' | 'relatorios' | 'configuracoes'
  const [activeTab, setActiveTab] = useState<'pedidos' | 'cardapio' | 'relatorios' | 'configuracoes'>('pedidos');
  const [mainFilter, setMainFilter] = useState<'abertos' | 'agendados'>('abertos');
  const [statusFilter, setStatusFilter] = useState<'novos' | 'preparando' | 'prontos' | 'em_entrega' | 'historico'>('novos');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [cardapioFilter, setCardapioFilter] = useState<'all' | 'burgers' | 'pizzas' | 'salgados' | 'sucos' | 'bebidas'>('all');
  const [managerPinInput, setManagerPinInput] = useState(storeSettings.managerPin || '1234');
  const [pinToast, setPinToast] = useState<string | null>(null);
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);

  // Financial Management State
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showFinancialGuide, setShowFinancialGuide] = useState(false);
  const [showFinancialPdfModal, setShowFinancialPdfModal] = useState(false);
  const [financialToast, setFinancialToast] = useState<string | null>(null);

  // New expense form
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState<'insumos' | 'bebidas' | 'motoboy' | 'embalagens' | 'gas' | 'operacional' | 'fixo' | 'outros'>('insumos');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Payment methods in store settings
  const [configTab, setConfigTab] = useState<'gateway' | 'geral' | 'area' | 'entregadores' | 'formas'>('area');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [newPaymentMethodInput, setNewPaymentMethodInput] = useState('');
  const [mpTestStatus, setMpTestStatus] = useState<string | null>(null);
  const [isTestingMp, setIsTestingMp] = useState(false);

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
    if (confirm(`Deseja remover o entregador ${name} do cadastro?`)) {
      const currentCouriers = storeSettings.couriers || [];
      const updatedCouriers = currentCouriers.filter(c => c.id !== courierId);
      onUpdateStoreSettings({
        ...storeSettings,
        couriers: updatedCouriers,
      });
      setCourierToast(`Entregador ${name} removido.`);
      setTimeout(() => setCourierToast(null), 3000);
    }
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

  // Stats calculation
  const novosOrders = orders.filter(o => o.status === 'novo' || o.status === 'recebido');
  const preparandoOrders = orders.filter(o => o.status === 'preparando');
  const prontosOrders = orders.filter(o => o.status === 'pronto');
  const emEntregaOrders = orders.filter(o => o.status === 'em_entrega');
  const historicoOrders = orders.filter(o => o.status === 'entregue' || o.status === 'recusado');
  const abertosOrders = orders.filter(o => o.status !== 'entregue' && o.status !== 'recusado');

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

  // Breakdown by payment methods
  const pixTotal = totalRevenue * 0.65;
  const cardTotal = totalRevenue * 0.25;
  const cashTotal = totalRevenue * 0.10;

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
            <button
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.origin : '';
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                }
                setLinkCopiedToast(true);
                setTimeout(() => setLinkCopiedToast(false), 2500);
              }}
              className="text-[#b4b5b5] hover:text-[#ffb5a0] p-1.5 transition-colors relative"
              title="Copiar Link do Cardápio"
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
              { id: 'cardapio' as const, label: 'Cardápio & Estoque', icon: Layers },
              { id: 'relatorios' as const, label: 'Finanças & DRE', icon: DollarSign },
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
            {/* Header Summary */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-['Montserrat'] text-2xl md:text-3xl font-extrabold text-white">
                  Gestor de Pedidos
                </h1>
                <p className="text-xs md:text-sm text-[#b4b5b5] mt-1 font-light">
                  Gerencie o fluxo da sua cozinha em tempo real.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setShowDailyReportModal(true)}
                  className="bg-[#20201f] text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/15 px-3 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  title="Ver e exportar lista detalhada de pedidos do dia"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Relatório do Dia</span>
                </button>

                <button
                  onClick={() => setShowGuideModal(true)}
                  className="bg-[#ff5722]/15 hover:bg-[#ff5722]/25 text-[#ff8a65] border border-[#ff5722]/40 px-3 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  title="Como Fazer a Gestão"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
                  <span>Guia de Gestão</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateStoreSettings({
                      ...storeSettings,
                      autoAcceptOrders: !storeSettings.autoAcceptOrders,
                    })
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                    storeSettings.autoAcceptOrders
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-[#20201f] text-[#b4b5b5] border border-[#353535] hover:text-white hover:border-[#ff5722]/50'
                  }`}
                  title="Clique para ligar ou desligar o aceite automático de pedidos"
                >
                  <Zap className={`w-3.5 h-3.5 ${storeSettings.autoAcceptOrders ? 'text-emerald-400' : 'text-[#8e8f8f]'}`} />
                  <span>Auto-Aceite: {storeSettings.autoAcceptOrders ? 'ATIVADO' : 'MANUAL'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-[#20201f] p-1 rounded-md border border-[#353535]/40">
                  <button
                    onClick={() => setMainFilter('abertos')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold font-['Montserrat'] transition-all ${
                      mainFilter === 'abertos'
                        ? 'bg-[#ff5722] text-white shadow-md'
                        : 'text-[#b4b5b5] hover:text-white'
                    }`}
                  >
                    Abertos ({abertosOrders.length})
                  </button>
                  <button
                    onClick={() => setMainFilter('agendados')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium font-['Montserrat'] transition-all ${
                      mainFilter === 'agendados'
                        ? 'bg-[#ff5722] text-white shadow-md'
                        : 'text-[#b4b5b5] hover:text-white'
                    }`}
                  >
                    Agendados (3)
                  </button>
                </div>
              </div>
            </section>

            {/* Status Toggles Horizontal Scroll */}
            <section className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
              <button
                onClick={() => setStatusFilter('novos')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                  statusFilter === 'novos'
                    ? 'border-[#ff5722] bg-[#ff5722]/15 text-[#ff8a65] shadow-sm'
                    : 'border-[#353535] bg-[#20201f] text-[#b4b5b5] hover:border-[#ff5722]/40'
                }`}
              >
                <span className="w-2 h-2 bg-[#ff5722] rounded-full animate-ping" />
                Novos ({novosOrders.length})
              </button>

              <button
                onClick={() => setStatusFilter('preparando')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all border ${
                  statusFilter === 'preparando'
                    ? 'border-[#ff5722] bg-[#ff5722]/15 text-[#ff8a65] font-bold'
                    : 'border-[#353535] bg-[#20201f] text-[#b4b5b5] hover:border-[#ff5722]/40'
                }`}
              >
                Preparando ({preparandoOrders.length})
              </button>

              <button
                onClick={() => setStatusFilter('prontos')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all border ${
                  statusFilter === 'prontos'
                    ? 'border-[#ff5722] bg-[#ff5722]/15 text-[#ff8a65] font-bold'
                    : 'border-[#353535] bg-[#20201f] text-[#b4b5b5] hover:border-[#ff5722]/40'
                }`}
              >
                Prontos ({prontosOrders.length})
              </button>

              <button
                onClick={() => setStatusFilter('em_entrega')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all border ${
                  statusFilter === 'em_entrega'
                    ? 'border-[#ff5722] bg-[#ff5722]/15 text-[#ff8a65] font-bold'
                    : 'border-[#353535] bg-[#20201f] text-[#b4b5b5] hover:border-[#ff5722]/40'
                }`}
              >
                Em Entrega ({emEntregaOrders.length})
              </button>

              <button
                onClick={() => setStatusFilter('historico')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all border ${
                  statusFilter === 'historico'
                    ? 'border-[#ff5722] bg-[#ff5722]/15 text-[#ff8a65] font-bold'
                    : 'border-[#353535] bg-[#20201f] text-[#b4b5b5] hover:border-[#ff5722]/40'
                }`}
              >
                Histórico ({historicoOrders.length})
              </button>
            </section>

            {/* Bento Grid: Cards Section */}
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
                              <h3 className="font-['Montserrat'] font-bold text-base text-white">
                                {order.orderNumber} - {order.customerName}
                              </h3>
                              <p className="text-xs text-[#b4b5b5]">
                                {order.timeAgo} • {order.type}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onPrintOrder(order)}
                                className="text-[#b4b5b5] hover:text-[#ff5722] p-1 rounded-full transition-colors"
                                title="Imprimir comanda"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <Zap className="w-5 h-5 text-[#ff5722] fill-[#ff5722]" />
                            </div>
                          </div>

                          <div className="space-y-1 mb-4 text-xs text-[#e5e2e1]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="text-[#ff5722] font-semibold">
                                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            ))}
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
                          ) : (
                            <button
                              onClick={() => onAdvanceToReady(order.id)}
                              className="w-full bg-[#2a2a2a] text-[#ff8a65] border border-[#ff5722]/30 hover:bg-[#ff5722]/10 py-2.5 rounded-md text-xs font-bold font-['Montserrat'] transition-all"
                            >
                              Mudar para Pronto
                            </button>
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
                          <h3 className="font-['Montserrat'] font-bold text-sm md:text-base text-white">
                            {order.orderNumber} - {order.customerName}
                          </h3>
                          <p className="text-xs text-[#b4b5b5]">
                            {order.timeAgo} • {order.type}
                          </p>
                        </div>
                        <button
                          onClick={() => onPrintOrder(order)}
                          className="ml-auto text-[#b4b5b5] hover:text-[#ff5722] p-1.5 rounded-full transition-colors"
                          title="Imprimir Pedido"
                        >
                          <Printer className="w-4 h-4" />
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
                          <div className="p-2 bg-[#1c1b1b] rounded-lg border border-[#353535] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-[#ff5722]/50 bg-[#252525] flex-shrink-0">
                                <img
                                  src={order.courierAvatar || APP_IMAGES.driverAvatar}
                                  alt="Entregador"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-white font-medium truncate max-w-[120px]">
                                {order.courierName || 'Entregador Despachado'}
                              </span>
                            </div>
                            {order.courierPhone && (
                              <a
                                href={`https://wa.me/55${order.courierPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] flex items-center gap-1"
                              >
                                WhatsApp
                              </a>
                            )}
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
          </div>
        )}

        {/* ================= ABA 2: CARDÁPIO & ESTOQUE ================= */}
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
                        <div className="text-right flex-shrink-0">
                          <span className="font-['Montserrat'] font-bold text-xs text-[#ff5722] block">
                            R$ {product.price.toFixed(2).replace('.', ',')}
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

                        <button
                          onClick={() => onOpenEditProduct(product)}
                          className="text-[#b4b5b5] hover:text-[#ff8a65] text-[11px] flex items-center gap-1 font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
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
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Ao Vivo
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#e5e2e1]">
                    <span className="font-sans font-medium text-emerald-400">(+) Receita de Vendas de Burgers & Pizzas</span>
                    <span className="font-bold">R$ {(totalRevenue * 0.88).toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#353535]/40 text-[#e5e2e1]">
                    <span className="font-sans font-medium text-emerald-400">(+) Receita com Taxas de Entrega</span>
                    <span className="font-bold">R$ {(totalRevenue * 0.12).toFixed(2).replace('.', ',')}</span>
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
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="text-xs text-[#ff8a65] hover:text-white font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
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
                        <span className="w-2 h-2 rounded-full bg-[#ff5722]" /> Pix (65% das vendas)
                      </span>
                      <span className="font-bold text-[#ff5722] font-mono">
                        R$ {pixTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Cai direto na conta corrente da hamburgueria (0% de taxa).</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#ff5722] rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535]/50">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#019ad8]" /> Cartão Crédito/Débito (25%)
                      </span>
                      <span className="font-bold text-white font-mono">
                        R$ {cardTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Conferir fechamento das maquininhas no fim da noite.</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-[#019ad8] rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div className="p-3 bg-[#1c1b1b] rounded-md border border-[#353535]/50">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Dinheiro em Espécie (10%)
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        R$ {cashTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8f8f]">Contar notas na gaveta de caixa e realizar sangria.</p>
                    <div className="h-2 w-full bg-[#353535] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Itens Mais Vendidos */}
              <div className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                    Mais Vendidos & Rentabilidade
                  </h3>
                  <span className="text-[10px] text-[#b4b5b5]">Curva ABC de produtos</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { name: 'Gourmet Truffle Burger', count: 18, total: 'R$ 972,00', margin: '68% margem' },
                    { name: 'Pizza Calabresa dos Crias', count: 12, total: 'R$ 598,80', margin: '72% margem' },
                    { name: 'Classic Bacon Burger', count: 14, total: 'R$ 546,00', margin: '65% margem' },
                    { name: 'Batata Rústica Grande', count: 12, total: 'R$ 226,80', margin: '80% margem' },
                    { name: 'Coca-Cola 350ml', count: 22, total: 'R$ 173,80', margin: '55% margem' },
                  ].map((top, idx) => (
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
                          <span className="text-[10px] text-emerald-400">{top.margin}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#b4b5b5] mr-2">{top.count} un</span>
                        <span className="font-bold text-[#ff5722] font-mono">{top.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

            {/* Sub-abas dentro das Configurações */}
            <div className="flex gap-2 p-1.5 bg-[#1c1b1b] rounded-md border border-[#353535] overflow-x-auto justify-start sm:justify-center">
              <button
                type="button"
                onClick={() => setConfigTab('gateway')}
                className={`px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  configTab === 'gateway'
                    ? 'bg-[#009ee3] text-white shadow-lg shadow-[#009ee3]/25 ring-1 ring-[#009ee3]'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <div className="w-4 h-4 rounded bg-white text-[#009ee3] text-[9px] font-black flex items-center justify-center shadow-sm">
                  MP
                </div>
                <span>Gateway</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  API
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('geral')}
                className={`px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  configTab === 'geral'
                    ? 'bg-[#ff5722] text-white shadow-md'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Geral & Operação</span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('entregadores')}
                className={`px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  configTab === 'entregadores'
                    ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Entregadores & Motoboys</span>
                {((storeSettings.couriers || []).filter(c => c.active).length > 0) && (
                  <span className="text-[9px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                    {(storeSettings.couriers || []).filter(c => c.active).length} no plantão
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('area')}
                className={`px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  configTab === 'area'
                    ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/20 ring-1 ring-[#ff5722]'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Área de Atuação</span>
                <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  {storeSettings.deliveryArea?.radiusKm || 7} km
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('formas')}
                className={`px-4 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  configTab === 'formas'
                    ? 'bg-[#ff5722] text-white shadow-md'
                    : 'text-[#b4b5b5] hover:text-white hover:bg-[#252525]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Formas de Pagamento Locais</span>
              </button>
            </div>

            {/* Toast da Área de Atuação */}
            {areaToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{areaToast}</span>
              </div>
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

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold text-white block">
                      Alerta Sonoro para Novos Pedidos
                    </span>
                    <span className="text-[11px] text-[#b4b5b5]">
                      Toca sinal acústico na cozinha a cada pedido recebido.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSettings.soundAlerts}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        soundAlerts: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-[#ff5722]"
                  />
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

                {/* Chave Pix Config */}
                <div className="bg-[#1c1b1b] border border-[#353535] rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-semibold text-white">
                    Chave Pix da Hamburgueria (Recebimento dos Clientes)
                  </label>
                  <input
                    type="text"
                    value={storeSettings.pixKey || '11987654321'}
                    onChange={e =>
                      onUpdateStoreSettings({
                        ...storeSettings,
                        pixKey: e.target.value,
                      })
                    }
                    placeholder="CNPJ, Telefone, E-mail ou Chave Aleatória"
                    className="w-full bg-[#20201f] border border-[#353535] rounded-md px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#ff5722]"
                  />
                  <span className="text-[10px] text-[#b4b5b5] block">
                    O cliente consegue copiar esta chave com 1 clique diretamente na tela de finalização do pedido.
                  </span>
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
                    {['Vale Refeição (VR)', 'Ticket Restaurante', 'Alelo', 'Sodexo / Pluxee', 'PicPay', 'Caju / Flash'].map(
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
                    Alterar PIN de Acesso (4 dígitos numéricos)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      inputMode="numeric"
                      value={managerPinInput}
                      onChange={e => setManagerPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Ex: 1234"
                      className="w-32 bg-[#181818] border border-[#353535] rounded-md px-3 py-2 text-white font-mono text-center tracking-widest text-lg font-bold focus:border-[#ff5722] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (managerPinInput.length !== 4) {
                          alert('O PIN deve conter exatamente 4 dígitos numéricos.');
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
                    PIN ativo no momento: <strong className="text-white font-mono">{storeSettings.managerPin || '1234'}</strong>
                  </p>
                </div>

                <div className="bg-[#181818] p-3.5 rounded-lg border border-[#353535] text-xs text-[#b4b5b5] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Proteção contra clientes e visitantes</span>
                  </div>
                  <p className="leading-relaxed">
                    Nenhum cliente conseguirá ver os relatórios de faturamento, pedidos da cozinha ou custos sem digitar esse PIN de 4 dígitos.
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
                <label className="block text-[#b4b5b5] mb-1.5 font-medium">Foto de Perfil do Entregador</label>
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
    </div>
  );
};
