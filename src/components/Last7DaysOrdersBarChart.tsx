import React, { useMemo } from 'react';
import { Order } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, ShoppingBag } from 'lucide-react';

interface Last7DaysOrdersBarChartProps {
  orders: Order[];
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

export const Last7DaysOrdersBarChart: React.FC<Last7DaysOrdersBarChartProps> = ({ orders }) => {
  const chartData = useMemo(() => {
    const valid = orders.filter(o => o.status !== 'recusado');
    const result = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);

      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const d = targetDate.getDate();

      const dayOrders = valid.filter(o => {
        const od = parseOrderDate(o);
        return od.getFullYear() === y && od.getMonth() === m && od.getDate() === d;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayName = weekdayNames[targetDate.getDay()];
      const dateStr = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;

      result.push({
        diaSemana: dayName,
        data: dateStr,
        label: `${dayName} (${dateStr})`,
        pedidos: dayOrders.length,
        faturamento: Number(dayRevenue.toFixed(2)),
      });
    }

    return result;
  }, [orders]);

  const totalLast7DaysOrders = chartData.reduce((sum, d) => sum + d.pedidos, 0);
  const totalLast7DaysRevenue = chartData.reduce((sum, d) => sum + d.faturamento, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5722] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-['Montserrat'] font-bold text-base text-gray-900 flex items-center gap-2">
              <span>Volume de Pedidos Diários • Últimos 7 Dias</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                Dashboard Recharts
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Acompanhamento gráfico em tempo real da demanda diária de pedidos na última semana.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Total (7 Dias)</span>
            <span className="font-mono font-bold text-[#ff5722] text-sm">{totalLast7DaysOrders} pedidos</span>
          </div>
          <div className="h-7 w-px bg-gray-200" />
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Faturamento</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">R$ {totalLast7DaysRevenue.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any, name: any) => [
                name === 'pedidos' ? `${value} pedidos` : `R$ ${Number(value).toFixed(2).replace('.', ',')}`,
                name === 'pedidos' ? 'Qtd de Pedidos' : 'Faturamento Diário'
              ]}
              labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
            />
            <Bar dataKey="pedidos" name="pedidos" fill="#ff5722" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <ShoppingBag className="w-3.5 h-3.5 text-[#ff5722]" />
          Média diária: {(totalLast7DaysOrders / 7).toFixed(1)} pedidos/dia
        </span>
        <span className="text-gray-400 font-mono text-[11px]">
          Atualizado em tempo real • Recharts BarChart
        </span>
      </div>
    </div>
  );
};
