import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Phone,
  MessageSquare,
  DollarSign,
  UtensilsCrossed,
  FileText,
  User,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { Order, StoreSettings, Product } from '../types';

interface PixRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products: Product[];
  storeSettings: StoreSettings;
  onUpdatePaymentStatus?: (orderId: string, status: 'pendente' | 'aprovado' | 'recusado') => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: any) => void;
  onAddOrder?: (newOrder: Order) => void;
  onOpenOrderDetails?: (order: Order) => void;
}

export const PixRecoveryModal: React.FC<PixRecoveryModalProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  storeSettings,
  onUpdatePaymentStatus,
  onUpdateOrderStatus,
  onAddOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'create' | 'help'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'pendentes' | 'aprovados'>('todos');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Form para Lançar Pedido do Pix Recebido
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [orderTotal, setOrderTotal] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderType, setOrderType] = useState<'Delivery' | 'Retirada' | 'Mesa'>('Delivery');

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filtra pedidos que são PIX ou têm pendência de pagamento
  const pixOrders = useMemo(() => {
    return orders.filter(o => {
      const isPix = Boolean(o.paymentMethod && o.paymentMethod.toLowerCase().includes('pix'));
      const matchesSearch = searchQuery.trim()
        ? (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.customerPhone || '').includes(searchQuery) ||
          (o.orderNumber || '').includes(searchQuery) ||
          (o.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(o.total || '').includes(searchQuery)
        : true;

      if (!matchesSearch) return false;

      if (filterType === 'pendentes') {
        return o.paymentStatus !== 'aprovado';
      }
      if (filterType === 'aprovados') {
        return o.paymentStatus === 'aprovado';
      }

      return isPix || Boolean(o.mercadoPagoPaymentId);
    });
  }, [orders, searchQuery, filterType]);

  const handleApprovePix = (orderId: string, orderNumber: string) => {
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(orderId, 'aprovado');
    }
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, 'preparando');
    }
    showToast(`✅ Pix do Pedido ${orderNumber} confirmado! Pedido movido para Em Preparo.`);
  };

  const handleMoveToPreparing = (orderId: string, orderNumber: string) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, 'preparando');
    }
    showToast(`🔥 Pedido ${orderNumber} movido para a Chapa (Em Preparo)!`);
  };

  const handleCreatePixOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    const val = parseFloat(orderTotal.replace(',', '.')) || 0;
    if (val <= 0) {
      alert('Por favor, informe o valor pago via Pix.');
      return;
    }

    const selectedProd = products.find(p => p.id === selectedProductId);
    const orderItems = selectedProd
      ? [{ name: selectedProd.name, quantity: 1, price: val, notes: orderNotes || undefined }]
      : [{ name: orderNotes.trim() || 'Itens combinados via Pix / WhatsApp', quantity: 1, price: val }];

    const newOrderNum = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNum,
      customerName: clientName.trim(),
      customerPhone: clientPhone.trim() || undefined,
      type: orderType,
      status: 'preparando',
      timeAgo: 'Resgatado pelo gestor • Pix Já Recebido',
      address: orderType === 'Delivery' ? clientAddress.trim() || 'Endereço a confirmar no WhatsApp' : 'Retirada no Balcão',
      paymentMethod: 'Pix (Confirmado no Banco)',
      paymentStatus: 'aprovado',
      items: orderItems,
      subtotal: val,
      deliveryFee: 0,
      total: val,
      notes: orderNotes.trim() || 'Pedido criado após confirmação do Pix no banco',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderDate: new Date().toLocaleDateString('pt-BR'),
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
      showToast(`🔥 Pedido ${newOrderNum} criado com sucesso e enviado para a chapa!`);
      // Limpa formulário
      setClientName('');
      setClientPhone('');
      setClientAddress('');
      setOrderTotal('');
      setOrderNotes('');
      setActiveTab('orders');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-lg w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353535] flex items-center justify-between bg-[#171616]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Montserrat'] font-black text-base sm:text-lg text-white">
                Central de Conferência Pix & Resgate
              </h2>
              <p className="text-[11px] text-[#b4b5b5]">
                Localize pedidos pagos no Pix, aprove transferências e garanta que nenhuma comanda fique de fora da chapa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8e8f8f] hover:text-white rounded-full hover:bg-[#252525] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notifier */}
        {feedbackToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in">
            {feedbackToast}
          </div>
        )}

        {/* Abas */}
        <div className="flex border-b border-[#353535] bg-[#141414] px-4 pt-2 gap-2 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 px-3 text-xs font-['Montserrat'] font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8e8f8f] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pedidos Pix Registrados ({orders.filter(o => o.paymentMethod?.toLowerCase().includes('pix')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-['Montserrat'] font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8e8f8f] hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Pedido do Pix Recebido</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`pb-2.5 px-3 text-xs font-['Montserrat'] font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'help'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8e8f8f] hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Por que o Pix não apareceu?</span>
          </button>
        </div>

        {/* Conteúdo da Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Barra de Pesquisa e Filtros */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8e8f8f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome do cliente, telefone, valor ou #número..."
                    className="w-full bg-[#141414] border border-[#353535] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#777] focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8e8f8f] hover:text-white"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(['todos', 'pendentes', 'aprovados'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilterType(f)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                        filterType === f
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#252525] text-[#b4b5b5] hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Pedidos Pix */}
              {pixOrders.length === 0 ? (
                <div className="text-center py-10 bg-[#151515] rounded-xl border border-[#2a2a2a] space-y-2">
                  <p className="text-xs text-[#b4b5b5]">
                    Nenhum pedido Pix encontrado com esses filtros.
                  </p>
                  <p className="text-[11px] text-[#777]">
                    Se o cliente fez o Pix e o pedido não foi enviado pelo celular dele, use a aba <strong>"Lançar Pedido do Pix Recebido"</strong> para colocar a comanda na chapa imediatamente!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pixOrders.map(order => {
                    const isApproved = order.paymentStatus === 'aprovado';
                    const isNovo = order.status === 'novo' || order.status === 'recebido';
                    const isPreparando = order.status === 'preparando';
                    const isPronto = order.status === 'pronto';
                    const isEmEntrega = order.status === 'em_entrega';
                    const isEntregue = order.status === 'entregue';
                    const isRecusado = order.status === 'recusado';

                    const statusBadgeText = isNovo
                      ? 'Em Novos 🆕'
                      : isPreparando
                      ? 'Na Chapa (Preparando) 🍳'
                      : isPronto
                      ? 'Pronto para Entrega 📦'
                      : isEmEntrega
                      ? 'Em Rota de Entrega 🛵'
                      : isEntregue
                      ? 'Finalizado (Entregue) ✅'
                      : 'Recusado / Cancelado ❌';

                    return (
                      <div
                        key={order.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          !isApproved
                            ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                            : 'bg-[#20201f] border-[#353535] hover:border-[#444]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#333]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-['Montserrat'] font-black text-sm text-white">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {order.customerName}
                            </span>
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-mono flex items-center gap-1 hover:underline"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                {order.customerPhone}
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-sm text-white">
                              R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {isApproved ? '✓ Pix Aprovado' : '🟡 Pix Pendente'}
                            </span>
                          </div>
                        </div>

                        {/* Detalhes e Itens */}
                        <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="space-y-1 min-w-0">
                            <div className="text-[11px] text-[#b4b5b5] truncate">
                              <strong>Itens:</strong> {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Nenhum item listado'}
                            </div>
                            <div className="text-[10px] text-[#8e8f8f] flex items-center gap-2">
                              <span>Horário: {order.createdAt || 'Hoje'}</span>
                              <span>•</span>
                              <span>Local: {order.type} {order.tableNumber ? `(Mesa ${order.tableNumber})` : ''}</span>
                              <span>•</span>
                              <span className="text-sky-300 font-medium">Status KDS: {statusBadgeText}</span>
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => handleApprovePix(order.id, order.orderNumber)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                                title="Marcar Pix como pago e enviar para a chapa"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Aprovar Pix no Banco</span>
                              </button>
                            )}

                            {(isEntregue || isRecusado) && (
                              <button
                                type="button"
                                onClick={() => handleMoveToPreparing(order.id, order.orderNumber)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#353535] text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="Mover pedido de volta para a chapa"
                              >
                                <UtensilsCrossed className="w-3 h-3" />
                                <span>Mover para Chapa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreatePixOrder} className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  O banco recebeu o Pix e o cliente não conseguiu concluir pelo app?
                </span>
                <p className="text-[11px] text-[#b4b5b5] leading-relaxed">
                  Lance a comanda aqui em segundos. O pedido entrará direto na chapa com status <strong>"Aprovado"</strong> e será contabilizado nas finanças do dia sem travas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    WhatsApp do Cliente (com DDD)
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="Ex: 88992176318"
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    Valor Pago via Pix (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderTotal}
                    onChange={e => setOrderTotal(e.target.value)}
                    placeholder="Ex: 42,00"
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    Tipo de Entrega
                  </label>
                  <select
                    value={orderType}
                    onChange={e => setOrderType(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Delivery">Delivery (Entrega)</option>
                    <option value="Retirada">Retirada no Balcão</option>
                    <option value="Mesa">Mesa / Salão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    Vincular Produto Principal (Opcional)
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Nenhum (Digitar observação)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (R$ {p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {orderType === 'Delivery' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                    Endereço de Entrega
                  </label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    placeholder="Rua, número, bairro e ponto de referência"
                    className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#b4b5b5] mb-1">
                  Itens e Observações do Pedido
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Ex: 1x Cria Caramelizado + Batata + 1x Pepsi 1L. Sem cebola."
                  className="w-full bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#353535]">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#b4b5b5] hover:text-white bg-[#252525]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-['Montserrat'] font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Lançar Comanda Direto na Chapa (Já Pago)</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'help' && (
            <div className="space-y-3.5 text-xs text-[#b4b5b5] leading-relaxed">
              <div className="bg-[#141414] p-4 rounded-xl border border-[#353535] space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Por que isso acontece em pagamentos Pix?
                </h4>
                <p>
                  Quando um cliente seleciona Pix no celular, o app gera o QR Code / código Copia e Cola. O cliente então <strong>sai do navegador</strong> e abre o aplicativo do banco dele (Nubank, Caixa, Inter, etc.).
                </p>
                <p>
                  Ao confirmar o pagamento no banco, o banco transfere o dinheiro na hora. Porém:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#ccc]">
                  <li>
                    <strong>O cliente fechou a aba do navegador:</strong> Muitos clientes acham que, após o banco confirmar, não precisam mais voltar ao site da hamburgueria e fecham a página antes do pedido ser enviado.
                  </li>
                  <li>
                    <strong>O pedido foi aceito automaticamente:</strong> Se a opção <em>"Aceitar Pedidos Automaticamente"</em> estiver ativa nas configurações, o pedido pula direto para a coluna <strong>"Em Preparo" (Chapa)</strong>, e não para "Novos".
                  </li>
                  <li>
                    <strong>O pedido foi finalizado:</strong> Se o pedido foi marcado como concluído, ele fica guardado no <strong>Histórico</strong> do gestor.
                  </li>
                </ul>
              </div>

              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 space-y-2 text-emerald-200">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Como o sistema te protege agora:
                </h4>
                <p className="text-[11px]">
                  1. O botão <strong>"Já fiz o Pix no meu banco"</strong> foi adicionado no checkout para o cliente concluir imediatamente assim que volta do banco.
                </p>
                <p className="text-[11px]">
                  2. O sistema detecta o retorno do cliente à tela e dispara a verificação bancária na hora.
                </p>
                <p className="text-[11px]">
                  3. Você tem a ferramenta <strong>"Lançar Pedido do Pix Recebido"</strong> (nesta mesma janela) para cadastrar qualquer comanda cujo Pix caiu na sua conta sem deixar o cliente esperando!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
