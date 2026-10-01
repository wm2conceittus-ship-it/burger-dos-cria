import React, { useState } from 'react';
import { Order } from '../types';
import { X, Printer, Flame, Check, Copy, Scissors, ReceiptText, FileText } from 'lucide-react';
import { APP_IMAGES } from '../data/mockData';

interface PrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ order, onClose }) => {
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('receipt_paper_size') as '58mm' | '80mm') || '58mm';
  });
  const [copiedText, setCopiedText] = useState(false);
  const [compactMode, setCompactMode] = useState(true);

  if (!order) return null;

  const handleSelectPaperSize = (size: '58mm' | '80mm') => {
    setPaperSize(size);
    localStorage.setItem('receipt_paper_size', size);
  };

  const handleCopyRawText = () => {
    const divider = '--------------------------------';
    const doubleDivider = '================================';

    const itemsText = order.items
      .map(it => {
        let line = `${it.quantity}x ${it.name} - R$ ${(it.price * it.quantity).toFixed(2).replace('.', ',')}`;
        if (it.pizzaSize) {
          line += `\n   TAM: ${it.pizzaSize.toUpperCase()} ${
            it.pizzaSize === 'Família'
              ? '(12 FATIAS)'
              : it.pizzaSize === 'P'
              ? '(4 FATIAS)'
              : it.pizzaSize === 'M'
              ? '(6 FATIAS)'
              : '(8 FATIAS)'
          }`;
        }
        if (it.juiceSize) {
          line += `\n   TAM: ${it.juiceSize === '1L' ? '1L (GARRAFA)' : it.juiceSize.toUpperCase()}`;
        }
        if (it.notes) {
          line += `\n   OBS: ${it.notes}`;
        }
        return line;
      })
      .join('\n');

    const text = `
${doubleDivider}
        BURGER DOS CRIAS
   Hamburgueria & Pizzaria Artesanal
     CNPJ: 45.892.120/0001-90
    WhatsApp: (11) 98765-4321
${divider}
   DOCUMENTO AUXILIAR DE VENDA
       (CUPOM NÃO FISCAL)
${divider}
PEDIDO: ${order.orderNumber}
DATA: ${new Date().toLocaleDateString('pt-BR')}  HORA: ${order.createdAt || 'Agora'}
TIPO: ${order.type.toUpperCase()}
CLIENTE: ${order.customerName}
FONE: ${order.customerPhone}
ENDEREÇO:
${order.address}
${order.notes ? `OBS PEDIDO: ${order.notes}\n` : ''}${divider}
QTD  ITEM                      TOTAL
${divider}
${itemsText}
${divider}
SUBTOTAL:            R$ ${order.subtotal.toFixed(2).replace('.', ',')}
${order.deliveryFee > 0 ? `TAXA ENTREGA:        R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n` : ''}${doubleDivider}
TOTAL A PAGAR:       R$ ${order.total.toFixed(2).replace('.', ',')}
${doubleDivider}
FORMA DE PAGAMENTO:  ${order.paymentMethod || 'PIX'}
STATUS PAGAMENTO:    CONFIRMADO
${order.changeFor ? `LEVAR TROCO PARA:    ${order.changeFor}\n` : ''}${order.mercadoPagoPaymentId ? `AUTORIZAÇÃO MP:      ${order.mercadoPagoPaymentId}\n` : ''}${divider}
   OBRIGADO PELA PREFERENCIA!
        BOM APETITE! 🔥
${doubleDivider}
    * * * ${order.orderNumber} * * *
`.trim();

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Dynamic page print size injection */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === '58mm' ? '58mm auto' : '80mm auto'};
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Main Dialog Modal */}
      <div className="bg-[#1f1e1e] border border-[#353535] rounded-2xl w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] print:border-none print:shadow-none print:max-h-none print:w-auto print:bg-transparent">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-3.5 bg-[#171616] border-b border-[#353535] flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#ff5722]/15 text-[#ff5722] rounded-lg">
              <Printer className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-xs text-white">
                Impressão de Pedido {order.orderNumber}
              </h3>
              <p className="text-[10px] text-[#8e8f8f]">Selecione a bobina da sua impressora térmica</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8e8f8f] hover:text-white p-1.5 rounded-lg hover:bg-[#252424] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar (Hidden in Print) */}
        <div className="px-4 py-2.5 bg-[#1c1b1b] border-b border-[#353535] flex flex-wrap items-center justify-between gap-2 print:hidden flex-shrink-0">
          {/* Paper Size Tabs */}
          <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-[#353535]">
            <button
              onClick={() => handleSelectPaperSize('58mm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paperSize === '58mm'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Bobina 58mm (Cupom)</span>
              <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded font-extrabold uppercase">POS</span>
            </button>

            <button
              onClick={() => handleSelectPaperSize('80mm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paperSize === '80mm'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#8e8f8f] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bobina 80mm (Ampla)</span>
            </button>
          </div>

          {/* Quick Options */}
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

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#121212] flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          {/* ============================================================== */}
          {/* LAYOUT 1: BOBINA 58mm (CUPOM FISCAL / MINI POS / BLUETOOTH)   */}
          {/* ============================================================== */}
          {paperSize === '58mm' && (
            <div
              id="printable-ticket"
              className="ticket-58mm bg-white text-black font-mono text-[11px] leading-[1.25] p-3 rounded shadow-2xl w-[265px] border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* Cupom Header */}
              <div className="text-center pb-1.5 border-b border-dashed border-black flex flex-col items-center">
                {/* Logo da Hamburgueria */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-black shadow-sm mb-1 bg-black flex items-center justify-center">
                  <img
                    src={APP_IMAGES.logo}
                    alt="Logo Burguer dos Crias"
                    className="w-full h-full object-cover print:contrast-150 print:grayscale"
                  />
                </div>
                <p className="font-black text-sm tracking-wider font-['Montserrat'] uppercase">
                  BURGER DOS CRIAS
                </p>
                <p className="text-[9px] font-bold text-gray-800 uppercase">
                  Hamburgueria & Pizzaria
                </p>
                <p className="text-[8px] text-gray-600">
                  CNPJ: 45.892.120/0001-90
                </p>
                <p className="text-[9px] font-bold text-gray-800">
                  WhatsApp: (11) 98765-4321
                </p>
                <div className="mt-1 bg-black text-white text-[9px] font-bold py-0.5 px-2 uppercase tracking-wider rounded-sm w-full">
                  DOC. AUXILIAR DE VENDA (NÃO FISCAL)
                </div>
              </div>

              {/* Order Meta Info */}
              <div className="py-1.5 border-b border-dashed border-black space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-base">{order.orderNumber}</span>
                  <span className="font-black text-xs px-1.5 py-0.2 bg-black text-white uppercase rounded-sm">
                    {order.type}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>Hora: {order.createdAt || '19:20'}</span>
                </div>
                <div className="text-[10px] pt-0.5">
                  <p className="font-bold truncate">CLIENTE: {order.customerName}</p>
                  <p className="text-gray-700">FONE: {order.customerPhone}</p>
                  <p className="text-gray-800 font-semibold leading-tight pt-0.5">
                    END: {order.address}
                  </p>
                </div>
                {order.notes && (
                  <div className="mt-1 p-1 bg-gray-100 border border-black text-[9px] font-bold leading-tight">
                    OBS GERAL: {order.notes}
                  </div>
                )}
              </div>

              {/* Items Column Header */}
              <div className="py-1 border-b border-black text-[9px] font-black flex justify-between uppercase">
                <span>QTD ITEM</span>
                <span>TOTAL</span>
              </div>

              {/* Items List */}
              <div className="py-1 space-y-1.5 border-b border-dashed border-black">
                {order.items.map((it, idx) => (
                  <div key={idx} className="text-[10px] leading-tight">
                    <div className="flex justify-between items-start font-bold">
                      <span className="pr-1">
                        <span className="font-black">{it.quantity}x</span> {it.name}
                      </span>
                      <span className="whitespace-nowrap font-black">
                        {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Sizes */}
                    {it.pizzaSize && (
                      <p className="text-[9px] font-black pl-3 text-black">
                        » TAM: {it.pizzaSize.toUpperCase()} {it.pizzaSize === 'Família' ? '(12 FAT)' : `(${it.pizzaSize === 'P' ? '4 FAT' : it.pizzaSize === 'M' ? '6 FAT' : '8 FAT'})`}
                      </p>
                    )}
                    {it.juiceSize && (
                      <p className="text-[9px] font-black pl-3 text-black">
                        » TAM: {it.juiceSize === '1L' ? '1 LITRO (1LT)' : it.juiceSize.toUpperCase()}
                      </p>
                    )}

                    {/* Additional Notes */}
                    {it.notes && (
                      <p className="text-[9px] font-semibold italic pl-3 text-gray-800">
                        • {it.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="py-1.5 border-b-2 border-dashed border-black space-y-0.5 text-[10px]">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black text-black">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-1 border-b border-dashed border-black text-[9px] space-y-0.5 font-bold">
                <div className="flex justify-between">
                  <span>FORMA DE PGTO:</span>
                  <span className="uppercase">{order.paymentMethod || 'PIX'}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span>CONFIRMADO</span>
                </div>
                {order.mercadoPagoPaymentId && (
                  <div className="flex justify-between text-[8px] text-gray-700">
                    <span>AUTORIZAÇÃO:</span>
                    <span className="font-mono">{order.mercadoPagoPaymentId}</span>
                  </div>
                )}
                {order.changeFor && (
                  <div className="flex justify-between bg-black text-white px-1 py-0.5 font-black">
                    <span>TROCO PARA:</span>
                    <span>{order.changeFor}</span>
                  </div>
                )}
              </div>

              {/* Footer / Barcode */}
              <div className="text-center pt-2 text-[9px] space-y-1">
                <p className="font-bold uppercase tracking-wider">
                  Obrigado pela preferência! 🔥
                </p>
                <div className="font-mono tracking-widest text-[9px] text-gray-800 py-0.5">
                  |||| ||||| ||||||| |||| ||||
                </div>
                <p className="text-[8px] text-gray-600">
                  * {order.orderNumber} • BURGER DOS CRIAS *
                </p>
                <div className="flex items-center justify-center gap-1 text-[8px] text-gray-500 pt-1 border-t border-dotted border-gray-400">
                  <Scissors className="w-2.5 h-2.5" />
                  <span>Corte da Bobina</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* LAYOUT 2: BOBINA 80mm (COMANDA AMPLA TRADICIONAL)              */}
          {/* ============================================================== */}
          {paperSize === '80mm' && (
            <div
              id="printable-ticket"
              className="ticket-80mm bg-white text-[#111111] rounded-xl w-[360px] p-5 shadow-2xl space-y-3 font-mono text-xs border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* Receipt Header with Logo */}
              <div className="relative pb-3 border-b-2 border-dashed border-gray-400 text-center">
                <div className="flex flex-col items-center justify-center mb-1.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-black shadow-sm mb-1 bg-black flex items-center justify-center">
                    <img
                      src={APP_IMAGES.logo}
                      alt="Logo Burguer dos Crias"
                      className="w-full h-full object-cover print:contrast-150"
                    />
                  </div>
                  <h2 className="font-extrabold text-base tracking-wider uppercase font-['Montserrat'] text-black leading-tight">
                    BURGER DOS CRIAS
                  </h2>
                  <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">
                    • COMANDA DE PRODUÇÃO & EXPEDIÇÃO •
                  </p>
                  <p className="text-[9px] text-gray-500 font-sans">
                    WhatsApp: (11) 98765-4321 • O Mais Brabo da Quebrada
                  </p>
                </div>
              </div>

              {/* Order Meta Info */}
              <div className="space-y-1.5 py-1 text-[11px] border-b border-dashed border-gray-300">
                <div className="flex justify-between items-center bg-gray-100 print:bg-transparent px-2 py-1 rounded">
                  <span className="font-black text-sm">PEDIDO {order.orderNumber}</span>
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded uppercase">
                    {order.type}
                  </span>
                </div>

                <div className="flex justify-between text-gray-800 pt-1">
                  <span><strong>Cliente:</strong> {order.customerName}</span>
                  <span><strong>Horário:</strong> {order.createdAt || 'Agora'}</span>
                </div>

                <div className="text-gray-800">
                  <strong>Endereço:</strong> {order.address}
                </div>

                {order.notes && (
                  <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 font-bold">
                    OBS GERAL: {order.notes}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-gray-200">
                  Itens do Pedido ({order.items.length})
                </div>

                {order.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-dotted border-gray-200 pb-1.5">
                    <div className="pr-2">
                      <span className="font-black text-sm">{it.quantity}x</span>{' '}
                      <span className="font-bold text-black">{it.name}</span>
                      {it.pizzaSize && (
                        <span className="ml-1.5 inline-block text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded print:border print:border-black">
                          TAM: {it.pizzaSize.toUpperCase()} {it.pizzaSize === 'Família' ? '(12 FATIAS)' : `(${it.pizzaSize === 'P' ? '4 FATIAS' : it.pizzaSize === 'M' ? '6 FATIAS' : '8 FATIAS'})`}
                        </span>
                      )}
                      {it.juiceSize && (
                        <span className="ml-1.5 inline-block text-[10px] font-black bg-amber-600 text-white px-1.5 py-0.5 rounded print:text-black print:border print:border-black">
                          TAM: {it.juiceSize === '1L' ? '1 LITRO (1LT)' : it.juiceSize.toUpperCase()}
                        </span>
                      )}
                      {it.notes && (
                        <p className="text-[11px] text-black font-extrabold ml-5 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                          » OBS: {it.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-right whitespace-nowrap">
                      R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="pt-2 border-t-2 border-dashed border-gray-400 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal dos Itens:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black pt-1.5 border-t border-gray-300 text-black">
                  <span>TOTAL A COBRAR:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-gray-800 pt-1">
                  <span>FORMA DE PAGAMENTO:</span>
                  <span className="uppercase px-1.5 py-0.5 bg-gray-200 rounded font-black">
                    {order.paymentMethod || 'PIX'}
                  </span>
                </div>

                {order.mercadoPagoPaymentId && (
                  <div className="flex justify-between items-center text-[10px] font-black text-black bg-gray-100 p-1 rounded border border-gray-300">
                    <span>MERCADO PAGO AUTORIZADO:</span>
                    <span className="font-mono">{order.mercadoPagoPaymentId}</span>
                  </div>
                )}

                {order.changeFor && (
                  <div className="flex justify-between items-center text-[11px] font-black text-amber-900 bg-amber-100 p-1 rounded border border-amber-300">
                    <span>⚠️ LEVAR TROCO PARA:</span>
                    <span>{order.changeFor}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2.5 border-t border-dashed border-gray-400 text-[10px] text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-700">Obrigado pela preferência! Bom apetite! 🔥</p>
                <p className="tracking-widest font-mono text-[9px]">
                  * * * {order.orderNumber} - SISTEMA BURGER DOS CRIAS * * *
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar (Hidden in Print) */}
        <div className="p-3.5 bg-[#171616] border-t border-[#353535] flex items-center justify-between gap-2.5 print:hidden flex-shrink-0">
          <button
            onClick={handleCopyRawText}
            className="flex items-center gap-1.5 bg-[#252424] hover:bg-[#2f2e2e] text-[#b4b5b5] hover:text-white px-3 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs transition-colors"
            title="Copiar texto puro para impressora Bluetooth / ESC/POS"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copiar Texto (ESC/POS)</span>
                <span className="sm:hidden">Copiar</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="bg-[#252424] hover:bg-[#2f2e2e] text-white px-4 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs transition-colors"
            >
              Fechar
            </button>

            <button
              onClick={() => {
                window.print();
              }}
              className="btn-flame text-white px-5 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#ff5722]/30 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>
                Imprimir {paperSize === '58mm' ? 'Cupom 58mm' : 'Comanda 80mm'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
