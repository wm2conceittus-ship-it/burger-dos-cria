import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import {
  X,
  Image as ImageIcon,
  Check,
  Trash2,
  Upload,
  Camera,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { compressImageFile } from '../utils/imageUpload';

const CATEGORY_IMAGE_PRESETS: Record<string, { label: string; url: string }[]> = {
  burgers: [
    { label: 'Smash Clássico', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiCpXDFzLo2i6AtAat0pi5aY8cpQUYfRuf2lbZeJUENy1TTAC_Bp1C6uBfpTVpZo5EBVV-P4x_1BjUgFtYgHZL-qddmIobcNc7lXG8HraY8OO7zkpnTr9cPo8CXh4B_xkAUO1J2kEZ5F6bESJfzGCr5GCSfpvW7aFvJsjpZVH-y5_FDuAVwAZta5HmIc8WjdmPiru6h5LhILUqoQtXc6eN7wGbyqDCpwfNowYZEEKdEzN9rFso8No-Yz7_ictkmFt8jLOplvkWlWY' },
    { label: 'Duplo Bacon', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuSdj4JSzyVbcLchz_WoYBrQfv59DaME1EY3-Dqh9rRiCe3a1JHscojj5Zh6I0bHYIgOaT0yKz9TTdPewC3VaX-QMaySphQYTIa1BWoirXnEspLqzHUTHwIceGngxmsuXyavLYslayAPuIk3g-6sYaAAuCvisE_p10YXn2qH2yV0T4CsnMT2lnHWoTL1DAMExaZ2grmSg_gutXjZA3H0bzhgTrSDPucEiFJmj9L7_YKK0fVL17tMdPxxaayZpSaf30xMZliEfwWy0X' },
    { label: 'Truffled Smash', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBksqjRCHKyH0Wklex97IsdV-IyLaYHuJvgIycYRCZ2-E0J0xdM2CLo7bI5WUr3EG2mT-k_VrxUXGu-wdCH6nDTbeFBMDqV2DVcmbhq9jaqCGW8ZECBOnLt5A6qeIa4LxZajs4NxSzxa1FiwrjdmsKmQzrY_dKXd1hXoAcCpDCCHOilYfzwNg_J8nFyR381Xegf0FNxlECpJYtRqXEtxYc5DIpx9YGEe4dBlZbmher37PdXtE6S3whyIPD7wb4gkkBchuYLdxFX1mb6' },
  ],
  pizzas: [
    { label: 'Calabresa', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Margherita', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
    { label: '4 Queijos', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  ],
  salgados: [
    { label: 'Batata Rústica', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Onion Rings', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
  ],
  sucos: [
    { label: 'Laranja', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80' },
    { label: 'Morango', url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
    { label: 'Maracujá', url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80' },
  ],
  bebidas: [
    { label: 'Refrigerante', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cerveja Artesanal', url: 'https://images.unsplash.com/photo-1608270544520-2c70284c8e76?auto=format&fit=crop&w=800&q=80' },
  ],
  combos: [
    { label: 'Combo Burger + Fritas', url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80' },
  ]
};

interface ProductFormModalProps {
  initialProduct?: Product | null;
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState<Product['category']>(
    initialProduct?.category || 'burgers'
  );
  const [price, setPrice] = useState(initialProduct ? initialProduct.price.toString() : '');
  const [costPrice, setCostPrice] = useState(
    initialProduct?.costPrice !== undefined ? initialProduct.costPrice.toString() : ''
  );
  const [juice300Price, setJuice300Price] = useState(
    initialProduct?.juicePrices?.['300ml'] !== undefined
      ? initialProduct.juicePrices['300ml'].toString()
      : initialProduct?.price ? Math.max(0, initialProduct.price - 3).toFixed(2) : '8.90'
  );
  const [juice500Price, setJuice500Price] = useState(
    initialProduct?.juicePrices?.['500ml'] !== undefined
      ? initialProduct.juicePrices['500ml'].toString()
      : initialProduct?.price ? initialProduct.price.toString() : '11.90'
  );
  const [juice1LPrice, setJuice1LPrice] = useState(
    initialProduct?.juicePrices?.['1L'] !== undefined
      ? initialProduct.juicePrices['1L'].toString()
      : initialProduct?.price ? (initialProduct.price + 8).toFixed(2) : '19.90'
  );
  const [pizzaPPrice, setPizzaPPrice] = useState(
    initialProduct?.pizzaPrices?.P !== undefined
      ? initialProduct.pizzaPrices.P.toString()
      : initialProduct?.price ? Math.max(15, initialProduct.price - 12).toFixed(2) : '37.90'
  );
  const [pizzaMPrice, setPizzaMPrice] = useState(
    initialProduct?.pizzaPrices?.M !== undefined
      ? initialProduct.pizzaPrices.M.toString()
      : initialProduct?.price ? Math.max(15, initialProduct.price - 6).toFixed(2) : '43.90'
  );
  const [pizzaGPrice, setPizzaGPrice] = useState(
    initialProduct?.pizzaPrices?.G !== undefined
      ? initialProduct.pizzaPrices.G.toString()
      : initialProduct?.price ? initialProduct.price.toString() : '49.90'
  );
  const [pizzaFamPrice, setPizzaFamPrice] = useState(
    initialProduct?.pizzaPrices?.Família !== undefined
      ? initialProduct.pizzaPrices.Família.toString()
      : initialProduct?.price ? (initialProduct.price + 16).toFixed(2) : '65.90'
  );
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [image, setImage] = useState(
    initialProduct?.image ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiCpXDFzLo2i6AtAat0pi5aY8cpQUYfRuf2lbZeJUENy1TTAC_Bp1C6uBfpTVpZo5EBVV-P4x_1BjUgFtYgHZL-qddmIobcNc7lXG8HraY8OO7zkpnTr9cPo8CXh4B_xkAUO1J2kEZ5F6bESJfzGCr5GCSfpvW7aFvJsjpZVH-y5_FDuAVwAZta5HmIc8WjdmPiru6h5LhILUqoQtXc6eN7wGbyqDCpwfNowYZEEKdEzN9rFso8No-Yz7_ictkmFt8jLOplvkWlWY'
  );
  const [tag, setTag] = useState(initialProduct?.tag || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Estados para upload de imagem do dispositivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  const processSelectedFile = async (file: File) => {
    setImageError(null);
    setImageSuccessMsg(null);
    setIsProcessingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.82);
      setImage(compressedDataUrl);
      setImageSuccessMsg('Foto carregada e otimizada com sucesso!');
      setTimeout(() => setImageSuccessMsg(null), 3500);
    } catch (err: any) {
      setImageError(err?.message || 'Falha ao processar a imagem do dispositivo.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  // Synchronize when initialProduct prop changes
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || 'burgers');
      setPrice(initialProduct.price !== undefined ? initialProduct.price.toString() : '');
      setCostPrice(initialProduct.costPrice !== undefined ? initialProduct.costPrice.toString() : '');
      setDescription(initialProduct.description || '');
      setImage(initialProduct.image || '');
      setTag(initialProduct.tag || '');
      if (initialProduct.juicePrices) {
        setJuice300Price(initialProduct.juicePrices['300ml']?.toString() || '');
        setJuice500Price(initialProduct.juicePrices['500ml']?.toString() || '');
        setJuice1LPrice(initialProduct.juicePrices['1L']?.toString() || '');
      }
      if (initialProduct.pizzaPrices) {
        setPizzaPPrice(initialProduct.pizzaPrices.P?.toString() || '');
        setPizzaMPrice(initialProduct.pizzaPrices.M?.toString() || '');
        setPizzaGPrice(initialProduct.pizzaPrices.G?.toString() || '');
        setPizzaFamPrice(initialProduct.pizzaPrices.Família?.toString() || '');
      }
    }
  }, [initialProduct]);

  const parseNum = (val: string | number | undefined, fallback = 0): number => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const clean = String(val).replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  };

  const numPrice = parseNum(price, 0);
  const numCost = parseNum(costPrice, 0);
  const grossProfit = numPrice > 0 && numCost > 0 ? numPrice - numCost : 0;
  const profitMargin = numPrice > 0 && numCost > 0 ? (grossProfit / numPrice) * 100 : 0;
  const markup = numCost > 0 ? numPrice / numCost : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseNum(price, 0);
    const basePrice = category === 'sucos'
      ? (parseNum(juice500Price, 0) || parsedPrice || 11.90)
      : category === 'pizzas'
      ? (parseNum(pizzaGPrice, 0) || parsedPrice || 49.90)
      : parsedPrice;

    const savedProduct: Product = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      category,
      price: basePrice,
      costPrice: costPrice.trim() ? parseNum(costPrice) : undefined,
      description: description.trim() || 'Feito com ingredientes frescos.',
      image,
      tag: tag.trim() || undefined,
      isAvailable: initialProduct?.isAvailable ?? true,
      subCategory: initialProduct?.subCategory,
      juicePrices: category === 'sucos' ? {
        '300ml': parseNum(juice300Price, Math.max(0, basePrice - 3)),
        '500ml': parseNum(juice500Price, basePrice),
        '1L': parseNum(juice1LPrice, basePrice + 8),
      } : undefined,
      pizzaPrices: category === 'pizzas' ? {
        P: parseNum(pizzaPPrice, Math.max(15, basePrice - 12)),
        M: parseNum(pizzaMPrice, Math.max(15, basePrice - 6)),
        G: parseNum(pizzaGPrice, basePrice),
        Família: parseNum(pizzaFamPrice, basePrice + 16),
      } : undefined,
      options: initialProduct?.options || (category === 'burgers' ? {
        meatDoneness: true,
        additionals: [
          { id: 'bacon', name: 'Bacon extra', subtitle: '+ Duas fatias crocantes', price: 6.00 },
          { id: 'cheddar', name: 'Queijo cheddar', subtitle: '+ Dose extra cremosa', price: 4.50 },
        ]
      } : category === 'pizzas' ? {
        additionals: [
          { id: 'borda-catupiry', name: 'Borda Recheada de Catupiry', subtitle: '+ Borda vulcão cremosa', price: 9.90 },
          { id: 'borda-cheddar', name: 'Borda Recheada de Cheddar', subtitle: '+ Cheddar cremoso', price: 9.90 },
          { id: 'queijo-extra', name: 'Mussarela Extra', subtitle: '+ Camada dupla de queijo', price: 7.50 },
        ]
      } : undefined)
    };

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#20201f] border border-[#353535] rounded-2xl w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(255,87,34,0.15)] flex flex-col max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-3.5 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {category === 'pizzas' ? '🍕' : category === 'sucos' ? '🥤' : '🍔'}
            </span>
            <h3 className="font-['Montserrat'] font-bold text-sm text-white">
              {initialProduct ? 'Editar Item do Cardápio' : 'Novo Item no Cardápio'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#b4b5b5] hover:text-white p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="product-form" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-[#b4b5b5] mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Double Cheddar Bacon"
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
            />
          </div>

          <div>
            <label className="block text-[#b4b5b5] mb-1">Categoria *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
            >
              <option value="burgers">Burgers</option>
              <option value="pizzas">Pizzas</option>
              <option value="combos">Combos</option>
              <option value="salgados">Salgados & Porções</option>
              <option value="sucos">Sucos</option>
              <option value="bebidas">Bebidas</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#b4b5b5] mb-1 font-medium flex items-center justify-between">
                <span>
                  {category === 'pizzas'
                    ? 'Preço Base (Tam. G)'
                    : category === 'sucos'
                    ? 'Preço Base (500ml)'
                    : 'Preço de Venda (R$)'} *
                </span>
                {(category === 'pizzas' || category === 'sucos') && (
                  <span className="text-[10px] text-[#ff8a65] font-semibold">Tamanho Padrão</span>
                )}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#8e8f8f]">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={price}
                  onChange={e => {
                    setPrice(e.target.value);
                    if (category === 'pizzas') setPizzaGPrice(e.target.value);
                    if (category === 'sucos') setJuice500Price(e.target.value);
                  }}
                  placeholder="Ex: 38.00"
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-[#ff5722] font-semibold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#b4b5b5] font-medium">Preço de Custo (R$)</label>
                <span className="text-[10px] text-emerald-400 font-semibold">Insumos/CMV</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-emerald-500/70">R$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="Ex: 12.50"
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Indicador de Margem e Lucro em Tempo Real */}
          {numPrice > 0 && numCost > 0 && (
            <div className="p-3 bg-[#181818] border border-emerald-500/30 rounded-xl flex items-center justify-between text-[11px] shadow-inner">
              <div>
                <span className="text-[#8e8f8f] block text-[10px]">Lucro Bruto Un.:</span>
                <span className="font-bold text-emerald-400 font-mono text-xs">
                  R$ {grossProfit.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div>
                <span className="text-[#8e8f8f] block text-[10px]">Margem de Lucro:</span>
                <span
                  className={`font-bold font-mono text-xs ${
                    profitMargin >= 60 ? 'text-emerald-400' : profitMargin >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[#8e8f8f] block text-[10px]">Markup:</span>
                <span className="font-bold text-[#ff8a65] font-mono text-xs">
                  {markup.toFixed(2)}x
                </span>
              </div>
            </div>
          )}

          {category === 'pizzas' && (
            <div className="p-3 bg-gradient-to-br from-[#24201e] to-[#1a1817] border border-[#ff5722]/40 rounded-xl space-y-2.5 shadow-lg shadow-black/60 ring-1 ring-[#ff5722]/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-['Montserrat'] font-bold text-white flex items-center gap-1.5">
                  🍕 Preços por Tamanho (P, M, G, Família)
                </span>
                <span className="text-[10px] text-[#ff8a65] font-semibold">Tabela de Valores</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* P */}
                <div className="flex items-center justify-between bg-[#171616] px-2.5 py-1.5 rounded-lg border border-[#353535] focus-within:border-[#ff5722] transition-colors shadow-sm">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">P (4 fat.)</span>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#8e8f8f]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={pizzaPPrice}
                      onChange={e => setPizzaPPrice(e.target.value)}
                      placeholder="37.90"
                      className="w-full bg-[#101010] border border-[#353535] rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>
                </div>

                {/* M */}
                <div className="flex items-center justify-between bg-[#171616] px-2.5 py-1.5 rounded-lg border border-[#353535] focus-within:border-[#ff5722] transition-colors shadow-sm">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">M (6 fat.)</span>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#8e8f8f]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={pizzaMPrice}
                      onChange={e => setPizzaMPrice(e.target.value)}
                      placeholder="43.90"
                      className="w-full bg-[#101010] border border-[#353535] rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>
                </div>

                {/* G */}
                <div className="flex items-center justify-between bg-[#171616] px-2.5 py-1.5 rounded-lg border border-[#ff5722]/60 ring-1 ring-[#ff5722]/30 focus-within:border-[#ff5722] transition-colors shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-['Montserrat'] font-bold text-xs text-white">G (8 fat.)</span>
                    <span className="text-[8px] bg-[#ff5722] text-white px-1 py-0.2 rounded font-extrabold uppercase">Padrão</span>
                  </div>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#ff8a65]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={pizzaGPrice}
                      onChange={e => {
                        setPizzaGPrice(e.target.value);
                        setPrice(e.target.value);
                      }}
                      placeholder="49.90"
                      className="w-full bg-[#101010] border border-[#ff5722]/60 rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>
                </div>

                {/* Família */}
                <div className="flex items-center justify-between bg-[#171616] px-2.5 py-1.5 rounded-lg border border-[#353535] focus-within:border-[#ff5722] transition-colors shadow-sm">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">Família (12 f.)</span>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#8e8f8f]">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={pizzaFamPrice}
                      onChange={e => setPizzaFamPrice(e.target.value)}
                      placeholder="65.90"
                      className="w-full bg-[#101010] border border-[#353535] rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {category === 'sucos' && (
            <div className="p-2.5 bg-[#ff9800]/10 border border-[#ff9800]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-['Montserrat'] font-bold text-white flex items-center gap-1.5">
                  🥤 Preços por Tamanho
                </span>
                <span className="text-[10px] text-[#ffd180]">300ml, 500ml e 1L</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center justify-between bg-[#1c1b1b] px-2.5 py-1.5 rounded-lg border border-[#353535] focus-within:border-[#ff9800] transition-colors">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">300ml</span>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#8e8f8f]">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={juice300Price}
                      onChange={e => setJuice300Price(e.target.value)}
                      placeholder="8.90"
                      className="w-full bg-[#141414] border border-[#353535] rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff9800]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#1c1b1b] px-2.5 py-1.5 rounded-lg border border-[#ff9800]/50 ring-1 ring-[#ff9800]/30 focus-within:border-[#ff9800] transition-colors">
                  <div className="flex items-center gap-1">
                    <span className="font-['Montserrat'] font-bold text-xs text-white">500ml</span>
                    <span className="text-[8px] bg-[#ff9800] text-black px-1 py-0.2 rounded font-extrabold uppercase">Padrão</span>
                  </div>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#ff9800]">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={juice500Price}
                      onChange={e => {
                        setJuice500Price(e.target.value);
                        setPrice(e.target.value);
                      }}
                      placeholder="11.90"
                      className="w-full bg-[#141414] border border-[#ff9800]/60 rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff9800]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#1c1b1b] px-2.5 py-1.5 rounded-lg border border-[#353535] focus-within:border-[#ff9800] transition-colors">
                  <span className="font-['Montserrat'] font-bold text-xs text-white">1 Litro</span>
                  <div className="relative flex items-center w-20 sm:w-24">
                    <span className="absolute left-2 text-[11px] font-bold text-[#8e8f8f]">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={juice1LPrice}
                      onChange={e => setJuice1LPrice(e.target.value)}
                      placeholder="19.90"
                      className="w-full bg-[#141414] border border-[#353535] rounded pl-6 pr-1.5 py-1 text-white font-bold text-xs text-right focus:outline-none focus:border-[#ff9800]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#b4b5b5] mb-1">Destaque / Tag (Opcional)</label>
            <input
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              placeholder="Ex: NOVIDADE, BEST-SELLER, ESPECIAL"
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#ff5722]"
            />
          </div>

          <div>
            <label className="block text-[#b4b5b5] mb-1">Descrição / Ingredientes</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: 2x Smash 90g, queijo cheddar inglês, cebola crispy..."
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#ff5722] resize-none"
            />
          </div>

          {/* Seção de Foto do Produto com Upload do Dispositivo */}
          <div className="space-y-2 pt-1 border-t border-[#353535]/60">
            <div className="flex items-center justify-between">
              <label className="text-[#b4b5b5] font-medium flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-4 h-4 text-[#ff5722]" />
                <span>Foto do Produto *</span>
              </label>

              {/* Seletor de Método (Dispositivo / Link / Sugestões) */}
              <div className="flex bg-[#141414] p-0.5 rounded-lg border border-[#353535]">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    imageTab === 'upload'
                      ? 'bg-[#ff5722] text-white shadow-sm'
                      : 'text-[#8e8f8f] hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Do Dispositivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    imageTab === 'url'
                      ? 'bg-[#ff5722] text-white shadow-sm'
                      : 'text-[#8e8f8f] hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Link URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('presets')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    imageTab === 'presets'
                      ? 'bg-[#ff5722] text-white shadow-sm'
                      : 'text-[#8e8f8f] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sugestões</span>
                </button>
              </div>
            </div>

            {/* Input de arquivo oculto para upload do celular / computador */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Feedback de erro e sucesso */}
            {imageError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/50 flex items-center gap-2 text-[11px] text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}
            {imageSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2 text-[11px] text-emerald-300 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{imageSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: Upload direto do Dispositivo (Celular / Computador) */}
            {imageTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessingImage && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-3.5 sm:p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#ff5722] bg-[#ff5722]/15 scale-[1.01]'
                    : 'border-[#ff5722]/40 hover:border-[#ff5722] bg-[#181716] hover:bg-[#1f1d1b]'
                }`}
              >
                {isProcessingImage ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-7 h-7 text-[#ff5722] animate-spin" />
                    <p className="font-semibold text-xs text-white">Processando e otimizando imagem...</p>
                    <p className="text-[10px] text-[#8e8f8f]">Redimensionando para carregamento rápido no cardápio</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-14 h-14 rounded-lg bg-[#242221] border border-[#353535] overflow-hidden shrink-0 flex items-center justify-center">
                        {image ? (
                          <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-[#8e8f8f]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-[#ff5722]" />
                          Carregar Foto do Dispositivo
                        </p>
                        <p className="text-[10px] text-[#8e8f8f] mt-0.5">
                          Toque para escolher da galeria, câmera ou arquivos
                        </p>
                        <p className="text-[9px] text-[#ff8a65] mt-0.5">
                          Suporta JPG, PNG, WEBP (otimização automática)
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg btn-flame text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Escolher Arquivo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Inserir Link da Web (URL) */}
            {imageTab === 'url' && (
              <div className="space-y-1.5 bg-[#181716] p-3 rounded-xl border border-[#353535]">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="Cole o link da foto (https://...)"
                    className="flex-grow bg-[#141414] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722] text-[11px]"
                  />
                  <div className="w-10 h-10 rounded-lg bg-[#141414] border border-[#353535] overflow-hidden flex-shrink-0">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#8e8f8f]">
                  Cole o endereço de qualquer imagem online pública.
                </p>
              </div>
            )}

            {/* TAB 3: Sugestões e Presets Rápidos */}
            {imageTab === 'presets' && (
              <div className="bg-[#181716] p-3 rounded-xl border border-[#353535] space-y-2">
                <p className="text-[10px] text-[#8e8f8f]">
                  Fotos profissionais prontas para {category}:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(CATEGORY_IMAGE_PRESETS[category] || CATEGORY_IMAGE_PRESETS.burgers).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImage(preset.url);
                        setImageSuccessMsg(`Foto "${preset.label}" aplicada!`);
                        setTimeout(() => setImageSuccessMsg(null), 2500);
                      }}
                      className={`group relative rounded-lg overflow-hidden border text-left p-1 transition-all ${
                        image === preset.url
                          ? 'border-[#ff5722] ring-1 ring-[#ff5722] bg-[#ff5722]/10'
                          : 'border-[#353535] hover:border-[#666] bg-[#141414]'
                      }`}
                    >
                      <div className="w-full h-14 rounded overflow-hidden mb-1">
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-[9.5px] font-medium text-white truncate px-0.5">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pré-visualização atual com opções de visualização rápida */}
            {image && (
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#141414] rounded-lg border border-[#353535]/70 text-[10px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[#b4b5b5] truncate">
                    {image.startsWith('data:image') ? 'Foto do dispositivo carregada (base64 otimizado)' : image}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#ff8a65] hover:text-white font-bold ml-2 shrink-0 transition-colors"
                >
                  Alterar Foto
                </button>
              </div>
            )}
          </div>
        </form>

        <div className="px-5 py-3 border-t border-[#353535] bg-[#1c1b1b] flex flex-col gap-2 flex-shrink-0">
          {showConfirmDelete ? (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Excluir permanentemente do cardápio?</p>
                  <p className="text-[11px] text-red-300">O produto "{initialProduct?.name}" será removido do sistema.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#353535] text-white text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (initialProduct && onDelete) {
                      onDelete(initialProduct.id);
                      onClose();
                    }
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sim, Excluir
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 w-full">
              {initialProduct && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-400 font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Excluir este produto do cardápio"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Excluir</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#353535] text-white py-2.5 rounded-xl font-['Montserrat'] font-semibold transition-colors text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-form"
                className="flex-1 btn-flame text-white py-2.5 rounded-xl font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#ff5722]/25 text-xs"
              >
                <Check className="w-4 h-4" /> Salvar Produto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
