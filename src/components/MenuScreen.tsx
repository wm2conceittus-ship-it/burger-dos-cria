import React, { useState, useRef, useEffect } from 'react';
import { Product, StoreSettings, CustomerProfile } from '../types';
import { APP_IMAGES } from '../data/mockData';
import { getPublicMenuUrl, copyToClipboard } from '../utils/shareUtils';
import {
  Search,
  Menu as MenuIcon,
  MessageSquare,
  Heart,
  ShoppingCart,
  Plus,
  Flame,
  Utensils,
  Layers,
  Croissant,
  GlassWater,
  Beer,
  Citrus,
  X,
  Sparkles,
  Percent,
  Share2,
  Copy,
  Check,
  Pizza,
  Compass,
  Navigation,
  MapPin,
  User,
  UserCheck,
  UserPlus,
  Phone,
  Lock,
  ChefHat,
  ArrowUp,
  Edit2,
  Trash2,
} from 'lucide-react';

interface MenuScreenProps {
  products: Product[];
  storeSettings?: StoreSettings;
  deliveryAddress?: string;
  customerProfile?: CustomerProfile | null;
  onOpenCustomerRegister?: () => void;
  onOpenAddressModal?: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onOpenCart: () => void;
  onOpenKitchen: () => void;
  onOpenChat: () => void;
  cartCount: number;
  isManager?: boolean;
  onOpenManageMenu?: () => void;
  onOpenEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onOpenAddProduct?: () => void;
}

export type CategoryFilter =
  | 'todos'
  | 'burgers'
  | 'combos'
  | 'pizzas'
  | 'salgados'
  | 'sucos'
  | 'refrigerantes'
  | 'cervejas'
  | 'bebidas';

export const MenuScreen: React.FC<MenuScreenProps> = ({
  products,
  storeSettings,
  deliveryAddress,
  customerProfile,
  onOpenCustomerRegister,
  onOpenAddressModal,
  onSelectProduct,
  onQuickAdd,
  onOpenCart,
  onOpenKitchen,
  onOpenChat,
  cartCount,
  isManager,
  onOpenManageMenu,
  onOpenEditProduct,
  onDeleteProduct,
  onOpenAddProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('burgers');
  const [favorites, setFavorites] = useState<string[]>(['gourmet-truffle']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const getShareUrl = () => {
    return getPublicMenuUrl('', storeSettings?.customMenuUrl);
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    await copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(x - startXRef.current) > 6) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const onMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // Reset hasDragged after click event dispatch cycle
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Group products by category
  const burgers = products.filter(p => p.category === 'burgers');
  const pizzas = products.filter(p => p.category === 'pizzas');
  const combos = products.filter(p => p.category === 'combos');
  const salgados = products.filter(p => p.category === 'salgados');
  const sucos = products.filter(p => p.category === 'sucos');
  const refrigerantes = products.filter(
    p => p.category === 'bebidas' && (p.subCategory === 'refrigerantes' || p.name.toLowerCase().includes('coca') || p.name.toLowerCase().includes('guaraná') || p.name.toLowerCase().includes('fanta') || p.name.toLowerCase().includes('sprite'))
  );
  const cervejas = products.filter(
    p => p.category === 'bebidas' && (p.subCategory === 'cervejas' || p.name.toLowerCase().includes('cerveja'))
  );
  const outrasBebidas = products.filter(
    p => p.category === 'bebidas' && p.subCategory !== 'refrigerantes' && !p.name.toLowerCase().includes('cerveja') && !p.name.toLowerCase().includes('coca') && !p.name.toLowerCase().includes('guaraná') && !p.name.toLowerCase().includes('fanta') && !p.name.toLowerCase().includes('sprite')
  );

  // Filter based on search or category
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery.trim()) {
      return matchesSearch;
    }
    if (selectedCategory === 'todos') {
      return true;
    }
    if (selectedCategory === 'refrigerantes') {
      return (
        p.category === 'bebidas' &&
        (p.subCategory === 'refrigerantes' ||
          p.name.toLowerCase().includes('coca') ||
          p.name.toLowerCase().includes('guaraná') ||
          p.name.toLowerCase().includes('fanta') ||
          p.name.toLowerCase().includes('sprite'))
      );
    }
    if (selectedCategory === 'cervejas' || selectedCategory === 'bebidas') {
      return (
        p.category === 'bebidas' &&
        p.subCategory !== 'refrigerantes' &&
        !p.name.toLowerCase().includes('coca') &&
        !p.name.toLowerCase().includes('guaraná') &&
        !p.name.toLowerCase().includes('fanta') &&
        !p.name.toLowerCase().includes('sprite')
      );
    }
    return p.category === selectedCategory;
  });

  const dailySpecial = products.find(p => p.id === 'truffle-king') || burgers[0];

  return (
    <div className="bg-[#0F0F0F] text-[#e5e2e1] min-h-screen pb-28">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#353535]/30 h-16 px-4 md:px-6">
        <div className="max-w-5xl mx-auto w-full h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-[#ffb5a0] hover:text-white p-1 rounded-full active:scale-95 transition-transform"
              title="Menu lateral"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/40 shadow-sm flex-shrink-0">
              <img
                src={APP_IMAGES.logo}
                alt="Burger dos Crias Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-['Montserrat'] font-extrabold text-sm tracking-tight text-white leading-tight">
                BURGER DOS CRIAS
              </span>
              <span className="text-[10px] text-[#ffb5a0] font-medium tracking-wide">
                O SABOR DO FOGO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-2.5">
            {/* Botão de Cadastro do Cliente */}
            {customerProfile ? (
              <button
                onClick={onOpenCustomerRegister}
                className="h-9 px-2.5 sm:px-3 rounded-full bg-[#20201f] border border-[#ff5722]/40 hover:border-[#ff5722] text-[#ff8a65] hover:text-white flex items-center gap-1.5 text-xs font-['Montserrat'] font-semibold transition-all active:scale-95 shadow-sm"
                title="Meu Cadastro e Endereço"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#ff5722]" />
                <span className="hidden md:inline text-[11px] text-[#b4b5b5]">Olá,</span>
                <span className="max-w-[70px] sm:max-w-[110px] truncate font-bold text-white text-xs">
                  {customerProfile.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenCustomerRegister}
                className="h-9 px-3 rounded-full bg-[#ff5722] hover:bg-[#ff5722]/90 text-white flex items-center gap-1.5 text-xs font-['Montserrat'] font-bold transition-all active:scale-95 shadow-md shadow-[#ff5722]/20 animate-pulse"
                title="Cadastre-se para pedir no cardápio"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cadastrar</span>
                <span className="sm:hidden">Cadastro</span>
              </button>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="h-9 px-3 rounded-md bg-[#ff5722]/15 hover:bg-[#ff5722]/25 border border-[#ff5722]/40 text-[#ff8a65] flex items-center gap-1.5 text-xs font-['Montserrat'] font-bold transition-all active:scale-95 shadow-sm"
              title="Compartilhar Link do Cardápio"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>

            <button
              onClick={onOpenChat}
              className="w-9 h-9 rounded-full bg-[#20201f] border border-[#353535] flex items-center justify-center text-[#ffb5a0] hover:text-white transition-colors"
              title="Atendimento WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenKitchen}
              className="relative w-9 h-9 rounded-full overflow-hidden border border-[#353535] hover:border-[#ff5722] transition-all group"
              title="Acesso do Gestor (Restrito com PIN)"
            >
              <img
                src={APP_IMAGES.userAvatar}
                alt="Gestor"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#1c1b1b] border border-[#ff5722]/80 rounded-full flex items-center justify-center text-[#ff5722] shadow-sm">
                <Lock className="w-2 h-2" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Side Drawer Modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 bg-[#1c1b1b] h-full p-5 flex flex-col justify-between border-r border-[#353535] shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#ff5722]">
                    <img src={APP_IMAGES.logo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-['Montserrat'] font-bold text-sm text-white">
                    Burger dos Crias
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-[#b4b5b5] hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cartão de Identificação do Cliente */}
              {customerProfile ? (
                <div className="bg-[#242323] p-3 rounded-lg border border-[#353535] space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-[#ff8a65] tracking-wider flex items-center gap-1 font-['Montserrat']">
                      <UserCheck className="w-3 h-3 text-[#ff5722]" /> Meu Cadastro
                    </span>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenCustomerRegister?.();
                      }}
                      className="text-[10px] text-[#ffb5a0] hover:text-white underline font-semibold"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{customerProfile.name}</div>
                  <div className="text-[11px] text-[#b4b5b5] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#ff5722]" /> {customerProfile.phone}
                  </div>
                  <div className="text-[10px] text-[#b4b5b5] truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#ff5722] flex-shrink-0" /> {customerProfile.address}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#ff5722]/15 to-[#ff5722]/5 p-3 rounded-lg border border-[#ff5722]/40 space-y-2 text-center shadow-sm">
                  <p className="text-xs font-bold text-white">Olá, visitante!</p>
                  <p className="text-[10px] text-[#b4b5b5]">Cadastre-se para pedir no cardápio e receber seu lanche.</p>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenCustomerRegister?.();
                    }}
                    className="w-full py-2 rounded-md btn-flame font-bold text-xs text-white shadow-md active:scale-95 transition-transform"
                  >
                    Fazer Cadastro 🔥
                  </button>
                </div>
              )}

              <nav className="space-y-1.5 text-sm font-['Montserrat']">
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('todos'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'todos' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Flame className="w-4 h-4 text-[#ff5722]" /> Ver Todos os Itens
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('burgers'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'burgers' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Utensils className="w-4 h-4" /> Burgers Artesanais
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('combos'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'combos' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Combos Especiais
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('pizzas'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'pizzas' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Pizza className="w-4 h-4" /> Pizzas Artesanais
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('salgados'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'salgados' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Croissant className="w-4 h-4" /> Salgados & Batatas
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('sucos'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'sucos' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Citrus className="w-4 h-4 text-[#ff9800]" /> Sucos Naturais
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('refrigerantes'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'refrigerantes' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <GlassWater className="w-4 h-4 text-[#00b0ff]" /> Refrigerantes
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setSelectedCategory('bebidas'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-bold transition-colors ${
                    selectedCategory === 'bebidas' || selectedCategory === 'cervejas' ? 'bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30' : 'text-[#e5e2e1] hover:bg-[#252525]'
                  }`}
                >
                  <Beer className="w-4 h-4 text-amber-400" /> Bebidas
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); onOpenCart(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#2a2a2a] text-[#e5e2e1]"
                >
                  <ShoppingCart className="w-4 h-4 text-[#ffb5a0]" /> Meu Carrinho ({cartCount})
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); setShowShareModal(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#2a2a2a] text-[#ff8a65] font-semibold"
                >
                  <Share2 className="w-4 h-4" /> Compartilhar Cardápio
                </button>
                <button
                  onClick={() => { setDrawerOpen(false); onOpenKitchen(); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[#2a2a2a] text-[#b4b5b5] hover:text-white transition-colors border-t border-[#353535]/40 mt-1"
                >
                  <span className="flex items-center gap-3">
                    <ChefHat className="w-4 h-4 text-[#ff5722]" /> Painel do Gestor
                  </span>
                  <Lock className="w-3.5 h-3.5 text-[#ff8a65]" />
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#353535] text-xs text-[#b4b5b5] space-y-1">
              <p>Horário: Terça a Domingo, 18h - 00h</p>
              <p>📍 São Paulo - SP</p>
            </div>
          </div>
          <div className="flex-grow" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto space-y-6">
        {/* Store Closed Alert if closed */}
        {storeSettings && !storeSettings.isOpen && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-['Montserrat'] font-bold text-xs text-red-400">
                Hamburgueria Fechada no Momento
              </p>
              <p className="text-[11px] text-[#b4b5b5] mt-0.5">
                Você pode visualizar o cardápio, mas os pedidos estão pausados temporariamente.
              </p>
            </div>
            <button
              onClick={onOpenKitchen}
              className="text-[11px] font-bold text-[#ff8a65] underline whitespace-nowrap ml-2"
            >
              Abrir Loja
            </button>
          </div>
        )}

        {/* Delivery Address & GPS Quick Access */}
        {deliveryAddress && (
          <div
            onClick={onOpenCustomerRegister || onOpenAddressModal}
            className="flex items-center justify-between bg-[#1c1b1b] border border-[#353535]/70 hover:border-[#ff5722]/50 p-2.5 px-3.5 rounded-md cursor-pointer transition-all active:scale-98 shadow-sm group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff5722] group-hover:text-white transition-colors">
                <Navigation className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#ff8a65] font-extrabold uppercase tracking-wider font-['Montserrat']">
                    {customerProfile ? `Entregar para ${customerProfile.name.split(' ')[0]}:` : 'Entregar no Endereço:'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                  {deliveryAddress}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="text-[11px] font-bold text-[#ffb5a0] group-hover:text-white px-2.5 py-1.5 rounded-md bg-[#20201f] border border-[#353535] group-hover:border-[#ff5722]/50 transition-colors whitespace-nowrap ml-2 flex items-center gap-1.5 shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>{customerProfile ? 'Alterar Dados' : 'Cadastrar / GPS'}</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <section>
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#b4b5b5] group-focus-within:text-[#ff5722] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="O que vamos grelhar hoje?"
              className="w-full h-14 pl-12 pr-4 bg-[#20201f] border border-[#353535]/60 rounded-lg focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722] transition-all text-sm placeholder:text-[#b4b5b5]/50 shadow-inner"
            />
          </div>
        </section>

        {/* Manager Mode Bar & Quick Actions */}
        {isManager && (
          <section className="bg-gradient-to-r from-[#1c1512] to-[#181818] border border-[#ff5722]/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff5722]/20 border border-[#ff5722]/40 flex items-center justify-center text-[#ff8a65] shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">Modo Gestor Ativo</span>
                  <span className="text-[9.5px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    Painel Aberto
                  </span>
                </div>
                <p className="text-[11px] text-[#b4b5b5] mt-0.5">
                  Para apagar ou editar itens, use os botões <strong>Editar</strong> e <strong>Excluir</strong> diretamente em cada prato ou acesse a Gestão Completa.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {onOpenManageMenu && (
                <button
                  type="button"
                  onClick={onOpenManageMenu}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#353535] text-white text-xs font-['Montserrat'] font-semibold flex items-center justify-center gap-1.5 border border-[#353535] transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-[#ff8a65]" /> Gestão do Cardápio
                </button>
              )}
              {onOpenAddProduct && (
                <button
                  type="button"
                  onClick={onOpenAddProduct}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg btn-flame text-white text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#ff5722]/25"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Prato
                </button>
              )}
            </div>
          </section>
        )}

        {/* Category Buttons Carousel Navigation Bar */}
        <section className="sticky top-16 z-30 bg-[#0F0F0F]/95 backdrop-blur-md py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-[#353535]/40 shadow-md">
          <div className="relative flex items-center max-w-5xl mx-auto">
            {/* Scrollable Container with Pure Drag, Swipe & Touch */}
            <div
              ref={scrollContainerRef}
              onWheel={handleWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUpOrLeave}
              onMouseLeave={onMouseUpOrLeave}
              className={`flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 px-1 select-none w-full touch-pan-x overscroll-x-contain scroll-smooth justify-start ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {[
                { id: 'todos' as const, label: 'Todos', icon: Flame },
                { id: 'burgers' as const, label: 'Burgers', icon: Utensils },
                { id: 'combos' as const, label: 'Combos', icon: Layers },
                { id: 'pizzas' as const, label: 'Pizzas', icon: Pizza },
                { id: 'salgados' as const, label: 'Porções & Salgados', icon: Croissant },
                { id: 'sucos' as const, label: 'Sucos Naturais', icon: Citrus },
                { id: 'refrigerantes' as const, label: 'Refrigerantes', icon: GlassWater },
                { id: 'bebidas' as const, label: 'Bebidas', icon: Beer },
              ].map(cat => {
                const active = selectedCategory === cat.id && !searchQuery.trim();
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={e => {
                      if (hasDraggedRef.current) return;
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                      e.currentTarget.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest',
                      });
                    }}
                    className={`group flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-['Montserrat'] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0 shadow-sm ${
                      active
                        ? 'bg-gradient-to-r from-[#ff5722] to-[#ff3d00] text-white ring-2 ring-[#ff5722]/50 shadow-[0_4px_16px_rgba(255,87,34,0.4)]'
                        : 'bg-[#1c1b1b] text-[#b4b5b5] hover:text-white hover:bg-[#252525] border border-[#353535]/80 hover:border-[#ff5722]/50'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[#2a2a2a] text-[#ff8a65] group-hover:bg-[#ff5722]/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="tracking-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= SEARCH RESULTS VIEW ================= */}
        {searchQuery.trim() && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-['Montserrat'] text-lg font-bold text-white">
                Resultados para "{searchQuery}" ({filteredProducts.length})
              </h3>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#ff5722] font-semibold hover:underline"
              >
                Limpar busca
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-[#20201f] rounded-lg p-8 text-center border border-[#353535] text-[#b4b5b5] text-xs">
                Nenhum item encontrado com o termo "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(prod => (
                  <ProductGridCard
                    key={prod.id}
                    product={prod}
                    isFavorite={favorites.includes(prod.id)}
                    onToggleFavorite={e => toggleFavorite(prod.id, e)}
                    onSelect={() => onSelectProduct(prod)}
                    onQuickAdd={() => onQuickAdd(prod)}
                    isManager={isManager}
                    onEdit={() => onOpenEditProduct?.(prod)}
                    onDelete={() => setProductToDelete(prod)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================= CATEGORIA 1: BURGERS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'burgers' || selectedCategory === 'todos') && (
          <div className="space-y-7">
            {/* Hero Banner: Especial do Dia */}
            {dailySpecial && (
              <div
                onClick={() => onSelectProduct(dailySpecial)}
                className="relative h-60 sm:h-72 w-full rounded-md overflow-hidden shadow-2xl group cursor-pointer border border-[#ff5722]/30 hover:border-[#ff5722] transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent z-10" />
                <img
                  src={dailySpecial.image}
                  alt={dailySpecial.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="relative z-20 h-full flex flex-col justify-center p-5 sm:p-7 max-w-[70%] sm:max-w-[55%]">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40 font-['Montserrat'] text-[10px] font-bold tracking-wider w-fit mb-2">
                    ESPECIAL DO DIA
                  </span>
                  <h2 className="font-['Montserrat'] text-2xl sm:text-3xl font-extrabold text-white mb-1.5 leading-tight">
                    {dailySpecial.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#e4beb4]/90 mb-3 line-clamp-2 font-light">
                    {dailySpecial.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#ff5722] font-['Montserrat'] font-extrabold text-xl sm:text-2xl">
                      R$ {dailySpecial.price.toFixed(0)}
                    </span>
                    {dailySpecial.originalPrice && (
                      <span className="text-[#b4b5b5]/70 line-through text-xs sm:text-sm font-['Montserrat']">
                        R$ {dailySpecial.originalPrice.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Grid de Burgers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#ff5722]" /> Burgers Artesanais
                  </h3>
                  <p className="text-xs text-[#b4b5b5] mt-0.5">Grelhados no fogo com pão brioche artesanal</p>
                </div>
                <span className="text-xs font-semibold text-[#ffb5a0] bg-[#20201f] px-3 py-1 rounded-full border border-[#353535]">
                  {burgers.length} opções
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {burgers.map(burger => (
                  <ProductGridCard
                    key={burger.id}
                    product={burger}
                    isFavorite={favorites.includes(burger.id)}
                    onToggleFavorite={e => toggleFavorite(burger.id, e)}
                    onSelect={() => onSelectProduct(burger)}
                    onQuickAdd={() => onQuickAdd(burger)}
                    isManager={isManager}
                    onEdit={() => onOpenEditProduct?.(burger)}
                    onDelete={() => setProductToDelete(burger)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= CATEGORIA 2: COMBOS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'combos' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#ff5722]" /> Combos Especiais dos Crias
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Burgers + Batatas + Bebidas com desconto exclusivo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {combos.map(combo => (
                <div
                  key={combo.id}
                  onClick={() => onSelectProduct(combo)}
                  className="bg-[#20201f] rounded-md overflow-hidden border border-[#353535]/50 hover:border-[#ff5722]/50 shadow-lg flex flex-col justify-between group cursor-pointer transition-all"
                >
                  <div className="h-48 relative overflow-hidden bg-[#1c1b1b]">
                    <img
                      src={combo.image}
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {combo.tag && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-[#ff5722] text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider font-['Montserrat'] shadow-md flex items-center gap-1">
                          <Percent className="w-3 h-3" /> {combo.tag}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <h4 className="font-['Montserrat'] font-bold text-base text-white">
                          {combo.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-['Montserrat'] font-extrabold text-base text-[#ff5722]">
                            R$ {combo.price.toFixed(2).replace('.', ',')}
                          </span>
                          {combo.originalPrice && (
                            <span className="text-xs text-[#b4b5b5] line-through">
                              R$ {combo.originalPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#b4b5b5] line-clamp-3 font-light mb-4 leading-relaxed">
                        {combo.description}
                      </p>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onQuickAdd(combo);
                      }}
                      className="btn-flame w-full py-3 rounded-md text-white font-['Montserrat'] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Pedir Este Combo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORIA: PIZZAS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'pizzas' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Pizza className="w-5 h-5 text-[#ff5722]" /> Pizzas Artesanais dos Crias
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Massa de fermentação natural, molho de tomate pelado italiano e borda recheada
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pizzas.map(pizza => (
                <ProductGridCard
                  key={pizza.id}
                  product={pizza}
                  isFavorite={favorites.includes(pizza.id)}
                  onToggleFavorite={e => toggleFavorite(pizza.id, e)}
                  onSelect={() => onSelectProduct(pizza)}
                  onQuickAdd={() => onQuickAdd(pizza)}
                  isManager={isManager}
                  onEdit={() => onOpenEditProduct?.(pizza)}
                  onDelete={() => setProductToDelete(pizza)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORIA 3: SALGADOS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'salgados' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Croissant className="w-5 h-5 text-[#ff5722]" /> Salgados, Batatas & Porções
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Acompanhamentos crocantes para turbinar seu pedido
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {salgados.map(salgado => (
                <ProductGridCard
                  key={salgado.id}
                  product={salgado}
                  isFavorite={favorites.includes(salgado.id)}
                  onToggleFavorite={e => toggleFavorite(salgado.id, e)}
                  onSelect={() => onSelectProduct(salgado)}
                  onQuickAdd={() => onQuickAdd(salgado)}
                  isManager={isManager}
                  onEdit={() => onOpenEditProduct?.(salgado)}
                  onDelete={() => setProductToDelete(salgado)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORIA: SUCOS NATURAIS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'sucos' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Citrus className="w-5 h-5 text-[#ff9800]" /> Sucos Natural da Fruta
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                100% da fruta batidos na hora bem gelados • Escolha entre 300ml, 500ml e 1 Litro (1lt)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {sucos.map(suco => (
                <DrinkCard
                  key={suco.id}
                  product={suco}
                  onSelect={() => onSelectProduct(suco)}
                  onQuickAdd={() => onSelectProduct(suco)}
                  isManager={isManager}
                  onEdit={() => onOpenEditProduct?.(suco)}
                  onDelete={() => setProductToDelete(suco)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORIA 4: BEBIDAS GERAIS ================= */}
        {!searchQuery.trim() && selectedCategory === 'bebidas' && (
          <div className="space-y-8">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Beer className="w-5 h-5 text-amber-400" /> Bebidas & Cervejas
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Cervejas trincando de geladas e águas minerais
              </p>
            </div>

            {/* Sub-seção: Cervejas Geladas */}
            {cervejas.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-[#353535]/50 pb-1.5">
                  <h4 className="font-['Montserrat'] text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Beer className="w-4 h-4 text-amber-400" /> Cervejas Geladas (Long Neck & Latas)
                  </h4>
                  <span className="text-[11px] text-[#b4b5b5]">Puro Malte & Premium</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {cervejas.map(cerveja => (
                    <DrinkCard
                      key={cerveja.id}
                      product={cerveja}
                      onQuickAdd={() => onQuickAdd(cerveja)}
                      isManager={isManager}
                      onEdit={() => onOpenEditProduct?.(cerveja)}
                      onDelete={() => setProductToDelete(cerveja)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sub-seção: Águas Minerais & Bebidas */}
            {outrasBebidas.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-[#353535]/50 pb-1.5">
                  <h4 className="font-['Montserrat'] text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#019ad8]" /> Águas Minerais & Outras Bebidas
                  </h4>
                  <span className="text-[11px] text-[#b4b5b5]">Geladas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {outrasBebidas.map(drink => (
                    <DrinkCard
                      key={drink.id}
                      product={drink}
                      onQuickAdd={() => onQuickAdd(drink)}
                      isManager={isManager}
                      onEdit={() => onOpenEditProduct?.(drink)}
                      onDelete={() => setProductToDelete(drink)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= CATEGORIA: REFRIGERANTES ================= */}
        {!searchQuery.trim() && (selectedCategory === 'refrigerantes' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <GlassWater className="w-5 h-5 text-[#ff5722]" /> Refrigerantes
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">Geladinhos para acompanhar seu lanche</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {refrigerantes.map(refri => (
                <DrinkCard
                  key={refri.id}
                  product={refri}
                  onQuickAdd={() => onQuickAdd(refri)}
                  isManager={isManager}
                  onEdit={() => onOpenEditProduct?.(refri)}
                  onDelete={() => setProductToDelete(refri)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORIA: CERVEJAS ================= */}
        {!searchQuery.trim() && (selectedCategory === 'cervejas' || selectedCategory === 'todos') && (
          <div className="space-y-6">
            <div>
              <h3 className="font-['Montserrat'] text-xl font-bold text-white flex items-center gap-2">
                <Beer className="w-5 h-5 text-amber-400" /> Cervejas Geladas
              </h3>
              <p className="text-xs text-[#b4b5b5] mt-0.5">Long Necks e latas trincando de geladas para acompanhar seu burger</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {cervejas.map(cerveja => (
                <DrinkCard
                  key={cerveja.id}
                  product={cerveja}
                  onQuickAdd={() => onQuickAdd(cerveja)}
                  isManager={isManager}
                  onEdit={() => onOpenEditProduct?.(cerveja)}
                  onDelete={() => setProductToDelete(cerveja)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Establishment Info Footer Card */}
        <section className="mt-8 pt-6 border-t border-[#353535]/60 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-[#ff5722]" />
            <h4 className="font-['Montserrat'] font-bold text-sm text-white">
              {storeSettings?.storeName || 'BURGER DOS CRIAS'}
            </h4>
          </div>
          {(storeSettings?.address || storeSettings?.deliveryArea?.baseAddress) && (
            <p className="text-xs text-[#b4b5b5] flex items-center justify-center gap-1.5 max-w-md mx-auto">
              <MapPin className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
              <span>{storeSettings.address || storeSettings.deliveryArea?.baseAddress}</span>
            </p>
          )}
          <p className="text-[11px] text-[#8e8f8f]">
            {storeSettings?.openingHours || 'Terça a Domingo, 18h - 00h'} • WhatsApp: {storeSettings?.whatsappSupport || '(11) 98765-4321'}
          </p>
        </section>
      </main>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed right-4 sm:right-5.5 bottom-29 sm:bottom-32 w-8 h-8 rounded-full bg-[#20201f]/95 hover:bg-[#ff5722] text-[#ff8a65] hover:text-white border border-[#ff5722]/40 backdrop-blur-md flex items-center justify-center shadow-md shadow-black/60 z-40 active:scale-90 transition-all duration-200 animate-in fade-in zoom-in-75 group"
          title="Voltar ao Topo"
          aria-label="Voltar ao Topo"
        >
          <ArrowUp className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Floating Action Cart Button */}
      <button
        onClick={onOpenCart}
        className="fixed right-3.5 sm:right-5 bottom-18 sm:bottom-20 w-9 h-9 rounded-full btn-flame flex items-center justify-center text-white shadow-sm shadow-[#ff5722]/30 z-40 active:scale-95 transition-all hover:scale-105"
        title="Ver Carrinho"
      >
        <ShoppingCart className="w-4 h-4" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#ff5722] font-['Montserrat'] font-black text-[8.5px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
            {cartCount}
          </span>
        )}
      </button>

      {/* Share Menu Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-[#353535] w-full max-w-md rounded-lg p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-[#b4b5b5] hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#ff5722]/20 border border-[#ff5722]/40 flex items-center justify-center text-[#ff5722]">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Link do Cardápio Digital
                </h3>
                <p className="text-xs text-[#b4b5b5]">
                  Envie este link para seus clientes realizarem pedidos online
                </p>
              </div>
            </div>

            {/* Link Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#8e8f8f] uppercase tracking-wider">
                Link Público do Cardápio
              </label>
              <div className="flex items-center gap-2 bg-[#131313] border border-[#353535] rounded-md p-2.5">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="bg-transparent text-xs text-[#e5e2e1] font-mono flex-1 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#ff5722] hover:bg-[#ff7043] text-white'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🍔 *Cardápio Digital - Burger dos Crias*\n\nFaça seu pedido diretamente pelo link abaixo:\n${getShareUrl()}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-['Montserrat'] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar pelo WhatsApp para Clientes</span>
              </a>
            </div>

            {/* Tips Card */}
            <div className="bg-[#20201f] border border-[#353535]/60 rounded-md p-3.5 text-xs text-[#b4b5b5] space-y-1.5">
              <p className="font-semibold text-[#e5e2e1] text-[11px] uppercase tracking-wide">
                💡 Onde divulgar o seu link:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Na <strong>Bio do Instagram</strong> da hamburgueria</li>
                <li>Na mensagem de saudação automática do <strong>WhatsApp Business</strong></li>
                <li>No perfil do <strong>Google Meu Negócio</strong> e redes sociais</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Produto do Cardápio */}
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
    </div>
  );
};

// Sub-component: Product Grid Card (Burgers & Salgados)
const ProductGridCard: React.FC<{
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onQuickAdd: () => void;
  isManager?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onQuickAdd,
  isManager,
  onEdit,
  onDelete,
}) => {
  const isAvailable = product.isAvailable !== false;

  return (
    <div
      onClick={() => isAvailable && onSelect()}
      className={`bg-[#20201f] rounded-md overflow-hidden shadow-lg border transition-all group flex flex-col justify-between ${
        isAvailable
          ? 'border-[#353535]/50 hover:border-[#ff5722]/50 cursor-pointer'
          : 'border-red-900/30 opacity-70 cursor-not-allowed'
      }`}
    >
      <div className="h-44 relative overflow-hidden bg-[#1c1b1b]">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isAvailable ? 'group-hover:scale-108' : 'grayscale'
          }`}
        />

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full font-['Montserrat'] tracking-wider">
              PAUSADO / ESGOTADO
            </span>
          </div>
        )}

        {isAvailable && product.tag && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#ff8a65] border border-[#ff5722]/30 text-[9px] font-bold font-['Montserrat'] tracking-wider">
              {product.tag}
            </span>
          </div>
        )}

        <button
          onClick={onToggleFavorite}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#131313]/70 backdrop-blur-md flex items-center justify-center text-[#ffb5a0] hover:bg-black active:scale-90 transition-all shadow-md"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-[#ff5722] text-[#ff5722]' : ''}`}
          />
        </button>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-['Montserrat'] font-bold text-base text-white">
              {product.name}
            </h4>
            {product.category === 'pizzas' ? (
              <div className="text-right">
                <span className="text-[10px] text-[#b4b5b5] block leading-none">A partir de</span>
                <span className="font-['Montserrat'] font-bold text-sm text-[#ff5722]">
                  R$ {(product.pizzaPrices?.P ?? Math.max(15, product.price - 12)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <span className="font-['Montserrat'] font-bold text-sm text-[#ff5722]">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {product.category === 'pizzas' && (
            <div className="flex items-center justify-between bg-[#1c1b1b] px-2.5 py-1.5 rounded-md border border-[#353535]/60 mb-2">
              <span className="text-[10px] font-bold text-[#ff8a65] flex items-center gap-1 font-['Montserrat']">
                🍕 P • M • G • Família
              </span>
              <span className="text-[10px] text-[#b4b5b5] font-semibold">4 a 12 fatias</span>
            </div>
          )}

          <p className="text-xs text-[#b4b5b5] line-clamp-2 font-light min-h-[32px] mb-3">
            {product.description}
          </p>
        </div>

        {isManager && (
          <div
            className="flex items-center justify-between gap-1.5 pt-2 pb-1.5 border-t border-[#353535]/60 mb-2"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-[10px] text-[#ff8a65] font-extrabold uppercase font-mono">Gestor:</span>
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#252525] hover:bg-[#353535] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-[#353535]"
                >
                  <Edit2 className="w-3 h-3 text-[#ff8a65]" /> Editar
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="px-2.5 py-1 rounded-md bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-red-500/40"
                  title="Excluir este prato do cardápio"
                >
                  <Trash2 className="w-3 h-3 text-red-400" /> Excluir
                </button>
              )}
            </div>
          </div>
        )}

        <button
          disabled={!isAvailable}
          onClick={e => {
            e.stopPropagation();
            if (isAvailable) {
              if (product.category === 'pizzas') {
                onSelect();
              } else {
                onQuickAdd();
              }
            }
          }}
          className={`w-full py-2.5 rounded-md font-['Montserrat'] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
            isAvailable
              ? 'btn-flame text-white active:scale-95'
              : 'bg-[#353535] text-[#b4b5b5] cursor-not-allowed'
          }`}
        >
          {product.category === 'pizzas' ? (
            <>
              <Pizza className="w-3.5 h-3.5" />
              <span>Escolher Tamanho (P, M, G, Família)</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isAvailable ? 'Adicionar' : 'Esgotado'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Sub-component: Drink Card (Bebidas e Sucos)
const DrinkCard: React.FC<{
  product: Product;
  onQuickAdd: () => void;
  onSelect?: () => void;
  isManager?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ product, onQuickAdd, onSelect, isManager, onEdit, onDelete }) => {
  const isAvailable = product.isAvailable !== false;
  const isJuice = product.category === 'sucos';

  const handleAction = () => {
    if (!isAvailable) return;
    if (isJuice && onSelect) {
      onSelect();
    } else {
      onQuickAdd();
    }
  };

  return (
    <div
      onClick={isJuice && onSelect ? onSelect : undefined}
      className={`bg-[#20201f] rounded-lg overflow-hidden border border-[#353535]/50 flex items-center p-3 gap-3 group hover:border-[#ff5722]/40 transition-all shadow-md ${
        isJuice ? 'cursor-pointer hover:border-[#ff9800]/60' : ''
      }`}
    >
      <div className="w-20 h-20 rounded-md overflow-hidden bg-[#1c1b1b] flex-shrink-0 relative">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            !isAvailable ? 'grayscale' : ''
          }`}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[8px] font-bold text-red-400 font-['Montserrat']">
            ESGOTADO
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          <h5 className="font-['Montserrat'] font-bold text-xs text-white truncate">
            {product.name}
          </h5>
          {isJuice && (
            <span className="inline-block text-[9px] font-bold text-[#ffd180] bg-[#ff9800]/15 border border-[#ff9800]/30 px-1.5 py-0.2 rounded font-['Montserrat'] mt-0.5">
              300ml • 500ml • 1lt
            </span>
          )}
          <p className="text-[10px] text-[#b4b5b5] truncate mt-0.5">{product.description}</p>
        </div>

        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-[#353535]/30">
          <div>
            {isJuice && (
              <span className="text-[9px] text-[#b4b5b5] block leading-none">A partir de</span>
            )}
            <span className="font-['Montserrat'] font-bold text-xs text-[#ff5722]">
              R$ {(isJuice ? (product.juicePrices?.['300ml'] ?? Math.max(5, product.price - 3)) : product.price).toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isManager && (
              <div className="flex items-center gap-1 mr-1" onClick={e => e.stopPropagation()}>
                {onEdit && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1.5 rounded-md bg-[#252525] hover:bg-[#353535] text-[#ff8a65] border border-[#353535] transition-colors"
                    title="Editar produto"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="p-1.5 rounded-md bg-red-950/70 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 transition-colors"
                    title="Excluir produto do cardápio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <button
              disabled={!isAvailable}
              onClick={e => {
                e.stopPropagation();
                handleAction();
              }}
              className={`transition-all shadow-sm ${
                isJuice
                  ? 'px-2.5 py-1 rounded-md text-[10px] font-bold font-[' + "'Montserrat'" + '] bg-[#ff9800] text-black hover:opacity-90 active:scale-95'
                  : 'w-7 h-7 rounded-md flex items-center justify-center ' + (isAvailable ? 'bg-[#ff5722] text-white hover:opacity-90 active:scale-90' : 'bg-[#353535] text-[#b4b5b5] cursor-not-allowed')
              }`}
              title={isJuice ? 'Escolher Tamanho (300ml, 500ml, 1lt)' : 'Adicionar Bebida'}
            >
              {isJuice ? (
                <span>Escolher</span>
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
