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
  FileSpreadsheet,
  FileText,
  Table,
} from 'lucide-react';

interface FinancialReportsDashboardProps {
  orders: Order[];
  storeSettings: StoreSettings;
  products?: Product[];
}

export type PeriodType = 'diario' | 'semanal' | 'mensal' | 'anual';
export type ChannelType = 'todos' | 'delivery' | 'mesas' | 'retirada';

export interface DataPoint {
  label: string;
  shortLabel: string;
  dateKey?: string;
  deliveryRevenue: number;
  dineInRevenue: number;
  takeawayRevenue: number;
  totalRevenue: number;
  orderCount: number;
  averageTicket: number;
  profitEstimate: number;
  displayRevenue?: number;
}

function parseOrderDate(order: Order): Date {
  if (order.id && order.id.startsWith('ord-')) {
    const rawNum = parseInt(order.id.replace('ord-', ''), 10);
    if (!isNaN(rawNum) && rawNum > 1500000000000 && rawNum < 2500000000000) {
      return new Date(rawNum);
    }
  }
  if (order.orderDate && typeof order.orderDate === 'string') {
    const parts = order.orderDate.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  return new Date();
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const FinancialReportsDashboard: React.FC<FinancialReportsDashboardProps> = ({
  orders,
  storeSettings,
  products = [],
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('mensal');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'todos'>('todos');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('todos');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'linha' | 'barras'>('linha');
  const [hoveredWeekCompareIndex, setHoveredWeekCompareIndex] = useState<number | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    years.add(currentYear - 1);
    orders.forEach(o => {
      const d = parseOrderDate(o);
      if (!isNaN(d.getFullYear())) {
        years.add(d.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentYear]);

  const validOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'recusado');
  }, [orders]);

  const currentVsPreviousWeekData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const currDate = new Date();
      currDate.setDate(now.getDate() - i);
      currDate.setHours(0, 0, 0, 0);

      const prevDate = new Date(currDate);
      prevDate.setDate(currDate.getDate() - 7);

      const yCurr = currDate.getFullYear();
      const mCurr = currDate.getMonth();
      const dCurr = currDate.getDate();

      const yPrev = prevDate.getFullYear();
      const mPrev = prevDate.getMonth();
      const dPrev = prevDate.getDate();

      const currOrders = validOrders.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === yCurr && d.getMonth() === mCurr && d.getDate() === dCurr;
      });

      const prevOrders = validOrders.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === yPrev && d.getMonth() === mPrev && d.getDate() === dPrev;
      });

      const currRev = currOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const prevRev = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayLabel = dayNames[currDate.getDay()];
      const dateStr = `${String(dCurr).padStart(2, '0')}/${String(mCurr + 1).padStart(2, '0')}`;
      const prevDateStr = `${String(dPrev).padStart(2, '0')}/${String(mPrev + 1).padStart(2, '0')}`;

      result.push({
        dayName: dayLabel,
        dateStr,
        prevDateStr,
        currentRevenue: currRev,
        previousRevenue: prevRev,
        currentOrders: currOrders.length,
        previousOrders: prevOrders.length,
      });
    }
    return result;
  }, [validOrders, now]);

  const totalCurrentWeekCompare = currentVsPreviousWeekData.reduce((s, d) => s + d.currentRevenue, 0);
  const totalPreviousWeekCompare = currentVsPreviousWeekData.reduce((s, d) => s + d.previousRevenue, 0);
  const weekCompareDiff = totalPreviousWeekCompare > 0 ? ((totalCurrentWeekCompare - totalPreviousWeekCompare) / totalPreviousWeekCompare) * 100 : (totalCurrentWeekCompare > 0 ? 100 : 0);
  const maxCompareRevenue = Math.max(...currentVsPreviousWeekData.map(d => Math.max(d.currentRevenue, d.previousRevenue)), 100) * 1.15;

  const dailyData: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];

    if (selectedMonth !== 'todos') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOrders = validOrders.filter(o => {
          const d = parseOrderDate(o);
          return (
            d.getFullYear() === selectedYear &&
            d.getMonth() === selectedMonth &&
            d.getDate() === day
          );
        });

        const delivery = dayOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
        const dineIn = dayOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
        const takeaway = dayOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
        const total = delivery + dineIn + takeaway;
        const count = dayOrders.length;

        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(selectedMonth + 1).padStart(2, '0');

        points.push({
          label: `Dia ${dayStr}/${monthStr}/${selectedYear}`,
          shortLabel: `${dayStr}/${monthStr}`,
          dateKey: `${selectedYear}-${monthStr}-${dayStr}`,
          deliveryRevenue: delivery,
          dineInRevenue: dineIn,
          takeawayRevenue: takeaway,
          totalRevenue: total,
          orderCount: count,
          averageTicket: count > 0 ? total / count : 0,
          profitEstimate: total * 0.38,
        });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() - i);
        targetDate.setHours(0, 0, 0, 0);

        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();
        const d = targetDate.getDate();

        const dayOrders = validOrders.filter(o => {
          const orderDate = parseOrderDate(o);
          return (
            orderDate.getFullYear() === y &&
            orderDate.getMonth() === m &&
            orderDate.getDate() === d
          );
        });

        const delivery = dayOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
        const dineIn = dayOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
        const takeaway = dayOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
        const total = delivery + dineIn + takeaway;
        const count = dayOrders.length;

        const dayStr = String(d).padStart(2, '0');
        const monthStr = String(m + 1).padStart(2, '0');
        const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weekDay = weekDayNames[targetDate.getDay()];
        const isToday = i === 0;

        points.push({
          label: `${isToday ? 'Hoje • ' : ''}${weekDay} (${dayStr}/${monthStr})`,
          shortLabel: isToday ? 'Hoje' : `${weekDay} ${dayStr}`,
          dateKey: `${y}-${monthStr}-${dayStr}`,
          deliveryRevenue: delivery,
          dineInRevenue: dineIn,
          takeawayRevenue: takeaway,
          totalRevenue: total,
          orderCount: count,
          averageTicket: count > 0 ? total / count : 0,
          profitEstimate: total * 0.38,
        });
      }
    }

    return points;
  }, [validOrders, selectedYear, selectedMonth]);

  const weeklyData: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];

    if (selectedMonth !== 'todos') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const monthName = MONTH_NAMES[selectedMonth];

      const weekDefs = [
        { name: 'Semana 1', short: 'Sem 1', start: 1, end: 7 },
        { name: 'Semana 2', short: 'Sem 2', start: 8, end: 14 },
        { name: 'Semana 3', short: 'Sem 3', start: 15, end: 21 },
        { name: 'Semana 4', short: 'Sem 4', start: 22, end: 28 },
        ...(daysInMonth > 28 ? [{ name: 'Semana 5', short: 'Sem 5', start: 29, end: daysInMonth }] : []),
      ];

      weekDefs.forEach(w => {
        const weekOrders = validOrders.filter(o => {
          const d = parseOrderDate(o);
          return (
            d.getFullYear() === selectedYear &&
            d.getMonth() === selectedMonth &&
            d.getDate() >= w.start &&
            d.getDate() <= w.end
          );
        });

        const delivery = weekOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
        const dineIn = weekOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
        const takeaway = weekOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
        const total = delivery + dineIn + takeaway;
        const count = weekOrders.length;

        points.push({
          label: `${w.name} de ${monthName} (${String(w.start).padStart(2, '0')} a ${String(w.end).padStart(2, '0')})`,
          shortLabel: w.short,
          deliveryRevenue: delivery,
          dineInRevenue: dineIn,
          takeawayRevenue: takeaway,
          totalRevenue: total,
          orderCount: count,
          averageTicket: count > 0 ? total / count : 0,
          profitEstimate: total * 0.38,
        });
      });
    } else {
      for (let i = 7; i >= 0; i--) {
        const endDay = new Date();
        endDay.setDate(now.getDate() - i * 7);
        const startDay = new Date(endDay);
        startDay.setDate(endDay.getDate() - 6);

        startDay.setHours(0, 0, 0, 0);
        endDay.setHours(23, 59, 59, 999);

        const weekOrders = validOrders.filter(o => {
          const d = parseOrderDate(o);
          return d >= startDay && d <= endDay;
        });

        const delivery = weekOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
        const dineIn = weekOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
        const takeaway = weekOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
        const total = delivery + dineIn + takeaway;
        const count = weekOrders.length;

        const sStr = `${String(startDay.getDate()).padStart(2, '0')}/${String(startDay.getMonth() + 1).padStart(2, '0')}`;
        const eStr = `${String(endDay.getDate()).padStart(2, '0')}/${String(endDay.getMonth() + 1).padStart(2, '0')}`;
        const isCurrent = i === 0;

        points.push({
          label: `${isCurrent ? 'Semana Atual' : `Semana ${8 - i}`} (${sStr} a ${eStr})`,
          shortLabel: isCurrent ? 'Sem. Atual' : sStr,
          deliveryRevenue: delivery,
          dineInRevenue: dineIn,
          takeawayRevenue: takeaway,
          totalRevenue: total,
          orderCount: count,
          averageTicket: count > 0 ? total / count : 0,
          profitEstimate: total * 0.38,
        });
      }
    }

    return points;
  }, [validOrders, selectedYear, selectedMonth]);

  const monthlyData: DataPoint[] = useMemo(() => {
    return MONTH_NAMES.map((mName, mIdx) => {
      const monthOrders = validOrders.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === selectedYear && d.getMonth() === mIdx;
      });

      const delivery = monthOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
      const dineIn = monthOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
      const takeaway = monthOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
      const total = delivery + dineIn + takeaway;
      const count = monthOrders.length;

      return {
        label: `${mName} de ${selectedYear}`,
        shortLabel: MONTH_SHORT[mIdx],
        deliveryRevenue: delivery,
        dineInRevenue: dineIn,
        takeawayRevenue: takeaway,
        totalRevenue: total,
        orderCount: count,
        averageTicket: count > 0 ? total / count : 0,
        profitEstimate: total * 0.38,
      };
    });
  }, [validOrders, selectedYear]);

  const annualData: DataPoint[] = useMemo(() => {
    const yearsToShow = [...availableYears].sort((a, b) => a - b);
    return yearsToShow.map(y => {
      const yearOrders = validOrders.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === y;
      });

      const delivery = yearOrders.filter(o => o.type === 'Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
      const dineIn = yearOrders.filter(o => o.type === 'Mesa').reduce((sum, o) => sum + (o.total || 0), 0);
      const takeaway = yearOrders.filter(o => o.type === 'Retirada').reduce((sum, o) => sum + (o.total || 0), 0);
      const total = delivery + dineIn + takeaway;
      const count = yearOrders.length;

      return {
        label: `Ano de ${y}`,
        shortLabel: String(y),
        deliveryRevenue: delivery,
        dineInRevenue: dineIn,
        takeawayRevenue: takeaway,
        totalRevenue: total,
        orderCount: count,
        averageTicket: count > 0 ? total / count : 0,
        profitEstimate: total * 0.38,
      };
    });
  }, [validOrders, availableYears]);

  const activeSeries = useMemo(() => {
    let rawData: DataPoint[];
    if (selectedPeriod === 'diario') rawData = dailyData;
    else if (selectedPeriod === 'semanal') rawData = weeklyData;
    else if (selectedPeriod === 'mensal') rawData = monthlyData;
    else rawData = annualData;

    return rawData.map(d => {
      let revenue = d.totalRevenue;
      if (selectedChannel === 'delivery') revenue = d.deliveryRevenue;
      else if (selectedChannel === 'mesas') revenue = d.dineInRevenue;
      else if (selectedChannel === 'retirada') revenue = d.takeawayRevenue;

      return {
        ...d,
        displayRevenue: revenue,
      };
    });
  }, [selectedPeriod, selectedChannel, dailyData, weeklyData, monthlyData, annualData]);

  const totalPeriodRevenue = useMemo(() => {
    return activeSeries.reduce((sum, d) => sum + (d.displayRevenue || 0), 0);
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
    if (activeSeries.length < 2) return 0;
    const last = activeSeries[activeSeries.length - 1].displayRevenue || 0;
    const prev = activeSeries[activeSeries.length - 2].displayRevenue || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return ((last - prev) / prev) * 100;
  }, [activeSeries]);

  const bestPoint = useMemo(() => {
    if (activeSeries.length === 0) return null;
    return [...activeSeries].sort((a, b) => (b.displayRevenue || 0) - (a.displayRevenue || 0))[0];
  }, [activeSeries]);

  const chartHeight = 240;
  const chartWidth = 720;
  const paddingLeft = 65;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...activeSeries.map(d => d.displayRevenue || 0), 100);
    return Math.ceil(maxVal * 1.15);
  }, [activeSeries]);

  const points = useMemo(() => {
    if (activeSeries.length === 0) return [];
    if (activeSeries.length === 1) {
      const d = activeSeries[0];
      const x = paddingLeft + innerWidth / 2;
      const y = paddingTop + innerHeight - ((d.displayRevenue || 0) / maxRevenue) * innerHeight;
      return [{ x, y, data: d, index: 0 }];
    }
    return activeSeries.map((d, index) => {
      const x = paddingLeft + (index / (activeSeries.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((d.displayRevenue || 0) / maxRevenue) * innerHeight;
      return { x, y, data: d, index };
    });
  }, [activeSeries, innerWidth, innerHeight, maxRevenue]);

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

  const areaPathD = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = paddingTop + innerHeight;
    return `${linePathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePathD, points, innerHeight]);

  const paymentBreakdown = useMemo(() => {
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
    const total = totalPeriodRevenue > 0 ? totalPeriodRevenue : (pixSum + creditSum + debitSum + cashSum || 1);

    return [
      { method: 'Pix (Imediato)', percentage: total > 0 ? Math.round((pixSum / total) * 100) : 0, amount: pixSum, color: 'text-emerald-600', bg: 'bg-emerald-500' },
      { method: 'Cartão de Crédito', percentage: total > 0 ? Math.round((creditSum / total) * 100) : 0, amount: creditSum, color: 'text-blue-600', bg: 'bg-blue-500' },
      { method: 'Cartão de Débito', percentage: total > 0 ? Math.round((debitSum / total) * 100) : 0, amount: debitSum, color: 'text-amber-600', bg: 'bg-amber-500' },
      { method: 'Dinheiro na Entrega / Balcão', percentage: total > 0 ? Math.round((cashSum / total) * 100) : 0, amount: cashSum, color: 'text-gray-600', bg: 'bg-gray-500' },
    ];
  }, [validOrders, totalPeriodRevenue]);

  const totalDeliverySum = activeSeries.reduce((s, p) => s + p.deliveryRevenue, 0);
  const totalDineInSum = activeSeries.reduce((s, p) => s + p.dineInRevenue, 0);
  const totalTakeawaySum = activeSeries.reduce((s, p) => s + p.takeawayRevenue, 0);
  const grandTotalChannels = totalDeliverySum + totalDineInSum + totalTakeawaySum || 1;

  const deliveryPercent = Math.round((totalDeliverySum / grandTotalChannels) * 100);
  const dineInPercent = Math.round((totalDineInSum / grandTotalChannels) * 100);
  const takeawayPercent = Math.round((totalTakeawaySum / grandTotalChannels) * 100);

  const topSellers = useMemo(() => {
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
  }, [validOrders]);

  const handleExportPDFLandscape = () => {
    const style = document.createElement('style');
    style.innerHTML = '@media print { @page { size: landscape; margin: 10mm; } }';
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1500);
  };

  const currentHoveredPoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card (Card Branco) */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4 text-gray-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5722] flex items-center justify-center shadow-inner shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Montserrat'] text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                <span>Controle de Vendas por Período</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-extrabold uppercase">
                  Semana • Mês • Ano
                </span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Consulte o faturamento detalhado por semana, mês ou ano com comparativos, ticket médio e exportação em PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportPDFLandscape}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold font-['Montserrat'] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Salvar PDF em modo paisagem (horizontal)"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Exportar PDF (Horizontal)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 hover:text-gray-900 transition-all shadow-sm"
              title="Imprimir Relatório Gráfico"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="bg-gray-100 p-1 rounded-xl border border-gray-200 flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('diario');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all ${
                selectedPeriod === 'diario'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Diário
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('semanal');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all ${
                selectedPeriod === 'semanal'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Semana
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('mensal');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all ${
                selectedPeriod === 'mensal'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Mês (Jan a Dez)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPeriod('anual');
                setHoveredPointIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all ${
                selectedPeriod === 'anual'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Ano
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(selectedPeriod === 'semanal' || selectedPeriod === 'diario') && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-600 text-[11px] font-bold">Mês:</span>
                <select
                  value={selectedMonth}
                  onChange={e => {
                    const val = e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10);
                    setSelectedMonth(val);
                    setHoveredPointIndex(null);
                  }}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="todos">
                    {selectedPeriod === 'semanal' ? 'Últimas 8 Semanas' : 'Últimos 7 Dias'}
                  </option>
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedPeriod !== 'anual' && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-600 text-[11px] font-bold">Ano:</span>
                <select
                  value={selectedYear}
                  onChange={e => {
                    setSelectedYear(parseInt(e.target.value, 10));
                    setHoveredPointIndex(null);
                  }}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs font-mono"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className="font-mono">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Strip (Cards Brancos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-lg p-4 border border-gray-200 relative overflow-hidden shadow-sm group hover:border-[#ff5722]/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Montserrat']">
              Faturamento {selectedPeriod === 'diario' ? 'do Período' : selectedPeriod === 'semanal' ? 'das Semanas' : selectedPeriod === 'mensal' ? `de ${selectedYear}` : 'Histórico Total'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#ff5722] flex items-center justify-center border border-orange-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-gray-900 font-mono">
              R$ {totalPeriodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center gap-0.5 font-bold ${periodGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {periodGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(periodGrowth).toFixed(1)}%
            </span>
            <span className="text-gray-500 text-[11px]">vs intervalo anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 relative overflow-hidden shadow-sm group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Montserrat']">
              Ticket Médio por Pedido
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-blue-700 font-mono">
              R$ {periodAverageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Volume Total:</span>
            <strong className="text-gray-900 font-mono">{totalPeriodOrders} pedidos faturados</strong>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden shadow-sm group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-['Montserrat']">
              Lucro Líquido Estimado (~38%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Montserrat'] font-black text-2xl text-emerald-700 font-mono">
              R$ {totalPeriodProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Margem Operacional:</span>
            <strong className="text-emerald-700 font-bold font-mono">Alta Rentabilidade</strong>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-amber-200 relative overflow-hidden shadow-sm group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-['Montserrat']">
              Maior Faturamento no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate">
            <span className="font-['Montserrat'] font-bold text-lg text-gray-900 block truncate">
              {bestPoint && bestPoint.totalRevenue > 0 ? bestPoint.label.split('(')[0] : 'Sem vendas'}
            </span>
            <span className="font-mono text-xs text-amber-800 font-bold mt-0.5 block">
              R$ {bestPoint ? (bestPoint.displayRevenue || bestPoint.totalRevenue).toFixed(2).replace('.', ',') : '0,00'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 truncate">
            {bestPoint && bestPoint.orderCount > 0 ? `${bestPoint.orderCount} pedidos concluídos` : 'Aguardando faturamento'}
          </div>
        </div>
      </div>

      {/* Main Graph Card (Card Branco) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="font-['Montserrat'] font-bold text-sm text-gray-900 flex items-center gap-2">
              <span>Curva de Evolução do Faturamento</span>
              <span className="text-xs text-gray-500 font-normal">
                ({selectedPeriod === 'diario' ? 'Diário' : selectedPeriod === 'semanal' ? 'Por Semana' : selectedPeriod === 'mensal' ? `Meses de ${selectedYear}` : 'Ano a Ano'})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedChannel('todos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedChannel === 'todos'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('delivery')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  selectedChannel === 'delivery'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
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
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UtensilsCrossed className="w-3 h-3" />
                <span>Salão</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('retirada')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  selectedChannel === 'retirada'
                    ? 'bg-[#ff5722] text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Balcão</span>
              </button>
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('linha')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeViewMode === 'linha' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Linha
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('barras')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeViewMode === 'barras' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Barras
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[650px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5722" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#ff5722" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7043" />
                  <stop offset="100%" stopColor="#d84315" />
                </linearGradient>
              </defs>

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
                      stroke="#e5e7eb"
                      strokeDasharray={pct === 0 ? 'none' : '4 4'}
                      strokeWidth={pct === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      fill="#6b7280"
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

              {activeViewMode === 'linha' && (
                <>
                  {areaPathD && <path d={areaPathD} fill="url(#revenueGradient)" />}
                  {linePathD && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#ff5722"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g key={idx} className="cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 7 : 4.5}
                          fill={isHovered ? '#111827' : '#ff5722'}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="transition-all duration-150 shadow"
                        />
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

              {activeViewMode === 'barras' && (
                <g>
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    const barWidth = Math.max(14, Math.min(36, (innerWidth / activeSeries.length) * 0.55));
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
                          rx="4"
                          fill={isHovered ? '#ff8a65' : 'url(#barGradient)'}
                          className="transition-all duration-200"
                        />
                        <text
                          x={p.x}
                          y={y - 8}
                          fill={isHovered ? '#ff5722' : '#4b5563'}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          R$ {Math.round(p.data.displayRevenue || p.data.totalRevenue)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {points.map((p, idx) => {
                const isHovered = hoveredPointIndex === idx;
                return (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - 12}
                    fill={isHovered ? '#ff5722' : '#6b7280'}
                    fontSize="10"
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

        {currentHoveredPoint ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#ff5722] tracking-wider font-['Montserrat']">
                {currentHoveredPoint.data.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-900 font-mono">
                  R$ {(currentHoveredPoint.data.displayRevenue || currentHoveredPoint.data.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-600">
                  ({currentHoveredPoint.data.orderCount} pedidos faturados)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                <span className="text-[9px] block text-gray-500 uppercase font-sans">Delivery</span>
                <strong className="text-[#ff5722]">R$ {currentHoveredPoint.data.deliveryRevenue.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                <span className="text-[9px] block text-gray-500 uppercase font-sans">Salão (Mesas)</span>
                <strong className="text-blue-600">R$ {currentHoveredPoint.data.dineInRevenue.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                <span className="text-[9px] block text-gray-500 uppercase font-sans">Ticket Médio</span>
                <strong className="text-emerald-600">R$ {currentHoveredPoint.data.averageTicket.toFixed(2).replace('.', ',')}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center text-xs text-gray-600">
            💡 Clique ou passe o cursor sobre qualquer ponto ou barra do gráfico para inspecionar os valores exatos de delivery, salão e ticket médio daquele período.
          </div>
        )}
      </div>

      {/* Comparativo Faturamento: Semana Atual vs Semana Anterior */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5722] flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-gray-900 flex items-center gap-2">
                <span>Comparativo de Vendas: Semana Atual vs Semana Anterior</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${weekCompareDiff >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {weekCompareDiff >= 0 ? `+${weekCompareDiff.toFixed(1)}%` : `${weekCompareDiff.toFixed(1)}%`} vs semana anterior
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Comparação dia a dia entre o faturamento dos últimos 7 dias e o período correspondente da semana passada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" />
              <span className="text-gray-600">Atual:</span>
              <strong className="text-gray-900 font-bold">R$ {totalCurrentWeekCompare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-gray-600">Anterior:</span>
              <strong className="text-gray-900 font-bold">R$ {totalPreviousWeekCompare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-x-auto pt-2">
          <div className="min-w-[650px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="currentWeekBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7043" />
                  <stop offset="100%" stopColor="#d84315" />
                </linearGradient>
                <linearGradient id="prevWeekBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingTop + innerHeight - pct * innerHeight;
                const valueLabel = (maxCompareRevenue * pct).toFixed(0);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray={pct === 0 ? 'none' : '4 4'}
                      strokeWidth={pct === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      fill="#6b7280"
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

              {currentVsPreviousWeekData.map((d, idx) => {
                const groupWidth = innerWidth / currentVsPreviousWeekData.length;
                const groupX = paddingLeft + idx * groupWidth;
                const barWidth = Math.max(10, Math.min(24, groupWidth * 0.35));
                const spacing = 4;

                const currBarH = Math.max(4, (d.currentRevenue / maxCompareRevenue) * innerHeight);
                const prevBarH = Math.max(4, (d.previousRevenue / maxCompareRevenue) * innerHeight);

                const currY = paddingTop + innerHeight - currBarH;
                const prevY = paddingTop + innerHeight - prevBarH;

                const currX = groupX + groupWidth / 2 - barWidth - spacing / 2;
                const prevX = groupX + groupWidth / 2 + spacing / 2;

                const isHovered = hoveredWeekCompareIndex === idx;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredWeekCompareIndex(idx)}
                    onClick={() => setHoveredWeekCompareIndex(idx)}
                  >
                    <rect
                      x={prevX}
                      y={prevY}
                      width={barWidth}
                      height={prevBarH}
                      rx="3"
                      fill={isHovered ? '#64748b' : 'url(#prevWeekBar)'}
                      className="transition-all duration-150"
                    />

                    <rect
                      x={currX}
                      y={currY}
                      width={barWidth}
                      height={currBarH}
                      rx="3"
                      fill={isHovered ? '#ff7043' : 'url(#currentWeekBar)'}
                      className="transition-all duration-150 shadow-sm"
                    />

                    <text
                      x={groupX + groupWidth / 2}
                      y={chartHeight - 12}
                      fill={isHovered ? '#ff5722' : '#6b7280'}
                      fontSize="10"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      textAnchor="middle"
                      fontFamily="Montserrat, sans-serif"
                    >
                      {d.dayName} ({d.dateStr})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {hoveredWeekCompareIndex !== null ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#ff5722] tracking-wider font-['Montserrat']">
                {currentVsPreviousWeekData[hoveredWeekCompareIndex].dayName} • {currentVsPreviousWeekData[hoveredWeekCompareIndex].dateStr} (Semana Atual) vs {currentVsPreviousWeekData[hoveredWeekCompareIndex].prevDateStr} (Semana Anterior)
              </span>
              <div className="flex items-center gap-4 text-xs font-mono pt-1">
                <div>
                  <span className="text-gray-500 font-sans text-[10px] block">Semana Atual:</span>
                  <strong className="text-[#ff5722] text-sm">
                    R$ {currentVsPreviousWeekData[hoveredWeekCompareIndex].currentRevenue.toFixed(2).replace('.', ',')} ({currentVsPreviousWeekData[hoveredWeekCompareIndex].currentOrders} ped.)
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 font-sans text-[10px] block">Semana Anterior:</span>
                  <strong className="text-slate-600 text-sm">
                    R$ {currentVsPreviousWeekData[hoveredWeekCompareIndex].previousRevenue.toFixed(2).replace('.', ',')} ({currentVsPreviousWeekData[hoveredWeekCompareIndex].previousOrders} ped.)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center text-xs text-gray-600">
            💡 Passe o cursor sobre as barras para comparar detalhadamente o faturamento de cada dia da semana atual com a semana anterior.
          </div>
        )}
      </div>

      {/* Demonstrativo Detalhado de Vendas (Card Branco com Tabela Limpa) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#ff5722] flex items-center justify-center border border-orange-200">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-gray-900">
                Demonstrativo Detalhado de Vendas ({selectedPeriod === 'diario' ? 'Diário' : selectedPeriod === 'semanal' ? 'Semanal' : selectedPeriod === 'mensal' ? 'Mensal' : 'Anual'})
              </h3>
              <p className="text-[11px] text-gray-500">
                Tabela analítica consolidada com faturamento bruto, canais e ticket médio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDFLandscape}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar PDF (Horizontal)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] font-['Montserrat'] font-bold border-b border-gray-200">
                <th className="py-2.5 px-3">Período / Referência</th>
                <th className="py-2.5 px-3 text-center">Qtd Pedidos</th>
                <th className="py-2.5 px-3 text-right">Delivery</th>
                <th className="py-2.5 px-3 text-right">Salão (Mesas)</th>
                <th className="py-2.5 px-3 text-right">Balcão</th>
                <th className="py-2.5 px-3 text-right text-gray-900">Total Faturado</th>
                <th className="py-2.5 px-3 text-right">Ticket Médio</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Lucro Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 font-mono">
              {activeSeries.map((d, idx) => {
                const total = d.displayRevenue !== undefined ? d.displayRevenue : d.totalRevenue;
                return (
                  <tr
                    key={idx}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => setHoveredPointIndex(idx)}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff5722]" />
                      <span>{d.label}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {d.orderCount > 0 ? (
                        <span className="bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-orange-800 font-bold">
                          {d.orderCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#ff5722]">
                      R$ {d.deliveryRevenue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600">
                      R$ {d.dineInRevenue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">
                      R$ {d.takeawayRevenue.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-gray-900 bg-gray-50">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600">
                      R$ {d.averageTicket.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      R$ {d.profitEstimate.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-[#ff5722] font-mono">
                <td className="py-3 px-3 font-sans font-black uppercase text-[#ff5722] text-xs">
                  TOTAL DO PERÍODO
                </td>
                <td className="py-3 px-3 text-center text-orange-800 font-black">
                  {totalPeriodOrders}
                </td>
                <td className="py-3 px-3 text-right text-[#ff5722]">
                  R$ {totalDeliverySum.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-3 px-3 text-right text-blue-600">
                  R$ {totalDineInSum.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-3 px-3 text-right text-emerald-600">
                  R$ {totalTakeawaySum.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-3 px-3 text-right font-black text-lg text-[#ff5722] bg-orange-50 font-['Montserrat'] border border-orange-200">
                  R$ {totalPeriodRevenue.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-3 px-3 text-right text-gray-700">
                  R$ {periodAverageTicket.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-3 px-3 text-right font-black text-emerald-600">
                  R$ {totalPeriodProfit.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Two Column Section: Channel & Payment Breakdown + Top Sellers (Cards Brancos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <h3 className="font-['Montserrat'] font-bold text-sm text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#ff5722]" />
              <span>Divisão por Canais & Meios de Pagamento</span>
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Consolidado</span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-700 block">
              Participação por Canal de Venda:
            </span>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex border border-gray-200">
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

            <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
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

          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <span className="text-[11px] font-bold text-gray-700 block">
              Formas de Pagamento Recebidas:
            </span>
            <div className="space-y-2 text-xs">
              {paymentBreakdown.map((pm, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pm.bg}`} />
                    <span className="text-gray-900 font-medium">{pm.method}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-gray-500">{pm.percentage}%</span>
                    <strong className={pm.color}>
                      R$ {pm.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <h3 className="font-['Montserrat'] font-bold text-sm text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Top 5 Campeões de Faturamento</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Mais Vendidos
            </span>
          </div>

          <div className="space-y-3">
            {topSellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                Nenhum produto vendido ainda. Quando houver pedidos faturados, o ranking dos campeões de venda aparecerá aqui.
              </div>
            ) : (
              topSellers.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-800 flex items-center justify-center font-bold text-[10px] border border-gray-200">
                        {idx + 1}
                      </span>
                      <div>
                        <strong className="text-gray-900 block font-['Montserrat'] truncate max-w-[200px] sm:max-w-xs">
                          {item.name}
                        </strong>
                        <span className="text-[10px] text-gray-500 block">{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-gray-900 font-bold block">
                        R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-gray-500 block">{item.sales} un vendidas</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className="h-full bg-gradient-to-r from-[#ff5722] to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-gray-500">
              {topSellers.length > 0 ? (
                <>O <strong>{topSellers[0].name}</strong> lidera o faturamento acumulado do restaurante.</>
              ) : (
                <>Nenhuma venda registrada ainda. Faturamento começa a ser computado nos primeiros pedidos.</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
