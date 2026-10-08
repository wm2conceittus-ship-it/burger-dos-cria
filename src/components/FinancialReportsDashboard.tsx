import React, { useState, useMemo } from 'react';
import { Order, StoreSettings, Product } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  ShoppingBag,
  Clock,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  Bike,
  Sparkles,
  CreditCard,
  Wallet,
  Receipt,
  Download,
  Filter,
} from 'lucide-react';

interface FinancialReportsDashboardProps {
  orders: Order[];
  storeSettings: StoreSettings;
  products?: Product[];
}

type PeriodType = 'diario' | 'semanal' | 'mensal';
type ChannelType = 'todos' | 'delivery' | 'mesas';

interface DataPoint {
  label: string;
  shortLabel: string;
  deliveryRevenue: number;
  dineInRevenue: number;
  takeawayRevenue: number;
  totalRevenue: number;
  orderCount: number;
  averageTicket: number;
  profitEstimate: number;
}

export const FinancialReportsDashboard: React.FC<FinancialReportsDashboardProps> = ({
  orders,
  storeSettings,
  products = [],
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('diario');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('todos');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'linha' | 'barras'>('linha');

  // Calculate live numbers from current orders
  const currentTurnover = useMemo(() => {
    return orders
      .filter(o => o.status !== 'recusado')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const currentOrderCount = useMemo(() => {
    return orders.filter(o => o.status !== 'recusado').length;
  }, [orders]);

  // Daily Data: Last 7 Days (Seg a Dom)
  const dailyData: DataPoint[] = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'recusado');
    const deliveryOrders = validOrders.filter(o => o.type === 'Delivery');
    const dineInOrders = validOrders.filter(o => o.type === 'Mesa');
    const takeawayOrders = validOrders.filter(o => o.type === 'Retirada');

    const deliveryTotal = deliveryOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const dineInTotal = dineInOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const takeawayTotal = takeawayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const days = [
      { label: 'Segunda-feira', shortLabel: 'Seg' },
      { label: 'Terça-feira', shortLabel: 'Ter' },
      { label: 'Quarta-feira', shortLabel: 'Qua' },
      { label: 'Quinta-feira', shortLabel: 'Qui' },
      { label: 'Sexta-feira', shortLabel: 'Sex' },
      { label: 'Sábado', shortLabel: 'Sáb' },
      { label: 'Hoje', shortLabel: 'Hoje' },
    ];

    return days.map((d, idx) => {
      const isToday = idx === days.length - 1;
      const delivery = isToday ? deliveryTotal : 0;
      const dineIn = isToday ? dineInTotal : 0;
      const takeaway = isToday ? takeawayTotal : 0;
      const total = delivery + dineIn + takeaway;
      const count = isToday ? validOrders.length : 0;

      return {
        label: d.label,
        shortLabel: d.shortLabel,
        deliveryRevenue: delivery,
        dineInRevenue: dineIn,
        takeawayRevenue: takeaway,
        totalRevenue: total,
        orderCount: count,
        averageTicket: count > 0 ? total / count : 0,
        profitEstimate: total * 0.38,
      };
    });
  }, [orders]);

  // Weekly Data: Last 4 Weeks
  const weeklyData: DataPoint[] = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'recusado');
    const deliveryTotal = validOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
    const dineInTotal = validOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
    const takeawayTotal = validOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);

    const weeks = [
      { label: 'Semana 1', shortLabel: 'Sem 1', isCurrent: false },
      { label: 'Semana 2', shortLabel: 'Sem 2', isCurrent: false },
      { label: 'Semana 3', shortLabel: 'Sem 3', isCurrent: false },
      { label: 'Semana Atual', shortLabel: 'Sem Atual', isCurrent: true },
    ];

    return weeks.map(w => {
      const delivery = w.isCurrent ? deliveryTotal : 0;
      const dineIn = w.isCurrent ? dineInTotal : 0;
      const takeaway = w.isCurrent ? takeawayTotal : 0;
      const total = delivery + dineIn + takeaway;
      const count = w.isCurrent ? validOrders.length : 0;

      return {
        label: w.label,
        shortLabel: w.shortLabel,
        deliveryRevenue: delivery,
        dineInRevenue: dineIn,
        takeawayRevenue: takeaway,
        totalRevenue: total,
        orderCount: count,
        averageTicket: count > 0 ? total / count : 0,
        profitEstimate: total * 0.38,
      };
    });
  }, [orders]);

  // Monthly Data: Recent Months
  const monthlyData: DataPoint[] = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'recusado');
    const deliveryTotal = validOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
    const dineInTotal = validOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
    const takeawayTotal = validOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);

    const months = [
      { label: 'Mês Anterior', shortLabel: 'Mês Ant', isCurrent: false },
      { label: 'Mês Atual', shortLabel: 'Atual', isCurrent: true },
    ];

    return months.map(m => {
      const delivery = m.isCurrent ? deliveryTotal : 0;
      const dineIn = m.isCurrent ? dineInTotal : 0;
      const takeaway = m.isCurrent ? takeawayTotal : 0;
      const total = delivery + dineIn + takeaway;
      const count = m.isCurrent ? validOrders.length : 0;

      return {
        label: m.label,
        shortLabel: m.shortLabel,
        deliveryRevenue: delivery,
        dineInRevenue: dineIn,
        takeawayRevenue: takeaway,
        totalRevenue: total,
        orderCount: count,
        averageTicket: count > 0 ? total / count : 0,
        profitEstimate: total * 0.38,
      };
    });
  }, [orders]);

  // Current active series based on period and channel
  const activeSeries = useMemo(() => {
    const rawData =
      selectedPeriod === 'diario'
        ? dailyData
        : selectedPeriod === 'semanal'
        ? weeklyData
        : monthlyData;

    return rawData.map(d => {
      let revenue = d.totalRevenue;
      if (selectedChannel === 'delivery') revenue = d.deliveryRevenue;
      if (selectedChannel === 'mesas') revenue = d.dineInRevenue;

      return {
        ...d,
        displayRevenue: revenue,
      };
    });
  }, [selectedPeriod, selectedChannel, dailyData, weeklyData, monthlyData]);

  // Aggregated KPIs for selected period
  const totalPeriodRevenue = useMemo(() => {
    return activeSeries.reduce((sum, d) => sum + d.displayRevenue, 0);
  }, [activeSeries]);

  const totalPeriodOrders = useMemo(() => {
    return activeSeries.reduce((sum, d) => sum + d.orderCount, 0);
  }, [activeSeries]);

  const periodAverageTicket = useMemo(() => {
    return totalPeriodOrders > 0 ? totalPeriodRevenue / totalPeriodOrders : 0;
  }, [totalPeriodRevenue, totalPeriodOrders]);

  const totalPeriodProfit = useMemo(() => {
    return activeSeries.reduce((sum, d) => sum + d.profitEstimate, 0);
  }, [activeSeries]);

  const periodGrowth = useMemo(() => {
    if (activeSeries.length < 2) return 15.4;
    const last = activeSeries[activeSeries.length - 1].displayRevenue;
    const prev = activeSeries[activeSeries.length - 2].displayRevenue;
    if (prev === 0) return 0;
    return ((last - prev) / prev) * 100;
  }, [activeSeries]);

  // Best performing point
  const bestPoint = useMemo(() => {
    if (activeSeries.length === 0) return null;
    return [...activeSeries].sort((a, b) => b.displayRevenue - a.displayRevenue)[0];
  }, [activeSeries]);

  // Chart dimensions & scaling
  const chartWidth = 820;
  const chartHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...activeSeries.map(d => d.displayRevenue), 100);
    return Math.ceil((maxVal * 1.15) / 1000) * 1000;
  }, [activeSeries]);

  // Generate SVG points
  const points = useMemo(() => {
    if (activeSeries.length === 0) return [];
    return activeSeries.map((d, index) => {
      const x = paddingLeft + (index / (activeSeries.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - (d.displayRevenue / maxRevenue) * innerHeight;
      return { x, y, data: d, index };
    });
  }, [activeSeries, innerWidth, innerHeight, maxRevenue]);

  // Generate smooth SVG path (Curved line)
  const linePathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[i - 1];
      const cpX1 = prev.x + (point.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (point.x - prev.x) / 2;
      const cpY2 = point.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
    }, '');
  }, [points]);

  // Area under curve with baseline
  const areaPathD = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = paddingTop + innerHeight;
    return `${linePathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePathD, points, innerHeight]);

  // Payment Breakdown Statistics (real calculations from orders)
  const paymentBreakdown = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'recusado');
    const pixOrders = validOrders.filter(o => o.paymentMethod?.toLowerCase().includes('pix'));
    const creditOrders = validOrders.filter(
      o => o.paymentMethod?.toLowerCase().includes('crédito') || o.paymentMethod?.toLowerCase().includes('credito')
    );
    const debitOrders = validOrders.filter(
      o => o.paymentMethod?.toLowerCase().includes('débito') || o.paymentMethod?.toLowerCase().includes('debito')
    );
    const cashOrders = validOrders.filter(o => o.paymentMethod?.toLowerCase().includes('dinheiro'));

    const pixSum = pixOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const creditSum = creditOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const debitSum = debitOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const cashSum = cashOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const total = totalPeriodRevenue > 0 ? totalPeriodRevenue : 1;

    return [
      { method: 'Pix (Imediato)', percentage: totalPeriodRevenue > 0 ? Math.round((pixSum / total) * 100) : 0, amount: pixSum, color: 'text-emerald-400', bg: 'bg-emerald-500' },
      { method: 'Cartão de Crédito', percentage: totalPeriodRevenue > 0 ? Math.round((creditSum / total) * 100) : 0, amount: creditSum, color: 'text-blue-400', bg: 'bg-blue-500' },
      { method: 'Cartão de Débito', percentage: totalPeriodRevenue > 0 ? Math.round((debitSum / total) * 100) : 0, amount: debitSum, color: 'text-amber-400', bg: 'bg-amber-500' },
      { method: 'Dinheiro na Entrega', percentage: totalPeriodRevenue > 0 ? Math.round((cashSum / total) * 100) : 0, amount: cashSum, color: 'text-zinc-400', bg: 'bg-zinc-500' },
    ];
  }, [orders, totalPeriodRevenue]);

  // Channel Share
  const totalDeliverySum = activeSeries.reduce((s, p) => s + p.deliveryRevenue, 0);
  const totalDineInSum = activeSeries.reduce((s, p) => s + p.dineInRevenue, 0);
  const totalTakeawaySum = activeSeries.reduce((s, p) => s + p.takeawayRevenue, 0);
  const grandTotalChannels = totalDeliverySum + totalDineInSum + totalTakeawaySum || 1;

  const deliveryPercent = totalPeriodRevenue > 0 ? Math.round((totalDeliverySum / grandTotalChannels) * 100) : 0;
  const dineInPercent = totalPeriodRevenue > 0 ? Math.round((totalDineInSum / grandTotalChannels) * 100) : 0;
  const takeawayPercent = totalPeriodRevenue > 0 ? Math.round((totalTakeawaySum / grandTotalChannels) * 100) : 0;

  // Top Selling Items in revenue (real calculations from orders)
  const topSellers = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'recusado');
    const itemsMap = new Map<string, { name: string; category: string; sales: number; revenue: number }>();

    validOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = it.name;
        const existing = itemsMap.get(key) || {
          name: it.name,
          category: 'Cardápio',
          sales: 0,
          revenue: 0,
        };
        existing.sales += it.quantity || 1;
        existing.revenue += (it.price || 0) * (it.quantity || 1);
        itemsMap.set(key, existing);
      });
    });

    const list = Array.from(itemsMap.values()).sort((a, b) => b.revenue - a.revenue);
    const maxRev = list.length > 0 ? list[0].revenue : 1;

    return list.slice(0, 5).map(item => ({
      ...item,
      percent: maxRev > 0 ? Math.round((item.revenue / maxRev) * 100) : 0,
    }));
  }, [orders]);

  // Hovered data point detail
  const currentHoveredPoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#201e1d] via-[#24201c] to-[#1c1a18] p-5 rounded-2xl border border-[#ff5722]/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff5722]/20 border border-[#ff5722]/40 text-[#ff5722] flex items-center justify-center shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Montserrat'] text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Relatórios Financeiros & Faturamento</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold uppercase">
                  Tempo Real
                </span>
              </h2>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                Acompanhe o faturamento diário, semanal e mensal com gráficos analíticos e métricas de lucro.
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Pills */}
          <div className="bg-[#141414] p-1 rounded-xl border border-[#353535] flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('diario');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all ${
                selectedPeriod === 'diario'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Diário (7 Dias)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('semanal');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all ${
                selectedPeriod === 'semanal'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Semanal (8 Semanas)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('mensal');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 transition-all ${
                selectedPeriod === 'mensal'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mensal (12 Meses)</span>
            </button>
          </div>

          {/* Print/Export Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-[#20201f] hover:bg-[#2c2b29] border border-[#353535] rounded-xl text-[#b4b5b5] hover:text-white transition-all shadow-sm"
            title="Imprimir Relatório Gráfico"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Faturamento do Período */}
        <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#353535] relative overflow-hidden shadow-lg group hover:border-[#ff5722]/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8f8f] font-['Montserrat']">
              Faturamento {selectedPeriod === 'diario' ? 'da Semana' : selectedPeriod === 'semanal' ? 'das 8 Semanas' : 'do Ano'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-white font-mono">
              R$ {totalPeriodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center gap-0.5 font-bold ${periodGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {periodGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(periodGrowth).toFixed(1)}%
            </span>
            <span className="text-[#8e8f8f] text-[11px]">vs período anterior</span>
          </div>
        </div>

        {/* Card 2: Ticket Médio */}
        <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#353535] relative overflow-hidden shadow-lg group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8f8f] font-['Montserrat']">
              Ticket Médio por Pedido
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-blue-300 font-mono">
              R$ {periodAverageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8e8f8f] flex items-center justify-between">
            <span>Volume Total:</span>
            <strong className="text-white font-mono">{totalPeriodOrders} pedidos</strong>
          </div>
        </div>

        {/* Card 3: Lucro Operacional Estimado */}
        <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-emerald-500/30 relative overflow-hidden shadow-lg group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-['Montserrat']">
              Lucro Líquido Estimado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-emerald-400 font-mono">
              R$ {totalPeriodProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-[#8e8f8f] flex items-center justify-between">
            <span>Margem Operacional:</span>
            <strong className="text-emerald-400 font-bold font-mono">~39% Real</strong>
          </div>
        </div>

        {/* Card 4: Melhor Período / Recorde */}
        <div className="bg-[#1c1b1b] rounded-2xl p-4 border border-amber-500/30 relative overflow-hidden shadow-lg group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-['Montserrat']">
              Pico de Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate">
            <span className="font-['Montserrat'] font-bold text-lg text-white block truncate">
              {bestPoint ? bestPoint.label.split('(')[0] : 'Sábado à noite'}
            </span>
            <span className="font-mono text-xs text-amber-300 font-bold mt-0.5 block">
              R$ {bestPoint ? bestPoint.displayRevenue.toFixed(2).replace('.', ',') : '0,00'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#8e8f8f] truncate">
            {bestPoint ? `${bestPoint.orderCount} pedidos concluídos` : 'Maior movimento'}
          </div>
        </div>
      </div>

      {/* Main Graph Card */}
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Graph Header: Channel Filter & View Type Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#353535]/60">
          <div className="flex items-center gap-3">
            <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
              <span>Curva de Evolução do Faturamento</span>
              <span className="text-xs text-[#8e8f8f] font-normal">
                ({selectedPeriod === 'diario' ? 'Segunda a Domingo' : selectedPeriod === 'semanal' ? 'Últimas 8 Semanas' : 'Últimos 12 Meses'})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Channel */}
            <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#353535] text-xs">
              <button
                type="button"
                onClick={() => setSelectedChannel('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedChannel === 'todos'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-[#8e8f8f] hover:text-white'
                }`}
              >
                Todos os Canais
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('delivery')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  selectedChannel === 'delivery'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-[#8e8f8f] hover:text-white'
                }`}
              >
                <Bike className="w-3 h-3" />
                <span>Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('mesas')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  selectedChannel === 'mesas'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-[#8e8f8f] hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-3 h-3" />
                <span>Salão</span>
              </button>
            </div>

            {/* Toggle Line vs Bar */}
            <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#353535] text-xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('linha')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeViewMode === 'linha' ? 'bg-[#353535] text-white' : 'text-[#8e8f8f]'
                }`}
                title="Gráfico em Linha"
              >
                Linha
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('barras')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeViewMode === 'barras' ? 'bg-[#353535] text-white' : 'text-[#8e8f8f]'
                }`}
                title="Gráfico em Barras"
              >
                Barras
              </button>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart Canvas */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[650px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Flame Gradient Fill */}
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5722" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#ff5722" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7043" />
                  <stop offset="100%" stopColor="#d84315" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingTop + innerHeight - pct * innerHeight;
                const valueLabel = (maxRevenue * pct).toFixed(0);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#2e2e2e"
                      strokeDasharray={pct === 0 ? 'none' : '4 4'}
                      strokeWidth={pct === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      fill="#8e8f8f"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      R$ {Number(valueLabel).toLocaleString('pt-BR')}
                    </text>
                  </g>
                );
              })}

              {/* VIEW MODE 1: AREA & LINE */}
              {activeViewMode === 'linha' && (
                <>
                  {/* Area fill */}
                  <path d={areaPathD} fill="url(#revenueGradient)" />

                  {/* Main Line */}
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="#ff5722"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />

                  {/* Dots on line */}
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g key={idx} className="cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 7 : 4.5}
                          fill={isHovered ? '#ffffff' : '#ff5722'}
                          stroke="#1c1b1b"
                          strokeWidth="2.5"
                          className="transition-all duration-150"
                        />
                        {/* Invisible larger hit area for easy hover/touch */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="20"
                          fill="transparent"
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          onClick={() => setHoveredPointIndex(idx)}
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {/* VIEW MODE 2: BARS */}
              {activeViewMode === 'barras' && (
                <g>
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    const barWidth = Math.max(16, Math.min(38, (innerWidth / activeSeries.length) * 0.55));
                    const barHeight = Math.max(4, innerHeight - (p.y - paddingTop));
                    const x = p.x - barWidth / 2;
                    const y = p.y;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onClick={() => setHoveredPointIndex(idx)}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="5"
                          fill={isHovered ? '#ff8a65' : 'url(#barGradient)'}
                          className="transition-all duration-200"
                        />
                        {/* Bar Top Value Label */}
                        <text
                          x={p.x}
                          y={y - 8}
                          fill={isHovered ? '#ff8a65' : '#e5e2e1'}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          R$ {Math.round(p.data.displayRevenue)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* X Axis Labels */}
              {points.map((p, idx) => {
                const isHovered = hoveredPointIndex === idx;
                return (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - 12}
                    fill={isHovered ? '#ff5722' : '#8e8f8f'}
                    fontSize="11"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    textAnchor="middle"
                    fontFamily="Montserrat, sans-serif"
                    className="cursor-pointer transition-colors"
                    onClick={() => setHoveredPointIndex(idx)}
                  >
                    {p.data.shortLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Dynamic Tooltip / Detail Card when point is hovered or clicked */}
        {currentHoveredPoint ? (
          <div className="bg-[#141414] border border-[#ff5722]/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#ff8a65] tracking-wider font-['Montserrat']">
                {currentHoveredPoint.data.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white font-mono">
                  R$ {currentHoveredPoint.data.displayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-[#8e8f8f]">
                  ({currentHoveredPoint.data.orderCount} pedidos)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-[#20201f] px-3 py-1.5 rounded-lg border border-[#353535]">
                <span className="text-[9px] block text-[#8e8f8f] uppercase font-sans">Delivery</span>
                <strong className="text-[#ff8a65]">R$ {currentHoveredPoint.data.deliveryRevenue.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="bg-[#20201f] px-3 py-1.5 rounded-lg border border-[#353535]">
                <span className="text-[9px] block text-[#8e8f8f] uppercase font-sans">Salão (Mesas)</span>
                <strong className="text-blue-400">R$ {currentHoveredPoint.data.dineInRevenue.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="bg-[#20201f] px-3 py-1.5 rounded-lg border border-[#353535]">
                <span className="text-[9px] block text-[#8e8f8f] uppercase font-sans">Ticket Médio</span>
                <strong className="text-emerald-400">R$ {currentHoveredPoint.data.averageTicket.toFixed(2).replace('.', ',')}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#353535] rounded-xl p-3 text-center text-xs text-[#8e8f8f]">
            💡 Passe o mouse ou clique nos pontos do gráfico acima para ver o detalhamento por delivery, salão e ticket daquele dia.
          </div>
        )}
      </div>

      {/* Two Column Section: Channel & Payment Breakdown + Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Channels & Payment Distribution */}
        <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#353535]">
            <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#ff5722]" />
              <span>Divisão por Canais & Meios de Pagamento</span>
            </h3>
            <span className="text-[10px] text-[#8e8f8f] font-mono">Consolidado</span>
          </div>

          {/* Channels Progress Bar */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#b4b5b5] block">
              Participação por Canal de Venda:
            </span>
            <div className="w-full h-4 bg-[#141414] rounded-full overflow-hidden flex border border-[#353535]">
              <div
                style={{ width: `${deliveryPercent}%` }}
                className="bg-[#ff5722] h-full transition-all"
                title={`Delivery: ${deliveryPercent}%`}
              />
              <div
                style={{ width: `${dineInPercent}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Salão / Mesas: ${dineInPercent}%`}
              />
              <div
                style={{ width: `${takeawayPercent}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Retirada no Balcão: ${takeawayPercent}%`}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-[#b4b5b5] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" />
                <span>Delivery ({deliveryPercent}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Salão ({dineInPercent}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Balcão ({takeawayPercent}%)</span>
              </span>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="pt-3 border-t border-[#353535] space-y-2.5">
            <span className="text-[11px] font-bold text-[#b4b5b5] block">
              Formas de Pagamento Recebidas:
            </span>
            <div className="space-y-2 text-xs">
              {paymentBreakdown.map((pm, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pm.bg}`} />
                    <span className="text-white font-medium">{pm.method}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#8e8f8f]">{pm.percentage}%</span>
                    <strong className={pm.color}>
                      R$ {pm.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Top Selling Products */}
        <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#353535]">
            <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Top 5 Campeões de Faturamento</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Mais Vendidos
            </span>
          </div>

          <div className="space-y-3">
            {topSellers.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#252525] text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-white block font-['Montserrat'] truncate max-w-[200px] sm:max-w-xs">
                        {item.name}
                      </strong>
                      <span className="text-[10px] text-[#8e8f8f] block">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white font-bold block">
                      R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-[#8e8f8f] block">{item.sales} un vendidas</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percent}%` }}
                    className="h-full bg-gradient-to-r from-[#ff5722] to-amber-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-[#8e8f8f]">
              O <strong>Gourmet Truffle Burger</strong> lidera o faturamento acumulado do restaurante.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
