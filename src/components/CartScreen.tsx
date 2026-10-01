import React, { useState, useEffect } from 'react';
import { CartItem, StoreSettings, CustomerProfile } from '../types';
import { APP_IMAGES } from '../data/mockData';
import { generatePixPayload, getPixQrCodeUrl } from '../utils/pixPayload';
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  MapPin,
  CheckCircle,
  CreditCard,
  Banknote,
  ArrowRight,
  MessageSquare,
  Tag,
  Navigation,
  Copy,
  Check,
  Wallet,
  Sparkles,
  PlusCircle,
  QrCode,
  Clock,
  User,
  UserCheck,
  UserPlus,
  Phone,
  AlertTriangle,
} from 'lucide-react';

interface CartScreenProps {
  items: CartItem[];
  deliveryAddress: string;
  customerProfile?: CustomerProfile | null;
  onOpenCustomerRegister?: () => void;
  storeSettings?: StoreSettings;
  onUpdateStoreSettings?: (newSettings: StoreSettings) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onBack: () => void;
  onOpenAddressModal: () => void;
  onOpenChat: () => void;
  onCheckout: (
    paymentMethod: string,
    discountAmount: number,
    changeFor?: string,
    mercadoPagoPaymentId?: string
  ) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  items,
  deliveryAddress,
  customerProfile,
  onOpenCustomerRegister,
  storeSettings,
  onUpdateStoreSettings,
  onUpdateQuantity,
  onRemoveItem,
  onBack,
  onOpenAddressModal,
  onOpenChat,
  onCheckout,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [fixedDiscount, setFixedDiscount] = useState<number>(0);
  const [isFreeShippingCoupon, setIsFreeShippingCoupon] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string>('');
  const [appliedCouponName, setAppliedCouponName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix');
  const [changeFor, setChangeFor] = useState<string>('');
  const [hasCopiedPix, setHasCopiedPix] = useState(false);

  // New Payment Method modal/input state
  const [showAddMethodInput, setShowAddMethodInput] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');

  // List of active payment methods from store settings or defaults (excluding Mercado Pago cards as requested)
  const activeMethods = (storeSettings?.acceptedPaymentMethods || [
    'Pix',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Dinheiro',
    'Vale Refeição (VR / Sodexo / Alelo)',
  ]).filter(m => !m.toLowerCase().includes('mercado pago'));

  const handleAddPaymentMethod = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMethodName.trim();
    if (!trimmed) return;

    if (!activeMethods.includes(trimmed)) {
      const updated = [...activeMethods, trimmed];
      if (storeSettings && onUpdateStoreSettings) {
        onUpdateStoreSettings({
          ...storeSettings,
          acceptedPaymentMethods: updated,
        });
      }
    }
    setPaymentMethod(trimmed);
    setNewMethodName('');
    setShowAddMethodInput(false);
  };

  const handleCopyPix = () => {
    const pixKey = storeSettings?.pixKey || '11987654321';
    navigator.clipboard.writeText(pixKey);
    setHasCopiedPix(true);
    setTimeout(() => setHasCopiedPix(false), 2500);
  };

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);

  // Dynamic delivery fee calculation based on store deliveryArea zones and rules
  const addrLower = (deliveryAddress || '').toLowerCase();
  const radiusLimit = storeSettings?.deliveryArea?.radiusKm || 7;
  const matchedZone = storeSettings?.deliveryArea?.zones?.find(
    z => z.active && addrLower.includes(z.name.toLowerCase())
  );

  const isOutsideRadius = Boolean(
    matchedZone && matchedZone.distanceKm && matchedZone.distanceKm > radiusLimit
  );

  const baseDeliveryFee = matchedZone
    ? matchedZone.fee
    : (storeSettings?.defaultDeliveryFee ?? 7.00);

  const isFreeDelivery = Boolean(
    storeSettings?.deliveryArea?.freeDeliveryThreshold &&
    storeSettings.deliveryArea.freeDeliveryThreshold > 0 &&
    subtotal >= storeSettings.deliveryArea.freeDeliveryThreshold
  );

  const isPickup = addrLower.includes('retirada no balcão') || addrLower.includes('retirada na loja');
  const rawDeliveryFee = items.length > 0 && !isPickup ? (isFreeDelivery ? 0.00 : baseDeliveryFee) : 0.00;
  const deliveryFee = isFreeShippingCoupon ? 0.00 : rawDeliveryFee;
  const discountAmount = (subtotal * discountPercent) + fixedDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Pix QR Code and EMV Payload State
  const [hasCopiedPixCode, setHasCopiedPixCode] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (paymentMethod !== 'Pix') return;
    const interval = setInterval(() => {
      setPixTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pixPayload = generatePixPayload({
    pixKey: storeSettings?.pixKey || '11987654321',
    merchantName: storeSettings?.storeName || 'BURGER DOS CRIAS',
    merchantCity: 'SAO PAULO',
    amount: total,
    txid: 'P' + Math.floor(100000 + Math.random() * 900000),
  });

  const pixQrCodeUrl = getPixQrCodeUrl(pixPayload, 260);

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixPayload);
    setHasCopiedPixCode(true);
    setTimeout(() => setHasCopiedPixCode(false), 2500);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Digite um código de cupom.');
      return;
    }

    // Check custom coupons from storeSettings
    const matched = storeSettings?.coupons?.find(
      c => c.active && c.code.toUpperCase() === code
    );

    if (matched) {
      if (matched.minOrderValue && subtotal < matched.minOrderValue) {
        setCouponError(`Pedido mínimo para este cupom é de R$ ${matched.minOrderValue.toFixed(2)}.`);
        return;
      }
      if (matched.discountType === 'percentage') {
        setDiscountPercent(matched.discountValue / 100);
        setFixedDiscount(0);
        setIsFreeShippingCoupon(false);
      } else if (matched.discountType === 'fixed') {
        setDiscountPercent(0);
        setFixedDiscount(matched.discountValue);
        setIsFreeShippingCoupon(false);
      } else if (matched.discountType === 'free_shipping') {
        setDiscountPercent(0);
        setFixedDiscount(0);
        setIsFreeShippingCoupon(true);
      }
      setAppliedCouponName(matched.code);
      return;
    }

    // Fallbacks
    if (code === 'CRIAS10' || code === 'BURGER10' || code === 'DESCONTO') {
      setDiscountPercent(0.10);
      setFixedDiscount(0);
      setIsFreeShippingCoupon(false);
      setAppliedCouponName(code);
    } else if (code === 'FOGO20') {
      setDiscountPercent(0.20);
      setFixedDiscount(0);
      setIsFreeShippingCoupon(false);
      setAppliedCouponName(code);
    } else if (code === 'FRETEGRATIS') {
      setDiscountPercent(0);
      setFixedDiscount(0);
      setIsFreeShippingCoupon(true);
      setAppliedCouponName(code);
    } else {
      setCouponError('Cupom inválido ou expirado.');
    }
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-44">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-5 bg-[#131313]/95 backdrop-blur-md border-b border-[#353535]/30 h-16">
        <div className="max-w-2xl mx-auto w-full h-full flex justify-between items-center">
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
              onClick={onOpenChat}
              className="w-9 h-9 rounded-full bg-[#20201f] border border-[#353535] flex items-center justify-center text-[#ffb5a0] hover:text-white"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <h1 className="font-['Montserrat'] text-2xl font-bold text-[#e5e2e1]">
            Seu Carrinho
          </h1>
          <p className="text-xs text-[#b4b5b5] mt-0.5">
            {items.length === 0
              ? 'Seu carrinho está vazio'
              : `${items.length} ${items.length === 1 ? 'item selecionado' : 'itens selecionados'}`}
          </p>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="bg-[#20201f] rounded-lg p-8 text-center border border-[#353535]/50 space-y-4">
            <p className="text-[#b4b5b5] text-sm">
              Você ainda não adicionou nenhum burger ou bebida.
            </p>
            <button
              onClick={onBack}
              className="btn-flame px-6 py-2.5 rounded-md font-['Montserrat'] font-bold text-sm text-white"
            >
              Explorar Cardápio
            </button>
          </div>
        ) : (
          /* Items List */
          <section className="space-y-3.5">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-[#20201f] rounded-lg overflow-hidden flex items-stretch border border-[#353535]/50 shadow-md group hover:border-[#ff5722]/30 transition-all"
              >
                <div className="w-24 sm:w-28 flex-shrink-0 relative overflow-hidden bg-[#1c1b1b]">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-grow p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-['Montserrat'] font-bold text-sm text-[#e5e2e1]">
                        {item.product.name}
                      </h3>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[#b4b5b5] hover:text-[#ffb4ab] p-1 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {item.pizzaSize && (
                        <span className="bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40 text-[10px] font-bold font-['Montserrat'] px-2 py-0.5 rounded-md flex items-center gap-1">
                          🍕 Tam: {item.pizzaSize} {item.pizzaSize === 'Família' ? '(12 fatias)' : `(${item.pizzaSize === 'P' ? '4 fatias' : item.pizzaSize === 'M' ? '6 fatias' : '8 fatias'})`}
                        </span>
                      )}
                      {item.juiceSize && (
                        <span className="bg-[#ff9800]/20 text-[#ffd180] border border-[#ff9800]/40 text-[10px] font-bold font-['Montserrat'] px-2 py-0.5 rounded-md flex items-center gap-1">
                          🥤 Tam: {item.juiceSize === '1L' ? '1 Litro (1lt)' : item.juiceSize}
                        </span>
                      )}
                      {item.meatDoneness && (
                        <span className="bg-[#353535] text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {item.meatDoneness}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#b4b5b5] mt-1 font-light line-clamp-1">
                      {item.additionals.length > 0
                        ? item.additionals.map(a => a.name).join(', ')
                        : item.product.description}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-[#ffb5a0] italic mt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#353535]/30">
                    <div className="flex items-center bg-[#2a2a2a] rounded-md p-0.5 border border-[#353535]">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-[#ffb5a0] hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-white font-['Montserrat']">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#ffb5a0] hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-['Montserrat'] font-bold text-sm text-[#ffb5a0]">
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Identificação / Cadastro do Cliente */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-[#b4b5b5] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#ff5722]" /> Dados do Cliente para Entrega
            </h3>
            {customerProfile && onOpenCustomerRegister && (
              <button
                onClick={onOpenCustomerRegister}
                className="text-[11px] text-[#ff8a65] hover:text-white underline font-semibold"
              >
                Editar Dados
              </button>
            )}
          </div>

          {customerProfile ? (
            <div className="bg-[#20201f] rounded-lg p-3.5 flex items-center justify-between border border-[#353535]/50 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ff5722]/10 flex items-center justify-center text-[#ff5722] flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {customerProfile.name}
                  </span>
                  <span className="text-xs text-[#b4b5b5] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#ff5722]" /> {customerProfile.phone}
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded font-extrabold uppercase font-['Montserrat']">
                Cadastrado
              </span>
            </div>
          ) : (
            <div
              onClick={onOpenCustomerRegister}
              className="bg-[#20201f] rounded-lg p-3.5 border border-[#ff5722]/50 hover:border-[#ff5722] cursor-pointer flex items-center justify-between shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-[#ff8a65] transition-colors">
                    Cadastro Obrigatório Pendente
                  </p>
                  <p className="text-[11px] text-[#b4b5b5]">
                    Clique aqui para preencher seu nome e WhatsApp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-white bg-[#ff5722] px-3.5 py-1.5 rounded-md"
              >
                Cadastrar
              </button>
            </div>
          )}
        </section>

        {/* Endereço de Entrega */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-medium text-[#b4b5b5]">
            Endereço de Entrega
          </h3>
          <div className="bg-[#20201f] rounded-lg p-4 flex items-center justify-between border border-[#353535]/50 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ff5722]/10 flex items-center justify-center text-[#ff5722] flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {deliveryAddress.split(' - ')[0] || deliveryAddress}
                </span>
                <span className="text-xs text-[#b4b5b5]">
                  {deliveryAddress.split(' - ')[1] || 'Centro, São Paulo - SP'}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenAddressModal}
              className="text-[#ffb5a0] hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-[#353535] border border-[#353535] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 text-[#ff5722]" /> Usar GPS / Alterar
            </button>
          </div>

          {/* Feedback do Raio de Atendimento da Loja */}
          {isOutsideRadius ? (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>
                Atenção: Este endereço fica a ~{matchedZone?.distanceKm} km (além do raio de atendimento de {radiusLimit} km). Considere a opção de Retirada no Balcão ou altere o endereço.
              </span>
            </div>
          ) : matchedZone ? (
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Área atendida: <strong>{matchedZone.name}</strong> (~{matchedZone.distanceKm || 3} km da base)</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                {matchedZone.estimatedTime || '25-35 min'}
              </span>
            </div>
          ) : null}
        </section>

        {/* Possui um cupom? */}
        <section className="space-y-1.5">
          <label className="block text-xs font-medium text-[#b4b5b5]">
            Possui um cupom?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Ex: CRIAS10 ou FOGO20"
                className="w-full bg-[#20201f] border border-[#353535] rounded-md px-4 py-3 text-sm text-[#e5e2e1] placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722] uppercase tracking-wider"
              />
              {appliedCouponName && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[#ff5722]/20 text-[#ff8a65] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {appliedCouponName}
                </span>
              )}
            </div>
            <button
              onClick={handleApplyCoupon}
              className="bg-[#353535] hover:bg-[#454747] text-white px-5 rounded-md text-xs font-bold font-['Montserrat'] transition-colors"
            >
              Aplicar
            </button>
          </div>
          {couponError && (
            <p className="text-[11px] text-[#ffb4ab] mt-1">{couponError}</p>
          )}
          {appliedCouponName && (
            <p className="text-[11px] text-[#86cfff] mt-1">
              Desconto de {(discountPercent * 100).toFixed(0)}% aplicado com sucesso!
            </p>
          )}
        </section>

        {/* Forma de Pagamento */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-[#b4b5b5] uppercase tracking-wider font-['Montserrat']">
              Forma de Pagamento
            </h3>
            <button
              type="button"
              onClick={() => setShowAddMethodInput(!showAddMethodInput)}
              className="text-xs text-[#ffb5a0] hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>{showAddMethodInput ? 'Fechar' : '+ Adicionar Forma'}</span>
            </button>
          </div>

          {/* Form to add custom payment method */}
          {showAddMethodInput && (
            <div className="bg-[#1c1b1b] border border-[#ff5722]/40 rounded-lg p-3.5 space-y-2.5 animate-in fade-in">
              <span className="text-xs font-bold text-white block font-['Montserrat']">
                Adicionar Nova Opção de Pagamento
              </span>
              <p className="text-[11px] text-[#b4b5b5]">
                Digite o nome da bandeira, app ou convênio que deseja utilizar:
              </p>
              <form onSubmit={handleAddPaymentMethod} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newMethodName}
                  onChange={e => setNewMethodName(e.target.value)}
                  placeholder="Ex: Ticket Restaurante, PicPay, Alelo..."
                  className="flex-grow bg-[#20201f] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
                <button
                  type="submit"
                  className="btn-flame text-white px-3.5 py-2 rounded-md text-xs font-bold font-['Montserrat'] whitespace-nowrap active:scale-95 transition-all"
                >
                  Adicionar
                </button>
              </form>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Ticket Restaurante', 'Alelo Refeição', 'Sodexo / Pluxee', 'PicPay', 'VR Smart'].map(
                  preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNewMethodName(preset);
                      }}
                      className="text-[10px] bg-[#2a2a2a] hover:bg-[#353535] text-[#ffb5a0] px-2 py-1 rounded-lg border border-[#353535] transition-colors"
                    >
                      + {preset}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Methods List */}
          <div className="space-y-2">
            {activeMethods.map(methodName => {
              const isSelected = paymentMethod === methodName;
              const isPix = methodName.toLowerCase().includes('pix');
              const isCash = methodName.toLowerCase().includes('dinheiro');
              const isCard =
                methodName.toLowerCase().includes('cartão') ||
                methodName.toLowerCase().includes('crédito') ||
                methodName.toLowerCase().includes('débito');

              const Icon = isPix
                ? Banknote
                : isCash
                ? Banknote
                : isCard
                ? CreditCard
                : Wallet;

              return (
                <div key={methodName} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(methodName)}
                    className={`w-full flex items-center justify-between p-3.5 bg-[#20201f] rounded-md border transition-all active:scale-[0.99] text-left ${
                      isSelected
                        ? 'border-[#ff5722] bg-[#ff5722]/10 shadow-[0_0_12px_rgba(255,87,34,0.15)] ring-1 ring-[#ff5722]'
                        : 'border-[#353535]/50 hover:border-[#353535]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[#ff5722] text-white' : 'bg-[#2a2a2a] text-[#b4b5b5]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">
                          {methodName}
                        </span>
                        <span className="text-[10px] text-[#b4b5b5]">
                          {isPix
                            ? 'Aprovação imediata via Chave Pix'
                            : isCash
                            ? 'Pagamento ao entregador na entrega'
                            : isCard
                            ? 'Maquininha levada pelo motoboy'
                            : 'Aceito na maquininha ou app'}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#ff5722]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#353535] flex-shrink-0" />
                    )}
                  </button>

                  {/* Pix Details Box when selected with real QR Code */}
                  {isSelected && isPix && (
                    <div className="bg-[#1c1b1b] border-2 border-[#ff5722]/50 rounded-lg p-4 space-y-3.5 ml-1 mr-1 shadow-xl animate-in fade-in duration-200">
                      {/* Header with Live Status & Timer */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#353535]">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold text-white font-['Montserrat']">
                            QR Code Pix Gerado
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-[#ff8a65] font-mono bg-[#ff5722]/10 border border-[#ff5722]/30 px-2.5 py-0.5 rounded-full font-bold">
                          <Clock className="w-3 h-3 text-[#ff5722]" />
                          {formatTimer(pixTimeLeft)}
                        </span>
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-lg max-w-[210px] mx-auto shadow-md border-2 border-[#ff5722]/30">
                        <img
                          src={pixQrCodeUrl}
                          alt="QR Code Pix"
                          className="w-40 h-40 object-contain rounded-md"
                        />
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-700 font-bold uppercase tracking-wider">
                          <QrCode className="w-3.5 h-3.5 text-[#ff5722]" />
                          <span>Pague com seu banco</span>
                        </div>
                      </div>

                      {/* Valor do Pedido */}
                      <div className="text-center">
                        <span className="text-[11px] text-[#b4b5b5] block">Total a pagar no Pix:</span>
                        <span className="text-xl font-black text-white font-['Montserrat']">
                          R$ {total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Botão Copiar Pix Copia e Cola */}
                      <button
                        type="button"
                        onClick={handleCopyPixCode}
                        className="w-full bg-[#ff5722] hover:bg-[#e64a19] text-white py-3 px-4 rounded-md font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        {hasCopiedPixCode ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>✓ Código Pix Copiado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Código Pix (Copia e Cola)</span>
                          </>
                        )}
                      </button>

                      {/* Chave Pix Direta da Hamburgueria */}
                      <div className="bg-[#20201f] p-2.5 rounded-md border border-[#353535] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#b4b5b5] block">Chave Pix da Loja:</span>
                          <span className="text-xs font-mono text-white font-semibold">
                            {storeSettings?.pixKey || '11987654321'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="text-[11px] font-bold text-[#ffb5a0] hover:text-white px-2.5 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#ff5722] transition-colors flex items-center gap-1"
                        >
                          {hasCopiedPix ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Chave</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Instruções */}
                      <div className="text-[10px] text-[#b4b5b5] leading-relaxed bg-[#141414] p-2.5 rounded-md border border-[#353535]/60 space-y-1">
                        <span className="font-semibold text-white block">Como funciona:</span>
                        <p>1. Abra o app do seu banco (Nubank, Itaú, Bradesco, Inter, Mercado Pago, etc.).</p>
                        <p>2. Aponte a câmera para o <strong>QR Code</strong> ou cole o <strong>Código Pix</strong>.</p>
                        <p>3. Conclua o pagamento e clique no botão abaixo para confirmar seu pedido.</p>
                      </div>
                    </div>
                  )}

                  {/* Cash Change Box when selected */}
                  {isSelected && isCash && (
                    <div className="bg-[#1c1b1b] border border-[#ff5722]/30 rounded-md p-3 space-y-2.5 ml-2 mr-2">
                      <span className="text-[11px] font-bold text-white block">
                        💵 Precisa de troco para quanto?
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Não preciso', 'R$ 50', 'R$ 100', 'R$ 200'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setChangeFor(val === 'Não preciso' ? '' : val)}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              (val === 'Não preciso' && !changeFor) || changeFor === val
                                ? 'bg-[#ff5722] text-white border-[#ff5722]'
                                : 'bg-[#20201f] text-[#b4b5b5] border-[#353535] hover:border-[#ff5722]/50'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={changeFor}
                        onChange={e => setChangeFor(e.target.value)}
                        placeholder="Ou digite o valor do troco (ex: R$ 80)"
                        className="w-full bg-[#20201f] border border-[#353535] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary Breakdown */}
        <section className="bg-[#20201f] rounded-lg p-5 border border-[#353535]/50 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#b4b5b5]">Subtotal</span>
            <span className="text-white font-medium">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#b4b5b5] flex items-center gap-1.5">
              <span>Taxa de entrega</span>
              {matchedZone && (
                <span className="text-[10px] text-[#ff8a65] font-semibold">({matchedZone.name})</span>
              )}
            </span>
            {isPickup ? (
              <span className="text-emerald-400 font-bold uppercase text-[11px]">Retirada no Balcão (Grátis)</span>
            ) : isFreeDelivery ? (
              <span className="text-emerald-400 font-bold uppercase text-[11px]">Grátis (Promocional)</span>
            ) : (
              <span className="text-white font-medium">
                R$ {deliveryFee.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-xs text-[#86cfff]">
              <span>Desconto ({appliedCouponName})</span>
              <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#353535] flex justify-between items-center">
            <span className="font-['Montserrat'] font-bold text-sm text-white">
              Total
            </span>
            <span className="font-['Montserrat'] font-extrabold text-xl text-[#ff5722]">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 w-full z-40 bg-gradient-to-t from-[#131313] via-[#131313]/95 to-transparent p-4 pb-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => {
                if (!customerProfile && onOpenCustomerRegister) {
                  onOpenCustomerRegister();
                  return;
                }
                onCheckout(paymentMethod, discountAmount, changeFor);
              }}
              className="w-full py-4 rounded-md font-['Montserrat'] font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xl btn-flame text-white"
            >
              <span>Confirmar Pedido ({paymentMethod})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
