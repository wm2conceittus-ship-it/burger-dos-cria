import React, { useState, useMemo, useRef } from 'react';
import { Order, StoreSettings } from '../types';
import { APP_IMAGES } from '../data/mockData';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  FileSpreadsheet,
  Receipt,
  Bike,
  Clock,
  User,
  MapPin,
  MessageSquare,
  DollarSign,
  TrendingUp,
  PackageCheck,
  Utensils,
  ChevronDown,
  ChevronUp,
  Share2,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface DailyOrdersReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeSettings: StoreSettings;
  onPrintOrder?: (order: Order) => void;
}

export const DailyOrdersReportModal: React.FC<DailyOrdersReportModalProps> = ({
  isOpen,
  onClose,
  orders,
  storeSettings,
  onPrintOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [activeView, setActiveView] = useState<'lista' | 'itens_resumo'>('lista');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Non-refused orders considered valid for finance
  const validOrders = orders.filter(o => o.status !== 'recusado');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalDeliveryFees = validOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const averageTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
  const completedOrdersCount = orders.filter(o => o.status === 'entregue').length;
  const activeOrdersCount = orders.filter(
    o => o.status === 'novo' || o.status === 'recebido' || o.status === 'preparando' || o.status === 'pronto' || o.status === 'em_entrega'
  ).length;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(query)) ||
        (order.courierName && order.courierName.toLowerCase().includes(query)) ||
        order.items.some(i => i.name.toLowerCase().includes(query));

      // Status match
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'novos' && (order.status === 'novo' || order.status === 'recebido')) ||
        order.status === statusFilter;

      // Type match
      const matchesType = typeFilter === 'all' || order.type === typeFilter;

      // Payment match
      const matchesPayment =
        paymentFilter === 'all' ||
        order.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase());

      return matchesQuery && matchesStatus && matchesType && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, typeFilter, paymentFilter]);

  // Ranking of most sold items today
  const itemsRanking = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; totalRevenue: number }>();
    validOrders.forEach(o => {
      o.items.forEach(item => {
        const key = item.name + (item.pizzaSize ? ` (${item.pizzaSize})` : '') + (item.juiceSize ? ` (${item.juiceSize === '1L' ? '1lt' : item.juiceSize})` : '');
        const current = map.get(key) || { name: key, quantity: 0, totalRevenue: 0 };
        current.quantity += item.quantity;
        current.totalRevenue += item.price * item.quantity;
        map.set(key, current);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [validOrders]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();
    validOrders.forEach(o => {
      const method = o.paymentMethod || 'Outros';
      const current = map.get(method) || { method, count: 0, total: 0 };
      current.count += 1;
      current.total += o.total;
      map.set(method, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [validOrders]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Número do Pedido',
      'Data/Hora',
      'Cliente',
      'Telefone',
      'Tipo de Pedido',
      'Endereço',
      'Itens Detalhados',
      'Observações',
      'Forma de Pagamento',
      'Troco para',
      'Entregador',
      'Status Atual',
      'Subtotal (R$)',
      'Taxa Entrega (R$)',
      'Valor Total (R$)',
    ];

    const rows = filteredOrders.map(order => {
      const itemsString = order.items
        .map(i => `${i.quantity}x ${i.name}${i.pizzaSize ? ` [Tam: ${i.pizzaSize}]` : ''}${i.juiceSize ? ` [Tam: ${i.juiceSize === '1L' ? '1 Litro (1lt)' : i.juiceSize}]` : ''}${i.notes ? ` (${i.notes})` : ''}`)
        .join(' | ');

      return [
        order.orderNumber,
        order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : order.timeAgo || 'Hoje',
        `"${order.customerName.replace(/"/g, '""')}"`,
        order.customerPhone ? `"${order.customerPhone}"` : '""',
        order.type,
        `"${(order.address || 'Balcão').replace(/"/g, '""')}"`,
        `"${itemsString.replace(/"/g, '""')}"`,
        `"${(order.notes || '').replace(/"/g, '""')}"`,
        `"${order.paymentMethod.replace(/"/g, '""')}"`,
        order.changeFor ? `"${order.changeFor}"` : '""',
        order.courierName ? `"${order.courierName.replace(/"/g, '""')}"` : '"Nenhum"',
        order.status,
        order.subtotal ? order.subtotal.toFixed(2).replace('.', ',') : '0,00',
        order.deliveryFee ? order.deliveryFee.toFixed(2).replace('.', ',') : '0,00',
        order.total ? order.total.toFixed(2).replace('.', ',') : '0,00',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        `"RELATÓRIO DETALHADO DE PEDIDOS DO DIA - ${storeSettings.storeName.toUpperCase()}"`,
        `"Data da Extração: ${new Date().toLocaleString('pt-BR')}"`,
        `"Total de Pedidos Listados: ${filteredOrders.length} | Faturamento: R$ ${totalRevenue.toFixed(2).replace('.', ',')}"`,
        '',
        headers.join(';'),
        ...rows.map(r => r.join(';')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `relatorio_pedidos_crias_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy WhatsApp summary text
  const handleCopyWhatsAppSummary = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let text = `📋 *RELATÓRIO DIÁRIO DE PEDIDOS - ${storeSettings.storeName.toUpperCase()}*\n`;
    text += `📅 Data: ${todayStr} às ${timeStr}\n`;
    text += `🏪 Status: ${storeSettings.isOpen ? 'Loja Aberta' : 'Loja Fechada'}\n`;
    text += `----------------------------------------\n`;
    text += `📊 *RESUMO GERAL:*\n`;
    text += `• Total de Pedidos: ${orders.length} pedidos\n`;
    text += `• Faturamento Bruto: R$ ${totalRevenue.toFixed(2).replace('.', ',')}\n`;
    text += `• Ticket Médio: R$ ${averageTicket.toFixed(2).replace('.', ',')}\n`;
    text += `• Taxas de Entrega: R$ ${totalDeliveryFees.toFixed(2).replace('.', ',')}\n`;
    text += `• Pedidos Entregues: ${completedOrdersCount}\n`;
    text += `• Em Andamento / KDS: ${activeOrdersCount}\n`;
    text += `----------------------------------------\n`;
    text += `💳 *FORMAS DE PAGAMENTO:*\n`;
    paymentBreakdown.forEach(p => {
      text += `• ${p.method}: ${p.count} ped. (R$ ${p.total.toFixed(2).replace('.', ',')})\n`;
    });
    text += `----------------------------------------\n`;
    text += `📝 *LISTA DETALHADA DOS PEDIDOS:*\n\n`;

    filteredOrders.forEach((o, index) => {
      const itemsList = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      text += `${index + 1}) *${o.orderNumber}* - ${o.customerName} (${o.type})\n`;
      text += `   💰 Total: R$ ${o.total.toFixed(2).replace('.', ',')} [${o.paymentMethod}]\n`;
      text += `   📦 Itens: ${itemsList}\n`;
      text += `   📍 Status: ${o.status.toUpperCase()} ${o.courierName ? `(Entregador: ${o.courierName})` : ''}\n`;
      if (o.notes) text += `   ⚠️ Obs: ${o.notes}\n`;
      text += `\n`;
    });

    text += `----------------------------------------\n`;
    text += `*Gerado pelo Painel de Gestão da Cozinha* 🍔🔥`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

  // Printable View Trigger
  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const element = reportRef.current;
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 1.5,
        backgroundColor: '#181818',
        skipFonts: true,
        imagePlaceholder: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%231a1a1a" width="100" height="100"/></svg>',
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao renderizar imagem'));
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeStoreName = (storeSettings.storeName || 'burgerdash').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileDateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`relatorio-pedidos-${safeStoreName}-${fileDateStr}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF de pedidos:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
      case 'recebido':
        return (
          <span className="px-2 py-0.5 rounded-md bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Novo
          </span>
        );
      case 'preparando':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Preparando
          </span>
        );
      case 'pronto':
        return (
          <span className="px-2 py-0.5 rounded-md bg-[#019ad8]/15 text-[#86cfff] border border-[#019ad8]/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Pronto
          </span>
        );
      case 'em_entrega':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Em Entrega
          </span>
        );
      case 'entregue':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Entregue
          </span>
        );
      case 'recusado':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase font-['Montserrat']">
            Recusado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-gray-500/15 text-gray-400 text-[10px] font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#181818] border border-[#353535] rounded-lg w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#353535] bg-[#1f1f1f] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722] flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Montserrat'] font-extrabold text-base sm:text-lg text-white">
                  Relatório de Pedidos do Dia
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold uppercase">
                  Lista Detalhada
                </span>
              </div>
              <p className="text-xs text-[#b4b5b5] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{storeSettings.storeName}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#ff8a65]">
                  <Calendar className="w-3 h-3" />
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="text-[#8e8f8f]">
                  {orders.length} pedidos no total
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={handleExportCSV}
              className="bg-[#262626] hover:bg-[#333333] text-emerald-400 border border-emerald-500/40 hover:border-emerald-500 px-3 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
              title="Baixar planilha compatível com Excel (.CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              onClick={handleCopyWhatsAppSummary}
              className="bg-[#262626] hover:bg-[#333333] text-[#ff8a65] border border-[#ff5722]/40 hover:border-[#ff5722] px-3 py-2 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
              title="Copiar resumo completo formatado para WhatsApp do dono/equipe"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado p/ WhatsApp!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copiar p/ WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#ff5722] hover:bg-[#f4511e] disabled:opacity-50 text-white px-3 py-2 rounded-md text-xs font-['Montserrat'] font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
              title="Baixar arquivo PDF de pedidos"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintReport}
              className="bg-[#262626] hover:bg-[#333333] text-white border border-[#353535] hover:border-white px-3 py-2 rounded-md text-xs font-['Montserrat'] font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap hidden sm:flex cursor-pointer"
              title="Imprimir relatório da cozinha"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#b4b5b5] hover:text-white p-2 rounded-md hover:bg-[#333] transition-colors ml-auto md:ml-0 cursor-pointer"
              title="Fechar relatório"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={reportRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#181818]">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Faturamento
              </span>
              <span className="text-lg font-extrabold text-[#ff5722] font-['Montserrat'] mt-0.5 block truncate">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-[#8e8f8f]">
                {validOrders.length} ped. válidos
              </span>
            </div>

            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Ticket Médio
              </span>
              <span className="text-lg font-extrabold text-white font-['Montserrat'] mt-0.5 block truncate">
                R$ {averageTicket.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-[#8e8f8f]">
                Média por pedido
              </span>
            </div>

            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Taxas de Entrega
              </span>
              <span className="text-lg font-extrabold text-[#86cfff] font-['Montserrat'] mt-0.5 block truncate">
                R$ {totalDeliveryFees.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-[#8e8f8f]">
                Frete total acumulado
              </span>
            </div>

            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Entregues
              </span>
              <span className="text-lg font-extrabold text-emerald-400 font-['Montserrat'] mt-0.5 block">
                {completedOrdersCount}
              </span>
              <span className="text-[10px] text-emerald-400/80">
                100% finalizados
              </span>
            </div>

            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Em Andamento
              </span>
              <span className="text-lg font-extrabold text-amber-400 font-['Montserrat'] mt-0.5 block">
                {activeOrdersCount}
              </span>
              <span className="text-[10px] text-amber-400/80">
                Fluxo da cozinha
              </span>
            </div>

            <div className="bg-[#20201f] border border-[#353535] rounded-md p-3">
              <span className="text-[10px] text-[#b4b5b5] uppercase font-bold tracking-wider font-['Montserrat'] block">
                Cancelados
              </span>
              <span className="text-lg font-extrabold text-red-400 font-['Montserrat'] mt-0.5 block">
                {orders.filter(o => o.status === 'recusado').length}
              </span>
              <span className="text-[10px] text-red-400/80">
                Pedidos recusados
              </span>
            </div>
          </div>

          {/* Subtabs for Visualizing: Lista Completa vs Resumo de Itens / Ranking */}
          <div className="flex items-center justify-between border-b border-[#353535] pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#20201f] p-1 rounded-md border border-[#353535]">
              <button
                onClick={() => setActiveView('lista')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'lista'
                    ? 'bg-[#ff5722] text-white shadow-sm'
                    : 'text-[#b4b5b5] hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Lista Detalhada ({filteredOrders.length})</span>
              </button>
              <button
                onClick={() => setActiveView('itens_resumo')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'itens_resumo'
                    ? 'bg-[#ff5722] text-white shadow-sm'
                    : 'text-[#b4b5b5] hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Mais Vendidos & Meios de Pgto</span>
              </button>
            </div>

            <span className="text-xs text-[#b4b5b5] font-mono">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-[#20201f] border border-[#353535] rounded-md p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8e8f8f] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por #pedido, cliente, telefone, produto ou motoboy..."
                  className="w-full bg-[#181818] border border-[#353535] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#8e8f8f] focus:outline-none focus:border-[#ff5722]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#ff8a65]" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#181818] border border-[#353535] rounded-md px-2.5 py-2 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#ff5722]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="novos">Novos / Recebidos</option>
                  <option value="preparando">Em Preparo</option>
                  <option value="pronto">Prontos</option>
                  <option value="em_entrega">Em Entrega</option>
                  <option value="entregue">Entregues</option>
                  <option value="recusado">Recusados</option>
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-[#181818] border border-[#353535] rounded-md px-2.5 py-2 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#ff5722]"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Retirada">Retirada</option>
                  <option value="Mesa">Mesa / Balcão</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value)}
                  className="bg-[#181818] border border-[#353535] rounded-md px-2.5 py-2 text-xs text-[#e5e2e1] focus:outline-none focus:border-[#ff5722]"
                >
                  <option value="all">Todos os Pgtos</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>
          </div>

          {/* VIEW 1: DETAILED ORDERS LIST (TABLE + ACCORDION) */}
          {activeView === 'lista' && (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-[#20201f] border border-[#353535] rounded-md p-10 text-center space-y-2">
                  <p className="text-white font-['Montserrat'] font-bold text-sm">
                    Nenhum pedido encontrado
                  </p>
                  <p className="text-xs text-[#b4b5b5]">
                    Tente ajustar seus termos de busca ou remover os filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#353535] rounded-md bg-[#20201f]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#353535] bg-[#181818] text-[#8e8f8f] font-['Montserrat'] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3.5">Pedido</th>
                        <th className="py-3 px-3">Cliente / Contato</th>
                        <th className="py-3 px-3">Tipo / Endereço</th>
                        <th className="py-3 px-3">Itens Discriminados</th>
                        <th className="py-3 px-3">Pagamento</th>
                        <th className="py-3 px-3">Entregador</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Total</th>
                        <th className="py-3 px-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#353535]/50">
                      {filteredOrders.map(order => {
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <React.Fragment key={order.id}>
                            <tr
                              className={`hover:bg-[#252525] transition-colors cursor-pointer ${
                                isExpanded ? 'bg-[#252525]' : ''
                              }`}
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                              {/* Order & Time */}
                              <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-sm">
                                    {order.orderNumber}
                                  </span>
                                  {order.isUrgent && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Urgente" />
                                  )}
                                </div>
                                <span className="text-[10px] text-[#8e8f8f] block mt-0.5">
                                  {order.timeAgo || 'Hoje'}
                                </span>
                              </td>

                              {/* Customer */}
                              <td className="py-3 px-3">
                                <span className="font-semibold text-white block">
                                  {order.customerName}
                                </span>
                                {order.customerPhone ? (
                                  <a
                                    href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    {order.customerPhone}
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-[#8e8f8f]">Sem telefone</span>
                                )}
                              </td>

                              {/* Type & Address */}
                              <td className="py-3 px-3 max-w-[180px]">
                                <span className="font-medium text-white block">
                                  {order.type}
                                </span>
                                <span
                                  className="text-[11px] text-[#b4b5b5] block truncate mt-0.5"
                                  title={order.address || 'Retirada no Balcão'}
                                >
                                  {order.address || 'Balcão da Loja'}
                                </span>
                              </td>

                              {/* Items Summary */}
                              <td className="py-3 px-3 max-w-[240px]">
                                <div className="text-white space-y-0.5">
                                  {order.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[11px]">
                                      <span className="truncate">
                                        <strong className="text-[#ff8a65]">{item.quantity}x</strong> {item.name}
                                        {item.pizzaSize && ` (${item.pizzaSize})`}
                                      </span>
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <span className="text-[10px] text-[#8e8f8f] block">
                                      +{order.items.length - 2} outros itens...
                                    </span>
                                  )}
                                  {order.notes && (
                                    <span className="text-[10px] text-amber-400/90 block italic truncate">
                                      Obs: {order.notes}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Payment */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="text-white block font-medium">
                                  {order.paymentMethod}
                                </span>
                                {order.changeFor && (
                                  <span className="text-[10px] text-amber-400 block">
                                    Troco p/ R$ {order.changeFor}
                                  </span>
                                )}
                              </td>

                              {/* Courier */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {order.courierName ? (
                                  <div className="flex items-center gap-1.5 text-white">
                                    <Bike className="w-3.5 h-3.5 text-[#86cfff]" />
                                    <span>{order.courierName}</span>
                                  </div>
                                ) : (
                                  <span className="text-[#8e8f8f] text-[11px]">—</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {getStatusBadge(order.status)}
                              </td>

                              {/* Total */}
                              <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                                <span className="font-extrabold text-[#ff5722] text-sm block">
                                  R$ {order.total.toFixed(2).replace('.', ',')}
                                </span>
                                {order.deliveryFee > 0 && (
                                  <span className="text-[10px] text-[#8e8f8f] block">
                                    (inclui R$ {order.deliveryFee.toFixed(2)} frete)
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                  {onPrintOrder && (
                                    <button
                                      onClick={() => onPrintOrder(order)}
                                      className="p-1.5 hover:bg-[#333] text-[#b4b5b5] hover:text-[#ff8a65] rounded-md transition-colors"
                                      title="Imprimir comanda deste pedido"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className="p-1.5 hover:bg-[#333] text-[#b4b5b5] hover:text-white rounded-md transition-colors"
                                    title={isExpanded ? 'Recolher detalhes' : 'Ver todos os detalhes'}
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Accordion Expandable Detailed Card */}
                            {isExpanded && (
                              <tr className="bg-[#1c1c1c] border-b border-[#353535]">
                                <td colSpan={9} className="p-4">
                                  <div className="bg-[#262626] border border-[#353535] rounded-md p-4 space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#353535] pb-2">
                                      <div className="flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-[#ff5722]" />
                                        <h4 className="font-['Montserrat'] font-bold text-sm text-white">
                                          Detalhamento Completo do Pedido {order.orderNumber}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-[#b4b5b5]">
                                        <span>Subtotal: R$ {order.subtotal ? order.subtotal.toFixed(2).replace('.', ',') : '0,00'}</span>
                                        <span>+ Frete: R$ {order.deliveryFee ? order.deliveryFee.toFixed(2).replace('.', ',') : '0,00'}</span>
                                        <span className="font-bold text-white">= Total: R$ {order.total.toFixed(2).replace('.', ',')}</span>
                                      </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-1.5 text-xs">
                                      <p className="text-[11px] font-bold text-[#8e8f8f] uppercase font-['Montserrat']">
                                        Itens Solicitados:
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {order.items.map((item, iIdx) => (
                                          <div
                                            key={iIdx}
                                            className="bg-[#1f1f1f] border border-[#353535] p-2.5 rounded-md flex justify-between items-start"
                                          >
                                            <div>
                                              <p className="font-semibold text-white">
                                                <span className="text-[#ff8a65]">{item.quantity}x</span> {item.name}
                                                {item.pizzaSize && ` • Tamanho: ${item.pizzaSize}`}
                                              </p>
                                              {item.notes && (
                                                <p className="text-[11px] text-amber-300 mt-0.5">
                                                  Obs: {item.notes}
                                                </p>
                                              )}
                                            </div>
                                            <span className="font-mono font-bold text-[#ff8a65]">
                                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Order Meta Footer */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#353535] text-xs">
                                      <div>
                                        <span className="text-[#8e8f8f] text-[10px] block uppercase font-bold">Endereço de Entrega:</span>
                                        <span className="text-white">{order.address || 'Retirada no Balcão'}</span>
                                      </div>
                                      <div>
                                        <span className="text-[#8e8f8f] text-[10px] block uppercase font-bold">Entregador Responsável:</span>
                                        <span className="text-white">
                                          {order.courierName
                                            ? `${order.courierName} ${order.courierVehicle ? `(${order.courierVehicle})` : ''} ${order.courierPhone ? `• ${order.courierPhone}` : ''}`
                                            : 'Não despachado ainda'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[#8e8f8f] text-[10px] block uppercase font-bold">Observações Gerais:</span>
                                        <span className="text-amber-300">{order.notes || 'Nenhuma observação informada.'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: TOP ITEMS & PAYMENT BREAKDOWN */}
          {activeView === 'itens_resumo' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Ranking of Items Sold Today */}
              <div className="bg-[#20201f] border border-[#353535] rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#353535] pb-2.5">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#ff5722]" /> Itens Mais Vendidos do Dia
                  </h3>
                  <span className="text-[10px] bg-[#ff5722]/15 text-[#ff8a65] border border-[#ff5722]/30 px-2 py-0.5 rounded-md font-bold">
                    {itemsRanking.length} produtos diferentes
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {itemsRanking.length === 0 ? (
                    <p className="text-xs text-[#8e8f8f] py-4 text-center">Nenhum produto registrado no turno.</p>
                  ) : (
                    itemsRanking.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-[#181818] border border-[#353535] rounded-md text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                              index === 0
                                ? 'bg-[#ff5722] text-white shadow-sm'
                                : index === 1
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-[#262626] text-[#b4b5b5]'
                            }`}
                          >
                            {index + 1}º
                          </span>
                          <span className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="bg-[#ff5722]/10 text-[#ff8a65] px-2 py-0.5 rounded font-bold text-[11px]">
                            {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                          </span>
                          <span className="font-mono font-bold text-white text-xs">
                            R$ {item.totalRevenue.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-[#20201f] border border-[#353535] rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#353535] pb-2.5">
                  <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Fechamento por Forma de Pagamento
                  </h3>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                    Total: R$ {totalRevenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {paymentBreakdown.map((item, index) => {
                    const percent = totalRevenue > 0 ? (item.total / totalRevenue) * 100 : 0;
                    return (
                      <div key={index} className="p-3 bg-[#181818] border border-[#353535] rounded-md space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{item.method}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[#8e8f8f] text-[11px]">{item.count} pedidos</span>
                            <span className="font-bold text-emerald-400">R$ {item.total.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#8e8f8f] block text-right">
                          {percent.toFixed(1)}% do faturamento diário
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#1f1f1f] border-t border-[#353535] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8e8f8f]">
            <Sparkles className="w-3.5 h-3.5 text-[#ff8a65]" />
            <span>
              Relatório compilado em tempo real com os pedidos da cozinha.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-[#ff5722] hover:bg-[#ff7043] text-white px-4 py-2 rounded-md font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Relatório (.CSV)</span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#262626] hover:bg-[#333] text-white px-4 py-2 rounded-md font-['Montserrat'] font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
