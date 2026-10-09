import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  ShieldCheck,
  X,
  ChevronRight,
  Lock,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
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
  onClearCart?: () => void;
  onBack: () => void;
  onOpenAddressModal: () => void;
  onOpenChat: () => void;
  onCheckout: (
    paymentMethod: string,
    discountAmount: number,
    changeFor?: string,
    mercadoPagoPaymentId?: string,
    orderType?: 'Delivery' | 'Retirada' | 'Mesa',
    tableNumber?: number
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
  onClearCart,
  onBack,
  onOpenAddressModal,
  onOpenChat,
  onCheckout,
}) => {
  // Order Type Mode: 'Delivery' | 'Retirada' | 'Mesa'
  const [orderType, setOrderType] = useState<'Delivery' | 'Retirada' | 'Mesa'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mesa')) {
      return 'Mesa';
    }
    return 'Delivery';
  });

  const [tableNumber, setTableNumber] = useState<number>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaParam = urlParams.get('mesa');
    return mesaParam ? parseInt(mesaParam) || 1 : 1;
  });

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [fixedDiscount, setFixedDiscount] = useState<number>(0);
  const [isFreeShippingCoupon, setIsFreeShippingCoupon] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string>('');
  const [appliedCouponName, setAppliedCouponName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix');
  const [changeFor, setChangeFor] = useState<string>('');
  const [hasCopiedPix, setHasCopiedPix] = useState(false);
  const [hasCopiedDirectPixKey, setHasCopiedDirectPixKey] = useState(false);
  const [showQrCodeInline, setShowQrCodeInline] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Card Payment Form State
  const [cardMode, setCardMode] = useState<'online' | 'delivery'>('online');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerProfile?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [installments, setInstallments] = useState('1');
  const [saveCard, setSaveCard] = useState(true);
  const [cardError, setCardError] = useState('');

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
    if (cardError) setCardError('');
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
    if (cardError) setCardError('');
  };

  const handleCvvChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    setCardCvv(raw);
    if (cardError) setCardError('');
  };

  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length > 9) {
      setCardCpf(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`);
    } else if (raw.length > 6) {
      setCardCpf(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`);
    } else if (raw.length > 3) {
      setCardCpf(`${raw.slice(0, 3)}.${raw.slice(3)}`);
    } else {
      setCardCpf(raw);
    }
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(34|37)/.test(clean)) return 'American Express';
    if (/^6062/.test(clean)) return 'Hipercard';
    if (/^(60|65|64|50)/.test(clean)) return 'Elo';
    return 'Cartão';
  };

  const handleConfirmPayment = () => {
    const isCard =
      paymentMethod.toLowerCase().includes('cartão') ||
      paymentMethod.toLowerCase().includes('crédito') ||
      paymentMethod.toLowerCase().includes('débito');

    if (isCard) {
      if (cardMode === 'online') {
        const cleanNumber = cardNumber.replace(/\D/g, '');
        if (cleanNumber.length < 15) {
          setCardError('Por favor, digite os 16 dígitos do seu cartão.');
          return;
        }
        if (!cardHolder.trim()) {
          setCardError('Por favor, informe o nome impresso no cartão.');
          return;
        }
        if (cardExpiry.length < 5) {
          setCardError('Por favor, informe a validade no formato MM/AA.');
          return;
        }
        if (cardCvv.length < 3) {
          setCardError('Por favor, informe o código de segurança (CVV).');
          return;
        }
        const last4 = cleanNumber.slice(-4);
        const brand = getCardBrand(cleanNumber);
        const finalMethod = `${paymentMethod} Online (${brand} •••• ${last4}${installments !== '1' ? `, ${installments}x` : ''})`;
        setShowPaymentModal(false);
        onCheckout(finalMethod, discountAmount, changeFor, undefined, orderType, orderType === 'Mesa' ? tableNumber : undefined);
        return;
      } else {
        const finalMethod = `${paymentMethod} (Maquininha na Entrega)`;
        setShowPaymentModal(false);
        onCheckout(finalMethod, discountAmount, changeFor, undefined, orderType, orderType === 'Mesa' ? tableNumber : undefined);
        return;
      }
    }

    setShowPaymentModal(false);
    onCheckout(paymentMethod, discountAmount, changeFor, undefined, orderType, orderType === 'Mesa' ? tableNumber : undefined);
  };

  const handleSelectPaymentMethod = (methodName: string) => {
    setPaymentMethod(methodName);
    if (!customerProfile && onOpenCustomerRegister) {
      onOpenCustomerRegister();
      return;
    }
    setShowPaymentModal(true);
  };

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

  const isPickup = orderType === 'Retirada' || addrLower.includes('retirada no balcão') || addrLower.includes('retirada na loja');
  const isTable = orderType === 'Mesa';
  const rawDeliveryFee = items.length > 0 && !isPickup && !isTable ? (isFreeDelivery ? 0.00 : baseDeliveryFee) : 0.00;
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

  const [pixTxId] = useState(() => 'P' + Math.floor(100000 + Math.random() * 900000));

  const pixPayload = useMemo(() => {
    return generatePixPayload({
      pixKey: storeSettings?.pixKey || '11987654321',
      merchantName: storeSettings?.storeName || 'BURGER DOS CRIAS',
      merchantCity: 'SAO PAULO',
      amount: total,
      txid: pixTxId,
    });
  }, [storeSettings?.pixKey, storeSettings?.storeName, total, pixTxId]);

  const pixQrCodeUrl = useMemo(() => getPixQrCodeUrl(pixPayload, 260), [pixPayload]);

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
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-36">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 bg-[#131313]/95 backdrop-blur-md border-b border-[#353535]/30 h-13 flex items-center">
        <div className="max-w-md mx-auto w-full h-full flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="text-[#ffb5a0] hover:text-white p-1 rounded-full active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ff5722]/30">
              <img
                src={APP_IMAGES.logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#353535]">
              <img
                src={APP_IMAGES.userAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={onOpenChat}
              className="w-8 h-8 rounded-full bg-[#20201f] border border-[#353535] flex items-center justify-center text-[#ffb5a0] hover:text-white"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-15 px-3 sm:px-4 max-w-md mx-auto space-y-2.5 pb-24">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Montserrat'] text-base sm:text-lg font-bold text-[#e5e2e1]">
              Seu Carrinho
            </h1>
            <p className="text-[10px] text-[#b4b5b5] mt-0.5">
              {items.length === 0
                ? 'Seu carrinho está vazio'
                : `${items.length} ${items.length === 1 ? 'item selecionado' : 'itens selecionados'}`}
            </p>
          </div>
          {items.length > 0 && onClearCart && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 hover:border-red-500/60 bg-red-950/20 active:scale-95 transition-all font-semibold"
              title="Remover todos os itens do carrinho"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="bg-[#20201f] rounded-lg p-5 text-center border border-[#353535]/50 space-y-2.5">
            <p className="text-[#b4b5b5] text-xs">
              Você ainda não adicionou nenhum burger ou bebida.
            </p>
            <button
              onClick={onBack}
              className="btn-flame px-4 py-1.5 rounded-md font-['Montserrat'] font-bold text-xs text-white"
            >
              Explorar Cardápio
            </button>
          </div>
        ) : (
          /* Items List */
          <section className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-[#20201f] rounded-lg overflow-hidden flex items-stretch border border-[#353535]/50 shadow-sm group hover:border-[#ff5722]/30 transition-all"
              >
                <div className="w-16 sm:w-18 flex-shrink-0 relative overflow-hidden bg-[#1c1b1b]">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-grow p-2 sm:p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-['Montserrat'] font-bold text-xs text-[#e5e2e1] leading-tight line-clamp-1">
                        {item.product.name}
                      </h3>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[#b4b5b5] hover:text-[#ffb4ab] p-0.5 transition-colors -mt-0.5"
                        title="Remover item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {item.pizzaSize && (
                        <span className="bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40 text-[8.5px] font-bold font-['Montserrat'] px-1.5 py-0.2 rounded flex items-center gap-1">
                          🍕 Tam: {item.pizzaSize} {item.pizzaSize === 'Família' ? '(12 fatias)' : `(${item.pizzaSize === 'P' ? '4 fatias' : item.pizzaSize === 'M' ? '6 fatias' : '8 fatias'})`}
                        </span>
                      )}
                      {item.juiceSize && (
                        <span className="bg-[#ff9800]/20 text-[#ffd180] border border-[#ff9800]/40 text-[8.5px] font-bold font-['Montserrat'] px-1.5 py-0.2 rounded flex items-center gap-1">
                          🥤 Tam: {item.juiceSize === '1L' ? '1 Litro' : item.juiceSize}
                        </span>
                      )}
                      {item.meatDoneness && (
                        <span className="bg-[#353535] text-white text-[8.5px] font-semibold px-1.5 py-0.2 rounded">
                          {item.meatDoneness}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-[#b4b5b5] mt-0.5 font-light line-clamp-1">
                      {item.additionals.length > 0
                        ? item.additionals.map(a => a.name).join(', ')
                        : item.product.description}
                    </p>
                    {item.notes && (
                      <p className="text-[9.5px] text-[#ffb5a0] italic mt-0.5 line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-[#353535]/30">
                    <div className="flex items-center bg-[#2a2a2a] rounded p-0.5 border border-[#353535]">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-[#ffb5a0] hover:text-white transition-colors"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-1.5 text-[11px] font-bold text-white font-['Montserrat']">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#ffb5a0] hover:text-white transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="font-['Montserrat'] font-bold text-xs text-[#ffb5a0]">
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Identificação / Cadastro do Cliente */}
        <section className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-medium text-[#b4b5b5] flex items-center gap-1">
              <User className="w-3 h-3 text-[#ff5722]" /> Dados do Cliente para Entrega
            </h3>
            {customerProfile && onOpenCustomerRegister && (
              <button
                onClick={onOpenCustomerRegister}
                className="text-[9.5px] text-[#ff8a65] hover:text-white underline font-semibold"
              >
                Editar Dados
              </button>
            )}
          </div>

          {customerProfile ? (
            <div className="bg-[#20201f] rounded-lg p-2 sm:p-2.5 flex items-center justify-between border border-[#353535]/50 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ff5722]/10 flex items-center justify-center text-[#ff5722] flex-shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-white">
                    {customerProfile.name}
                  </span>
                  <span className="text-[10px] text-[#b4b5b5] flex items-center gap-1">
                    <Phone className="w-2 h-2 text-[#ff5722]" /> {customerProfile.phone}
                  </span>
                </div>
              </div>
              <span className="text-[8.5px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-extrabold uppercase font-['Montserrat']">
                Cadastrado
              </span>
            </div>
          ) : (
            <div
              onClick={onOpenCustomerRegister}
              className="bg-[#20201f] rounded-lg p-2 border border-[#ff5722]/50 hover:border-[#ff5722] cursor-pointer flex items-center justify-between shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white group-hover:text-[#ff8a65] transition-colors">
                    Cadastro Obrigatório Pendente
                  </p>
                  <p className="text-[9.5px] text-[#b4b5b5]">
                    Clique aqui para preencher nome e WhatsApp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-white bg-[#ff5722] px-2 py-0.5 rounded"
              >
                Cadastrar
              </button>
            </div>
          )}
        </section>

        {/* Modalidade do Pedido: Delivery, Retirada no Balcão ou Consumir na Mesa */}
        <section className="space-y-1">
          <h3 className="text-[10px] font-bold text-white font-['Montserrat'] flex items-center justify-between">
            <span>Como deseja receber seu pedido?</span>
            {orderType === 'Mesa' && (
              <span className="text-[8.5px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-extrabold uppercase">
                Consumo no Local
              </span>
            )}
          </h3>

          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setOrderType('Delivery')}
              className={`py-1.5 px-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                orderType === 'Delivery'
                  ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm shadow-[#ff5722]/30'
                  : 'bg-[#20201f] text-[#b4b5b5] hover:text-white border-[#353535]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-['Montserrat']">Delivery</span>
              <span className="text-[7.5px] opacity-80">Entrega</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('Retirada')}
              className={`py-1.5 px-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                orderType === 'Retirada'
                  ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm shadow-[#ff5722]/30'
                  : 'bg-[#20201f] text-[#b4b5b5] hover:text-white border-[#353535]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-['Montserrat']">Retirada</span>
              <span className="text-[7.5px] opacity-80">Balcão (Grátis)</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('Mesa')}
              className={`py-1.5 px-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                orderType === 'Mesa'
                  ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm shadow-[#ff5722]/30'
                  : 'bg-[#20201f] text-[#b4b5b5] hover:text-white border-[#353535]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-['Montserrat']">Na Mesa</span>
              <span className="text-[7.5px] opacity-80">Salão</span>
            </button>
          </div>
        </section>

        {/* DETALHES DE ACORDO COM A MODALIDADE */}
        {orderType === 'Mesa' && (
          <section className="bg-[#1c1b1b] rounded-lg p-3 border border-[#ff5722]/40 space-y-2 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#353535]">
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#ff5722]" />
                <h4 className="font-['Montserrat'] font-bold text-xs text-white">
                  Identificação da sua Mesa no Salão
                </h4>
              </div>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                Sem Taxa
              </span>
            </div>

            <div>
              <label className="block text-[#b4b5b5] text-[10px] font-semibold mb-1">
                Selecione o número da mesa em que você está sentado:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(storeSettings?.tables || Array.from({ length: 10 }, (_, i) => ({ number: i + 1, label: `Mesa ${i + 1}` }))).map(t => (
                  <button
                    key={t.number}
                    type="button"
                    onClick={() => setTableNumber(t.number)}
                    className={`py-1.5 rounded-md font-['Montserrat'] font-bold text-[11px] flex flex-col items-center justify-center transition-all ${
                      tableNumber === t.number
                        ? 'bg-[#ff5722] text-white shadow-sm shadow-[#ff5722]/40 scale-102 border border-white'
                        : 'bg-[#121212] text-[#b4b5b5] hover:text-white border border-[#353535]'
                    }`}
                  >
                    <span className="text-[8px] opacity-80">Mesa</span>
                    <span className="text-xs font-black font-mono">{t.number < 10 ? `0${t.number}` : t.number}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 bg-black/40 rounded border border-[#353535] text-[10px] text-[#b4b5b5] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
              <span>
                Pedido direto na chapa para a <strong>Mesa {tableNumber < 10 ? `0${tableNumber}` : tableNumber}</strong>!
              </span>
            </div>
          </section>
        )}

        {orderType === 'Retirada' && (
          <section className="bg-[#1c1b1b] rounded-lg p-3 border border-[#353535] space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-white font-bold text-xs">
              <ShoppingBag className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>Retirada no Balcão da Hamburgueria</span>
            </div>
            <p className="text-[11px] text-[#b4b5b5]">
              Endereço: <strong className="text-white">{storeSettings?.address || storeSettings?.deliveryArea?.baseAddress || 'Rua Augusta, 1000 - Consolação, São Paulo - SP'}</strong>
            </p>
            <p className="text-[10px] text-emerald-400">
              ✓ Economize a taxa de frete e retire seu lanche no balcão sem filas!
            </p>
          </section>
        )}

        {orderType === 'Delivery' && (
          <section className="space-y-1">
            <h3 className="text-[10px] font-medium text-[#b4b5b5]">
              Endereço de Entrega
            </h3>
            <div className="bg-[#20201f] rounded-lg p-2.5 sm:p-3 flex items-center justify-between border border-[#353535]/50 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-full bg-[#ff5722]/10 flex items-center justify-center text-[#ff5722] flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {deliveryAddress.split(' - ')[0] || deliveryAddress}
                  </span>
                  <span className="text-[10px] text-[#b4b5b5] truncate">
                    {deliveryAddress.split(' - ')[1] || 'Centro, São Paulo - SP'}
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenAddressModal}
                className="text-[#ffb5a0] hover:text-white text-[10px] font-semibold px-2 py-1 rounded hover:bg-[#353535] border border-[#353535] transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0"
              >
                <Navigation className="w-3 h-3 text-[#ff5722]" /> Alterar
              </button>
            </div>

          {/* Feedback do Raio de Atendimento da Loja */}
          {isOutsideRadius ? (
            <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg text-[10px] text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>
                Atenção: Endereço a ~{matchedZone?.distanceKm} km (fora do raio de {radiusLimit} km). Escolha Retirada no Balcão.
              </span>
            </div>
          ) : matchedZone ? (
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Área atendida: <strong>{matchedZone.name}</strong></span>
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-mono font-bold">
                {matchedZone.estimatedTime || '25-35 min'}
              </span>
            </div>
          ) : null}
        </section>
        )}

        {/* Possui um cupom? */}
        <section className="space-y-1">
          <label className="block text-[10px] font-medium text-[#b4b5b5]">
            Possui um cupom de desconto?
          </label>
          <div className="flex gap-1.5">
            <div className="relative flex-grow">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Ex: CRIAS10"
                className="w-full bg-[#20201f] border border-[#353535] rounded-md px-2.5 py-1.5 text-xs text-[#e5e2e1] placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722] uppercase tracking-wider"
              />
              {appliedCouponName && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-[#ff5722]/20 text-[#ff8a65] px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                  <Tag className="w-2 h-2" /> {appliedCouponName}
                </span>
              )}
            </div>
            <button
              onClick={handleApplyCoupon}
              className="bg-[#353535] hover:bg-[#454747] text-white px-3 py-1.5 rounded-md text-[11px] font-bold font-['Montserrat'] transition-colors"
            >
              Aplicar
            </button>
          </div>
          {couponError && (
            <p className="text-[10px] text-[#ffb4ab] mt-0.5">{couponError}</p>
          )}
          {appliedCouponName && (
            <p className="text-[10px] text-[#86cfff] mt-0.5">
              Desconto de {(discountPercent * 100).toFixed(0)}% aplicado!
            </p>
          )}
        </section>

        {/* Forma de Pagamento */}
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-semibold text-[#b4b5b5] uppercase tracking-wider font-['Montserrat']">
              Forma de Pagamento
            </h3>
            <button
              type="button"
              onClick={() => setShowAddMethodInput(!showAddMethodInput)}
              className="text-[10px] text-[#ffb5a0] hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-3 h-3 text-[#ff5722]" />
              <span>{showAddMethodInput ? 'Fechar' : '+ Outra'}</span>
            </button>
          </div>

          {/* Form to add custom payment method */}
          {showAddMethodInput && (
            <div className="bg-[#1c1b1b] border border-[#ff5722]/40 rounded-lg p-2.5 space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-white block font-['Montserrat']">
                Adicionar Opção de Pagamento
              </span>
              <form onSubmit={handleAddPaymentMethod} className="flex gap-1.5">
                <input
                  type="text"
                  required
                  value={newMethodName}
                  onChange={e => setNewMethodName(e.target.value)}
                  placeholder="Ex: Ticket, Alelo, PicPay..."
                  className="flex-grow bg-[#20201f] border border-[#353535] rounded-md px-2.5 py-1 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
                <button
                  type="submit"
                  className="btn-flame text-white px-3 py-1 rounded-md text-[11px] font-bold font-['Montserrat'] whitespace-nowrap active:scale-95 transition-all"
                >
                  Adicionar
                </button>
              </form>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {['Ticket Restaurante', 'Alelo Refeição', 'Sodexo / Pluxee', 'PicPay'].map(
                  preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNewMethodName(preset);
                      }}
                      className="text-[9px] bg-[#2a2a2a] hover:bg-[#353535] text-[#ffb5a0] px-1.5 py-0.5 rounded border border-[#353535] transition-colors"
                    >
                      + {preset}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Methods List */}
          <div className="space-y-1.5">
            {activeMethods.map(methodName => {
              const isSelected = paymentMethod === methodName;
              const isPix = methodName.toLowerCase().includes('pix');
              const isCash = methodName.toLowerCase().includes('dinheiro');
              const isCardCredit = methodName.toLowerCase().includes('crédito');
              const isCardDebit = methodName.toLowerCase().includes('débito');
              const isCard = isCardCredit || isCardDebit || methodName.toLowerCase().includes('cartão');

              const Icon = isPix
                ? Zap
                : isCash
                ? Banknote
                : isCard
                ? CreditCard
                : Wallet;

              return (
                <div key={methodName}>
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod(methodName)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all active:scale-[0.99] text-left group ${
                      isSelected
                        ? isPix
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/50'
                          : 'border-[#ff5722] bg-[#ff5722]/10 shadow-[0_0_12px_rgba(255,87,34,0.12)] ring-1 ring-[#ff5722]'
                        : 'bg-[#20201f] border-[#353535]/50 hover:border-[#ff5722]/50 hover:bg-[#252525]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? isPix
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                              : 'bg-[#ff5722] text-white shadow-sm shadow-[#ff5722]/30'
                            : 'bg-[#2a2a2a] text-[#b4b5b5] group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-['Montserrat'] truncate">
                            {methodName}
                          </span>
                          {isPix && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-black uppercase">
                              Pix
                            </span>
                          )}
                          {(isCard || isCash) && (
                            <span className="text-[8px] bg-[#2a2a2a] text-[#ffb5a0] px-1 py-0.2 rounded font-medium">
                              Entrega
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] text-[#b4b5b5] block truncate">
                          {isPix
                            ? 'Aprovação imediata • QR Code'
                            : isCash
                            ? 'Em dinheiro com troco'
                            : isCardCredit
                            ? 'Cartão de crédito na maquininha'
                            : isCardDebit
                            ? 'Cartão de débito na maquininha'
                            : 'Aceito na maquininha ou app'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-0.5 pl-1.5">
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all group-hover:scale-105 ${
                        isPix
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40'
                      }`}>
                        Pagar <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary Breakdown */}
        <section className="bg-[#20201f] rounded-lg p-3 border border-[#353535]/50 space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#b4b5b5]">Subtotal</span>
            <span className="text-white font-medium">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#b4b5b5] flex items-center gap-1">
              <span>Taxa de entrega</span>
              {matchedZone && (
                <span className="text-[9px] text-[#ff8a65] font-semibold">({matchedZone.name})</span>
              )}
            </span>
            {isPickup ? (
              <span className="text-emerald-400 font-bold uppercase text-[9px]">Retirada no Balcão (Grátis)</span>
            ) : isFreeDelivery ? (
              <span className="text-emerald-400 font-bold uppercase text-[9px]">Grátis (Promocional)</span>
            ) : (
              <span className="text-white font-medium">
                R$ {deliveryFee.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-[11px] text-[#86cfff]">
              <span>Desconto ({appliedCouponName})</span>
              <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-[#353535] flex justify-between items-center">
            <span className="font-['Montserrat'] font-bold text-xs text-white">
              Total
            </span>
            <span className="font-['Montserrat'] font-extrabold text-base text-[#ff5722]">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-14 sm:bottom-16 left-0 w-full z-40 bg-gradient-to-t from-[#131313] via-[#131313]/95 to-transparent p-2 px-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => handleSelectPaymentMethod(paymentMethod)}
              className="w-full py-2.5 rounded-lg font-['Montserrat'] font-bold text-xs sm:text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md btn-flame text-white"
            >
              <span>Ir para Pagamento ({paymentMethod}) • R$ {total.toFixed(2).replace('.', ',')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL / TELA DE PAGAMENTO DEDICADA */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1918] border border-[#353535] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Modal Top Header */}
            <div className="p-3 px-4 border-b border-[#353535] flex items-center justify-between bg-[#20201f]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded-full text-[#b4b5b5] hover:text-white hover:bg-[#333] transition-colors"
                  title="Voltar ao Carrinho"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Tela de Pagamento</span>
                    <span className="text-[9px] bg-[#ff5722]/20 text-[#ff8a65] px-1.5 py-0.2 rounded-full font-bold uppercase">
                      {paymentMethod.split(' (')[0]}
                    </span>
                  </h3>
                  <span className="text-[10px] text-[#b4b5b5]">
                    {items.length} {items.length === 1 ? 'item' : 'itens'} • Total: <strong className="text-white font-mono">R$ {total.toFixed(2).replace('.', ',')}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-7 h-7 rounded-full bg-[#2a2a2a] hover:bg-[#353535] text-[#b4b5b5] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Switch Pills between Methods */}
            <div className="px-5 py-2.5 bg-[#141414] border-b border-[#353535]/60 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              {activeMethods.map(m => {
                const isActive = paymentMethod === m;
                const isP = m.toLowerCase().includes('pix');
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Montserrat'] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? isP
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-[#ff5722] text-white shadow-md'
                        : 'bg-[#20201f] text-[#8e8f8f] hover:text-white hover:bg-[#252525] border border-[#353535]'
                    }`}
                  >
                    <span>{m.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Delivery Address Pill */}
              <div className="bg-[#20201f] p-3 rounded-xl border border-[#353535] flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#ff5722] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">Entregar em:</span>
                  <span className="text-xs text-white font-medium truncate block">
                    {deliveryAddress.split(' - ')[0] || deliveryAddress}
                  </span>
                </div>
              </div>

              {/* === CASO 1: PIX === */}
              {paymentMethod.toLowerCase().includes('pix') && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Status & Timer */}
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-white text-xs">
                        Aprovação Automática Imediata
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-black/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {formatTimer(pixTimeLeft)}
                    </span>
                  </div>

                  {/* QR Code Container com Logo no Centro */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-[210px] mx-auto shadow-2xl border-4 border-emerald-500/30">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <img
                        src={pixQrCodeUrl}
                        alt="QR Code Pix"
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                      {/* Logo da Hamburgueria no centro do QR Code */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white p-1 shadow-2xl border-2 border-[#ff5722] flex items-center justify-center overflow-hidden">
                          <img
                            src={APP_IMAGES.logo}
                            alt="Logo da Hamburgueria"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-800 font-extrabold uppercase tracking-wide">
                      <QrCode className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Pague pelo seu banco</span>
                    </div>
                  </div>

                  {/* Pix Copia e Cola Button */}
                  <button
                    type="button"
                    onClick={handleCopyPixCode}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-xl font-['Montserrat'] font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    {hasCopiedPixCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>✓ Código Pix Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código Pix (Copia e Cola)</span>
                      </>
                    )}
                  </button>

                  {/* Chave Pix Direta (Alternativa para digitação manual no banco) */}
                  <div className="bg-[#1c1b1b] p-3 rounded-xl border border-[#353535] flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold text-[#8e8f8f] block">Chave Pix da Hamburgueria:</span>
                      <span className="text-xs font-mono font-bold text-white truncate block">
                        {storeSettings?.pixKey || '11987654321'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(storeSettings?.pixKey || '11987654321');
                        setHasCopiedDirectPixKey(true);
                        setTimeout(() => setHasCopiedDirectPixKey(false), 2500);
                      }}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#353535] text-[#ff8a65] border border-[#ff5722]/30 flex items-center gap-1.5 transition-colors shrink-0 active:scale-95"
                    >
                      {hasCopiedDirectPixKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Chave</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Passo a Passo */}
                  <div className="bg-[#161616] p-3.5 rounded-xl border border-[#353535]/60 text-[#b4b5b5] space-y-1 text-[11px] leading-relaxed">
                    <span className="font-bold text-white block">Como funciona:</span>
                    <p>1. Aponte a câmera para o QR Code acima ou use o botão <strong>Copiar Código Pix</strong>.</p>
                    <p>2. Abra o app do seu banco e conclua o pagamento de <strong>R$ {total.toFixed(2).replace('.', ',')}</strong>.</p>
                    <p>3. Clique no botão abaixo para confirmar seu pedido na cozinha!</p>
                  </div>
                </div>
              )}

              {/* === CASO 2: CARTÃO DE CRÉDITO OU DÉBITO === */}
              {(paymentMethod.toLowerCase().includes('cartão') || paymentMethod.toLowerCase().includes('crédito') || paymentMethod.toLowerCase().includes('débito')) && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Mode Selector: Online no App vs Na Entrega */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] rounded-xl border border-[#353535]">
                    <button
                      type="button"
                      onClick={() => setCardMode('online')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold font-['Montserrat'] flex items-center justify-center gap-1.5 transition-all ${
                        cardMode === 'online'
                          ? 'bg-[#ff5722] text-white shadow-md'
                          : 'text-[#8e8f8f] hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pagar no App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardMode('delivery')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold font-['Montserrat'] flex items-center justify-center gap-1.5 transition-all ${
                        cardMode === 'delivery'
                          ? 'bg-[#ff5722] text-white shadow-md'
                          : 'text-[#8e8f8f] hover:text-white'
                      }`}
                    >
                      <span>Maquininha (Entrega)</span>
                    </button>
                  </div>

                  {cardMode === 'online' ? (
                    <div className="space-y-3.5 animate-in fade-in">
                      {/* Interactive Card Preview */}
                      <div className="bg-gradient-to-br from-[#241713] via-[#1a120f] to-[#ff5722]/35 border border-[#ff5722]/40 rounded-2xl p-4 shadow-xl relative overflow-hidden text-white font-mono space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 flex items-center justify-center shadow-inner opacity-90">
                            <div className="w-6 h-4 border border-amber-600/40 rounded-[2px]" />
                          </div>
                          <span className="font-['Montserrat'] font-black text-xs text-[#ff8a65] tracking-widest uppercase">
                            {getCardBrand(cardNumber)}
                          </span>
                        </div>

                        <div className="text-base sm:text-lg tracking-widest font-bold py-1">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between items-end text-[10px] text-[#b4b5b5] font-sans">
                          <div className="min-w-0 pr-2">
                            <span className="text-[9px] block text-[#8e8f8f] uppercase">Titular</span>
                            <span className="font-semibold text-white truncate max-w-[170px] block">
                              {cardHolder.toUpperCase() || 'NOME DO TITULAR'}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] block text-[#8e8f8f] uppercase">Validade</span>
                            <span className="font-semibold text-white">
                              {cardExpiry || 'MM/AA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Error feedback */}
                      {cardError && (
                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{cardError}</span>
                        </div>
                      )}

                      {/* Card Inputs Form */}
                      <div className="bg-[#20201f] border border-[#353535] rounded-2xl p-4 space-y-3">
                        {/* Número do Cartão */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                            Número do Cartão
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={cardNumber}
                              onChange={e => handleCardNumberChange(e.target.value)}
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#555] font-mono focus:outline-none focus:border-[#ff5722] transition-colors pr-10"
                            />
                            <CreditCard className="w-4 h-4 text-[#ff5722] absolute right-3 pointer-events-none" />
                          </div>
                        </div>

                        {/* Nome no Cartão */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                            Nome Impresso no Cartão
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={e => {
                              setCardHolder(e.target.value.toUpperCase());
                              if (cardError) setCardError('');
                            }}
                            placeholder="Como está gravado no cartão"
                            className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#555] uppercase focus:outline-none focus:border-[#ff5722] transition-colors"
                          />
                        </div>

                        {/* Validade e CVV */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                              Validade (MM/AA)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={cardExpiry}
                              onChange={e => handleExpiryChange(e.target.value)}
                              placeholder="MM/AA"
                              maxLength={5}
                              className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff5722] transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                              CVV
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="password"
                                inputMode="numeric"
                                value={cardCvv}
                                onChange={e => handleCvvChange(e.target.value)}
                                placeholder="123"
                                maxLength={4}
                                className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff5722] transition-colors pr-9"
                              />
                              <Lock className="w-3.5 h-3.5 text-[#ff5722] absolute right-3 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* CPF do Titular */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                            CPF do Titular
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardCpf}
                            onChange={e => handleCpfChange(e.target.value)}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff5722] transition-colors"
                          />
                        </div>

                        {/* Parcelamento */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#8e8f8f] uppercase tracking-wider block">
                            Parcelamento
                          </label>
                          <select
                            value={installments}
                            onChange={e => setInstallments(e.target.value)}
                            className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5722] transition-colors"
                          >
                            <option value="1">1x de R$ {total.toFixed(2).replace('.', ',')} (à vista)</option>
                            {total >= 50 && (
                              <option value="2">2x de R$ {(total / 2).toFixed(2).replace('.', ',')} sem juros</option>
                            )}
                            {total >= 90 && (
                              <option value="3">3x de R$ {(total / 3).toFixed(2).replace('.', ',')} sem juros</option>
                            )}
                          </select>
                        </div>

                        {/* Salvar Cartão Checkbox */}
                        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={e => setSaveCard(e.target.checked)}
                            className="rounded border-[#353535] text-[#ff5722] focus:ring-[#ff5722] bg-[#141414]"
                          />
                          <span className="text-[11px] text-[#b4b5b5]">
                            Salvar este cartão com segurança para próximos pedidos
                          </span>
                        </label>
                      </div>

                      {/* Security Banner */}
                      <div className="bg-[#121915] border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-emerald-400">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <span className="text-[11px] font-medium leading-tight">
                          Pagamento criptografado de ponta a ponta (SSL 256 bits). Dados do cartão 100% protegidos.
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Opção Maquininha na Entrega */
                    <div className="bg-[#20201f] rounded-2xl p-4 border border-[#ff5722]/30 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center shrink-0">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white font-['Montserrat']">
                            {paymentMethod} na Entrega
                          </h4>
                          <p className="text-[11px] text-[#b4b5b5]">
                            O motoboy levará a maquininha sem fio até você.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#181818] rounded-xl border border-[#353535] space-y-2">
                        <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">
                          Bandeiras e tecnologias aceitas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Mastercard', 'Visa', 'Elo', 'Hipercard', 'Amex', 'Aproximação NFC', 'Apple Pay', 'Google Pay'].map(f => (
                            <span key={f} className="text-[10px] bg-[#252525] text-[#ffb5a0] px-2.5 py-1 rounded-lg border border-[#353535] font-semibold">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#181818] p-3 rounded-xl border border-[#353535] flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] font-medium">
                          Pagamento presencial e seguro na entrega.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === CASO 3: DINHEIRO === */}
              {paymentMethod.toLowerCase().includes('dinheiro') && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#20201f] rounded-2xl p-4 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white font-['Montserrat']">
                          Pagamento em Dinheiro
                        </h4>
                        <p className="text-[11px] text-[#b4b5b5]">
                          Pague diretamente ao entregador na chegada.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#181818] rounded-xl border border-[#353535] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Precisa de troco para quanto?
                        </span>
                        {changeFor && changeFor !== 'Não preciso' && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            Troco p/ {changeFor}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {['Não preciso', 'R$ 50', 'R$ 100', 'R$ 150'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setChangeFor(val === 'Não preciso' ? '' : val)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                              (val === 'Não preciso' && !changeFor) || changeFor === val
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                : 'bg-[#252525] text-[#b4b5b5] border-[#353535] hover:border-emerald-500/50 hover:text-white'
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
                        placeholder="Ou digite outro valor (ex: R$ 80,00)"
                        className="w-full bg-[#121212] border border-[#353535] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#8e8f8f] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* === CASO 4: VALE REFEIÇÃO / OUTROS === */}
              {(!paymentMethod.toLowerCase().includes('pix') && !paymentMethod.toLowerCase().includes('cartão') && !paymentMethod.toLowerCase().includes('crédito') && !paymentMethod.toLowerCase().includes('débito') && !paymentMethod.toLowerCase().includes('dinheiro')) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#20201f] rounded-2xl p-4 border border-[#ff5722]/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center shrink-0">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white font-['Montserrat']">
                          {paymentMethod}
                        </h4>
                        <p className="text-[11px] text-[#b4b5b5]">
                          Pagamento via maquininha ou aplicativo na entrega.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#181818] rounded-xl border border-[#353535] space-y-2">
                      <span className="text-[10px] text-[#8e8f8f] block uppercase font-bold">
                        Bandeiras de voucher aceitas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {['VR Benefícios', 'Sodexo / Pluxee', 'Ticket Restaurante', 'Alelo', 'Ben Visa', 'Flash', 'Caju'].map(v => (
                          <span key={v} className="text-[10px] bg-[#252525] text-[#ffb5a0] px-2.5 py-1 rounded-lg border border-[#353535] font-semibold">
                            ✓ {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-3 border-t border-[#353535] bg-[#20201f] space-y-1.5">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full py-3 rounded-lg font-['Montserrat'] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md btn-flame text-white"
              >
                <span>Concluir e Fazer Pedido • R$ {total.toFixed(2).replace('.', ',')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-1 text-center text-[11px] text-[#8e8f8f] hover:text-white transition-colors"
              >
                Voltar e alterar itens do carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
