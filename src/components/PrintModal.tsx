import React from 'react';
import { Order } from '../types';
import { X, Printer, Flame, Check } from 'lucide-react';
import { APP_IMAGES } from '../data/mockData';

interface PrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      {/* Printable Receipt Container */}
      <div
        id="printable-ticket"
        className="bg-white text-[#111111] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 font-mono text-xs border border-gray-200 print:border-none print:shadow-none print:w-full print:max-w-none print:p-2"
      >
        {/* Receipt Header with Burger Logo */}
        <div className="relative pb-3 border-b-2 border-dashed border-gray-400 text-center">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-black p-1 print:hidden"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo da Hamburgueria */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black shadow-sm mb-1.5 bg-black flex items-center justify-center">
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
            <p className="text-[9px] text-gray-500 font-sans mt-0.5">
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
        <div className="py-2 space-y-2.5">
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

        {/* Footer Barcode / Thank you message */}
        <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">Obrigado pela preferência! Bom apetite! 🔥</p>
          <p className="tracking-widest font-mono text-[9px]">
            * * * {order.orderNumber} - SISTEMA BURGER DOS CRIAS * * *
          </p>
        </div>

        {/* Actions (Hidden in print) */}
        <div className="pt-2 flex gap-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 bg-[#ff5722] hover:bg-[#f4511e] text-white py-2.5 rounded-xl font-bold font-['Montserrat'] text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir Comanda
          </button>
        </div>
      </div>
    </div>
  );
};

