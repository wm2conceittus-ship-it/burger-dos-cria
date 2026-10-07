import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, MessageCircle, QrCode, Globe, ShieldCheck } from 'lucide-react';
import { getPublicMenuUrl, copyToClipboard } from '../utils/shareUtils';

interface ShareMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber?: number;
}

export const ShareMenuModal: React.FC<ShareMenuModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const defaultUrl = tableNumber
    ? getPublicMenuUrl(`/?mesa=${tableNumber}`)
    : getPublicMenuUrl();

  const [customUrl, setCustomUrl] = useState(defaultUrl);

  const handleCopy = async () => {
    const success = await copyToClipboard(customUrl || defaultUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = tableNumber
    ? `Olá! Faça seu pedido na Mesa ${tableNumber} pelo nosso cardápio digital:\n${customUrl || defaultUrl}`
    : `Olá! Confira o cardápio do Burguer dos Crias e faça seu pedido online com entrega rápida:\n${customUrl || defaultUrl}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353535] flex items-center justify-between bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center border border-[#ff5722]/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                {tableNumber ? `Link da Mesa ${tableNumber}` : 'Link do Cardápio para Clientes'}
              </h3>
              <p className="text-[11px] text-[#b4b5b5]">
                Link público oficial • Acesso livre sem login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b4b5b5] hover:text-white p-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block text-emerald-300 font-bold">Link 100% Público e Ativo</strong>
              Qualquer cliente consegue abrir este link no celular, computador ou WhatsApp sem precisar fazer login.
            </div>
          </div>

          {/* Link Box */}
          <div>
            <label className="block text-[#b4b5b5] font-semibold mb-1.5 text-[11px]">
              Copie o link abaixo para enviar aos seus clientes ou colocar na bio do Instagram:
            </label>
            <div className="flex items-center gap-2 bg-[#141414] border border-[#353535] rounded-xl p-1.5 pl-3">
              <Globe className="w-4 h-4 text-[#ff5722] shrink-0" />
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                className="bg-transparent text-white font-mono text-[11px] w-full focus:outline-none select-all truncate"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#ff5722] hover:bg-[#ff3d00] text-white active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-['Montserrat'] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </a>

            <a
              href={customUrl || defaultUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white font-['Montserrat'] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs text-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Testar Abrir Link</span>
            </a>
          </div>

          {/* Tips */}
          <div className="p-3 bg-[#151515] border border-[#2a2a2a] rounded-xl space-y-1 text-[11px] text-[#8e8f8f]">
            <p className="text-white font-semibold">💡 Dicas para vender mais:</p>
            <p>• Coloque este link no botão "Fazer Pedido" do seu WhatsApp Business.</p>
            <p>• Adicione no campo "Site" do perfil do Instagram da sua hamburgueria.</p>
            <p>• Crie um QR Code deste link para imprimir no cardápio de balcão ou nas mesas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
