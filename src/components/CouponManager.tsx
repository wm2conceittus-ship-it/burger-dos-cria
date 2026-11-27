import React, { useState, useMemo } from 'react';
import { StoreSettings, Coupon, Order } from '../types';
import { Ticket, Plus, Tag, Check, X, Trash2, Edit2, Copy, Share2, Bike, Percent, DollarSign, Users, Smartphone, MessageSquare } from 'lucide-react';

interface CouponManagerProps {
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
  orders?: Order[];
}

export const CouponManager: React.FC<CouponManagerProps> = ({
  storeSettings,
  onUpdateStoreSettings,
  orders = [],
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // WhatsApp Broadcast Modal State
  const [broadcastCoupon, setBroadcastCoupon] = useState<Coupon | null>(null);
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState<'all' | 'recurring' | 'new'>('recurring');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Agrega clientes a partir dos pedidos
  const aggregatedCustomers = useMemo(() => {
    const map = new Map<string, { customerName: string; customerPhone: string; totalOrders: number; totalSpent: number }>();
    (orders || []).forEach(o => {
      if (!o.customerPhone) return;
      const cleanPhone = o.customerPhone.replace(/\D/g, '');
      if (!cleanPhone) return;
      const existing = map.get(cleanPhone) || {
        customerName: o.customerName || 'Cliente',
        customerPhone: o.customerPhone,
        totalOrders: 0,
        totalSpent: 0,
      };
      existing.totalOrders += 1;
      existing.totalSpent += (o.total || 0);
      map.set(cleanPhone, existing);
    });
    return Array.from(map.values());
  }, [orders]);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('10');
    setMinOrderValue('');
    setShowModal(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(String(coupon.discountValue));
    setMinOrderValue(coupon.minOrderValue ? String(coupon.minOrderValue) : '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      alert('Por favor, informe o código do cupom (ex: CRIAS10).');
      return;
    }

    const currentCoupons = storeSettings.coupons || [];
    const parsedVal = parseFloat(discountValue) || 0;
    const parsedMin = parseFloat(minOrderValue) || 0;

    let updatedCoupons: Coupon[];
    if (editingCoupon) {
      updatedCoupons = currentCoupons.map(c =>
        c.id === editingCoupon.id
          ? {
              ...c,
              code: cleanCode,
              description: description.trim() || undefined,
              discountType,
              discountValue: discountType === 'free_shipping' ? 0 : parsedVal,
              minOrderValue: parsedMin > 0 ? parsedMin : undefined,
            }
          : c
      );
      setToast(`Cupom "${cleanCode}" atualizado com sucesso!`);
    } else {
      if (currentCoupons.some(c => c.code.toUpperCase() === cleanCode)) {
        alert(`Já existe um cupom com o código "${cleanCode}". Escolha outro código.`);
        return;
      }
      const newCoupon: Coupon = {
        id: `coup-${Date.now()}`,
        code: cleanCode,
        description: description.trim() || undefined,
        discountType,
        discountValue: discountType === 'free_shipping' ? 0 : parsedVal,
        minOrderValue: parsedMin > 0 ? parsedMin : undefined,
        active: true,
        usageCount: 0,
      };
      updatedCoupons = [newCoupon, ...currentCoupons];
      setToast(`Cupom "${cleanCode}" criado com sucesso! 🔥`);
    }

    onUpdateStoreSettings({
      ...storeSettings,
      coupons: updatedCoupons,
    });

    setShowModal(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleActive = (couponId: string) => {
    const currentCoupons = storeSettings.coupons || [];
    const updated = currentCoupons.map(c =>
      c.id === couponId ? { ...c, active: !c.active } : c
    );
    onUpdateStoreSettings({
      ...storeSettings,
      coupons: updated,
    });
    setToast('Status do cupom atualizado!');
    setTimeout(() => setToast(null), 2500);
  };

  const handleDelete = (couponId: string, couponCode: string) => {
    if (!window.confirm(`Deseja realmente excluir o cupom "${couponCode}"?`)) return;
    const currentCoupons = storeSettings.coupons || [];
    const updated = currentCoupons.filter(c => c.id !== couponId);
    onUpdateStoreSettings({
      ...storeSettings,
      coupons: updated,
    });
    setToast(`Cupom "${couponCode}" excluído.`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleOpenBroadcast = (coupon: Coupon) => {
    setBroadcastCoupon(coupon);
    setBroadcastMessage(
      `Olá {nome}! 🍔🔥 Passando para presentear você com um cupom especial de desconto em nosso cardápio: *${coupon.code}* (${coupon.description || 'Desconto imperdível'}). Peça já o seu!`
    );
  };

  const handleExecuteBroadcast = () => {
    if (!broadcastCoupon) return;
    const targetList = aggregatedCustomers.filter(c => {
      if (!c.customerPhone) return false;
      if (broadcastTargetGroup === 'recurring') return c.totalOrders > 1;
      if (broadcastTargetGroup === 'new') return c.totalOrders === 1;
      return true;
    });

    if (targetList.length === 0) {
      alert('Nenhum cliente com telefone válido encontrado no grupo selecionado.');
      return;
    }

    const firstClient = targetList[0];
    const personalizedText = broadcastMessage.replace('{nome}', firstClient.customerName);
    const cleanPhone = firstClient.customerPhone.replace(/\D/g, '');
    const phoneWith55 = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const waUrl = `https://wa.me/${phoneWith55}?text=${encodeURIComponent(personalizedText)}`;
    window.open(waUrl, '_blank');
    setBroadcastCoupon(null);
    setToast(`Campanha iniciada! Abrindo WhatsApp para ${firstClient.customerName} (${targetList.length} clientes na base).`);
    setTimeout(() => setToast(null), 4000);
  };

  const coupons = storeSettings.coupons || [];

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Card (White) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5722] flex items-center justify-center shadow-inner">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-['Montserrat'] font-bold text-lg text-gray-900 flex items-center gap-2">
              <span>Gerenciamento de Cupons</span>
              <span className="text-[10px] bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-bold">
                {coupons.filter(c => c.active).length} ativos
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Adicione, edite, pause e dispare cupons via WhatsApp integrados com a base de clientes do Firestore.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#ff5722] hover:bg-[#f4511e] text-white rounded-xl text-xs font-bold font-['Montserrat'] shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cupom</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 space-y-2 shadow-sm">
            <Ticket className="w-8 h-8 text-[#ff5722] mx-auto opacity-50" />
            <p className="font-bold text-gray-900 text-sm">Nenhum cupom cadastrado</p>
            <p className="text-xs">Clique em "Novo Cupom" para começar a criar suas promoções.</p>
          </div>
        ) : (
          coupons.map(coupon => {
            const discountBadge =
              coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% OFF`
                : coupon.discountType === 'fixed'
                ? `R$ ${coupon.discountValue.toFixed(2)} OFF`
                : 'Frete Grátis';

            return (
              <div
                key={coupon.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm hover:border-[#ff5722]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      {discountBadge}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {coupon.description || 'Desconto aplicado diretamente no checkout.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                      <span className="block text-amber-700 font-medium text-[11px]">
                        Mín: R$ {coupon.minOrderValue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="block text-gray-500 text-[11px]">Sem valor mínimo</span>
                    )}
                    <span className="block text-[10px] text-gray-400">
                      {coupon.usageCount || 0} pedido(s) usaram
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenBroadcast(coupon)}
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                      title="Disparar este cupom via WhatsApp para os clientes"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
                      title="Editar cupom"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(coupon.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        coupon.active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                      title="Ativar ou pausar cupom"
                    >
                      {coupon.active ? 'Ativo' : 'Pausado'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      className="p-1.5 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg border border-gray-200 transition-colors"
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

      {/* Add / Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-gray-900"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-100 text-[#ff5722] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </span>
                <h3 className="font-['Montserrat'] font-bold text-base text-gray-900">
                  {editingCoupon ? 'Editar Cupom de Desconto' : 'Cadastrar Novo Cupom de Desconto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: CRIAS10, FOGO20"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-mono font-bold uppercase focus:outline-none focus:border-[#ff5722]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Sem espaços. O cliente digitará esse código no carrinho.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-medium focus:outline-none focus:border-[#ff5722]"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                    <option value="free_shipping">Frete Grátis</option>
                  </select>
                </div>

                {discountType !== 'free_shipping' ? (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Valor do Desconto *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        step="0.5"
                        min="1"
                        value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '10' : '15.00'}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-mono font-bold focus:outline-none focus:border-[#ff5722]"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-gray-500">
                        {discountType === 'percentage' ? '%' : 'R$'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Benefício
                    </label>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-xl font-bold flex items-center gap-1">
                      <Bike className="w-4 h-4" />
                      <span>Frete Grátis 100%</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Descrição / Regra (Exibida para o cliente)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: 10% de desconto em todo o pedido"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Pedido Mínimo (R$) - Opcional
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={minOrderValue}
                  onChange={e => setMinOrderValue(e.target.value)}
                  placeholder="0 (Sem pedido mínimo)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-mono focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 border border-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-flame text-white px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Cupom</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WhatsApp Broadcast Modal for Specific Coupon */}
      {broadcastCoupon && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-base text-gray-900">
                    Disparar Cupom "{broadcastCoupon.code}" via WhatsApp
                  </h3>
                  <p className="text-[11px] text-gray-500">Envie esta oferta diretamente para sua base de clientes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastCoupon(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Público-Alvo da Campanha</label>
                <select
                  value={broadcastTargetGroup}
                  onChange={e => setBroadcastTargetGroup(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 font-medium focus:outline-none focus:border-[#ff5722]"
                >
                  <option value="recurring">Clientes Recorrentes ({aggregatedCustomers.filter(c => c.totalOrders > 1).length} clientes)</option>
                  <option value="new">Clientes de 1ª Compra ({aggregatedCustomers.filter(c => c.totalOrders === 1).length} clientes)</option>
                  <option value="all">Todos os Clientes da Base ({aggregatedCustomers.length} clientes)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-gray-700">Mensagem da Promoção</label>
                  <span className="text-[10px] text-gray-400">Use {'{nome}'} para personalizar</span>
                </div>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 font-medium focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 space-y-1">
                <span className="font-bold block">📲 Disparo Inteligente:</span>
                <p className="text-[11px] leading-relaxed">
                  O sistema abrirá o WhatsApp com a mensagem personalizada contendo o cupom <strong>{broadcastCoupon.code}</strong> para os clientes do grupo selecionado.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setBroadcastCoupon(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 border border-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-['Montserrat'] shadow-md flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Disparar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
