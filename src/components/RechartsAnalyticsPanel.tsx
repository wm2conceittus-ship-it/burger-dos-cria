import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, Activity, Filter } from 'lucide-react';

interface RechartsAnalyticsPanelProps {
  orders: Order[];
}

type DateRangeFilter = '7d' | '30d' | 'mes_atual' | 'ano_atual' | 'todos';

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

export const RechartsAnalyticsPanel: React.FC<RechartsAnalyticsPanelProps> = ({ orders }) => {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');

  const now = useMemo(() => new Date(), []);

  // Filter orders based on selected date range
  const filteredOrders = useMemo(() => {
    const valid = orders.filter(o => o.status !== 'recusado');
    if (dateRange === 'todos') return valid;

    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);

    if (dateRange === '7d') {
      cutoff.setDate(now.getDate() - 7);
      return valid.filter(o => parseOrderDate(o) >= cutoff);
    }
    if (dateRange === '30d') {
      cutoff.setDate(now.getDate() - 30);
      return valid.filter(o => parseOrderDate(o) >= cutoff);
    }
    if (dateRange === 'mes_atual') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      return valid.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    }
    if (dateRange === 'ano_atual') {
      const currentYear = now.getFullYear();
      return valid.filter(o => {
        const d = parseOrderDate(o);
        return d.getFullYear() === currentYear;
      });
    }
    return valid;
  }, [orders, dateRange, now]);

  // 1. Volume total de pedidos por dia da semana (baseado nos pedidos filtrados)
  const weekdayVolumeData = useMemo(() => {
    const days = [
      { name: 'Domingo', key: 0, count: 0, revenue: 0 },
      { name: 'Segunda', key: 1, count: 0, revenue: 0 },
      { name: 'Terça', key: 2, count: 0, revenue: 0 },
      { name: 'Quarta', key: 3, count: 0, revenue: 0 },
      { name: 'Quinta', key: 4, count: 0, revenue: 0 },
      { name: 'Sexta', key: 5, count: 0, revenue: 0 },
      { name: 'Sábado', key: 6, count: 0, revenue: 0 },
    ];

    filteredOrders.forEach(o => {
      const d = parseOrderDate(o);
      const dayOfWeek = d.getDay();
      const target = days.find(x => x.key === dayOfWeek);
      if (target) {
        target.count += 1;
        target.revenue += o.total || 0;
      }
    });

    return days.map(d => ({
      dia: d.name,
      pedidos: d.count,
      faturamento: Number(d.revenue.toFixed(2)),
      ticketMedio: d.count > 0 ? Number((d.revenue / d.count).toFixed(2)) : 0,
    }));
  }, [filteredOrders]);

  // 2. Ticket médio diário (dinâmico conforme o intervalo selecionado)
  const ticketTrendData = useMemo(() => {
    let daysCount = 30;
    if (dateRange === '7d') daysCount = 7;
    else if (dateRange === 'mes_atual') daysCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    else if (dateRange === 'ano_atual' || dateRange === 'todos') daysCount = 30;

    const result = [];
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    for (let i = daysCount - 1; i >= 0; i--) {
      const targetDate = new Date(endDate);
      targetDate.setDate(endDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const d = targetDate.getDate();

      const dayOrders = filteredOrders.filter(o => {
        const od = parseOrderDate(o);
        return (
          od.getFullYear() === y &&
          od.getMonth() === m &&
          od.getDate() === d
        );
      });

      const dayTotalRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const dayOrderCount = dayOrders.length;
      const averageTicket = dayOrderCount > 0 ? dayTotalRevenue / dayOrderCount : 0;

      const dateStr = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;

      result.push({
        data: dateStr,
        ticketMedio: Number(averageTicket.toFixed(2)),
        pedidos: dayOrderCount,
        faturamento: Number(dayTotalRevenue.toFixed(2)),
      });
    }

    return result;
  }, [filteredOrders, dateRange, now]);

  const totalOrdersCount = filteredOrders.length;
  const overallAverageTicket = totalOrdersCount > 0
    ? filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0) / totalOrdersCount
    : 0;
  const totalPeriodRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Painel Recharts com Seletor de Intervalo */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5722] flex items-center justify-center shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Painel Avançado Recharts</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-extrabold uppercase">
                  Analytics Dinâmico
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Visualize o volume de pedidos por dia da semana e a evolução do ticket médio filtrado por período.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Faturamento (Período)</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">R$ {totalPeriodRevenue.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Ticket Médio</span>
              <span className="font-mono font-bold text-gray-900 text-sm">R$ {overallAverageTicket.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        {/* Barra de Seletor de Intervalo de Datas */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
            <Filter className="w-4 h-4 text-[#ff5722]" />
            <span>Filtrar Período:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '7d'
                  ? 'bg-[#ff5722] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '30d'
                  ? 'bg-[#ff5722] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={() => setDateRange('mes_atual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'mes_atual'
                  ? 'bg-[#ff5722] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => setDateRange('ano_atual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'ano_atual'
                  ? 'bg-[#ff5722] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Este ano
            </button>
            <button
              type="button"
              onClick={() => setDateRange('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'todos'
                  ? 'bg-[#ff5722] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              Todo o histórico ({orders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Volume de Pedidos por Dia da Semana */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#ff5722]" />
              <h4 className="font-['Montserrat'] font-bold text-sm text-gray-900">
                Volume de Pedidos por Dia da Semana
              </h4>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
              {totalOrdersCount} pedidos no filtro
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    name === 'pedidos' ? `${value} pedidos` : `R$ ${Number(value).toFixed(2).replace('.', ',')}`,
                    name === 'pedidos' ? 'Qtd Pedidos' : 'Faturamento'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="pedidos" name="Qtd Pedidos" fill="#ff5722" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 text-center">
            Distribuição dos pedidos do intervalo selecionado por dia da semana.
          </p>
        </div>

        {/* Gráfico 2: Ticket Médio Dinâmico */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="font-['Montserrat'] font-bold text-sm text-gray-900">
                Evolução do Ticket Médio
              </h4>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              Tendência Diária
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#6b7280' }} interval={Math.floor(ticketTrendData.length / 6) || 1} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit=" R$" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Ticket Médio']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="ticketMedio"
                  name="Ticket Médio (R$)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 text-center">
            Acompanhe a variação do valor médio gasto por pedido no intervalo selecionado.
          </p>
        </div>
      </div>
    </div>
  );
};
