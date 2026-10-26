import React, { useState, useEffect } from 'react';
import { Order, StoreSettings } from '../types';
import { APP_IMAGES } from '../data/mockData';
import {
  ArrowLeft,
  MessageSquare,
  Flame,
  Bike,
  Check,
  CheckCircle2,
  MapPin,
  ChevronRight,
  HelpCircle,
  Navigation,
  ExternalLink,
  UtensilsCrossed,
  Zap,
  Sparkles,
  Phone,
  Share2,
  Receipt,
  PackageCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { mercadoPagoApi } from '../services/mercadoPagoService';
import { getManagerWhatsAppNotificationUrl } from '../utils/whatsappNotification';
import { getGoogleMapsRouteUrl, getWazeRouteUrl } from '../utils/gpsRouteUtils';
import { formatOrderCreationDateTime } from '../utils/orderDateTime';

interface OrderTrackingScreenProps {
  order?: Order | null;
  storeSettings?: StoreSettings;
  onBack: () => void;
  onOpenChatWithDriver: () => void;
  onOpenHelp: () => void;
  onUpdatePaymentStatus?: (orderId: string, status: 'pendente' | 'aprovado' | 'recusado') => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  order,
  storeSettings,
  onBack,
  onOpenChatWithDriver,
  onOpenHelp,
  onUpdatePaymentStatus,
}) => {
  if (!order) {
    return (
      <div className="min-h-screen bg-[#121212] pb-24 text-[#e5e2e1]">
        <header className="fixed top-0 left-0 w-full z-30 bg-[#20201f]/95 backdrop-blur-md border-b border-[#353535]/50 h-16 flex items-center px-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-white mr-3 hover:bg-[#333] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-['Montserrat'] font-bold text-lg text-white">Acompanhar Pedido</h1>
        </header>

        <div className="pt-28 px-5 max-w-md mx-auto text-center space-y-5 animate-in fade-in">
          <div className="w-20 h-20 rounded-3xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722] mx-auto shadow-xl shadow-[#ff5722]/10">
            <Bike className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-['Montserrat'] text-white">Nenhum pedido em andamento</h2>
            <p className="text-xs text-[#b4b5b5] leading-relaxed">
              Você ainda não enviou nenhum pedido ativo nesta sessão. Explore o cardápio, monte seu pedido e envie direto para a cozinha!
            </p>
          </div>
          <button
            onClick={onBack}
            className="btn-flame px-6 py-3 rounded-xl font-bold font-['Montserrat'] text-xs text-white shadow-lg shadow-[#ff5722]/20 active:scale-95 transition-all"
          >
            Ver Cardápio & Fazer Pedido
          </button>
        </div>
      </div>
    );
  }

  const isTable = order.type === 'Mesa';

  const getStepIndexFromStatus = (status?: string): number => {
    switch (status) {
      case 'novo':
      case 'recebido':
        return 0; // Recebido
      case 'preparando':
        return 1; // Em Preparo
      case 'pronto':
        return 2; // Pronto
      case 'em_entrega':
        return 3; // Em Rota
      case 'entregue':
        return 4; // Entregue
      default:
        return 0;
    }
  };

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() =>
    getStepIndexFromStatus(order.status)
  );
  const [showItemsList, setShowItemsList] = useState(false);

  // Sincroniza em tempo real com o status atualizado pela cozinha no Firebase
  useEffect(() => {
    if (order.status) {
      setCurrentStepIndex(getStepIndexFromStatus(order.status));
    }
  }, [order.status]);

  const isPixPending =
    Boolean(order.paymentMethod?.toLowerCase().includes('pix')) &&
    order.paymentStatus === 'pendente' &&
    Boolean(order.mercadoPagoPaymentId);

  // Polling em tempo real se o Pix ainda está aguardando confirmação do Mercado Pago
  useEffect(() => {
    if (!isPixPending || !order.mercadoPagoPaymentId) return;

    const interval = setInterval(async () => {
      try {
        const res = await mercadoPagoApi.checkPaymentStatus(
          order.mercadoPagoPaymentId!,
          storeSettings?.mercadoPago?.accessToken
        );
        if (res.approved && onUpdatePaymentStatus) {
          onUpdatePaymentStatus(order.id, 'aprovado');
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPixPending, order.mercadoPagoPaymentId, order.id, storeSettings?.mercadoPago?.accessToken, onUpdatePaymentStatus]);

  // 5 Etapas Solicitadas: Recebido, Em Preparo, Pronto, Em Rota e Entregue
  const steps = [
    {
      id: 'recebido',
      label: 'Recebido',
      icon: Receipt,
      desc: isTable ? 'Pedido registrado na Mesa' : 'Pedido registrado e enviado para a chapa',
    },
    {
      id: 'preparo',
      label: 'Em Preparo',
      icon: Flame,
      desc: 'O chapeiro está grelhando o lanche na chapa',
    },
    {
      id: 'pronto',
      label: 'Pronto',
      icon: PackageCheck,
      desc: isTable ? 'Lanches prontos para servir na mesa' : 'Lanches prontos e embalados na bag térmica',
    },
    {
      id: 'em_rota',
      label: isTable ? 'A Servir' : 'Em Rota',
      icon: isTable ? UtensilsCrossed : Bike,
      desc: isTable ? 'Garçom levando o prato à mesa' : 'Entregador em rota a caminho do endereço',
    },
    {
      id: 'entregue',
      label: 'Entregue',
      icon: CheckCircle2,
      desc: isTable ? 'Pedido servido na mesa! Bom apetite' : 'Pedido entregue com sucesso! Bom apetite',
    },
  ];

  const getStatusText = () => {
    if (order.status === 'recusado') {
      return 'PEDIDO RECUSADO';
    }

    if (isTable) {
      switch (currentStepIndex) {
        case 0:
          return 'PEDIDO RECEBIDO NO SALÃO';
        case 1:
          return 'BURGER NA CHAPA 🔥 (EM PREPARO)';
        case 2:
          return 'PRONTO PARA SERVIR ✨';
        case 3:
          return 'A CAMINHO DA SUA MESA 🍽️';
        case 4:
          return 'SERVIDO NA SUA MESA 🎉';
        default:
          return 'EM ATENDIMENTO';
      }
    }

    switch (currentStepIndex) {
      case 0:
        return 'PEDIDO RECEBIDO PELA HAMBURGUERIA';
      case 1:
        return 'PEDIDO ACEITO! EM PREPARO 🔥';
      case 2:
        return 'PEDIDO PRONTO & EMBALADO ✨';
      case 3:
        return 'PEDIDO EM ROTA DE ENTREGA 🛵';
      case 4:
        return 'PEDIDO ENTREGUE COM SUCESSO 🎉';
      default:
        return 'EM PREPARO';
    }
  };

  const courierFirstName = (order.courierName || 'Ricardo').split(' ')[0];

  const getCourierStatus = () => {
    if (isTable) {
      switch (currentStepIndex) {
        case 0:
          return `Mesa ${order.tableNumber || 1}: pedido recebido pela cozinha`;
        case 1:
          return `O chapeiro está grelhando seu lanche para a Mesa ${order.tableNumber || 1}`;
        case 2:
          return `Lanches finalizados na chapa para a Mesa ${order.tableNumber || 1}`;
        case 3:
          return `O garçom está levando seu pedido para a Mesa ${order.tableNumber || 1}`;
        case 4:
          return `Pedido servido com sucesso na Mesa ${order.tableNumber || 1}! Bom apetite 🔥`;
        default:
          return `Pedido em atendimento na Mesa ${order.tableNumber || 1}`;
      }
    }

    switch (currentStepIndex) {
      case 0:
        return 'Aguardando o chapeiro aceitar e iniciar o preparo';
      case 1:
        return 'Pedido aceito! O chapeiro já iniciou o preparo na chapa 🔥';
      case 2:
        return 'Lanches artesanais prontos e embalados na bag térmica ✨';
      case 3:
        return `${courierFirstName} retirou seu pedido e está a caminho do seu endereço 🛵`;
      case 4:
        return 'Pedido entregue com sucesso! Bom apetite 🎉';
      default:
        return `${courierFirstName} está com seu pedido`;
    }
  };

  const progressPercent = Math.min(100, Math.round((currentStepIndex / (steps.length - 1)) * 100));

  return (
    <div className="bg-[#0F0F0F] text-[#e5e2e1] min-h-screen pb-28">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-5 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#353535]/30 h-16">
        <div className="max-w-lg mx-auto w-full h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-[#ffb5a0] hover:text-white p-1 rounded-full active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/30">
              <img
                src={APP_IMAGES.logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#353535]">
              <img
                src={APP_IMAGES.userAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={onOpenChatWithDriver}
              className="w-9 h-9 rounded-full bg-[#20201f] border border-[#353535] flex items-center justify-center text-[#ffb5a0] hover:text-white"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-lg mx-auto space-y-6">
        {/* Order Identity Header */}
        <section>
          <div className="flex justify-between items-end mb-1">
            <h1 className="font-['Montserrat'] text-2xl font-bold text-[#e5e2e1]">
              Pedido {order.orderNumber}
            </h1>
            <span className="text-xs font-semibold text-[#ff5722] tracking-wider uppercase font-['Montserrat']">
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#b4b5b5] mt-1 flex-wrap gap-2">
            <p className="flex items-center gap-1.5 bg-[#1c1b1b] px-2.5 py-1 rounded-md border border-[#353535]">
              <Clock className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>Pedido feito em: <strong className="text-white font-mono">{formatOrderCreationDateTime(order)}</strong></span>
            </p>
            <p className="bg-[#1c1b1b] px-2.5 py-1 rounded-md border border-[#353535]">
              Previsão:{' '}
              <span className="text-white font-bold font-['Montserrat']">
                20-30 min
              </span>
            </p>
          </div>
        </section>

        {/* Status Alert Banners */}
        {(order.status === 'novo' || order.status === 'recebido') && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 shadow-lg animate-in fade-in space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-['Montserrat'] font-black text-xs text-amber-300 uppercase tracking-wide">
                ⏳ Etapa 1: Pedido Recebido • Aguardando Chapa
              </span>
            </div>
            <p className="text-xs text-[#d4d4d4]">
              Seu pedido já foi transmitido para a cozinha. Assim que o chapeiro aceitar, o preparo começará imediatamente!
            </p>
          </div>
        )}

        {order.status === 'preparando' && (
          <div className="bg-gradient-to-r from-[#ff5722]/20 via-[#ff5722]/10 to-amber-500/10 border-2 border-[#ff5722] rounded-2xl p-4 shadow-xl shadow-[#ff5722]/10 animate-in fade-in space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722] animate-ping" />
              <span className="font-['Montserrat'] font-black text-sm text-[#ff8a65] uppercase tracking-wide">
                🔥 Etapa 2: Pedido Aceito! Burger na Chapa
              </span>
            </div>
            <p className="text-xs text-white font-medium">
              O chapeiro já aceitou seu pedido e iniciou o preparo dos seus lanches artesanais na chapa.
            </p>
          </div>
        )}

        {order.status === 'pronto' && (
          <div className="bg-sky-950/50 border-2 border-sky-500/60 rounded-2xl p-4 shadow-xl animate-in fade-in space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <span className="font-['Montserrat'] font-black text-sm text-sky-300 uppercase tracking-wide">
                ✨ Etapa 3: Pedido Pronto & Embalado!
              </span>
            </div>
            <p className="text-xs text-white font-medium">
              Seus lanches acabaram de ser finalizados na chapa e estão devidamente embalados na bag térmica, prontos para saída!
            </p>
          </div>
        )}

        {order.status === 'em_entrega' && (
          <div className="bg-blue-950/50 border-2 border-[#019ad8] rounded-2xl p-4 shadow-xl animate-in fade-in space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#019ad8] animate-ping" />
              <span className="font-['Montserrat'] font-black text-sm text-[#86cfff] uppercase tracking-wide">
                🛵 Etapa 4: Pedido em Rota de Entrega!
              </span>
            </div>
            <p className="text-xs text-white font-medium">
              {order.courierName
                ? `O entregador ${order.courierName} já retirou a bag e está a caminho do seu endereço.`
                : 'O entregador já está a caminho do seu endereço com sua encomenda quentinha!'}
            </p>
          </div>
        )}

        {order.status === 'entregue' && (
          <div className="bg-emerald-950/60 border-2 border-emerald-500/70 rounded-2xl p-4 shadow-xl animate-in fade-in space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-['Montserrat'] font-black text-sm text-emerald-300 uppercase tracking-wide">
                🎉 Etapa 5: Pedido Entregue com Sucesso!
              </span>
            </div>
            <p className="text-xs text-white font-medium">
              Agradecemos a sua preferência pelo Burguer dos Crias! Bom apetite!
            </p>
          </div>
        )}

        {order.status === 'recusado' && (
          <div className="bg-red-950/60 border-2 border-red-500/80 rounded-2xl p-4 shadow-xl animate-in fade-in space-y-1.5">
            <span className="font-['Montserrat'] font-black text-xs text-red-400 uppercase tracking-wide flex items-center gap-2">
              ❌ Pedido Não Pôde Ser Aceito
            </span>
            <p className="text-xs text-[#e5e2e1]">
              A cozinha não conseguiu aceitar seu pedido no momento. Entre em contato conosco via WhatsApp para mais informações.
            </p>
          </div>
        )}

        {/* Card de Alerta no WhatsApp do Gestor */}
        <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-xs block">
                  Notificação no WhatsApp do Gestor
                </span>
                <span className="text-[11px] text-emerald-300 block truncate">
                  Alerta com a ficha completa enviado para a hamburgueria
                </span>
              </div>
            </div>
            <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full shrink-0 border border-emerald-500/40">
              {storeSettings?.whatsappManagerAlert || storeSettings?.whatsappSupport || '(11) 98765-4321'}
            </span>
          </div>

          <a
            href={getManagerWhatsAppNotificationUrl(order, storeSettings)}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Reenviar Ficha do Pedido pelo WhatsApp</span>
          </a>
        </div>

        {/* Banner de Pix Automático em Espera */}
        {isPixPending && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 space-y-2 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Aguardando Confirmação do Pix...
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                Detecção Automática Ativa
              </span>
            </div>
            <p className="text-[11px] text-[#d4d4d4] leading-relaxed">
              O sistema está conectado com a rede bancária. Assim que seu banco processar o Pix de <strong>R$ {order.total.toFixed(2).replace('.', ',')}</strong>, seu pedido será liberado automaticamente sem você precisar fazer nada!
            </p>
            {/* Botão de teste para demonstração no modo sandbox */}
            {(!storeSettings?.mercadoPago?.environment || storeSettings?.mercadoPago?.environment === 'sandbox') && (
              <button
                type="button"
                onClick={async () => {
                  if (order.mercadoPagoPaymentId) {
                    await mercadoPagoApi.simulateApproval(order.mercadoPagoPaymentId);
                    if (onUpdatePaymentStatus) {
                      onUpdatePaymentStatus(order.id, 'aprovado');
                    }
                  }
                }}
                className="w-full bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-500/40 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Pagamento Instantâneo (Demonstração Teste)</span>
              </button>
            )}
          </div>
        )}

        {/* Banner se Pix foi aprovado automaticamente */}
        {order.paymentMethod?.toLowerCase().includes('pix') && order.paymentStatus === 'aprovado' && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-2.5 text-emerald-300 text-xs shadow-md animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-white block">Pagamento Pix Aprovado 100% Automaticamente!</span>
              <span className="text-[11px] text-emerald-200/90 block">Transação confirmada pelo Mercado Pago • Cozinha liberada.</span>
            </div>
          </div>
        )}

        {/* Visual Timeline / Stepper (5 Etapas: Recebido, Em Preparo, Pronto, Em Rota, Entregue) */}
        <section className="bg-[#1c1b1b] rounded-2xl p-4 sm:p-5 border border-[#353535] shadow-xl relative overflow-hidden space-y-3.5">
          {/* Header do Stepper com indicador de etapa atual */}
          <div className="flex items-center justify-between pb-2 border-b border-[#353535]/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722] animate-ping" />
              <span className="text-xs font-['Montserrat'] font-black uppercase tracking-wider text-white">
                Progresso da Entrega
              </span>
            </div>
            <span className="text-[10px] font-['Montserrat'] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30">
              Etapa {currentStepIndex + 1} de 5 • {steps[currentStepIndex].label}
            </span>
          </div>

          {/* Progress track com 5 nós */}
          <div className="relative pt-2 pb-1">
            {/* Linha de fundo cinza contínua conectando os centros dos círculos */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-[#2e2d2d] rounded-full -z-0">
              {/* Barra de preenchimento dinâmica com gradiente de chama e brilho */}
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-[#ff5722] to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(255,87,34,0.7)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 5 nós das etapas perfeitamente distribuídos */}
            <div className="flex justify-between items-start relative z-10">
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className="flex flex-col items-center group cursor-pointer focus:outline-none transition-transform active:scale-95 max-w-[60px] sm:max-w-[76px]"
                    title={`Etapa ${idx + 1}: ${step.label} - ${step.desc}`}
                  >
                    {/* Círculo do nó */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs transition-all duration-300 border-2 ${
                        isCurrent
                          ? 'bg-[#ff5722] text-white border-white shadow-[0_0_18px_rgba(255,87,34,0.8)] scale-110'
                          : isPassed
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-[#252424] text-[#8e8f8f] border-[#383838] group-hover:border-[#555]'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse text-white' : ''}`} />
                      )}
                    </div>

                    {/* Rótulo da etapa */}
                    <span
                      className={`text-[9.5px] sm:text-[11px] text-center mt-2 font-['Montserrat'] font-bold leading-tight transition-colors ${
                        isCurrent
                          ? 'text-[#ff8a65] font-black'
                          : isPassed
                          ? 'text-white'
                          : 'text-[#8e8f8f]'
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* Ponto pulsante sutil na etapa atual */}
                    {isCurrent && (
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#ff5722] animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card explicativo do status atual */}
          <div className="bg-[#242323] p-2.5 rounded-xl border border-[#353535] flex items-center justify-between text-xs">
            <span className="text-[#b4b5b5] text-[11px] truncate mr-2">
              Status: <strong className="text-white">{steps[currentStepIndex].desc}</strong>
            </span>
            <span className="text-[10px] text-[#ff8a65] font-mono font-bold shrink-0">
              {progressPercent}% Concluído
            </span>
          </div>

          <p className="text-[10px] text-center text-[#8e8f8f] italic">
            Toque nos ícones acima para simular e visualizar as 5 etapas da entrega
          </p>
        </section>

        {/* Delivery GPS Map Card */}
        <section className="relative rounded-lg overflow-hidden h-64 border border-[#353535]/50 shadow-xl group">
          <img
            src={APP_IMAGES.deliveryMap}
            alt="Mapa de Entrega GPS"
            className="w-full h-full object-cover"
          />

          {/* GPS Live Badge */}
          <div className="absolute top-3 left-3 bg-[#131313]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 flex items-center gap-2 shadow-lg z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold text-white font-['Montserrat'] flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-emerald-400" /> GPS ATIVO • Rastreamento ao Vivo
            </span>
          </div>

          {/* Map Overlay info */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center gap-3.5 bg-[#20201f]/90 backdrop-blur-md p-3 rounded-md border border-white/10 shadow-lg">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/50 flex-shrink-0">
                <img
                  src={order.courierAvatar || APP_IMAGES.driverAvatar}
                  alt={order.courierName || 'Ricardo'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="text-xs font-semibold text-white">
                  {getCourierStatus()}
                </p>
                <p className="text-[11px] text-[#b4b5b5]">
                  {order.courierVehicle
                    ? `${order.courierVehicle}${order.courierPlate ? ` • ${order.courierPlate}` : ''}`
                    : `${order.courierName || 'Ricardo'} • Entregador Oficial Burger dos Crias`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live GPS Route Action Link */}
        <div className="bg-[#182026] border border-[#019ad8]/40 rounded-xl p-3 flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#019ad8]/20 text-[#86cfff] flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-[#019ad8]" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate font-['Montserrat']">
                Trajeto GPS em Tempo Real
              </span>
              <span className="text-[11px] text-[#86cfff]/80 block truncate">
                Acompanhe o trânsito e o caminho até seu endereço
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={getGoogleMapsRouteUrl(order.address, { lat: order.latitude, lng: order.longitude })}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 bg-[#019ad8] hover:bg-[#019ad8]/90 text-white font-['Montserrat'] font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
              title="Abrir rota no Google Maps"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={getWazeRouteUrl(order.address, { lat: order.latitude, lng: order.longitude })}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 bg-[#33ccff]/20 hover:bg-[#33ccff]/30 text-[#33ccff] border border-[#33ccff]/40 font-['Montserrat'] font-bold text-xs py-2 px-2.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              title="Abrir no Waze"
            >
              <span>Waze</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <section className="space-y-3">
          <button
            onClick={onOpenChatWithDriver}
            className="w-full h-14 btn-flame text-white font-['Montserrat'] font-bold rounded-md flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Entrar em contato com o entregador</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="w-full h-14 bg-transparent border-2 border-[#353535] hover:border-[#ff5722]/40 text-[#e5e2e1] font-['Montserrat'] font-semibold rounded-md flex items-center justify-center gap-2 active:scale-98 transition-all text-sm"
          >
            <HelpCircle className="w-5 h-5 text-[#b4b5b5]" />
            <span>Preciso de ajuda</span>
          </button>
        </section>

        {/* Delivery Address & Items toggle */}
        <section className="space-y-3">
          <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff5722]/10 flex items-center justify-center text-[#ff5722] flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-[#b4b5b5]">Entregar em</p>
                <p className="text-xs font-medium text-white">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Collapsible Order items */}
          <div className="bg-[#20201f] rounded-lg p-4 border border-[#353535]/50 shadow-md">
            <button
              onClick={() => setShowItemsList(!showItemsList)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-xs font-bold text-white font-['Montserrat']">
                  Resumo do Pedido ({order.items.length} itens)
                </p>
                <p className="text-[11px] text-[#ffb5a0] mt-0.5 font-semibold">
                  Total: R$ {order.total.toFixed(2).replace('.', ',')} • {order.paymentMethod}
                </p>
                {order.mercadoPagoPaymentId ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-[#009ee3]/20 text-[#009ee3] border border-[#009ee3]/40 px-2 py-0.5 rounded-full font-bold">
                    ✓ Pago via Mercado Pago ({order.mercadoPagoPaymentId})
                  </span>
                ) : order.paymentMethod.toLowerCase().includes('pix') ? (
                  order.paymentStatus === 'aprovado' ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Pagamento Pix Confirmado pela Cozinha
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      🟡 Pix em Conferência pela Hamburgueria
                    </span>
                  )
                ) : null}
              </div>
              <ChevronRight
                className={`w-5 h-5 text-[#b4b5b5] transition-transform duration-200 ${
                  showItemsList ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showItemsList && (
              <div className="mt-3 pt-3 border-t border-[#353535] space-y-2 text-xs">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <span className="text-white font-medium">
                        {item.quantity}x {item.name}
                      </span>
                      {item.notes && (
                        <p className="text-[10px] text-[#b4b5b5] italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                    <span className="text-[#ffb5a0] font-semibold">
                      R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#353535]/40 flex justify-between text-xs text-[#b4b5b5]">
                  <span>Taxa de entrega {order.deliveryFee > 0 ? '(cobrada por bairro)' : ''}</span>
                  <span className="font-mono text-white font-semibold">R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
