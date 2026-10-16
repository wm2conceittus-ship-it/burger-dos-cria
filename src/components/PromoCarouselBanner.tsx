import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, StoreSettings } from '../types';
import {
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Tag,
  ArrowRight,
  Pause,
  Play,
  Copy,
  Check,
  Star,
  Zap,
} from 'lucide-react';

export interface PromoSlide {
  id: string;
  type: 'product' | 'coupon';
  badge: string;
  badgeStyle: 'flame' | 'emerald' | 'amber' | 'purple';
  title: string;
  highlightText?: string;
  description: string;
  price?: number;
  originalPrice?: number;
  discountTag?: string;
  image: string;
  ctaText: string;
  product?: Product;
  couponCode?: string;
  couponDiscount?: string;
}

interface PromoCarouselBannerProps {
  products: Product[];
  storeSettings?: StoreSettings;
  onSelectProduct: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
}

export const PromoCarouselBanner: React.FC<PromoCarouselBannerProps> = ({
  products,
  storeSettings,
  onSelectProduct,
  onQuickAdd,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Build slides dynamically based on available products & coupons
  const slides = useMemo<PromoSlide[]>(() => {
    const list: PromoSlide[] = [];

    // 1. Especial do Dia / Produto com maior desconto
    const discountedBurger = products.find(
      p => p.originalPrice && p.originalPrice > p.price
    );
    const truffleKing = products.find(p => p.id === 'truffle-king') || discountedBurger;

    if (truffleKing) {
      const orig = truffleKing.originalPrice || truffleKing.price + 8;
      const discount = Math.round(((orig - truffleKing.price) / orig) * 100);
      list.push({
        id: `promo-${truffleKing.id}`,
        type: 'product',
        badge: 'ESPECIAL DO DIA',
        badgeStyle: 'flame',
        title: truffleKing.name,
        highlightText: 'Grelhado no Fogo',
        description: truffleKing.description || 'Blend 180g artesanal, trufas negras e queijo gruyère derretido.',
        price: truffleKing.price,
        originalPrice: orig,
        discountTag: `${discount}% OFF`,
        image: truffleKing.image,
        ctaText: 'Pedir Especial',
        product: truffleKing,
      });
    }

    // 2. Combo em Destaque (Economia para compartilhar)
    const combo = products.find(p => p.category === 'combos' && p.id === 'combo-familia-crias')
      || products.find(p => p.category === 'combos');

    if (combo) {
      list.push({
        id: `promo-${combo.id}`,
        type: 'product',
        badge: 'COMBO EM DOBRO',
        badgeStyle: 'amber',
        title: combo.name,
        highlightText: 'Economize R$ 21',
        description: combo.description || '2x Burgers Crias Max + 2x Batatas Médias + 2x Refrigerantes gelados!',
        price: combo.price,
        originalPrice: combo.originalPrice || (combo.price + 21),
        discountTag: 'SUPER COMBO',
        image: combo.image,
        ctaText: 'Aproveitar Combo',
        product: combo,
      });
    }

    // 3. Cupom da Loja (se houver ou cupom padrão de boas-vindas)
    const activeCoupons = (storeSettings?.coupons || []).filter(c => c.active !== false);
    const topCoupon = activeCoupons[0];

    list.push({
      id: 'promo-coupon-crias',
      type: 'coupon',
      badge: 'CUPOM EXCLUSIVO',
      badgeStyle: 'emerald',
      title: topCoupon ? `Cupom: ${topCoupon.code}` : 'Cupom: CRIAS10',
      highlightText: topCoupon
        ? (topCoupon.discountType === 'percentage'
            ? `${topCoupon.discountValue}% OFF`
            : topCoupon.discountType === 'free_shipping'
            ? 'Frete Grátis'
            : `R$ ${topCoupon.discountValue.toFixed(2).replace('.', ',')} OFF`)
        : '10% OFF no Pedido',
      description: topCoupon?.description || 'Use na tela de pagamento e garanta desconto no seu lanche artesanal!',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      ctaText: 'Copiar Cupom',
      couponCode: topCoupon ? topCoupon.code : 'CRIAS10',
      couponDiscount: topCoupon
        ? (topCoupon.discountType === 'percentage' ? `${topCoupon.discountValue}%` : `R$ ${topCoupon.discountValue}`)
        : '10%',
    });

    // 4. Acompanhamento / Porção Mais Pedida
    const side = products.find(p => p.id === 'batata-cheddar-bacon')
      || products.find(p => p.category === 'salgados');

    if (side) {
      list.push({
        id: `promo-${side.id}`,
        type: 'product',
        badge: 'MAIS PEDIDO',
        badgeStyle: 'purple',
        title: side.name,
        highlightText: 'Cheddar & Bacon',
        description: side.description || 'Batatas rústicas com calda artesanal de cheddar inglês e farofa de bacon.',
        price: side.price,
        image: side.image,
        ctaText: 'Adicionar Lanche',
        product: side,
      });
    }

    // 5. Chef's Choice / Burger Gourmet Truffle
    const gourmet = products.find(p => p.id === 'gourmet-truffle')
      || products.find(p => p.category === 'burgers' && p.id !== truffleKing?.id);

    if (gourmet && gourmet.id !== truffleKing?.id) {
      list.push({
        id: `promo-${gourmet.id}`,
        type: 'product',
        badge: "CHEF'S SELECTION",
        badgeStyle: 'flame',
        title: gourmet.name,
        highlightText: 'Blend de Angus 200g',
        description: gourmet.description || 'Pão brioche artesanal, maionese de trufas brancas e rúcula baby.',
        price: gourmet.price,
        image: gourmet.image,
        ctaText: 'Experimentar',
        product: gourmet,
      });
    }

    return list;
  }, [products, storeSettings]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleSlideAction = (slide: PromoSlide) => {
    if (slide.type === 'product' && slide.product) {
      onSelectProduct(slide.product);
    } else if (slide.type === 'coupon' && slide.couponCode) {
      navigator.clipboard?.writeText(slide.couponCode);
      setCopiedCoupon(slide.couponCode);
      setTimeout(() => setCopiedCoupon(null), 3000);
    }
  };

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  const getBadgeColors = (style: PromoSlide['badgeStyle']) => {
    switch (style) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'flame':
      default:
        return 'bg-[#ff5722]/20 text-[#ff8a65] border-[#ff5722]/40';
    }
  };

  return (
    <section
      aria-label="Destaques e Promoções do Dia"
      className="relative rounded-2xl overflow-hidden border border-[#ff5722]/30 shadow-xl shadow-black/60 transition-all select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background with Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1b1411] via-[#1a1918] to-[#121212] z-0" />
      <div className="absolute top-0 right-1/4 w-72 h-44 bg-[#ff5722]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-48 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Slide Content */}
      <div
        onClick={() => handleSlideAction(currentSlide)}
        className="relative z-10 flex flex-col md:flex-row items-stretch cursor-pointer min-h-[175px] sm:min-h-[195px] md:min-h-[210px]"
      >
        {/* Left Column: Offer Details */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between space-y-2 md:space-y-3 z-10">
          <div>
            {/* Top metadata row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`text-[9.5px] sm:text-[10px] font-['Montserrat'] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${getBadgeColors(
                  currentSlide.badgeStyle
                )}`}
              >
                <Flame className="w-3 h-3 fill-current" />
                {currentSlide.badge}
              </span>

              {currentSlide.discountTag && (
                <span className="text-[9.5px] font-['Montserrat'] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {currentSlide.discountTag}
                </span>
              )}

              {currentSlide.highlightText && (
                <span className="text-[10px] text-[#b4b5b5] font-medium hidden sm:inline-flex items-center gap-1">
                  <span>•</span>
                  <span>{currentSlide.highlightText}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-['Montserrat'] font-black text-lg sm:text-xl md:text-2xl text-white tracking-tight leading-tight group-hover:text-[#ff8a65] transition-colors">
              {currentSlide.title}
            </h3>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-[#b4b5b5] line-clamp-2 max-w-lg mt-1 leading-relaxed">
              {currentSlide.description}
            </p>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-baseline gap-2">
              {currentSlide.price !== undefined && (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-['Montserrat'] font-black text-lg sm:text-xl md:text-2xl text-[#ff5722]">
                    R$ {currentSlide.price.toFixed(2).replace('.', ',')}
                  </span>
                  {currentSlide.originalPrice && currentSlide.originalPrice > currentSlide.price && (
                    <span className="text-xs sm:text-sm text-[#8e8f8f] line-through font-medium">
                      R$ {currentSlide.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
              )}

              {currentSlide.type === 'coupon' && currentSlide.couponCode && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs sm:text-sm bg-[#141414] border border-dashed border-emerald-500/60 text-emerald-400 px-2.5 py-1 rounded-md">
                    {currentSlide.couponCode}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold hidden xs:inline">
                    {currentSlide.highlightText}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleSlideAction(currentSlide);
              }}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all shrink-0 btn-flame text-white"
            >
              {currentSlide.type === 'coupon' ? (
                copiedCoupon === currentSlide.couponCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{currentSlide.ctaText}</span>
                  </>
                )
              ) : (
                <>
                  <span>{currentSlide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Hero Image with Gradient Vignette */}
        <div className="relative md:w-5/12 h-36 sm:h-44 md:h-auto overflow-hidden">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Subtle gradient overlays so typography and edges blend seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1b1411] via-[#1b1411]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#121212]/80 md:hidden" />

          {/* Quick Rating or Tag Badge on Image */}
          {currentSlide.product?.rating && (
            <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md border border-[#353535] text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{currentSlide.product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Chevrons (Previous / Next) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#ff5722] backdrop-blur-md text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-all z-20 border border-white/10 active:scale-90"
            aria-label="Promoção anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#ff5722] backdrop-blur-md text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-all z-20 border border-white/10 active:scale-90"
            aria-label="Próxima promoção"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Bottom Track: Pagination Dots & Autoplay status */}
      {slides.length > 1 && (
        <div className="absolute bottom-2.5 left-4 md:left-6 z-20 flex items-center gap-1.5">
          {slides.map((s, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full h-1.5 ${
                  isActive
                    ? 'w-6 bg-[#ff5722] shadow-[0_0_8px_rgba(255,87,34,0.6)]'
                    : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            );
          })}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setIsPaused(p => !p);
            }}
            className="ml-2 text-white/50 hover:text-white p-0.5 rounded transition-colors"
            title={isPaused ? 'Reproduzir carrossel' : 'Pausar carrossel'}
          >
            {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
          </button>
        </div>
      )}
    </section>
  );
};
