import React, { useState } from 'react';
import { Product, Order, PizzaSize, JuiceSize } from '../types';
import { X, Plus, Trash2, Pizza, Citrus } from 'lucide-react';
import { PIZZA_SIZES, JUICE_SIZES } from '../data/mockData';

interface ManualOrderModalProps {
  products: Product[];
  onAddOrder: (newOrder: Order) => void;
  onClose: () => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  products,
  onAddOrder,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'Delivery' | 'Retirada' | 'Mesa'>('Balcão' as any);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [pizzaSize, setPizzaSize] = useState<PizzaSize>('G');
  const [juiceSize, setJuiceSize] = useState<JuiceSize>('500ml');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ name: string; quantity: number; price: number; pizzaSize?: PizzaSize; juiceSize?: JuiceSize; notes?: string }[]>([
    { name: 'Gourmet Truffle Burger', quantity: 1, price: 54.00, notes: 'Bem passado' },
  ]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isPizza = selectedProduct?.category === 'pizzas';
  const isJuice = selectedProduct?.category === 'sucos';

  const handleAddItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const sizeConfig = PIZZA_SIZES.find(s => s.id === pizzaSize) || PIZZA_SIZES[2];
    const juiceConfig = JUICE_SIZES.find(s => s.id === juiceSize) || JUICE_SIZES[1];

    const finalPrice = prod.category === 'pizzas'
      ? Math.max(15, prod.price + sizeConfig.priceOffset)
      : prod.category === 'sucos'
      ? (prod.juicePrices?.[juiceSize] ?? Math.max(5, prod.price + juiceConfig.priceOffset))
      : prod.price;

    const itemName = prod.category === 'pizzas'
      ? `${prod.name} [Tam: ${pizzaSize}]`
      : prod.category === 'sucos'
      ? `${prod.name} [${juiceSize === '1L' ? '1 Litro (1lt)' : juiceSize}]`
      : prod.name;

    setItems(prev => [
      ...prev,
      {
        name: itemName,
        quantity,
        price: finalPrice,
        pizzaSize: prod.category === 'pizzas' ? pizzaSize : undefined,
        juiceSize: prod.category === 'sucos' ? juiceSize : undefined,
        notes: notes.trim() || undefined,
      },
    ]);
    setNotes('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const deliveryFee = orderType === 'Delivery' ? 7.00 : 0.00;
  const total = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    const newOrder: Order = {
      id: `ord-man-${Date.now()}`,
      orderNumber: `#${Math.floor(2500 + Math.random() * 500)}`,
      customerName: customerName.trim(),
      type: orderType,
      status: 'novo',
      timeAgo: 'Acabou de criar',
      address: orderType === 'Delivery' ? 'Rua das Flores, 500' : 'Balcão / Salão',
      paymentMethod: 'Pix',
      items,
      subtotal,
      deliveryFee,
      total,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#20201f] border border-[#353535] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#353535] flex justify-between items-center bg-[#1c1b1b]">
          <h3 className="font-['Montserrat'] font-bold text-base text-white">
            Criar Pedido Manual (Balcão ou Telefone)
          </h3>
          <button onClick={onClose} className="text-[#b4b5b5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-grow">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#b4b5b5] mb-1">Nome do Cliente *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
              />
            </div>
            <div>
              <label className="block text-[#b4b5b5] mb-1">Tipo de Pedido</label>
              <select
                value={orderType}
                onChange={e => setOrderType(e.target.value as any)}
                className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
              >
                <option value="Retirada">Retirada no Balcão</option>
                <option value="Delivery">Delivery / Telefone</option>
                <option value="Mesa">Mesa no Salão</option>
              </select>
            </div>
          </div>

          {/* Add Product Line */}
          <div className="bg-[#1c1b1b] p-3 rounded-2xl border border-[#353535]/60 space-y-2.5">
            <span className="font-['Montserrat'] font-bold text-white block">Adicionar Item</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#20201f] border border-[#353535] rounded-xl px-2.5 py-1.5 text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#20201f] border border-[#353535] rounded-xl px-2 py-1.5 text-center text-white"
                />
              </div>
            </div>

            {isPizza && (
              <div className="pt-1 border-t border-[#353535]/50">
                <label className="text-[11px] text-[#ffb5a0] font-bold block mb-1.5 flex items-center gap-1">
                  <Pizza className="w-3.5 h-3.5 text-[#ff5722]" /> Escolha o Tamanho da Pizza:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['P', 'M', 'G', 'Família'] as const).map(size => {
                    const sizeConfig = PIZZA_SIZES.find(s => s.id === size);
                    const isSelected = pizzaSize === size;
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setPizzaSize(size)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm'
                            : 'bg-[#20201f] text-[#b4b5b5] border-[#353535] hover:border-[#ff5722]/50'
                        }`}
                      >
                        <span className="block font-black">{size}</span>
                        <span className="text-[9px] opacity-80 block">{sizeConfig?.slices}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isJuice && (
              <div className="pt-1 border-t border-[#353535]/50">
                <label className="text-[11px] text-[#ffd180] font-bold block mb-1.5 flex items-center gap-1">
                  <Citrus className="w-3.5 h-3.5 text-[#ff9800]" /> Escolha o Tamanho do Suco:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['300ml', '500ml', '1L'] as const).map(size => {
                    const sizeConfig = JUICE_SIZES.find(s => s.id === size);
                    const isSelected = juiceSize === size;
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setJuiceSize(size)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-[#ff9800] text-black border-[#ff9800] shadow-sm font-black'
                            : 'bg-[#20201f] text-[#b4b5b5] border-[#353535] hover:border-[#ff9800]/50'
                        }`}
                      >
                        <span className="block font-black">{size === '1L' ? '1 Litro (1lt)' : size}</span>
                        <span className="text-[9px] opacity-80 block">{sizeConfig?.volume}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observação (ex: bem passado, sem cebola)"
                className="flex-grow bg-[#20201f] border border-[#353535] rounded-xl px-3 py-1.5 text-white placeholder:text-[#b4b5b5]/40"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-flame px-3 py-1.5 rounded-md text-white font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5">
            <span className="font-['Montserrat'] font-semibold text-[#b4b5b5] block">
              Itens do Pedido ({items.length})
            </span>
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2.5 bg-[#20201f] rounded-xl border border-[#353535]/40"
              >
                <div>
                  <span className="font-semibold text-white">
                    {it.quantity}x {it.name}
                  </span>
                  {it.notes && (
                    <p className="text-[10px] text-[#ffb5a0] italic">{it.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ff5722] font-bold font-['Montserrat']">
                    R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-[#b4b5b5] hover:text-[#ffb4ab] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="p-3 bg-[#1c1b1b] rounded-xl border border-[#353535] flex justify-between items-center text-sm font-['Montserrat'] font-bold">
            <span className="text-[#b4b5b5]">Total do Pedido:</span>
            <span className="text-[#ff5722] text-base">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#353535] text-white py-2.5 rounded-md font-['Montserrat'] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0 || !customerName.trim()}
              className="flex-1 btn-flame text-white py-2.5 rounded-md font-['Montserrat'] font-bold disabled:opacity-50"
            >
              Enviar para Cozinha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
