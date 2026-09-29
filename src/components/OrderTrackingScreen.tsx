import React, { useState } from 'react';
import { Order } from '../types';
import { APP_IMAGES } from '../data/mockData';
import { ArrowLeft, MessageSquare, Flame, Bike, Check, CheckCircle2, MapPin, ChevronRight, HelpCircle, Navigation } from 'lucide-react';

interface OrderTrackingScreenProps {
  order: Order;
  onBack: () => void;
  onOpenChatWithDriver: () => void;
  onOpenHelp: () => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  order,
  onBack,
  onOpenChatWithDriver,
  onOpenHelp,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1); // 0: Recebido, 1: Preparo, 2: Entrega, 3: Entregue
  const [showItemsList, setShowItemsList] = useState(false);

  const steps = [
    { label: 'Pedido\nRecebido', icon: Check },
    { label: 'Em\nPreparo', icon: Flame },
    { label: 'Saiu para\nEntrega', icon: Bike },
    { label: 'Pedido\nEntregue', icon: CheckCircle2 },
  ];

  const getStatusText = () => {
    switch (currentStepIndex) {
      case 0:
        return 'PEDIDO RECEBIDO';
      case 1:
        return 'EM PREPARO';
      case 2:
        return 'SAIU PARA ENTREGA';
      case 3:
        return 'ENTREGUE';
      default:
        return 'EM PREPARO';
    }
  };

  const courierFirstName = (order.courierName || 'Ricardo').split(' ')[0];

  const getCourierStatus = () => {
    switch (currentStepIndex) {
      case 0:
        return 'A cozinha já confirmou seu pedido';
      case 1:
        return `${courierFirstName} está acompanhando o preparo`;
      case 2:
        return `${courierFirstName} está a caminho do seu endereço`;
      case 3:
        return 'Pedido entregue com sucesso!';
      default:
        return `${courierFirstName} está com seu pedido`;
    }
  };

  const progressPercent = (currentStepIndex / (steps.length - 1)) * 100;

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
          <p className="text-xs text-[#b4b5b5]">
            Previsão de entrega:{' '}
            <span className="text-white font-bold font-['Montserrat']">
              20-30 min
            </span>
          </p>
        </section>

        {/* Visual Timeline / Stepper */}
        <section className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 shadow-lg relative overflow-hidden">
          {/* Progress track */}
          <div className="relative mb-3">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#353535] -z-0">
              <div
                className="h-full bg-[#ff5722] transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,87,34,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step icons */}
            <div className="flex justify-between relative z-10">
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className="flex flex-col items-center group cursor-pointer"
                    title={`Avançar para etapa: ${step.label.replace('\n', ' ')}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#ff5722] text-white shadow-[0_0_16px_rgba(255,87,34,0.6)] animate-flame-pulse'
                          : isPassed
                          ? 'bg-[#ff5722] text-white'
                          : 'bg-[#353535] text-[#b4b5b5]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] text-center mt-2 leading-tight font-medium ${
                        isCurrent
                          ? 'text-[#ff5722] font-bold'
                          : isPassed
                          ? 'text-white'
                          : 'text-[#b4b5b5]'
                      }`}
                    >
                      {step.label.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i === 0 && <br />}
                        </React.Fragment>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-center text-[#b4b5b5] mt-1 italic">
            Toque nos ícones acima para simular as etapas da entrega
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
                {order.mercadoPagoPaymentId && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-[#009ee3]/20 text-[#009ee3] border border-[#009ee3]/40 px-2 py-0.5 rounded-full font-bold">
                    ✓ Pago via Mercado Pago ({order.mercadoPagoPaymentId})
                  </span>
                )}
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
                  <span>Taxa de entrega</span>
                  <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
