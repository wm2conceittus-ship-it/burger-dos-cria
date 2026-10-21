import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Globe,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { getPublicMenuUrl, copyToClipboard } from '../utils/shareUtils';
import { APP_IMAGES } from '../data/mockData';

interface ShareMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber?: number;
  customBaseUrl?: string;
  onSaveCustomBaseUrl?: (url: string) => void;
  storeName?: string;
}

export const ShareMenuModal: React.FC<ShareMenuModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  customBaseUrl,
  onSaveCustomBaseUrl,
  storeName = 'Burguer dos Crias',
}) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'geral' | 'mesa'>(tableNumber ? 'mesa' : 'geral');
  const [selectedTable, setSelectedTable] = useState<number>(tableNumber || 1);
  const [isDownloading, setIsDownloading] = useState(false);

  const getComputedUrl = () => {
    if (mode === 'mesa') {
      return getPublicMenuUrl(`/?mesa=${selectedTable}&origem=qrcode_mesa`, customBaseUrl);
    }
    return getPublicMenuUrl('/?origem=qrcode', customBaseUrl);
  };

  const currentUrl = getComputedUrl();
  const [customUrl, setCustomUrl] = useState(currentUrl);

  useEffect(() => {
    setCustomUrl(getComputedUrl());
  }, [mode, selectedTable, customBaseUrl, isOpen]);

  if (!isOpen) return null;

  const targetUrl = customUrl || currentUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(targetUrl)}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(targetUrl);
    if (success) {
      setCopied(true);
      if (onSaveCustomBaseUrl && customUrl && customUrl !== currentUrl) {
        onSaveCustomBaseUrl(customUrl);
      }
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Função para compor o QR Code com o logo centralizado em um arquivo PNG baixável
  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const size = 500;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1. Carrega a imagem do QR Code da API
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrCodeUrl;
      });

      // Desenha o QR code no canvas
      ctx.drawImage(qrImage, 0, 0, size, size);

      // 2. Carrega o Logo da Hamburgueria
      const logoImage = new Image();
      logoImage.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        logoImage.onload = resolve;
        logoImage.onerror = () => {
          // Fallback se falhar ao carregar o logo externamente
          resolve(null);
        };
        logoImage.src = APP_IMAGES.logo;
      });

      // Se carregou o logo com sucesso, desenha no centro com borda e fundo branco
      if (logoImage.complete && logoImage.naturalWidth !== 0) {
        const logoSize = 110;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;

        // Fundo circular branco para destacar o logo sobre o QR code
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2 + 6, 0, 2 * Math.PI);
        ctx.fill();

        // Borda laranja ao redor do logo
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Desenha o logo recortado em círculo
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, logoSize / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
        ctx.restore();
      }

      // Gera o link de download do PNG composto
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qrcode-cardapio-${mode === 'mesa' ? `mesa-${selectedTable}` : 'geral'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao gerar PNG com logo:', err);
      // Fallback para download simples se houver bloqueio de CORS
      window.open(qrCodeUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const titleText = mode === 'mesa' ? `MESA ${selectedTable}` : 'CARDÁPIO DIGITAL';
    const subtitleText = mode === 'mesa' 
      ? `Faça o pedido direto da Mesa ${selectedTable} pelo celular!` 
      : 'Aponte a câmera do celular e faça seu pedido online!';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${storeName}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
            body {
              margin: 0;
              padding: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: #f5f5f5;
              font-family: 'Montserrat', sans-serif;
              color: #1a1a1a;
              box-sizing: border-box;
            }
            .card {
              background: #ffffff;
              width: 100%;
              max-width: 440px;
              border: 3px solid #ff5722;
              border-radius: 24px;
              padding: 32px 24px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .badge {
              display: inline-block;
              background: #ff5722;
              color: #ffffff;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              padding: 6px 18px;
              border-radius: 9999px;
              margin-bottom: 16px;
            }
            .store-name {
              font-size: 26px;
              font-weight: 900;
              margin: 0 0 6px 0;
              color: #111111;
            }
            .subtitle {
              font-size: 13px;
              color: #555555;
              margin: 0 0 24px 0;
              font-weight: 600;
            }
            .qr-box {
              position: relative;
              display: inline-block;
              padding: 12px;
              background: #ffffff;
              border: 2px dashed #ff5722;
              border-radius: 20px;
              margin-bottom: 20px;
            }
            .qr-img {
              width: 260px;
              height: 260px;
              display: block;
            }
            .qr-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 54px;
              height: 54px;
              border-radius: 50%;
              border: 3px solid #ff5722;
              background: #ffffff;
              object-fit: cover;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .steps {
              background: #fff5f0;
              border: 1px solid #ffd1c1;
              border-radius: 14px;
              padding: 14px 18px;
              text-align: left;
              margin-bottom: 18px;
              font-size: 12px;
              color: #333333;
              line-height: 1.5;
            }
            .steps strong {
              color: #ff5722;
            }
            .url-text {
              font-size: 11px;
              color: #777777;
              word-break: break-all;
              font-family: monospace;
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .card {
                border-color: #000000;
                box-shadow: none;
                margin: auto;
              }
              .badge {
                background: #000000;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">${titleText}</div>
            <h1 class="store-name">${storeName}</h1>
            <p class="subtitle">${subtitleText}</p>
            
            <div class="qr-box">
              <img class="qr-img" src="${qrCodeUrl}" alt="QR Code Cardápio" />
              <img class="qr-logo" src="${APP_IMAGES.logo}" alt="Logo" />
            </div>

            <div class="steps">
              <div><strong>1.</strong> Abra a câmera do seu celular</div>
              <div><strong>2.</strong> Aponte para este QR Code</div>
              <div><strong>3.</strong> Veja nosso cardápio e faça seu pedido!</div>
            </div>

            <div class="url-text">${targetUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const whatsappMessage = mode === 'mesa'
    ? `Olá! Faça seu pedido na Mesa ${selectedTable} pelo nosso cardápio digital:\n${targetUrl}`
    : `Olá! Confira o cardápio do ${storeName} e faça seu pedido online com entrega rápida:\n${targetUrl}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353535] flex items-center justify-between bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center border border-[#ff5722]/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-base text-white flex items-center gap-1.5">
                <span>QR Code do Cardápio</span>
                <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] border border-[#ff5722]/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                  Com Logo Oficial
                </span>
              </h3>
              <p className="text-[11px] text-[#b4b5b5]">
                Aponte a câmera do celular para abrir o cardápio digital diretamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#b4b5b5] hover:text-white p-2 rounded-xl hover:bg-[#333] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Selector de Modo: Cardápio Geral vs Mesa */}
          <div className="bg-[#141414] p-1.5 rounded-xl border border-[#353535] flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode('geral')}
              className={`flex-1 py-2 px-3 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                mode === 'geral'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#b4b5b5] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Cardápio Geral (Balcão & Delivery)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('mesa')}
              className={`flex-1 py-2 px-3 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                mode === 'mesa'
                  ? 'bg-[#ff5722] text-white shadow-md'
                  : 'text-[#b4b5b5] hover:text-white hover:bg-[#202020]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Mesa do Salão</span>
            </button>
          </div>

          {/* Seletor de Mesa caso esteja no modo mesa */}
          {mode === 'mesa' && (
            <div className="bg-[#242323] p-3 rounded-xl border border-[#383838] flex items-center justify-between gap-3 animate-in fade-in">
              <span className="text-white font-bold text-xs">
                Selecione o número da Mesa:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedTable(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                      selectedTable === num
                        ? 'bg-[#ff5722] text-white ring-2 ring-white/20'
                        : 'bg-[#181818] text-[#b4b5b5] hover:text-white border border-[#353535]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR Code Preview Card */}
          <div className="bg-[#141414] border border-[#353535] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center group">
              <img
                src={qrCodeUrl}
                alt="QR Code do Cardápio Digital"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
              />

              {/* Logo Centralizada no QR Code */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white p-1 shadow-2xl border-2 border-[#ff5722] flex items-center justify-center overflow-hidden">
                  <img
                    src={APP_IMAGES.logo}
                    alt={storeName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="font-['Montserrat'] font-black text-sm text-white block">
                {mode === 'mesa' ? `QR Code da Mesa ${selectedTable}` : 'QR Code Oficial do Cardápio'}
              </span>
              <p className="text-[11px] text-[#b4b5b5]">
                Baixe a imagem com o logo embutido ou imprima a plaquinha oficial!
              </p>
            </div>

            {/* Ações de Impressão e Download */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={handlePrintCard}
                className="w-full bg-[#ff5722] hover:bg-[#ff3d00] text-white py-2.5 px-3 rounded-xl font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Imprimir plaquinha de mesa ou expositor de balcão com logo"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Placa</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={isDownloading}
                className="w-full bg-[#262626] hover:bg-[#303030] border border-[#404040] text-white py-2.5 px-3 rounded-xl font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                title="Baixar imagem em PNG com o logo centralizado"
              >
                <Download className="w-4 h-4 text-[#ff8a65]" />
                <span>{isDownloading ? 'Gerando Logo...' : 'Baixar Imagem c/ Logo'}</span>
              </button>
            </div>
          </div>

          {/* Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#b4b5b5] font-semibold">
                Link direto que o QR Code abre:
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sem login / Acesso direto
              </span>
            </div>

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
                    : 'bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Redes Sociais e Teste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-['Montserrat'] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Compartilhar no WhatsApp</span>
            </a>

            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#202020] hover:bg-[#2a2a2f] border border-[#383838] text-[#e5e2e1] font-['Montserrat'] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs text-center"
            >
              <ExternalLink className="w-4 h-4 text-[#ff8a65]" />
              <span>Testar no Navegador</span>
            </a>
          </div>

          {/* Dicas de Uso */}
          <div className="p-3 bg-[#151515] border border-[#2a2a2a] rounded-xl space-y-1.5 text-[11px] text-[#8e8f8f]">
            <p className="text-white font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#ff5722]" />
              Dica Pro:
            </p>
            <p>• Ao clicar em <strong>"Baixar Imagem c/ Logo"</strong>, o sistema junta automaticamente o QR Code com o logo oficial da sua hamburgueria em um arquivo PNG perfeito para adesivos e panfletos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
