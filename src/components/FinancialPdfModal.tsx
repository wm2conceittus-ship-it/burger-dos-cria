import React from 'react';
import { X, Printer, Download, FileText, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { ExpenseItem } from './KitchenManagerScreen';
import { APP_IMAGES } from '../data/mockData';

interface FinancialPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  expenses: ExpenseItem[];
  storeSettings: StoreSettings;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  averageTicket: number;
  pixTotal: number;
  cardTotal: number;
  cashTotal: number;
  cmvPercentage: number;
}

export const FinancialPdfModal: React.FC<FinancialPdfModalProps> = ({
  isOpen,
  onClose,
  orders,
  expenses,
  storeSettings,
  totalRevenue,
  totalExpenses,
  netProfit,
  netMargin,
  averageTicket,
  pixTotal,
  cardTotal,
  cashTotal,
  cmvPercentage,
}) => {
  if (!isOpen) return null;

  const validOrders = orders.filter(o => o.status !== 'recusado');
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#1e1e1e] border border-[#353535] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="p-4 border-b border-[#353535] bg-[#161616] flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                <span>Relatório Financeiro & DRE em PDF</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-extrabold uppercase">
                  PDF / A4
                </span>
              </h3>
              <p className="text-[11px] text-[#b4b5b5]">
                Visualize abaixo e clique em "Salvar como PDF" para arquivar ou imprimir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Salvar como PDF / Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#b4b5b5] hover:text-white p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#121212] print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-xl p-8 sm:p-10 shadow-2xl font-sans text-xs space-y-6 print:shadow-none print:p-4 print:max-w-none print:rounded-none">
            
            {/* Header Document */}
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-900 shadow-sm flex-shrink-0 bg-black">
                  <img
                    src={APP_IMAGES.logo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-['Montserrat'] font-extrabold text-xl text-gray-950 uppercase tracking-tight">
                    {storeSettings.storeName}
                  </h1>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                    Fechamento de Caixa & DRE Operacional
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    WhatsApp: {storeSettings.whatsappSupport} • {storeSettings.openingHours}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <span className="inline-block bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded border border-gray-300">
                  DOCUMENTO OFICIAL
                </span>
                <p className="text-gray-500 mt-1 capitalize font-medium">{dateStr}</p>
                <p className="text-gray-500 font-mono text-[10px]">Emissão: {timeStr}</p>
              </div>
            </div>

            {/* 1. Resumo Executivo */}
            <div>
              <h2 className="font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-3">
                1. Resumo Executivo do Turno
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Faturamento Bruto</span>
                  <span className="text-lg font-extrabold text-gray-900 font-mono">
                    R$ {totalRevenue.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {validOrders.length} pedidos
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Despesas / Saídas</span>
                  <span className="text-lg font-extrabold text-red-600 font-mono">
                    - R$ {totalExpenses.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {expenses.length} lançamentos
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Lucro Líquido</span>
                  <span className="text-lg font-extrabold text-emerald-700 font-mono">
                    R$ {netProfit.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                    Margem: {netMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Ticket Médio</span>
                  <span className="text-lg font-extrabold text-gray-900 font-mono">
                    R$ {averageTicket.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    CMV Insumos: {cmvPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Conciliação por Forma de Pagamento */}
            <div>
              <h2 className="font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-3">
                2. Conciliação de Meios de Pagamento
              </h2>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                    <th className="p-2 border border-gray-200">Canal / Método</th>
                    <th className="p-2 border border-gray-200">Destino Financeiro</th>
                    <th className="p-2 border border-gray-200 text-right">Valor Apurado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-200 font-medium">Pix Online / Chave Pix</td>
                    <td className="p-2 border border-gray-200 text-gray-500">Conta Bancária da Loja</td>
                    <td className="p-2 border border-gray-200 font-bold font-mono text-right">
                      R$ {pixTotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-2 border border-gray-200 font-medium">Cartões (Crédito / Débito)</td>
                    <td className="p-2 border border-gray-200 text-gray-500">Maquininha dos Motoboys</td>
                    <td className="p-2 border border-gray-200 font-bold font-mono text-right">
                      R$ {cardTotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-medium">Dinheiro em Espécie</td>
                    <td className="p-2 border border-gray-200 text-gray-500">Gaveta do Caixa Físico</td>
                    <td className="p-2 border border-gray-200 font-bold font-mono text-right">
                      R$ {cashTotal.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-2 border border-gray-200" colSpan={2}>TOTAL GERAL APURADO</td>
                    <td className="p-2 border border-gray-200 font-mono text-right text-gray-950 font-black">
                      R$ {totalRevenue.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Despesas e Saídas */}
            <div>
              <h2 className="font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-3">
                3. Lançamento de Despesas e Saídas de Caixa
              </h2>
              {expenses.length === 0 ? (
                <p className="text-gray-400 italic text-center py-2">Nenhuma saída lançada no turno.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                      <th className="p-2 border border-gray-200 w-20">Horário</th>
                      <th className="p-2 border border-gray-200">Descrição do Gasto</th>
                      <th className="p-2 border border-gray-200 w-28">Categoria</th>
                      <th className="p-2 border border-gray-200 text-right w-28">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-b border-gray-200">
                        <td className="p-2 border border-gray-200 font-mono text-gray-500">{e.time}</td>
                        <td className="p-2 border border-gray-200 font-medium">{e.description}</td>
                        <td className="p-2 border border-gray-200 uppercase text-[10px] text-gray-700 font-bold">
                          {e.category === 'insumos'
                            ? 'Insumos & Carnes'
                            : e.category === 'motoboy'
                            ? 'Entregas / Motoboy'
                            : e.category === 'embalagens'
                            ? 'Embalagens'
                            : e.category === 'gas'
                            ? 'Gás de Cozinha'
                            : e.category === 'operacional'
                            ? 'Operacional / Limpeza'
                            : e.category === 'fixo'
                            ? 'Custo Fixo (Aluguel/Luz/Net)'
                            : 'Outros'}
                        </td>
                        <td className="p-2 border border-gray-200 font-mono font-bold text-right text-red-600">
                          - R$ {e.amount.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="p-2 border border-gray-200" colSpan={3}>TOTAL DE DESPESAS</td>
                      <td className="p-2 border border-gray-200 font-mono text-right text-red-700 font-black">
                        - R$ {totalExpenses.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* 4. Lista Resumida dos Pedidos do Turno */}
            <div>
              <h2 className="font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-3">
                4. Lista de Pedidos Realizados no Turno
              </h2>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                    <th className="p-2 border border-gray-200 w-16">Nº</th>
                    <th className="p-2 border border-gray-200">Cliente</th>
                    <th className="p-2 border border-gray-200">Tipo</th>
                    <th className="p-2 border border-gray-200">Pagamento</th>
                    <th className="p-2 border border-gray-200">Status</th>
                    <th className="p-2 border border-gray-200 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {validOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-200">
                      <td className="p-2 border border-gray-200 font-mono font-bold">{order.orderNumber}</td>
                      <td className="p-2 border border-gray-200 font-medium">{order.customerName}</td>
                      <td className="p-2 border border-gray-200 uppercase text-[10px] text-gray-600">
                        {order.type}
                      </td>
                      <td className="p-2 border border-gray-200 text-gray-600">{order.paymentMethod}</td>
                      <td className="p-2 border border-gray-200 uppercase text-[10px] font-bold">
                        {order.status}
                      </td>
                      <td className="p-2 border border-gray-200 font-mono font-bold text-right">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature & Closing footer */}
            <div className="pt-8 mt-6 border-t-2 border-dashed border-gray-300 flex justify-between items-end text-[10px] text-gray-500">
              <div>
                <p>Relatório emitido automaticamente pelo sistema <strong>{storeSettings.storeName}</strong>.</p>
                <p>Assinatura do Responsável pelo Fechamento do Caixa:</p>
                <div className="w-64 border-b border-gray-400 mt-6" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-700">Burger dos Crias • Sistema Operacional KDS</p>
                <p>Página 1 de 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
