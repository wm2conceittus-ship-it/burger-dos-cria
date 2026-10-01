import React, { useState } from 'react';
import { RestaurantTable, TableOrderItem, StoreSettings, Product, Order } from '../types';
import {
  UtensilsCrossed,
  Users,
  Plus,
  Clock,
  CheckCircle,
  Receipt,
  DollarSign,
  AlertCircle,
  X,
  Search,
  Printer,
  ArrowRightLeft,
  Trash2,
  Share2,
  QrCode,
  Flame,
  Check,
  Percent,
  Wallet,
  Calendar,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { APP_IMAGES } from '../data/mockData';

interface TableManagementViewProps {
  storeSettings: StoreSettings;
  products: Product[];
  orders: Order[];
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
  onAddOrder?: (newOrder: Order) => void;
  onPrintOrder?: (order: Order) => void;
}

export const TableManagementView: React.FC<TableManagementViewProps> = ({
  storeSettings,
  products,
  orders,
  onUpdateStoreSettings,
  onAddOrder,
  onPrintOrder,
}) => {
  const tables: RestaurantTable[] = storeSettings.tables || [];
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ocupadas' | 'livres' | 'conta_pedida' | 'reservadas'>('todos');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Modals
  const [isOpenNewTableModal, setIsOpenNewTableModal] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCloseAccountModalOpen, setIsCloseAccountModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState<RestaurantTable | null>(null);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToReset, setTableToReset] = useState<RestaurantTable | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // New Table Form
  const [newTableNumber, setNewTableNumber] = useState(tables.length + 1);
  const [newTableLabel, setNewTableLabel] = useState(`Mesa ${tables.length + 1 < 10 ? '0' : ''}${tables.length + 1} • Salão`);
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableCustomer, setNewTableCustomer] = useState('');
  const [newTablePeople, setNewTablePeople] = useState(2);
  const [newTableWaiter, setNewTableWaiter] = useState('Danilo (Garçom)');
  const [newTableNotes, setNewTableNotes] = useState('');

  // Add Product Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productQuantity, setProductQuantity] = useState(1);
  const [productNotes, setProductNotes] = useState('');

  // Bill Split State
  const [splitCount, setSplitCount] = useState<number>(1);

  // Close Account Payment Method
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentToast, setPaymentToast] = useState<string | null>(null);

  // Feedback Toast
  const showToast = (msg: string) => {
    setPaymentToast(msg);
    setTimeout(() => setPaymentToast(null), 3000);
  };

  // Metrics
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
  const billRequestedTables = tables.filter(t => t.status === 'conta_pedida').length;
  const freeTables = tables.filter(t => t.status === 'livre').length;
  const reservedTables = tables.filter(t => t.status === 'reservada').length;

  const currentDineInRevenue = tables.reduce((acc, table) => {
    const tableSubtotal = table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const service = table.serviceFeeEnabled ? tableSubtotal * ((storeSettings.serviceFeePercentage || 10) / 100) : 0;
    return acc + tableSubtotal + service;
  }, 0);

  // Filtered tables
  const filteredTables = tables.filter(t => {
    if (filterStatus === 'todos') return true;
    if (filterStatus === 'ocupadas') return t.status === 'ocupada';
    if (filterStatus === 'livres') return t.status === 'livre';
    if (filterStatus === 'conta_pedida') return t.status === 'conta_pedida';
    if (filterStatus === 'reservadas') return t.status === 'reservada';
    return true;
  });

  // Calculate table total
  const getTableFinancials = (table: RestaurantTable) => {
    const subtotal = table.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const serviceFee = table.serviceFeeEnabled
      ? subtotal * ((storeSettings.serviceFeePercentage || 10) / 100)
      : 0;
    const total = subtotal + serviceFee;
    return { subtotal, serviceFee, total };
  };

  // Open Table Atendimento
  const handleOpenTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updated = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'ocupada' as const,
          customerName: newTableCustomer || 'Cliente Mesa ' + t.number,
          peopleCount: newTablePeople || 2,
          waiterName: newTableWaiter || 'Atendente',
          openedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          notes: newTableNotes || '',
          serviceFeeEnabled: true,
        };
      }
      return t;
    });

    onUpdateStoreSettings({ ...storeSettings, tables: updated });
    setIsOpenNewTableModal(false);
    setNewTableCustomer('');
    setNewTableNotes('');
    showToast(`Mesa ${table.number} aberta com sucesso! 🍽️`);
  };

  // Add Item to Table
  const handleAddItemToTable = (product: Product) => {
    if (!selectedTable) return;

    const newItem: TableOrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: product.name,
      quantity: productQuantity,
      price: product.price,
      notes: productNotes || undefined,
      orderedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          items: [...t.items, newItem],
        };
      }
      return t;
    });

    onUpdateStoreSettings({ ...storeSettings, tables: updatedTables });

    // Also send an order ticket to the Kitchen KDS!
    if (onAddOrder) {
      const kitchenOrder: Order = {
        id: `ord-table-${Date.now()}`,
        orderNumber: `#MESA-${selectedTable.number < 10 ? '0' : ''}${selectedTable.number}`,
        customerName: `${selectedTable.customerName || 'Mesa ' + selectedTable.number} (Mesa ${selectedTable.number})`,
        type: 'Mesa',
        tableNumber: selectedTable.number,
        peopleCount: selectedTable.peopleCount,
        waiterName: selectedTable.waiterName,
        status: 'preparando',
        timeAgo: 'Acabou de lançar',
        address: `Consumo no Local • Mesa ${selectedTable.number} (${selectedTable.label})`,
        paymentMethod: 'Comanda da Mesa',
        items: [
          {
            name: product.name,
            quantity: productQuantity,
            price: product.price,
            notes: productNotes || undefined,
          },
        ],
        subtotal: product.price * productQuantity,
        deliveryFee: 0,
        total: product.price * productQuantity,
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        notes: `Comanda Mesa ${selectedTable.number}: ${productNotes || 'Pedido lançado pelo salão'}`,
      };
      onAddOrder(kitchenOrder);
    }

    // Refresh selectedTable reference
    setSelectedTable(prev => (prev ? { ...prev, items: [...prev.items, newItem] } : null));

    setProductQuantity(1);
    setProductNotes('');
    setIsAddProductModalOpen(false);
    showToast(`Adicionado ${product.name} à Mesa ${selectedTable.number}! 🔥`);
  };

  // Remove Item from Table
  const handleRemoveItem = (itemId: string) => {
    if (!selectedTable) return;
    const updatedItems = selectedTable.items.filter(it => it.id !== itemId);
    const updatedTables = tables.map(t => (t.id === selectedTable.id ? { ...t, items: updatedItems } : t));
    onUpdateStoreSettings({ ...storeSettings, tables: updatedTables });
    setSelectedTable(prev => (prev ? { ...prev, items: updatedItems } : null));
    showToast('Item removido da comanda.');
  };

  // Toggle 10% Service Fee
  const handleToggleServiceFee = () => {
    if (!selectedTable) return;
    const newVal = !selectedTable.serviceFeeEnabled;
    const updatedTables = tables.map(t =>
      t.id === selectedTable.id ? { ...t, serviceFeeEnabled: newVal } : t
    );
    onUpdateStoreSettings({ ...storeSettings, tables: updatedTables });
    setSelectedTable(prev => (prev ? { ...prev, serviceFeeEnabled: newVal } : null));
  };

  // Request Bill
  const handleRequestBill = (tableId: string) => {
    const updatedTables = tables.map(t =>
      t.id === tableId ? { ...t, status: 'conta_pedida' as const } : t
    );
    onUpdateStoreSettings({ ...storeSettings, tables: updatedTables });
    if (selectedTable?.id === tableId) {
      setSelectedTable(prev => (prev ? { ...prev, status: 'conta_pedida' } : null));
    }
    showToast('Conta solicitada! Garçom notificado.');
  };

  // Close Bill & Free Table
  const handleCloseAndFreeTable = () => {
    if (!selectedTable) return;
    const { total } = getTableFinancials(selectedTable);

    // Free the table
    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'livre' as const,
          customerName: undefined,
          peopleCount: undefined,
          openedAt: undefined,
          waiterName: undefined,
          notes: undefined,
          items: [],
          serviceFeeEnabled: true,
        };
      }
      return t;
    });

    onUpdateStoreSettings({ ...storeSettings, tables: updatedTables });
    setIsCloseAccountModalOpen(false);
    setSelectedTable(null);
    showToast(`Conta da Mesa ${selectedTable.number} finalizada (R$ ${total.toFixed(2)}) e mesa liberada! 🟢`);
  };

  // Print Table Pre-bill receipt
  const handlePrintPreBill = (table: RestaurantTable) => {
    const { subtotal, serviceFee, total } = getTableFinancials(table);
    const mockOrder: Order = {
      id: `table-bill-${table.id}`,
      orderNumber: `#CONTA-MESA-${table.number}`,
      customerName: table.customerName || `Mesa ${table.number}`,
      type: 'Mesa',
      tableNumber: table.number,
      peopleCount: table.peopleCount,
      waiterName: table.waiterName,
      status: 'pronto',
      timeAgo: 'Fechamento de Conta',
      address: `Consumo no Local • Mesa ${table.number} (${table.label})`,
      paymentMethod: paymentMethod || 'A Definir',
      items: table.items.map(it => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        notes: it.notes,
      })),
      subtotal,
      deliveryFee: serviceFee,
      total,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      notes: `Pré-conta da Mesa ${table.number} • ${table.peopleCount || 1} pessoas • Garçom: ${table.waiterName || 'Salão'}`,
    };

    if (onPrintOrder) {
      onPrintOrder(mockOrder);
    }
  };

  // Create New Physical Table in the Salon
  const handleAddNewPhysicalTable = () => {
    const newNumber = tables.length + 1;
    const newTable: RestaurantTable = {
      id: `table-${Date.now()}`,
      number: newNumber,
      label: `Mesa ${newNumber < 10 ? '0' : ''}${newNumber} • Salão`,
      capacity: newTableCapacity || 4,
      status: 'livre',
      items: [],
      serviceFeeEnabled: true,
    };

    onUpdateStoreSettings({
      ...storeSettings,
      tables: [...tables, newTable],
    });

    showToast(`Mesa ${newNumber} adicionada ao salão! 🪑`);
  };

  // Delete Table from Salon
  const handleDeletePhysicalTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updated = tables.filter(t => t.id !== tableId);
    onUpdateStoreSettings({ ...storeSettings, tables: updated });
    setIsDeleteModalOpen(false);
    setTableToDelete(null);
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    showToast(`Mesa ${table.number} excluída do salão.`);
  };

  // Cancel Table / Reset to Free without charging
  const handleCancelAndFreeTable = (tableId: string) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'livre' as const,
          customerName: undefined,
          peopleCount: undefined,
          openedAt: undefined,
          waiterName: undefined,
          notes: undefined,
          items: [],
          serviceFeeEnabled: true,
        };
      }
      return t;
    });

    onUpdateStoreSettings({ ...storeSettings, tables: updated });
    setIsResetModalOpen(false);
    setTableToReset(null);
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    showToast('Comanda cancelada e mesa liberada! 🟢');
  };

  // Products filtered for modal
  const filteredProductsForAdd = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {paymentToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-lg text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{paymentToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#201d1c] via-[#241f1c] to-[#1c1a19] p-5 rounded-xl border border-[#ff5722]/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ff5722]/20 border border-[#ff5722]/40 text-[#ff5722] flex items-center justify-center flex-shrink-0 shadow-inner">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-['Montserrat'] font-bold text-lg text-white">
                Controle de Mesas & Comandas de Salão
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold uppercase">
                Consumo no Local Ativo
              </span>
            </div>
            <p className="text-xs text-[#b4b5b5] mt-1">
              Gerencie atendimentos, lance rodadas na chapa, divida contas e feche mesas com agilidade.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsOpenNewTableModal(true)}
            className="btn-flame text-white px-3.5 py-2 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Abrir Nova Mesa</span>
          </button>

          <button
            onClick={handleAddNewPhysicalTable}
            className="bg-[#20201f] hover:bg-[#2b2b2b] text-[#e5e2e1] border border-[#353535] px-3.5 py-2 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            title="Adicionar mais uma mesa ao salão"
          >
            <Plus className="w-3.5 h-3.5 text-[#ff5722]" />
            <span>+ Adicionar Mesa ({tables.length + 1})</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#353535] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8e8f8f] uppercase block font-['Montserrat']">
              Total de Mesas
            </span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{totalTables}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#353535]/50 text-white flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#ff5722]/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#ff8a65] uppercase block font-['Montserrat']">
              Mesas Ocupadas
            </span>
            <span className="text-xl font-black text-[#ff5722] font-mono mt-0.5 block">{occupiedTables}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-amber-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase block font-['Montserrat']">
              Pediram Conta
            </span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              {billRequestedTables}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Receipt className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase block font-['Montserrat']">
              Mesas Livres
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{freeTables}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#1c1b1b] p-3.5 rounded-xl border border-[#353535] col-span-2 sm:col-span-1 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#8e8f8f] uppercase block font-['Montserrat']">
              Consumo no Salão
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              R$ {currentDineInRevenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'todos', label: 'Todas as Mesas', count: totalTables },
          { id: 'ocupadas', label: 'Ocupadas', count: occupiedTables },
          { id: 'conta_pedida', label: 'Pediram Conta', count: billRequestedTables },
          { id: 'livres', label: 'Livres', count: freeTables },
          { id: 'reservadas', label: 'Reservadas', count: reservedTables },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              filterStatus === tab.id
                ? 'bg-[#ff5722] text-white shadow-md'
                : 'bg-[#1c1b1b] text-[#b4b5b5] hover:text-white border border-[#353535]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map(table => {
          const { subtotal, serviceFee, total } = getTableFinancials(table);
          const isOccupied = table.status === 'ocupada';
          const isBillRequested = table.status === 'conta_pedida';
          const isFree = table.status === 'livre';
          const isReserved = table.status === 'reservada';

          return (
            <div
              key={table.id}
              onClick={() => {
                if (isFree) {
                  setNewTableNumber(table.number);
                  setNewTableLabel(table.label);
                  setIsOpenNewTableModal(true);
                } else {
                  setSelectedTable(table);
                  setSplitCount(table.peopleCount || 1);
                }
              }}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-lg hover:shadow-2xl relative overflow-hidden ${
                isBillRequested
                  ? 'bg-gradient-to-br from-[#251e12] to-[#1c1712] border-amber-500/70 hover:border-amber-400 ring-2 ring-amber-500/20'
                  : isOccupied
                  ? 'bg-gradient-to-br from-[#241a18] to-[#1a1413] border-[#ff5722]/60 hover:border-[#ff5722] shadow-[#ff5722]/10'
                  : isReserved
                  ? 'bg-[#1c1f26] border-blue-500/50 hover:border-blue-400'
                  : 'bg-[#1a1a1a] border-[#353535] hover:border-[#555] opacity-90 hover:opacity-100'
              }`}
            >
              {/* Card Top: Number & Status Badge */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-['Montserrat'] font-black text-sm shadow-md ${
                        isBillRequested
                          ? 'bg-amber-500 text-black animate-pulse'
                          : isOccupied
                          ? 'bg-[#ff5722] text-white shadow-[#ff5722]/30'
                          : isReserved
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#2a2a2a] text-[#8e8f8f]'
                      }`}
                    >
                      {table.number < 10 ? `0${table.number}` : table.number}
                    </div>
                    <div>
                      <h4 className="font-['Montserrat'] font-bold text-xs text-white group-hover:text-[#ff8a65] transition-colors truncate max-w-[130px]">
                        {table.label}
                      </h4>
                      <span className="text-[10px] text-[#8e8f8f] flex items-center gap-1">
                        <Users className="w-3 h-3" /> Até {table.capacity} pessoas
                      </span>
                    </div>
                  </div>

                  {/* Action Icons: QR Code & Delete Table */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedQrTable(table);
                        setIsQrModalOpen(true);
                      }}
                      className="p-1 text-[#8e8f8f] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title={`Ver Link & QR Code da Mesa ${table.number}`}
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setTableToDelete(table);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 text-[#8e8f8f] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title={`Apagar / Excluir Mesa ${table.number} do salão`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider font-['Montserrat'] flex items-center gap-1 ${
                      isBillRequested
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isOccupied
                        ? 'bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40'
                        : isReserved
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    {isBillRequested
                      ? 'Pediu a Conta'
                      : isOccupied
                      ? 'Ocupada'
                      : isReserved
                      ? 'Reservada'
                      : 'Livre'}
                  </span>

                  {table.openedAt && (
                    <span className="text-[10px] text-[#8e8f8f] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#ff5722]" /> {table.openedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Middle: Customer and Order Summary */}
              <div className="py-3 space-y-1.5 my-1">
                {isFree ? (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-[#8e8f8f]">Mesa livre & pronta</p>
                    <span className="text-[10px] text-[#ff8a65] font-bold block group-hover:underline">
                      + Clique para abrir atendimento
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-xs">
                      <strong className="text-white font-['Montserrat'] block truncate">
                        {table.customerName || 'Cliente'}
                      </strong>
                      <span className="text-[10px] text-[#b4b5b5] block truncate">
                        {table.peopleCount ? `${table.peopleCount} pessoas` : ''} •{' '}
                        {table.waiterName || 'Garçom'}
                      </span>
                    </div>

                    {/* Items preview */}
                    <div className="bg-black/30 rounded-lg p-2 text-[11px] text-[#b4b5b5] space-y-0.5">
                      <div className="flex justify-between font-semibold text-white text-[10px]">
                        <span>Itens na comanda:</span>
                        <span className="text-[#ff8a65]">{table.items.length} itens</span>
                      </div>
                      <p className="truncate text-[10px] text-[#8e8f8f]">
                        {table.items.length > 0
                          ? table.items.map(it => `${it.quantity}x ${it.name}`).join(', ')
                          : 'Nenhum item lançado ainda'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Card Bottom: Total and Action Buttons */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#8e8f8f] uppercase block font-semibold">
                    {isFree ? 'Capacidade' : 'Total Parcial'}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isFree ? 'text-[#8e8f8f]' : isBillRequested ? 'text-amber-300' : 'text-[#ff5722]'
                    }`}
                  >
                    {isFree ? `${table.capacity} Lugares` : `R$ ${total.toFixed(2).replace('.', ',')}`}
                  </span>
                </div>

                <div>
                  {isFree ? (
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-white/5 group-hover:bg-[#ff5722] text-[#b4b5b5] group-hover:text-white text-xs font-bold font-['Montserrat'] transition-all"
                    >
                      Abrir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-['Montserrat'] transition-all shadow-md ${
                        isBillRequested
                          ? 'bg-amber-500 hover:bg-amber-400 text-black'
                          : 'bg-[#ff5722] hover:bg-[#ff7043] text-white'
                      }`}
                    >
                      Comanda
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DETALHES & COMANDA DA MESA                            */}
      {/* ============================================================== */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#201e1d] to-[#1c1b1b] border-b border-[#353535] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ff5722] text-white font-black text-lg flex items-center justify-center shadow-lg font-['Montserrat']">
                  {selectedTable.number < 10 ? `0${selectedTable.number}` : selectedTable.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Montserrat'] font-bold text-base text-white">
                      {selectedTable.label}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedTable.status === 'conta_pedida'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : selectedTable.status === 'ocupada'
                          ? 'bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {selectedTable.status === 'conta_pedida'
                        ? 'Pediu Conta'
                        : selectedTable.status === 'ocupada'
                        ? 'Ocupada'
                        : 'Livre'}
                    </span>
                  </div>
                  <p className="text-xs text-[#b4b5b5] mt-0.5">
                    Cliente: <strong className="text-white">{selectedTable.customerName || 'Não informado'}</strong> •{' '}
                    {selectedTable.peopleCount || 1} pessoas • Atendente: {selectedTable.waiterName || 'Salão'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Table Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#141414] rounded-xl border border-[#353535]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="btn-flame text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Nova Rodada / Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestBill(selectedTable.id)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Pedir Conta</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintPreBill(selectedTable)}
                    className="bg-[#252525] hover:bg-[#303030] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border border-[#404040] transition-all"
                    title="Imprimir Pré-Conta para levar à mesa"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#ff5722]" />
                    <span>Imprimir Pré-Conta</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-[#ff8a65] flex items-center justify-between">
                  <span>Itens Consumidos na Mesa ({selectedTable.items.length})</span>
                  <span className="text-[10px] text-[#8e8f8f] font-normal lowercase">horário de lançamento</span>
                </h4>

                {selectedTable.items.length === 0 ? (
                  <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#353535] space-y-2">
                    <UtensilsCrossed className="w-8 h-8 text-[#555] mx-auto" />
                    <p className="text-white font-bold">Nenhum item lançado ainda nesta mesa.</p>
                    <p className="text-[11px] text-[#8e8f8f]">
                      Clique em "Lançar Nova Rodada" para adicionar hambúrgueres, porções ou bebidas.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#141414] rounded-xl border border-[#353535] divide-y divide-[#252525] overflow-hidden">
                    {selectedTable.items.map(it => (
                      <div key={it.id} className="p-3 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-[#ff5722]/15 text-[#ff8a65] font-bold text-xs flex items-center justify-center font-mono mt-0.5">
                            {it.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-white block">{it.name}</span>
                            {it.notes && (
                              <span className="text-[10px] text-amber-300 block">Obs: {it.notes}</span>
                            )}
                            <span className="text-[10px] text-[#8e8f8f]">Lançado às {it.orderedAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-xs">
                            R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 text-[#8e8f8f] hover:text-red-400 transition-colors"
                            title="Remover item da comanda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Calculator & 10% Service Fee */}
              <div className="bg-[#141414] rounded-xl border border-[#353535] p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#252525]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="serviceFeeToggle"
                      checked={selectedTable.serviceFeeEnabled || false}
                      onChange={handleToggleServiceFee}
                      className="h-4 w-4 accent-[#ff5722] cursor-pointer"
                    />
                    <label htmlFor="serviceFeeToggle" className="cursor-pointer font-semibold text-white">
                      Taxa de Serviço Garçom ({storeSettings.serviceFeePercentage || 10}%)
                    </label>
                  </div>
                  <span className="font-mono text-[#ff8a65] font-bold">
                    + R$ {getTableFinancials(selectedTable).serviceFee.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Subtotal and Total */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#b4b5b5]">
                    <span>Subtotal dos Itens:</span>
                    <span className="font-mono font-bold text-white">
                      R$ {getTableFinancials(selectedTable).subtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#252525]">
                    <span className="text-white font-['Montserrat']">Total da Comanda:</span>
                    <span className="font-mono text-base font-black text-emerald-400">
                      R$ {getTableFinancials(selectedTable).total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Smart Bill Splitter */}
                <div className="pt-2 border-t border-[#252525] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#8e8f8f] uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#ff5722]" /> Dividir Conta da Mesa
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSplitCount(n)}
                          className={`w-6 h-6 rounded text-[10px] font-bold font-mono transition-all ${
                            splitCount === n
                              ? 'bg-[#ff5722] text-white shadow'
                              : 'bg-[#252525] text-[#b4b5b5] hover:text-white'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {splitCount > 1 && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-medium">
                        Valor para cada uma das {splitCount} pessoas:
                      </span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        R$ {(getTableFinancials(selectedTable).total / splitCount).toFixed(2).replace('.', ',')} cada
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 bg-[#171616] border-t border-[#353535] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="px-3 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs transition-colors"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableToReset(selectedTable);
                    setIsResetModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Cancelar consumo e liberar esta mesa para novos clientes sem cobrar"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Zerar & Liberar Mesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableToDelete(selectedTable);
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Apagar / Excluir o cadastro desta mesa do salão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Mesa</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseAccountModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-['Montserrat'] font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Fechar Conta & Liberar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ABRIR NOVA MESA                                       */}
      {/* ============================================================== */}
      {isOpenNewTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#353535]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff5722]/20 text-[#ff5722] flex items-center justify-center font-bold">
                  {newTableNumber}
                </div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Abrir Atendimento • Mesa {newTableNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsOpenNewTableModal(false)}
                className="text-[#8e8f8f] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#b4b5b5] mb-1 font-semibold">
                  Mesa a ser aberta
                </label>
                <select
                  value={newTableNumber}
                  onChange={e => {
                    const num = parseInt(e.target.value);
                    setNewTableNumber(num);
                    const targetTable = tables.find(t => t.number === num);
                    if (targetTable) setNewTableLabel(targetTable.label);
                  }}
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#ff5722]"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.number} disabled={t.status !== 'livre'}>
                      Mesa {t.number} - {t.label} ({t.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#b4b5b5] mb-1 font-semibold">
                  Nome do Cliente / Responsável da Mesa
                </label>
                <input
                  type="text"
                  value={newTableCustomer}
                  onChange={e => setNewTableCustomer(e.target.value)}
                  placeholder="Ex: Lucas Rocha ou Galera do Trabalho"
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-semibold">
                    Qtd. de Pessoas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTablePeople}
                    onChange={e => setNewTablePeople(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#ff5722]"
                  />
                </div>

                <div>
                  <label className="block text-[#b4b5b5] mb-1 font-semibold">
                    Garçom Responsável
                  </label>
                  <select
                    value={newTableWaiter}
                    onChange={e => setNewTableWaiter(e.target.value)}
                    className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                  >
                    {(storeSettings.employees || [])
                      .filter(emp => emp.active)
                      .map(emp => (
                        <option key={emp.id} value={`${emp.name} (${emp.customRoleTitle || emp.role})`}>
                          {emp.name} ({emp.customRoleTitle || emp.role})
                        </option>
                      ))}
                    {(!storeSettings.employees || storeSettings.employees.length === 0) && (
                      <>
                        <option value="Danilo (Garçom)">Danilo (Garçom)</option>
                        <option value="Carla (Atendente)">Carla (Atendente)</option>
                        <option value="Balcão">Balcão / Caixa</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#b4b5b5] mb-1 font-semibold">
                  Observações da Mesa (Opcional)
                </label>
                <input
                  type="text"
                  value={newTableNotes}
                  onChange={e => setNewTableNotes(e.target.value)}
                  placeholder="Ex: Aniversariante, trouxe bolo, carne bem passada"
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenNewTableModal(false)}
                className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetTable = tables.find(t => t.number === newTableNumber);
                  if (targetTable) {
                    handleOpenTable(targetTable.id);
                  }
                }}
                className="btn-flame text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md active:scale-95"
              >
                Confirmar & Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: LANÇAR PRODUTOS NA COMANDA                            */}
      {/* ============================================================== */}
      {isAddProductModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#201e1d] border-b border-[#353535] flex items-center justify-between">
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                  <span>Lançar Pedido • Mesa {selectedTable.number}</span>
                  <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] px-2 py-0.5 rounded font-bold">
                    Envia direto pra cozinha
                  </span>
                </h3>
                <p className="text-[11px] text-[#b4b5b5] mt-0.5">
                  Selecione o produto do cardápio para adicionar à comanda da mesa.
                </p>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-[#8e8f8f] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Categories Filter */}
            <div className="p-3 bg-[#171616] border-b border-[#353535] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8e8f8f] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar burger, chopp, batata, pizza..."
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {['all', 'burgers', 'combos', 'salgados', 'pizzas', 'sucos', 'bebidas'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#ff5722] text-white'
                        : 'bg-[#252525] text-[#b4b5b5] hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#252525]">
              {filteredProductsForAdd.map(product => (
                <div
                  key={product.id}
                  className="pt-2 flex items-center justify-between gap-3 hover:bg-[#202020] p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-white text-xs block truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-[#8e8f8f] block truncate">
                        {product.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono font-bold text-white text-xs">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItemToTable(product)}
                      className="btn-flame text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#171616] border-t border-[#353535] flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: FECHAR CONTA DA MESA & PAGAMENTO                      */}
      {/* ============================================================== */}
      {isCloseAccountModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#353535]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-['Montserrat'] font-bold text-base text-white">
                  Fechamento • Mesa {selectedTable.number}
                </h3>
              </div>
              <button
                onClick={() => setIsCloseAccountModalOpen(false)}
                className="text-[#8e8f8f] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#141414] p-3.5 rounded-xl border border-[#353535] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#b4b5b5]">
                <span>Cliente:</span>
                <strong className="text-white">{selectedTable.customerName || 'Mesa'}</strong>
              </div>
              <div className="flex justify-between text-[#b4b5b5]">
                <span>Total de Itens:</span>
                <strong className="text-white">{selectedTable.items.length} itens</strong>
              </div>
              <div className="flex justify-between text-[#b4b5b5]">
                <span>Taxa de Serviço (10%):</span>
                <span className="font-mono text-emerald-400">
                  R$ {getTableFinancials(selectedTable).serviceFee.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[#252525]">
                <span className="text-white font-['Montserrat']">VALOR A COBRAR:</span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  R$ {getTableFinancials(selectedTable).total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#b4b5b5] block">
                Forma de Pagamento Utilizada pelo Cliente:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Dinheiro', 'Vale Refeição'].map(
                  method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-lg font-bold border transition-all text-left ${
                        paymentMethod === method
                          ? 'bg-[#ff5722] text-white border-[#ff5722] shadow'
                          : 'bg-[#141414] text-[#b4b5b5] hover:text-white border-[#353535]'
                      }`}
                    >
                      {method}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#353535] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCloseAccountModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleCloseAndFreeTable}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Pagamento & Liberar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: QR CODE & LINK DA MESA PARA O CLIENTE PEDIR           */}
      {/* ============================================================== */}
      {isQrModalOpen && selectedQrTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center pb-2 border-b border-[#353535]">
              <span className="font-['Montserrat'] font-bold text-sm text-white">
                Mesa {selectedQrTable.number} • Autoatendimento
              </span>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-[#8e8f8f] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-[#ff5722]/30">
              <div className="relative w-48 h-48 flex items-center justify-center bg-white rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `${window.location.origin}/?mesa=${selectedQrTable.number}`
                  )}`}
                  alt={`QR Code Mesa ${selectedQrTable.number}`}
                  className="w-48 h-48 object-contain rounded-lg"
                />
                {/* Logo da Hamburgueria Centralizado no QR Code */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white p-1 shadow-2xl border-2 border-[#ff5722] flex items-center justify-center overflow-hidden">
                    <img
                      src={APP_IMAGES.logo}
                      alt="Logo da Hamburgueria"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="font-['Montserrat'] font-black text-xs uppercase tracking-wider text-[#ff5722] bg-[#ff5722]/15 px-3 py-1 rounded-full">
                  🍽️ MESA {selectedQrTable.number < 10 ? `0${selectedQrTable.number}` : selectedQrTable.number}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white">
                Coloque esta plaquinha com QR Code na mesa!
              </p>
              <p className="text-[11px] text-[#b4b5b5]">
                O cliente escaneia com a câmera do celular e faz o pedido direto da mesa sem precisar esperar garçom.
              </p>
            </div>

            <div className="p-2.5 bg-[#141414] rounded-lg border border-[#353535] flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-[#ff8a65] truncate">
                {window.location.origin}/?mesa={selectedQrTable.number}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?mesa=${selectedQrTable.number}`);
                  showToast(`Link da Mesa ${selectedQrTable.number} copiado!`);
                }}
                className="text-xs text-white font-bold underline ml-2 whitespace-nowrap"
              >
                Copiar Link
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2 rounded-lg bg-[#252525] text-white font-bold text-xs hover:bg-[#303030]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: CONFIRMAR EXCLUSÃO DA MESA DO SALÃO                   */}
      {/* ============================================================== */}
      {isDeleteModalOpen && tableToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Excluir Mesa do Salão?
                </h3>
                <span className="text-xs text-[#8e8f8f]">
                  {tableToDelete.label} (Mesa {tableToDelete.number})
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#b4b5b5] bg-[#141414] p-3 rounded-xl border border-[#353535]">
              <p>
                Tem certeza que deseja apagar a <strong className="text-white">Mesa {tableToDelete.number}</strong> do cadastro do restaurante?
              </p>
              {tableToDelete.status !== 'livre' && (
                <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-[11px] flex items-start gap-1.5 mt-1 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Atenção: Esta mesa está <strong>{tableToDelete.status.toUpperCase()}</strong> e possui {tableToDelete.items.length} itens lançados. Ao excluir, a comanda será descartada.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTableToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleDeletePhysicalTable(tableToDelete.id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: CONFIRMAR ZERAR / CANCELAR COMANDA DA MESA            */}
      {/* ============================================================== */}
      {isResetModalOpen && tableToReset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                  Zerar & Liberar Mesa?
                </h3>
                <span className="text-xs text-[#8e8f8f]">
                  Mesa {tableToReset.number} • {tableToReset.customerName || 'Cliente'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#b4b5b5] bg-[#141414] p-3 rounded-xl border border-[#353535]">
              <p>
                Deseja cancelar o atendimento atual e liberar a <strong className="text-white">Mesa {tableToReset.number}</strong> sem gerar cobrança?
              </p>
              <p className="text-[11px] text-[#8e8f8f]">
                A mesa continuará cadastrada no salão e ficará 🟢 <strong>LIVRE</strong> imediatamente para receber novos clientes.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setTableToReset(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#252525] text-[#b4b5b5] hover:text-white font-bold text-xs"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => handleCancelAndFreeTable(tableToReset.id)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Sim, Liberar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
