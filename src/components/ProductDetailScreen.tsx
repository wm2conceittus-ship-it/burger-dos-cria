import React, { useState } from 'react';
import { Product, CartItem, PizzaSize, JuiceSize } from '../types';
import { ArrowLeft, Heart, Minus, Plus, Star, Pizza, Users, Citrus, Edit2, Trash2 } from 'lucide-react';
import { PIZZA_SIZES, JUICE_SIZES } from '../data/mockData';

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (item: CartItem) => void;
  onOpenCart: () => void;
  isManager?: boolean;
  onOpenEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onAddToCart,
  onOpenCart,
  isManager,
  onOpenEditProduct,
  onDeleteProduct,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [meatDoneness, setMeatDoneness] = useState<'Mal passado' | 'Ao ponto' | 'Bem passado'>('Ao ponto');
  const [pizzaSize, setPizzaSize] = useState<PizzaSize>('G');
  const [juiceSize, setJuiceSize] = useState<JuiceSize>('500ml');
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPizza = product.category === 'pizzas';
  const isJuice = product.category === 'sucos';
  const selectedSizeConfig = PIZZA_SIZES.find(s => s.id === pizzaSize) || PIZZA_SIZES[2];
  const selectedJuiceSizeConfig = JUICE_SIZES.find(s => s.id === juiceSize) || JUICE_SIZES[1];

  const getPizzaPrice = (sizeId: PizzaSize) => {
    if (product.pizzaPrices?.[sizeId] !== undefined) {
      return product.pizzaPrices[sizeId]!;
    }
    const cfg = PIZZA_SIZES.find(s => s.id === sizeId);
    return Math.max(15, product.price + (cfg ? cfg.priceOffset : 0));
  };

  const getJuicePrice = (sizeId: JuiceSize) => {
    if (product.juicePrices?.[sizeId] !== undefined) {
      return product.juicePrices[sizeId]!;
    }
    const cfg = JUICE_SIZES.find(s => s.id === sizeId);
    return Math.max(5, product.price + (cfg ? cfg.priceOffset : 0));
  };

  const additionalsList = product.options?.additionals || [
    { id: 'bacon', name: 'Bacon extra', subtitle: '+ Duas fatias crocantes', price: 6.00 },
    { id: 'cheddar', name: 'Queijo cheddar', subtitle: '+ Dose extra cremosa', price: 4.50 },
    { id: 'cebola', name: 'Cebola caramelizada', subtitle: '+ Doçura artesanal', price: 3.00 },
  ];

  const toggleAdditional = (id: string) => {
    setSelectedAdditionals(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const additionalsTotal = selectedAdditionals.reduce((sum, id) => {
    const item = additionalsList.find(a => a.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  // Calculate base price based on pizza or juice size offset
  const basePriceWithSize = isPizza
    ? getPizzaPrice(pizzaSize)
    : isJuice
    ? getJuicePrice(juiceSize)
    : product.price;

  const unitPrice = basePriceWithSize + additionalsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    const chosenAdditionals = additionalsList
      .filter(a => selectedAdditionals.includes(a.id))
      .map(a => ({ id: a.id, name: a.name, price: a.price }));

    onAddToCart({
      id: `${product.id}-${Date.now()}`,
      product,
      quantity,
      meatDoneness: product.options?.meatDoneness ? meatDoneness : undefined,
      pizzaSize: isPizza ? pizzaSize : undefined,
      pizzaSlices: isPizza ? `${selectedSizeConfig.slices} (${selectedSizeConfig.diameter})` : undefined,
      juiceSize: isJuice ? juiceSize : undefined,
      additionals: chosenAdditionals,
      notes: notes.trim() || undefined,
      totalPrice,
    });
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-36">
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[480px] overflow-hidden">
        {/* Floating Top Controls: Seta Voltar e Curtida / Like */}
        <div className="absolute top-4 left-0 w-full z-30 px-4 sm:px-6 pointer-events-none">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <button
              onClick={onBack}
              className="pointer-events-auto bg-black/70 hover:bg-[#ff5722] text-white backdrop-blur-md p-3 rounded-full border border-white/20 shadow-2xl active:scale-90 transition-all flex items-center justify-center group"
              title="Voltar ao Cardápio"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-white" />
            </button>

            {isManager && (
              <div className="pointer-events-auto flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#ff5722]/50 shadow-2xl">
                <span className="text-[10px] text-[#ff8a65] font-extrabold uppercase font-mono mr-1 hidden sm:inline">Gestor:</span>
                {onOpenEditProduct && (
                  <button
                    onClick={() => onOpenEditProduct(product)}
                    className="px-2.5 py-1 rounded-md bg-[#252525] hover:bg-[#ff5722] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-[#ff8a65]" /> Editar
                  </button>
                )}
                {onDeleteProduct && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-2.5 py-1 rounded-md bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-red-500/40"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" /> Excluir
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`pointer-events-auto bg-black/70 backdrop-blur-md p-3 rounded-full border border-white/20 shadow-2xl active:scale-90 transition-all flex items-center justify-center group ${
                isFavorite ? 'hover:bg-black/90' : 'hover:bg-[#252525]'
              }`}
              title={isFavorite ? 'Descurtir' : 'Curtir / Favoritar'}
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isFavorite ? 'fill-[#ff5722] text-[#ff5722]' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/30 to-transparent z-10" />
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute bottom-0 left-0 w-full p-5 z-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 mb-2">
              <span className="bg-[#ff5722]/20 text-[#ff8a65] px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-[#ff5722]/30">
                {product.tag || 'Gourmet'}
              </span>
              <span className="bg-[#019ad8]/20 text-[#86cfff] px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border border-[#019ad8]/30">
                <Star className="w-3.5 h-3.5 fill-[#86cfff]" />
                {product.rating || 4.9}
              </span>
            </div>
            <h1 className="font-['Montserrat'] text-2xl md:text-3xl font-extrabold text-[#e5e2e1] tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm md:text-base text-[#e4beb4]/90 max-w-2xl mt-1.5 leading-relaxed font-light">
              {product.description}
            </p>
          </div>
        </div>
      </section>

      {/* Options Form */}
      <section className="px-5 mt-6 space-y-7 max-w-2xl mx-auto">
        {/* Tamanho da Pizza (P, M, G ou Família) */}
        {isPizza && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-['Montserrat'] text-lg font-bold text-[#ffb5a0] flex items-center gap-2">
                  <Pizza className="w-5 h-5 text-[#ff5722]" /> Escolha o Tamanho da Pizza
                </h2>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Selecione o tamanho ideal: P, M, G ou Família
                </p>
              </div>
              <span className="text-xs text-[#ff5722] bg-[#ff5722]/15 border border-[#ff5722]/30 px-2.5 py-1 rounded-md font-bold">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIZZA_SIZES.map(size => {
                const isSelected = pizzaSize === size.id;
                const calculatedPrice = getPizzaPrice(size.id);

                return (
                  <div
                    key={size.id}
                    onClick={() => setPizzaSize(size.id)}
                    className={`p-3.5 bg-[#20201f] rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#ff5722] bg-[#ff5722]/10 shadow-[0_0_18px_rgba(255,87,34,0.2)] ring-1 ring-[#ff5722]'
                        : 'border-[#353535]/60 hover:bg-[#282828] hover:border-[#ff5722]/40'
                    }`}
                  >
                    {size.isPopular && (
                      <span className="absolute -top-2.5 right-3 bg-[#ff5722] text-white text-[10px] font-['Montserrat'] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        Mais Pedida 🔥
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center font-['Montserrat'] font-black text-sm transition-all ${
                            isSelected
                              ? 'bg-[#ff5722] text-white shadow-md'
                              : 'bg-[#2a2a2a] text-[#ffb5a0] border border-[#353535]'
                          }`}
                        >
                          {size.id === 'Família' ? 'FAM' : size.id}
                        </div>
                        <div>
                          <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                            {size.label}
                          </h3>
                          <span className="text-[11px] text-[#ff8a65] font-semibold block">
                            {size.slices} • {size.diameter}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                          isSelected ? 'border-[#ff5722] bg-[#ff5722]' : 'border-[#ab8980]/50'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#353535]/50 text-xs">
                      <span className="text-[#b4b5b5] text-[11px] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#8e8f8f]" /> {size.people}
                      </span>
                      <span className="font-['Montserrat'] font-extrabold text-sm text-white whitespace-nowrap shrink-0">
                        R$&nbsp;{calculatedPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Escolha do Tamanho do Suco Natural (300ml, 500ml, 1lt) */}
        {isJuice && (
          <div className="space-y-3.5 bg-[#1c1b1b] p-4 rounded-xl border border-[#ff9800]/40 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-['Montserrat'] text-base font-bold text-white flex items-center gap-2">
                  <Citrus className="w-5 h-5 text-[#ff9800]" /> Escolha o Tamanho do Suco
                </h2>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Selecione entre 300ml, 500ml ou 1 Litro (1lt) bem geladinho
                </p>
              </div>
              <span className="text-xs text-[#ff9800] bg-[#ff9800]/15 border border-[#ff9800]/30 px-2.5 py-1 rounded-md font-bold">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {JUICE_SIZES.map(size => {
                const isSelected = juiceSize === size.id;
                const calculatedPrice = getJuicePrice(size.id);

                return (
                  <div
                    key={size.id}
                    onClick={() => setJuiceSize(size.id)}
                    className={`p-3.5 bg-[#20201f] rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#ff9800] bg-[#ff9800]/10 shadow-[0_0_18px_rgba(255,152,0,0.25)] ring-1 ring-[#ff9800]'
                        : 'border-[#353535]/60 hover:bg-[#282828] hover:border-[#ff9800]/40'
                    }`}
                  >
                    {size.isPopular && (
                      <span className="absolute -top-2.5 right-3 bg-[#ff9800] text-black text-[10px] font-['Montserrat'] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        Mais Pedido 🔥
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center font-['Montserrat'] font-black text-xs transition-all ${
                            isSelected
                              ? 'bg-[#ff9800] text-black shadow-md font-bold'
                              : 'bg-[#2a2a2a] text-[#ffd180] border border-[#353535]'
                          }`}
                        >
                          {size.id === '1L' ? '1LT' : size.id}
                        </div>
                        <div>
                          <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                            {size.label}
                          </h3>
                          <span className="text-[11px] text-[#ffb74d] font-semibold block">
                            {size.volume}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                          isSelected ? 'border-[#ff9800] bg-[#ff9800]' : 'border-[#ab8980]/50'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-[#b4b5b5] my-1 font-light">
                      {size.description}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-[#353535]/50 text-xs">
                      <span className="text-[#8e8f8f] text-[10px]">Preço unitário</span>
                      <span className="font-['Montserrat'] font-extrabold text-sm text-white whitespace-nowrap shrink-0">
                        R$&nbsp;{calculatedPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ponto da Carne */}
        {product.options?.meatDoneness && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h2 className="font-['Montserrat'] text-lg font-bold text-[#ffb5a0]">
                Escolha o ponto da carne
              </h2>
              <span className="text-xs text-[#b4b5b5] bg-[#20201f] px-2.5 py-1 rounded-md border border-[#353535]">
                Obrigatório
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {(['Mal passado', 'Ao ponto', 'Bem passado'] as const).map(option => {
                const isSelected = meatDoneness === option;
                return (
                  <label
                    key={option}
                    onClick={() => setMeatDoneness(option)}
                    className={`flex items-center justify-between p-4 bg-[#20201f] rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#ff5722] bg-[#ff5722]/10 shadow-[0_0_15px_rgba(255,87,34,0.15)]'
                        : 'border-[#353535]/50 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <span className="text-base font-medium">{option}</span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#ff5722]' : 'border-[#ab8980]/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-[#ff5722]" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Adicionais */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="font-['Montserrat'] text-lg font-bold text-[#ffb5a0]">
              Adicionais
            </h2>
            <span className="text-xs text-[#b4b5b5]">Opcional</span>
          </div>
          <div className="space-y-2.5">
            {additionalsList.map(item => {
              const checked = selectedAdditionals.includes(item.id);
              return (
                <label
                  key={item.id}
                  onClick={() => toggleAdditional(item.id)}
                  className={`flex items-center gap-3.5 p-4 bg-[#20201f] rounded-md border cursor-pointer transition-all ${
                    checked
                      ? 'border-[#ff5722]/70 bg-[#ff5722]/5'
                      : 'border-[#353535]/50 hover:bg-[#2a2a2a]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="h-5 w-5 rounded border-[#ab8980] bg-transparent text-[#ff5722] focus:ring-[#ff5722] accent-[#ff5722]"
                  />
                  <div className="flex-grow">
                    <p className="text-base font-medium text-white">{item.name}</p>
                    <p className="text-xs text-[#b4b5b5] mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#ffb5a0] whitespace-nowrap shrink-0 pl-2">
                    + R$&nbsp;{item.price.toFixed(2).replace('.', ',')}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <h2 className="font-['Montserrat'] text-lg font-bold text-[#ffb5a0]">
            Alguma observação?
          </h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex: Tirar o tomate, ponto mais passado, caprichar no molho..."
            className="w-full bg-[#20201f] border border-[#353535] rounded-md p-3.5 text-sm text-[#e5e2e1] placeholder:text-[#b4b5b5]/50 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722] transition-all resize-none"
          />
        </div>
      </section>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-gradient-to-t from-[#131313] via-[#131313]/95 to-transparent p-5 pt-8">
        <div className="max-w-2xl mx-auto flex gap-3.5 items-center">
          {/* Counter */}
          <div className="flex items-center bg-[#20201f] rounded-md p-1 border border-[#353535]">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-[#e5e2e1] hover:text-[#ff5722] disabled:opacity-40 transition-colors active:scale-90"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-8 text-center font-bold text-lg font-['Montserrat']">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-[#e5e2e1] hover:text-[#ff5722] transition-colors active:scale-90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* CTA Add to cart */}
          <button
            onClick={handleAdd}
            className="flex-grow btn-flame text-white py-3 px-5 rounded-md font-['Montserrat'] text-base md:text-lg flex justify-between items-center active:scale-95 transition-all shadow-xl"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] uppercase font-semibold opacity-85 tracking-wider">
                Adicionar
              </span>
              <span className="font-bold">ao Carrinho</span>
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] opacity-85">Total</span>
              <span className="font-extrabold text-base md:text-lg whitespace-nowrap">
                R$&nbsp;{totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal de Exclusão do Produto */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-red-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Excluir este item do cardápio?
                </h3>
                <p className="text-xs text-[#b4b5b5] mt-0.5">
                  Esta ação removerá "{product.name}" permanentemente do sistema e do banco de dados Firebase.
                </p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#353535] rounded-xl p-3 flex items-center gap-3 mb-5">
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover bg-[#20201f] shrink-0 border border-[#353535]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{product.name}</h4>
                <span className="text-xs font-bold text-[#ff5722] block mt-0.5">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#353535] text-white text-xs font-['Montserrat'] font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteProduct) {
                    onDeleteProduct(product.id);
                  }
                  onBack();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
