import React, { useState } from 'react';
import { Product } from '../types';
import { X, Image as ImageIcon, Check } from 'lucide-react';

interface ProductFormModalProps {
  initialProduct?: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  onSave,
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
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [image, setImage] = useState(
    initialProduct?.image ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiCpXDFzLo2i6AtAat0pi5aY8cpQUYfRuf2lbZeJUENy1TTAC_Bp1C6uBfpTVpZo5EBVV-P4x_1BjUgFtYgHZL-qddmIobcNc7lXG8HraY8OO7zkpnTr9cPo8CXh4B_xkAUO1J2kEZ5F6bESJfzGCr5GCSfpvW7aFvJsjpZVH-y5_FDuAVwAZta5HmIc8WjdmPiru6h5LhILUqoQtXc6eN7wGbyqDCpwfNowYZEEKdEzN9rFso8No-Yz7_ictkmFt8jLOplvkWlWY'
  );
  const [tag, setTag] = useState(initialProduct?.tag || '');

  const numPrice = parseFloat(price) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const grossProfit = numPrice > 0 && numCost > 0 ? numPrice - numCost : 0;
  const profitMargin = numPrice > 0 && numCost > 0 ? (grossProfit / numPrice) * 100 : 0;
  const markup = numCost > 0 ? numPrice / numCost : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const savedProduct: Product = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      category,
      price: parseFloat(price) || 0,
      costPrice: costPrice.trim() ? parseFloat(costPrice) : undefined,
      description: description.trim() || 'Feito com ingredientes frescos e grelhado no fogo.',
      image,
      tag: tag.trim() || undefined,
      isAvailable: initialProduct?.isAvailable ?? true,
      options: category === 'burgers' ? {
        meatDoneness: true,
        additionals: initialProduct?.options?.additionals || [
          { id: 'bacon', name: 'Bacon extra', subtitle: '+ Duas fatias crocantes', price: 6.00 },
          { id: 'cheddar', name: 'Queijo cheddar', subtitle: '+ Dose extra cremosa', price: 4.50 },
        ]
      } : category === 'pizzas' ? {
        additionals: initialProduct?.options?.additionals || [
          { id: 'borda-catupiry', name: 'Borda Recheada de Catupiry', subtitle: '+ Borda vulcão cremosa', price: 9.90 },
          { id: 'borda-cheddar', name: 'Borda Recheada de Cheddar', subtitle: '+ Cheddar cremoso', price: 9.90 },
          { id: 'queijo-extra', name: 'Mussarela Extra', subtitle: '+ Camada dupla de queijo', price: 7.50 },
        ]
      } : undefined
    };

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#20201f] border border-[#353535] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
          <h3 className="font-['Montserrat'] font-bold text-base text-white">
            {initialProduct ? 'Editar Item do Cardápio' : 'Novo Item no Cardápio'}
          </h3>
          <button onClick={onClose} className="text-[#b4b5b5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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
              <label className="block text-[#b4b5b5] mb-1 font-medium">Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ex: 38.00"
                className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#ff5722] font-semibold"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#b4b5b5] font-medium">Preço de Custo (R$)</label>
                <span className="text-[10px] text-emerald-400 font-semibold">Insumos/CMV</span>
              </div>
              <input
                type="number"
                step="0.10"
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                placeholder="Ex: 12.50"
                className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
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
            <div className="p-2.5 bg-[#ff5722]/10 border border-[#ff5722]/30 rounded-xl text-[11px] text-[#ffb5a0] flex items-center gap-2">
              <span className="text-base">🍕</span>
              <span>
                O valor acima refere-se ao tamanho <strong>Grande (G - 8 fatias)</strong>. Os tamanhos <strong>P (4 fatias)</strong>, <strong>M (6 fatias)</strong> e <strong>Família (12 fatias)</strong> são calculados dinamicamente no cardápio.
              </span>
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

          <div>
            <label className="block text-[#b4b5b5] mb-1">URL da Imagem</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="https://..."
                className="flex-grow bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722] text-[11px]"
              />
              <div className="w-9 h-9 rounded-xl bg-[#1c1b1b] border border-[#353535] overflow-hidden flex-shrink-0">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#353535] text-white py-2.5 rounded-md font-['Montserrat'] font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn-flame text-white py-2.5 rounded-md font-['Montserrat'] font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" /> Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
