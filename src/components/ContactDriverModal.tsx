import React, { useState } from 'react';
import { APP_IMAGES } from '../data/mockData';
import { X, Send, Phone, ShieldCheck } from 'lucide-react';

interface ContactDriverModalProps {
  onClose: () => void;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierVehicle?: string;
  courierPlate?: string;
}

export const ContactDriverModal: React.FC<ContactDriverModalProps> = ({
  onClose,
  courierName = 'Ricardo',
  courierPhone = '(11) 98765-1122',
  courierAvatar = APP_IMAGES.driverAvatar,
  courierVehicle,
  courierPlate,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<{ sender: 'driver' | 'user'; text: string; time: string }[]>([
    {
      sender: 'driver',
      text: `Olá! Sou o ${courierName}, seu entregador Burger dos Crias. O pedido está bem quentinho na bag térmica e chego em breve!`,
      time: '19:28',
    },
  ]);

  const quickReplies = [
    'O interfone está quebrado',
    'Pode deixar na portaria',
    'Já estou descendo!',
    'Obrigado, no aguardo!',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');

    // Simulated driver reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'driver',
          text: 'Perfeito! Anotado aqui, até breve!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const handleCall = () => {
    const cleanNum = courierPhone.replace(/\D/g, '');
    window.open(`tel:${cleanNum}`, '_blank');
  };

  const handleWhatsApp = () => {
    const cleanNum = courierPhone.replace(/\D/g, '');
    const numWithCountry = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`;
    window.open(`https://wa.me/${numWithCountry}?text=${encodeURIComponent(`Olá ${courierName}, sobre a entrega do meu pedido no Burger dos Crias:`)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#20201f] border border-[#353535] rounded-3xl w-full max-w-md h-[540px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1c1b1b] p-4 border-b border-[#353535] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]">
                <img src={courierAvatar} alt={courierName} className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1c1b1b] rounded-full" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-1.5">
                {courierName} <ShieldCheck className="w-3.5 h-3.5 text-[#ff8a65]" />
              </h3>
              <p className="text-[11px] text-[#b4b5b5]">
                {courierVehicle ? `${courierVehicle}${courierPlate ? ` • ${courierPlate}` : ''}` : 'Entregador Oficial Burger dos Crias'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleWhatsApp}
              className="p-2 text-emerald-400 hover:text-white rounded-full hover:bg-emerald-500/20 transition-colors"
              title={`Chamar ${courierName} no WhatsApp (${courierPhone})`}
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={handleCall}
              className="p-2 text-[#ffb5a0] hover:text-white rounded-full hover:bg-[#353535] transition-colors"
              title={`Ligar para ${courierName} (${courierPhone})`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#b4b5b5] hover:text-white rounded-full hover:bg-[#353535] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#131313]/60 hide-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#ff5722] text-white rounded-br-none'
                    : 'bg-[#2a2a2a] text-[#e5e2e1] rounded-bl-none border border-[#353535]'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[9px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-[#b4b5b5]'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick reply suggestions */}
        <div className="px-3 py-2 bg-[#1c1b1b] border-t border-[#353535] flex gap-1.5 overflow-x-auto hide-scrollbar">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qr)}
              className="whitespace-nowrap bg-[#2a2a2a] hover:bg-[#ff5722]/20 hover:text-[#ff8a65] text-[#b4b5b5] text-[10px] px-2.5 py-1 rounded-md border border-[#353535] transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-[#1c1b1b] border-t border-[#353535] flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Mensagem para o entregador..."
            className="flex-grow bg-[#20201f] border border-[#353535] rounded-md px-3 py-2.5 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
          />
          <button
            onClick={() => handleSend()}
            className="w-9 h-9 rounded-md btn-flame text-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
