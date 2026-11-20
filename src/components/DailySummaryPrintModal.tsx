import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { ExpenseItem } from './KitchenManagerScreen';
import { X, Printer, ReceiptText, FileText } from 'lucide-react';
import { APP_IMAGES } from '../data/mockData';

interface DailySummaryPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeSettings: StoreSettings;
  expenses: ExpenseItem[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export const DailySummaryPrintModal: React.FC<DailySummaryPrintModalProps> = ({
  isOpen,
  onClose,
  orders,
  storeSettings,
  expenses,
  totalRevenue,
  totalExpenses,
  netProfit,
}) => {
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('receipt_paper_size') as '58mm' | '80mm') || '58mm';
  });
  const [compactMode, setCompactMode] = useState(true);

  if (!isOpen) return null;

  const storeName = storeSettings?.storeName || 'BURGER DOS CRIAS';
  const storeLogo = storeSettings?.logoUrl || APP_IMAGES.logo;
  const storeAddress = storeSettings?.address || storeSettings?.deliveryArea?.baseAddress || 'Rua Augusta, 1000 - Consolação, São Paulo - SP';
  const storeWhatsApp = storeSettings?.whatsappSupport || '(11) 98765-4321';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const validOrders = orders.filter(o => o.status !== 'recusado');
  const cancelledOrders = orders.filter(o => o.status === 'recusado');
  const deliveryOrdersCount = validOrders.filter(o => (o.type as string).toLowerCase().includes('delivery')).length;
  const pickupOrdersCount = validOrders.filter(o => {
    const t = (o.type as string).toLowerCase();
    return t.includes('retirada') || t.includes('balcão') || t.includes('balcao');
  }).length;
  const tableOrdersCount = validOrders.filter(o => (o.type as string).toLowerCase().includes('mesa')).length;

  const deliveryFeeRevenue = validOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const productSalesRevenue = Math.max(0, totalRevenue - deliveryFeeRevenue);

  const pixTotal = validOrders
    .filter(o => o.paymentMethod?.toLowerCase().includes('pix'))
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const cardTotal = validOrders
    .filter(o => {
      const pm = (o.paymentMethod || '').toLowerCase();
      return pm.includes('cart') || pm.includes('créd') || pm.includes('cred') || pm.includes('déb') || pm.includes('deb');
    })
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const cashTotal = validOrders
    .filter(o => (o.paymentMethod || '').toLowerCase().includes('dinheiro'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Dynamic page print size injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ticket-58mm, .ticket-58mm *, .ticket-80mm, .ticket-80mm * {
            visibility: visible !important;
          }
          .ticket-58mm, .ticket-80mm {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          @page {
            size: ${paperSize === '58mm' ? '58mm auto' : '80mm auto'};
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          img {
            display: block !important;
            max-width: 100% !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* Main Dialog Modal */}
      <div className="bg-[#1f1e1e] border border-[#353535] rounded-lg w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] print:border-none print:shadow-none print:max-h-none print:w-auto print:bg-transparent">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-3.5 bg-[#171616] border-b border-[#353535] flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
              <Printer className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-xs text-white">
                Ticket Resumo Diário Consolidado
              </h3>
              <p className="text-[10px] text-[#8e8f8f]">Fechamento de caixa em formato ticket POS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#8e8f8f] hover:text-white p-1.5 rounded-lg hover:bg-[#252424] transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar (Hidden in Print) */}
        <div className="px-4 py-2.5 bg-[#1c1b1b] border-b border-[#353535] flex flex-wrap items-center justify-between gap-2 print:hidden flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-[#353535]">
            <button
              onClick={() => setPaperSize('58mm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paperSize === '58mm'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Bobina 58mm</span>
            </button>

            <button
              onClick={() => setPaperSize('80mm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paperSize === '80mm'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bobina 80mm</span>
            </button>
          </div>

          {paperSize === '58mm' && (
            <label className="flex items-center gap-1.5 text-[11px] text-[#b4b5b5] cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={e => setCompactMode(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#ff5722] bg-[#141414] border-[#353535] focus:ring-0"
              />
              <span>Modo Ultra Econômico</span>
            </label>
          )}
        </div>

        {/* Ticket Preview Container (Scrollable) */}
        <div className="p-4 sm:p-6 bg-[#131313] overflow-y-auto flex-1 flex justify-center print:p-0 print:bg-white">
          {paperSize === '58mm' ? (
            /* 58mm POS Thermal Ticket */
            <div className={`bg-white text-black font-mono font-bold p-4 shadow-2xl rounded-sm ticket-58mm ${compactMode ? 'w-[260px] text-[11px] leading-tight space-y-2' : 'w-[280px] text-[11.5px] leading-relaxed space-y-3'} print:shadow-none print:w-[58mm] print:p-0`}>
              
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-black text-[#ff5722] flex items-center justify-center mb-1 overflow-hidden border border-gray-300 shadow-sm print:bg-black print:text-black">
                  <img src={storeLogo} alt="Logo" className="w-full h-full object-cover print:block print:opacity-100" crossOrigin="anonymous" />
                </div>
                <h2 className="font-black text-sm tracking-wide">{storeName.toUpperCase()}</h2>
                <p className="text-[10px] font-normal text-gray-600">Fechamento & Resumo Diário</p>
                <p className="text-[9.5px] font-normal text-gray-500">{storeAddress}</p>
                <p className="text-[9.5px] font-normal text-gray-500">WhatsApp: {storeWhatsApp}</p>
              </div>

              {/* Meta */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-[11px]">
                <div className="text-center font-black bg-black text-white py-1 text-xs tracking-wider">
                  RESUMO CONSOLIDADO DE VENDAS
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>DATA: {dateStr}</span>
                  <span>HORA: {timeStr}</span>
                </div>
              </div>

              {/* Order Volume Summary */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-xs">
                <div className="text-[10px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-0.5">
                  Volume de Pedidos
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Pedidos Válidos:</span>
                  <span className="font-black text-black">{validOrders.length}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>• Delivery:</span>
                  <span>{deliveryOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>• Balcão / Retirada:</span>
                  <span>{pickupOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>• Mesas (Salão):</span>
                  <span>{tableOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Pedidos Cancelados:</span>
                  <span className="text-red-600 font-bold">{cancelledOrders.length}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-xs">
                <div className="text-[10px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-0.5">
                  Fechamento Financeiro
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Vendas de Produtos:</span>
                  <span>R$ {productSalesRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxas de Entrega:</span>
                  <span>R$ {deliveryFeeRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-black font-black text-sm pt-1 border-t border-gray-300">
                  <span>FATURAMENTO BRUTO:</span>
                  <span>R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-xs">
                <div className="text-[10px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-0.5">
                  Formas de Pagamento
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Pix:</span>
                  <span>R$ {pixTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Cartão (Créd/Déb):</span>
                  <span>R$ {cardTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Dinheiro:</span>
                  <span>R$ {cashTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* DRE / Net Profit */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-xs">
                <div className="text-[10px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-0.5">
                  Resultado Operacional (DRE)
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Total de Despesas:</span>
                  <span className="text-red-600">- R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-black font-black text-sm pt-1 border-t border-gray-300">
                  <span>LUCRO LÍQUIDO:</span>
                  <span className={netProfit >= 0 ? 'text-black' : 'text-red-600'}>
                    R$ {netProfit.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-700">Fim do Resumo Diário • Bom Trabalho! 🔥</p>
                <p className="tracking-widest font-mono text-[9px]">
                  * * * CAIXA CONSOLIDADO * * *
                </p>
              </div>

            </div>
          ) : (
            /* 80mm Wide Thermal Ticket */
            <div className="bg-white text-black font-mono font-bold p-5 shadow-2xl rounded-sm w-[360px] text-xs leading-relaxed space-y-3 ticket-80mm print:shadow-none print:w-[80mm] print:p-0">
              
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-black text-[#ff5722] flex items-center justify-center mb-1.5 overflow-hidden border border-gray-300 shadow-sm print:bg-black print:text-black">
                  <img src={storeLogo} alt="Logo" className="w-full h-full object-cover print:block print:opacity-100" crossOrigin="anonymous" />
                </div>
                <h2 className="font-black text-base tracking-wide">{storeName.toUpperCase()}</h2>
                <p className="text-[11px] font-normal text-gray-600">Fechamento & Resumo Diário Consolidado</p>
                <p className="text-[10px] font-normal text-gray-500">{storeAddress}</p>
                <p className="text-[10px] font-normal text-gray-500">WhatsApp: {storeWhatsApp}</p>
              </div>

              {/* Meta */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-1.5 text-xs">
                <div className="text-center font-black bg-black text-white py-1.5 text-sm tracking-wider">
                  RELATÓRIO CONSOLIDADO DE VENDAS
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>DATA: {dateStr}</span>
                  <span>HORA: {timeStr}</span>
                </div>
              </div>

              {/* Order Volume Summary */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-2 text-xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-1">
                  Volume de Pedidos do Turno
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Total Pedidos Válidos:</span>
                  <span className="font-black text-black text-sm">{validOrders.length}</span>
                </div>
                <div className="flex justify-between text-gray-700 pl-2">
                  <span>• Delivery:</span>
                  <span>{deliveryOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700 pl-2">
                  <span>• Balcão / Retirada:</span>
                  <span>{pickupOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700 pl-2">
                  <span>• Mesas (Salão):</span>
                  <span>{tableOrdersCount}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Pedidos Cancelados:</span>
                  <span className="text-red-600 font-bold">{cancelledOrders.length}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-2 text-xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-1">
                  Fechamento Financeiro Detalhado
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Vendas de Produtos:</span>
                  <span className="font-mono">R$ {productSalesRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxas de Entrega:</span>
                  <span className="font-mono">R$ {deliveryFeeRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-black font-black text-sm pt-1.5 border-t border-gray-300">
                  <span>FATURAMENTO BRUTO:</span>
                  <span className="font-mono">R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-2 text-xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-1">
                  Formas de Pagamento Recebidas
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Pix:</span>
                  <span className="font-mono">R$ {pixTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Cartão (Crédito / Débito):</span>
                  <span className="font-mono">R$ {cardTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Dinheiro (Espécie):</span>
                  <span className="font-mono">R$ {cashTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* DRE / Net Profit */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-2 text-xs">
                <div className="text-[11px] text-gray-500 font-bold uppercase border-b border-gray-300 pb-1">
                  Resultado Operacional (DRE)
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Total de Despesas Lançadas:</span>
                  <span className="font-mono text-red-600">- R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-black font-black text-sm pt-1.5 border-t border-gray-300">
                  <span>LUCRO LÍQUIDO DO TURNO:</span>
                  <span className={`font-mono ${netProfit >= 0 ? 'text-black' : 'text-red-600'}`}>
                    R$ {netProfit.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Fim do Resumo Diário • Bom Trabalho! 🔥</p>
                <p className="tracking-widest font-mono text-[9.5px]">
                  * * * CAIXA CONSOLIDADO * * *
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
