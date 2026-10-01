import React, { useState } from 'react';
import { CustomerProfile, Order, StoreSettings } from '../types';
import {
  User,
  Phone,
  MapPin,
  Clock,
  Bike,
  Receipt,
  Edit2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Tag,
  Check,
  Copy,
  ChevronRight,
  ShieldCheck,
  Heart,
  MessageSquare,
  Navigation,
  RefreshCw,
  LogOut,
  Flame,
} from 'lucide-react';

interface ProfileScreenProps {
  customerProfile: CustomerProfile | null;
  orders: Order[];
  storeSettings: StoreSettings;
  onEditProfile: () => void;
  onNavigateToTracking: () => void;
  onNavigateToMenu: () => void;
  onReorder: (order: Order) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  customerProfile,
  orders,
  storeSettings,
  onEditProfile,
  onNavigateToTracking,
  onNavigateToMenu,
  onReorder,
}) => {
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Filter orders related to this customer (by phone or name) or fallback to all device orders
  const customerOrders = orders.filter(o => {
    if (!customerProfile) return true;
    const phoneMatch =
      customerProfile.phone &&
      o.customerPhone &&
      customerProfile.phone.replace(/\D/g, '') === o.customerPhone.replace(/\D/g, '');
    const nameMatch =
      customerProfile.name &&
      o.customerName &&
      o.customerName.toLowerCase().includes(customerProfile.name.toLowerCase().split(' ')[0]);
    return phoneMatch || nameMatch;
  });

  const activeOrders = customerOrders.filter(
    o => o.status === 'recebido' || o.status === 'novo' || o.status === 'preparando' || o.status === 'em_entrega'
  );

  const completedOrders = customerOrders.filter(
    o => o.status === 'entregue' || o.status === 'pronto'
  );

  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'BC';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const cleanSupportPhone = storeSettings.whatsappSupport?.replace(/\D/g, '') || '11987654321';
  const supportWaUrl = `https://wa.me/55${cleanSupportPhone}?text=${encodeURIComponent(
    `Olá! Sou o cliente ${customerProfile?.name || ''} e gostaria de tirar uma dúvida sobre o cardápio ou meu pedido no Burger dos Crias.`
  )}`;

  return (
    <div className="min-h-screen bg-[#141414] text-white pb-24 font-['Montserrat']">
      {/* Top Header */}
      <div className="bg-gradient-to-b from-[#251e1b] via-[#1c1a19] to-[#141414] border-b border-[#353535] px-4 pt-6 pb-6 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#ff8a65] flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-current text-[#ff5722]" />
              Meu Perfil • Burger dos Crias
            </span>

            <button
              onClick={onEditProfile}
              className="text-xs font-bold text-[#ffb5a0] hover:text-white bg-[#20201f] border border-[#353535] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>Editar Dados</span>
            </button>
          </div>

          {/* User Card */}
          <div className="flex items-center gap-4 bg-[#20201f]/80 backdrop-blur-md p-4 rounded-2xl border border-[#ff5722]/30 shadow-lg">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff5722] to-[#ff8a65] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20 flex-shrink-0">
              {getInitials(customerProfile?.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {customerProfile?.name || 'Cliente Amigo'}
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  VIP
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#b4b5b5] mt-1">
                <Phone className="w-3.5 h-3.5 text-[#ff5722]" />
                <span className="font-mono">{customerProfile?.phone || '(11) 98765-4321'}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8e8f8f] mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#ff8a65] flex-shrink-0" />
                <span className="truncate">
                  {customerProfile?.neighborhood || customerProfile?.address?.split(' - ')[1] || 'Centro, São Paulo - SP'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="bg-[#1a1918] p-3 rounded-xl border border-[#353535]">
              <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Pedidos</span>
              <span className="text-base font-black text-white mt-0.5 block font-mono">
                {customerOrders.length}
              </span>
            </div>

            <div className="bg-[#1a1918] p-3 rounded-xl border border-[#353535]">
              <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Total Gasto</span>
              <span className="text-base font-black text-emerald-400 mt-0.5 block font-mono">
                R$ {totalSpent.toFixed(0)}
              </span>
            </div>

            <div className="bg-[#1a1918] p-3 rounded-xl border border-[#353535]">
              <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Fidelidade</span>
              <span className="text-base font-black text-[#ff8a65] mt-0.5 block font-mono">
                {Math.min(customerOrders.length * 10, 100)} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 text-xs">
        {/* Active Order Banner if any */}
        {activeOrders.length > 0 && (
          <div className="bg-gradient-to-r from-[#2a1712] to-[#20201f] border-2 border-[#ff5722] rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722] animate-ping" />
                <span>Você tem 1 pedido em andamento!</span>
              </span>
              <span className="text-[10px] bg-[#ff5722] text-white px-2 py-0.5 rounded font-black font-mono">
                {activeOrders[0].orderNumber}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-[#b4b5b5] bg-[#141414] p-3 rounded-xl border border-[#353535]">
              <div>
                <span className="text-white font-semibold block">
                  Status: <strong className="text-amber-400 uppercase">{activeOrders[0].status}</strong>
                </span>
                <span className="text-[11px] text-[#8e8f8f]">
                  Total: R$ {activeOrders[0].total.toFixed(2).replace('.', ',')} • {activeOrders[0].paymentMethod}
                </span>
              </div>

              <button
                type="button"
                onClick={onNavigateToTracking}
                className="btn-flame text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Bike className="w-4 h-4" />
                <span>Rastrear</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Endereço Padrão de Entrega */}
        <section className="bg-[#20201f] rounded-2xl p-4 border border-[#353535] space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#353535]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff5722]" />
              <span>Endereço de Entrega Cadastrado</span>
            </h3>
            <button
              onClick={onEditProfile}
              className="text-[#ff8a65] hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              <span>Alterar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  {customerProfile?.street || customerProfile?.address?.split(' - ')[0] || 'Rua das Flores'}
                  {customerProfile?.number ? `, ${customerProfile.number}` : ', 123'}
                </span>
                <span className="text-[11px] text-[#b4b5b5] block mt-0.5">
                  {customerProfile?.neighborhood || customerProfile?.address?.split(' - ')[1] || 'Centro'}, {customerProfile?.city || 'São Paulo - SP'}
                </span>
                {customerProfile?.cep && (
                  <span className="text-[10px] text-[#8e8f8f] font-mono block mt-0.5">
                    CEP: {customerProfile.cep}
                  </span>
                )}
                {customerProfile?.reference && (
                  <span className="text-[10px] text-amber-400 block mt-1 italic">
                    Ponto de Referência: "{customerProfile.reference}"
                  </span>
                )}
              </div>

              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold uppercase">
                Padrão
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Cupons de Desconto Disponíveis */}
        <section className="bg-[#20201f] rounded-2xl p-4 border border-[#353535] space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#353535]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Meus Cupons de Desconto</span>
            </h3>
            <span className="text-[10px] text-[#8e8f8f]">Disponíveis para usar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-[#181818] p-3 rounded-xl border border-dashed border-[#ff5722]/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-[#ff5722]">CRIAS10</span>
                  <span className="text-[9px] bg-[#ff5722]/20 text-[#ff8a65] px-1.5 py-0.2 rounded font-bold">10% OFF</span>
                </div>
                <span className="text-[10px] text-[#8e8f8f] block mt-0.5">Válido em todo o cardápio</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCoupon('CRIAS10')}
                className="bg-[#252525] hover:bg-[#333] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                {copiedCoupon === 'CRIAS10' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCoupon === 'CRIAS10' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <div className="bg-[#181818] p-3 rounded-xl border border-dashed border-amber-500/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-amber-400">FOGO20</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">20% OFF</span>
                </div>
                <span className="text-[10px] text-[#8e8f8f] block mt-0.5">Válido no primeiro pedido</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCoupon('FOGO20')}
                className="bg-[#252525] hover:bg-[#333] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                {copiedCoupon === 'FOGO20' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCoupon === 'FOGO20' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Histórico de Pedidos Anteriores */}
        <section className="bg-[#20201f] rounded-2xl p-4 border border-[#353535] space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#353535]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#ff5722]" />
              <span>Histórico de Pedidos</span>
            </h3>
            <span className="text-[11px] text-[#8e8f8f]">
              {customerOrders.length} pedido(s)
            </span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="text-center py-8 space-y-3 bg-[#181818] rounded-xl border border-[#353535]">
              <div className="w-12 h-12 rounded-full bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-bold text-white text-sm">Você ainda não fez nenhum pedido</p>
              <p className="text-[11px] text-[#b4b5b5] max-w-xs mx-auto">
                Explore nosso cardápio com os melhores burgers artesanais e pizzas da quebrada!
              </p>
              <button
                type="button"
                onClick={onNavigateToMenu}
                className="btn-flame text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md"
              >
                Explorar Cardápio
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {customerOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-[9px] bg-[#ff5722]/20 text-[#ff8a65] px-1.5 py-0.2 rounded font-bold uppercase">
                        {order.type}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        order.status === 'entregue'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : order.status === 'recusado'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="text-[11px] text-[#b4b5b5] space-y-0.5 border-t border-[#353535]/50 pt-1.5">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-white">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-[10px] text-[#8e8f8f] italic block">
                        + {order.items.length - 3} outros itens...
                      </span>
                    )}
                  </div>

                  {/* Footer with total and reorder button */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#353535]/50">
                    <div>
                      <span className="text-[10px] text-[#8e8f8f] block">Total Pago:</span>
                      <span className="font-mono font-bold text-white text-xs">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReorder(order)}
                      className="bg-[#252525] hover:bg-[#333] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Pedir Novamente</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Atendimento & Informações da Loja */}
        <section className="bg-[#20201f] rounded-2xl p-4 border border-[#353535] space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#353535]">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Suporte da Hamburgueria</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded">
              Online
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#181818] rounded-xl border border-[#353535]">
              <div>
                <span className="text-white font-bold block">WhatsApp Oficial de Atendimento</span>
                <span className="text-[11px] text-[#b4b5b5]">{storeSettings.whatsappSupport}</span>
              </div>
              <a
                href={supportWaUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Falar Agora
              </a>
            </div>

            <div className="p-2.5 bg-[#181818] rounded-xl border border-[#353535] text-[11px] text-[#b4b5b5] space-y-1">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <Clock className="w-3.5 h-3.5 text-[#ff5722]" />
                <span>Horário de Funcionamento:</span>
              </div>
              <p>{storeSettings.openingHours || 'Terça a Domingo, 18h - 00h'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
