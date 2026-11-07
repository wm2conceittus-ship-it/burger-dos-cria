import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { X, Printer, Flame, Check, Copy, Scissors, ReceiptText, FileText, Bluetooth, QrCode } from 'lucide-react';
import { APP_IMAGES } from '../data/mockData';
import { getOrderDate, getOrderTime, formatOrderCreationDateTime } from '../utils/orderDateTime';

interface PrintModalProps {
  order: Order | null;
  storeSettings?: StoreSettings;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ order, storeSettings, onClose }) => {
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('receipt_paper_size') as '58mm' | '80mm') || '58mm';
  });
  const [copiedText, setCopiedText] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [isPrintingBluetooth, setIsPrintingBluetooth] = useState(false);
  const [showPrintQrModal, setShowPrintQrModal] = useState(false);

  if (!order) return null;

  const storeName = storeSettings?.storeName || 'BURGER DOS CRIAS';
  const storeAddress = storeSettings?.address || storeSettings?.deliveryArea?.baseAddress || 'Rua Augusta, 1000 - Consolação, São Paulo - SP';
  const storeWhatsApp = storeSettings?.whatsappSupport || '(11) 98765-4321';

  const isOnlinePaid =
    order.paymentStatus === 'aprovado' ||
    Boolean(
      order.paymentMethod &&
        (order.paymentMethod.toLowerCase().includes('online') ||
          order.paymentMethod.toLowerCase().includes('pix'))
    );

  const isNeedMachine =
    Boolean(
      order.paymentMethod &&
        (order.paymentMethod.toLowerCase().includes('maquininha') ||
          order.paymentMethod.toLowerCase().includes('vale') ||
          order.paymentMethod.toLowerCase().includes('vr') ||
          order.paymentMethod.toLowerCase().includes('crédito') ||
          order.paymentMethod.toLowerCase().includes('débito')) &&
        !isOnlinePaid
    );

  const isCash = Boolean(
    order.paymentMethod && order.paymentMethod.toLowerCase().includes('dinheiro')
  );

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

    const paymentInstructionText = isOnlinePaid
      ? '>>> PAGO ONLINE - NAO COBRAR DO CLIENTE <<<'
      : isNeedMachine
      ? '>>> LEVAR MAQUININHA (COBRAR NA ENTREGA) <<<'
      : isCash
      ? `>>> COBRAR EM DINHEIRO NA ENTREGA ${order.changeFor ? `(LEVAR TROCO P/ ${order.changeFor})` : '(SEM TROCO)'} <<<`
      : '>>> COBRAR NA ENTREGA <<<';

    const text = `
${doubleDivider}
        ${storeName.toUpperCase()}
   Hamburgueria & Pizzaria Artesanal
   End: ${storeAddress}
   WhatsApp: ${storeWhatsApp}
${divider}
   DOCUMENTO AUXILIAR DE VENDA
       (CUPOM NÃO FISCAL)
${divider}
PEDIDO: ${order.orderNumber}
DATA: ${getOrderDate(order)}  HORA: ${getOrderTime(order)}
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
TOTAL DO PEDIDO:     R$ ${order.total.toFixed(2).replace('.', ',')}
${doubleDivider}
FORMA DE PAGAMENTO:  ${order.paymentMethod || 'PIX'}
INSTRUÇÃO: ${paymentInstructionText}
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

  // Web Bluetooth ESC/POS Direct Print for Thermal Printers (58mm/80mm)
  const handleBluetoothPrint = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      alert('A Web Bluetooth API não é suportada neste navegador (use Google Chrome em tablets Android, Windows ou Mac).');
      return;
    }

    setIsPrintingBluetooth(true);
    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '00001101-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'
        ]
      });

      if (!device || !device.gatt) {
        throw new Error('Nenhum dispositivo Bluetooth selecionado.');
      }

      const server = await device.gatt.connect();
      let characteristic: any = null;
      const services = await server.getPrimaryServices();

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              characteristic = char;
              break;
            }
          }
        } catch {
          // ignore
        }
        if (characteristic) break;
      }

      if (!characteristic) {
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb').catch(() => null);
        if (service) {
          characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb').catch(() => null);
        }
      }

      if (!characteristic) {
        throw new Error('Característica de escrita ESC/POS não encontrada na impressora térmica.');
      }

      const encoder = new TextEncoder();
      const maxChars = paperSize === '58mm' ? 32 : 48;
      const divider = '-'.repeat(maxChars);
      const doubleDivider = '='.repeat(maxChars);

      let escPosData = '';
      escPosData += '\x1b\x40'; // Init ESC @
      escPosData += '\x1b\x61\x01'; // Center align
      escPosData += '\x1b\x45\x01'; // Bold ON
      escPosData += `${storeName.toUpperCase()}\n`;
      escPosData += '\x1b\x45\x00'; // Bold OFF
      escPosData += `PEDIDO #${order.orderNumber}\n`;
      escPosData += `${doubleDivider}\n`;
      escPosData += '\x1b\x61\x00'; // Left align
      escPosData += `Data: ${getOrderDate(order)}  Hora: ${getOrderTime(order)}\n`;
      escPosData += `Tipo: ${order.type.toUpperCase()}\n`;
      escPosData += `Cliente: ${order.customerName}\n`;
      escPosData += `Fone: ${order.customerPhone || 'N/A'}\n`;
      escPosData += `Endereço: ${order.address || 'Retirada'}\n`;
      if (order.notes) escPosData += `Obs: ${order.notes}\n`;
      escPosData += `${divider}\n`;
      escPosData += `QTD ITEM                      TOTAL\n`;
      escPosData += `${divider}\n`;

      order.items.forEach(it => {
        const itemTotal = (it.price * it.quantity).toFixed(2).replace('.', ',');
        escPosData += `${it.quantity}x ${it.name} - R$ ${itemTotal}\n`;
        if (it.pizzaSize) escPosData += `   TAM: ${it.pizzaSize.toUpperCase()}\n`;
        if (it.notes) escPosData += `   OBS: ${it.notes}\n`;
      });

      escPosData += `${divider}\n`;
      escPosData += `Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
      if (order.deliveryFee > 0) {
        escPosData += `Taxa Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n`;
      }
      escPosData += `${doubleDivider}\n`;
      escPosData += `TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}\n`;
      escPosData += `${doubleDivider}\n`;
      escPosData += `Pagamento: ${order.paymentMethod || 'PIX'}\n`;
      escPosData += '\x1b\x61\x01'; // Center align
      escPosData += `\nOBRIGADO PELA PREFERÊNCIA!\n`;
      escPosData += `=== ${order.orderNumber} ===\n\n\n`;
      escPosData += '\x1d\x56\x41\x00'; // Cut paper

      const bytes = encoder.encode(escPosData);
      const chunkSize = 512;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValue(chunk);
        }
      }

      alert('Comando ESC/POS enviado via Bluetooth com sucesso para a impressora!');
    } catch (err: any) {
      console.error('Erro Web Bluetooth:', err);
      alert(`Erro na impressão Bluetooth: ${err.message || err}`);
    } finally {
      setIsPrintingBluetooth(false);
    }
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
      <div className="bg-[#1f1e1e] border border-[#353535] rounded-lg w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] print:border-none print:shadow-none print:max-h-none print:w-auto print:bg-transparent">
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
              <p className="text-[10px] text-[#8e8f8f]">Selecione a bobina ou conecte via Web Bluetooth</p>
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

        {/* Receipt Preview Container (Scrollable) */}
        <div className="p-4 sm:p-6 bg-[#131313] overflow-y-auto flex-1 flex justify-center print:p-0 print:bg-white">
          {paperSize === '58mm' ? (
            /* 58mm POS Thermal Receipt Preview */
            <div className={`bg-white text-black font-mono font-bold p-4 shadow-2xl rounded-sm ${compactMode ? 'w-[260px] text-[11px] leading-tight space-y-2' : 'w-[280px] text-[11.5px] leading-relaxed space-y-3'} print:shadow-none print:w-[58mm] print:p-0`}>
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-black text-[#ff5722] flex items-center justify-center mb-1 overflow-hidden border border-gray-300 shadow-sm">
                  <img src={APP_IMAGES.logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="font-black text-sm tracking-wide">{storeName.toUpperCase()}</h2>
                <p className="text-[10px] font-normal text-gray-600">Hamburgueria & Pizzaria Artesanal</p>
                <p className="text-[9.5px] font-normal text-gray-500 leading-tight">{storeAddress}</p>
                <p className="text-[9.5px] font-normal text-gray-500">WhatsApp: {storeWhatsApp}</p>
              </div>

              {/* Order Meta */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-[11px]">
                <div className="text-center font-black bg-black text-white py-1 text-xs tracking-wider">
                  PEDIDO #{order.orderNumber}
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>DATA: {getOrderDate(order)}</span>
                  <span>HORA: {getOrderTime(order)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>TIPO: {order.type.toUpperCase()}</span>
                  {order.tableNumber && <span>MESA: #{order.tableNumber}</span>}
                </div>
                <div className="pt-1">
                  <span className="text-gray-500 block text-[9.5px]">CLIENTE:</span>
                  <span className="font-bold text-black">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div>
                    <span className="text-gray-500 block text-[9.5px]">FONE:</span>
                    <span className="font-bold text-black">{order.customerPhone}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-[9.5px]">ENDEREÇO DE ENTREGA:</span>
                  <span className="font-bold text-black leading-tight block">{order.address}</span>
                </div>
                {order.notes && (
                  <div className="bg-yellow-100 p-1.5 rounded border border-yellow-300 text-black mt-1">
                    <span className="text-[9px] font-bold block uppercase">Obs do Pedido:</span>
                    <span className="font-black">{order.notes}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-2">
                <div className="text-[10px] text-gray-500 font-bold flex justify-between border-b border-gray-300 pb-0.5">
                  <span>QTD ITEM</span>
                  <span>TOTAL (R$)</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-black">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-mono text-black whitespace-nowrap">
                        {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {item.pizzaSize && (
                      <div className="text-[10px] text-gray-700 pl-4 font-semibold">
                        • Tam: {item.pizzaSize.toUpperCase()}
                        {item.pizzaSize === 'Família' ? ' (12 Fatias)' : item.pizzaSize === 'P' ? ' (4 Fatias)' : item.pizzaSize === 'M' ? ' (6 Fatias)' : ' (8 Fatias)'}
                      </div>
                    )}
                    {item.juiceSize && (
                      <div className="text-[10px] text-gray-700 pl-4 font-semibold">
                        • Tamanho: {item.juiceSize === '1L' ? '1L (Garrafa)' : item.juiceSize.toUpperCase()}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[10px] text-red-600 pl-4 italic">
                        Obs: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals & Payment */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-black font-black text-sm pt-1 border-t border-gray-300">
                  <span>TOTAL:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-gray-800 pt-1">
                  <span>PAGAMENTO:</span>
                  <span className="uppercase px-1.5 py-0.5 bg-gray-200 rounded font-black">
                    {order.paymentMethod || 'PIX'}
                  </span>
                </div>

                {/* Big Visual Instruction Box for Courier */}
                {isOnlinePaid ? (
                  <div className="bg-black text-white p-2 text-center font-black text-xs tracking-wider rounded">
                    ✓ PAGO ONLINE - NÃO COBRAR DO CLIENTE
                  </div>
                ) : isNeedMachine ? (
                  <div className="border-2 border-black p-2 text-center font-black text-xs tracking-wider rounded">
                    💳 LEVAR MAQUININHA DE CARTÃO (COBRAR NA ENTREGA)
                  </div>
                ) : isCash ? (
                  <div className="border-2 border-black p-2 text-center font-black text-xs tracking-wider rounded space-y-0.5">
                    <div>💵 COBRAR EM DINHEIRO NA ENTREGA</div>
                    {order.changeFor ? (
                      <div className="text-[11px] font-black underline bg-gray-100 py-0.5 px-1 rounded inline-block text-black">
                        ⚠️ LEVAR TROCO PARA: {order.changeFor}
                      </div>
                    ) : (
                      <div className="text-[10px] font-normal">(Cliente informou que não precisa de troco)</div>
                    )}
                  </div>
                ) : (
                  <div className="border border-black p-1.5 text-center font-black text-xs rounded">
                    COBRAR NA ENTREGA
                  </div>
                )}

                {order.mercadoPagoPaymentId && (
                  <div className="flex justify-between items-center text-[10px] font-black text-black bg-gray-100 p-1 rounded border border-gray-300">
                    <span>MERCADO PAGO AUTORIZADO:</span>
                    <span className="font-mono">{order.mercadoPagoPaymentId}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-700">Obrigado pela preferência! Bom apetite! 🔥</p>
                <p className="tracking-widest font-mono text-[9px]">
                  * * * {order.orderNumber} * * *
                </p>
              </div>
            </div>
          ) : (
            /* 80mm Wide Thermal Receipt Preview */
            <div className="bg-white text-black font-mono font-bold p-5 shadow-2xl rounded-sm w-[360px] text-xs leading-relaxed space-y-3 print:shadow-none print:w-[80mm] print:p-0">
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-black text-[#ff5722] flex items-center justify-center mb-1.5 overflow-hidden border border-gray-300 shadow-sm">
                  <img src={APP_IMAGES.logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="font-black text-base tracking-wide">{storeName.toUpperCase()}</h2>
                <p className="text-[11px] font-normal text-gray-600">Hamburgueria & Pizzaria Artesanal</p>
                <p className="text-[10px] font-normal text-gray-500">{storeAddress}</p>
                <p className="text-[10px] font-normal text-gray-500">WhatsApp: {storeWhatsApp}</p>
              </div>

              {/* Order Meta */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-1.5 text-xs">
                <div className="text-center font-black bg-black text-white py-1.5 text-sm tracking-wider">
                  PEDIDO #{order.orderNumber}
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>DATA: {getOrderDate(order)}</span>
                  <span>HORA: {getOrderTime(order)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>TIPO: {order.type.toUpperCase()}</span>
                  {order.tableNumber && <span>MESA: #{order.tableNumber}</span>}
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">CLIENTE:</span>
                  <span className="font-bold text-black text-sm">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">FONE:</span>
                    <span className="font-bold text-black">{order.customerPhone}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-[10px]">ENDEREÇO DE ENTREGA:</span>
                  <span className="font-bold text-black leading-tight block">{order.address}</span>
                </div>
                {order.notes && (
                  <div className="bg-yellow-100 p-2 rounded border border-yellow-300 text-black mt-1">
                    <span className="text-[10px] font-bold block uppercase">Obs do Pedido:</span>
                    <span className="font-black text-sm">{order.notes}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-2.5">
                <div className="text-[11px] text-gray-500 font-bold flex justify-between border-b border-gray-300 pb-1">
                  <span>QTD ITEM</span>
                  <span>TOTAL (R$)</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-black text-sm">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-mono text-black whitespace-nowrap text-sm">
                        {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {item.pizzaSize && (
                      <div className="text-xs text-gray-700 pl-5 font-semibold">
                        • Tam: {item.pizzaSize.toUpperCase()}
                        {item.pizzaSize === 'Família' ? ' (12 Fatias)' : item.pizzaSize === 'P' ? ' (4 Fatias)' : item.pizzaSize === 'M' ? ' (6 Fatias)' : ' (8 Fatias)'}
                      </div>
                    )}
                    {item.juiceSize && (
                      <div className="text-xs text-gray-700 pl-5 font-semibold">
                        • Tamanho: {item.juiceSize === '1L' ? '1L (Garrafa)' : item.juiceSize.toUpperCase()}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-red-600 pl-5 italic">
                        Obs: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals & Payment */}
              <div className="border-b border-dashed border-gray-400 pb-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-black font-black text-base pt-1.5 border-t border-gray-300">
                  <span>TOTAL:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-gray-800 pt-1.5">
                  <span>FORMA DE PAGAMENTO:</span>
                  <span className="uppercase px-1.5 py-0.5 bg-gray-200 rounded font-black">
                    {order.paymentMethod || 'PIX'}
                  </span>
                </div>

                {/* Big Visual Instruction Box for Courier */}
                {isOnlinePaid ? (
                  <div className="bg-black text-white p-2 text-center font-black text-xs tracking-wider rounded">
                    ✓ PAGO ONLINE - NÃO COBRAR DO CLIENTE
                  </div>
                ) : isNeedMachine ? (
                  <div className="border-2 border-black p-2 text-center font-black text-xs tracking-wider rounded">
                    💳 LEVAR MAQUININHA DE CARTÃO (COBRAR NA ENTREGA)
                  </div>
                ) : isCash ? (
                  <div className="border-2 border-black p-2 text-center font-black text-xs tracking-wider rounded space-y-0.5">
                    <div>💵 COBRAR EM DINHEIRO NA ENTREGA</div>
                    {order.changeFor ? (
                      <div className="text-xs font-black underline bg-gray-100 py-0.5 px-1 rounded inline-block text-black">
                        ⚠️ LEVAR TROCO PARA: {order.changeFor}
                      </div>
                    ) : (
                      <div className="text-[11px] font-normal">(Cliente informou que não precisa de troco)</div>
                    )}
                  </div>
                ) : (
                  <div className="border border-black p-1.5 text-center font-black text-xs rounded">
                    COBRAR NA ENTREGA
                  </div>
                )}

                {order.mercadoPagoPaymentId && (
                  <div className="flex justify-between items-center text-[11px] font-black text-black bg-gray-100 p-1.5 rounded border border-gray-300">
                    <span>MERCADO PAGO AUTORIZADO:</span>
                    <span className="font-mono">{order.mercadoPagoPaymentId}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[11px] text-gray-500 space-y-0.5">
                <p className="font-bold text-gray-700">Obrigado pela preferência! Bom apetite! 🔥</p>
                <p className="tracking-widest font-mono text-[10px]">
                  * * * {order.orderNumber} * * *
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar (Hidden in Print) */}
        <div className="p-3.5 bg-[#171616] border-t border-[#353535] flex flex-wrap items-center justify-between gap-2.5 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
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
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Web Bluetooth Thermal Printer Button */}
            <button
              onClick={handleBluetoothPrint}
              disabled={isPrintingBluetooth}
              className="flex items-center gap-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/40 px-3 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs transition-all active:scale-95 disabled:opacity-50"
              title="Conectar via Web Bluetooth a impressora térmica portátil ESC/POS (58mm/80mm)"
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isPrintingBluetooth ? 'animate-spin' : ''}`} />
              <span>{isPrintingBluetooth ? 'Conectando...' : 'Bluetooth ESC/POS'}</span>
            </button>

            {/* Gerar QR Code de Impressão Button */}
            <button
              onClick={() => setShowPrintQrModal(true)}
              className="flex items-center gap-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 px-3 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs transition-all active:scale-95"
              title="Gerar QR Code para escaneamento rápido por garçons ou impressoras móveis"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gerar QR Code de Impressão</span>
            </button>
          </div>

          {/* QR Code Modal Popup */}
          {showPrintQrModal && (
            <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#1c1b1b] border border-[#353535] rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center pb-3 border-b border-[#353535]">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </span>
                    <h4 className="font-['Montserrat'] font-bold text-sm text-white">
                      QR Code de Impressão
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowPrintQrModal(false)}
                    className="text-[#b4b5b5] hover:text-white p-1 rounded-md hover:bg-[#333]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-amber-400 font-bold block">
                    Pedido #{order.orderNumber} • {order.customerName}
                  </span>
                  <p className="text-xs text-[#b4b5b5]">
                    Garçons e atendentes podem escanear este QR Code para enviar a comanda diretamente para impressoras térmicas Bluetooth portáteis.
                  </p>
                </div>

                {/* QR Code SVG */}
                <div className="bg-white rounded-2xl p-4 w-48 h-48 mx-auto flex items-center justify-center relative shadow-inner border-4 border-amber-500/30">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="5" y="5" width="25" height="25" fill="#000" />
                    <rect x="8" y="8" width="19" height="19" fill="#fff" />
                    <rect x="11" y="11" width="13" height="13" fill="#000" />
                    <rect x="70" y="5" width="25" height="25" fill="#000" />
                    <rect x="73" y="8" width="19" height="19" fill="#fff" />
                    <rect x="76" y="11" width="13" height="13" fill="#000" />
                    <rect x="5" y="70" width="25" height="25" fill="#000" />
                    <rect x="8" y="73" width="19" height="19" fill="#fff" />
                    <rect x="11" y="76" width="13" height="13" fill="#000" />
                    <rect x="35" y="10" width="8" height="8" fill="#000" />
                    <rect x="48" y="8" width="14" height="6" fill="#000" />
                    <rect x="35" y="24" width="6" height="14" fill="#000" />
                    <rect x="45" y="20" width="12" height="12" fill="#ff5722" />
                    <rect x="62" y="22" width="5" height="10" fill="#000" />
                    <rect x="10" y="35" width="18" height="6" fill="#000" />
                    <rect x="15" y="45" width="8" height="15" fill="#000" />
                    <rect x="28" y="38" width="6" height="8" fill="#000" />
                    <rect x="38" y="38" width="24" height="24" fill="#ff5722" rx="4" />
                    <rect x="68" y="35" width="8" height="12" fill="#000" />
                    <rect x="80" y="40" width="12" height="6" fill="#000" />
                    <rect x="68" y="52" width="10" height="8" fill="#000" />
                    <rect x="82" y="52" width="10" height="16" fill="#000" />
                    <rect x="36" y="68" width="8" height="14" fill="#000" />
                    <rect x="48" y="65" width="14" height="6" fill="#000" />
                    <rect x="48" y="76" width="8" height="16" fill="#000" />
                    <rect x="62" y="70" width="12" height="8" fill="#000" />
                    <rect x="78" y="75" width="14" height="16" fill="#000" />
                  </svg>
                  <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-white border border-[#ff5722] flex items-center justify-center shadow-md">
                    <span className="font-['Montserrat'] font-black text-[9px] text-[#ff5722]">
                      POS
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPrintQrModal(false);
                    handleBluetoothPrint();
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold font-['Montserrat'] flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>Conectar Impressora Bluetooth Agora</span>
                </button>
              </div>
            </div>
          )}

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
