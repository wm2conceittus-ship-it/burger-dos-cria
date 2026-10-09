import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, Delete, KeyRound, AlertCircle, ChefHat } from 'lucide-react';

interface ManagerPinModalProps {
  correctPin?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  correctPin = '123456',
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);

  const rawPin = correctPin?.trim() || '123456';
  // Se houver PIN antigo de 4 dígitos (ex: 1234), migra automaticamente para 123456 ou completa com 6 dígitos
  const effectivePin = rawPin.length === 6 ? rawPin : rawPin === '1234' ? '123456' : rawPin.padEnd(6, '0');

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === effectivePin) {
      onSuccess();
    } else {
      setIsShaking(true);
      setError('PIN incorreto. Acesso restrito ao gestor.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 700);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, effectivePin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-[#1c1b1b] border border-[#ff5722]/40 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative overflow-hidden transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Glowing flame accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-transparent via-[#ff5722] to-transparent shadow-[0_0_20px_#ff5722]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#b4b5b5] hover:text-white p-2 rounded-full hover:bg-[#353535] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722] shadow-[0_0_25px_rgba(255,87,34,0.3)] mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-[#ff8a65] mb-1 font-['Montserrat']">
            <ChefHat className="w-4 h-4" /> Acesso Administrativo
          </div>
          <h2 className="text-xl font-bold font-['Montserrat'] text-white">
            Gestor de Pedidos & Cozinha
          </h2>
          <p className="text-xs text-[#b4b5b5] mt-1.5 px-4 leading-relaxed">
            Painel exclusivo para a equipe da hamburgueria. Digite o PIN de 6 dígitos para continuar.
          </p>
        </div>

        {/* PIN Indicators (6 dígitos) */}
        <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-4">
          {[0, 1, 2, 3, 4, 5].map(index => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-9 h-12 sm:w-10 sm:h-13 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold font-['Montserrat'] transition-all duration-200 ${
                  hasDigit
                    ? 'border-[#ff5722] bg-[#ff5722]/20 text-[#ff5722] shadow-[0_0_15px_rgba(255,87,34,0.4)] scale-105'
                    : 'border-[#353535] bg-[#252525] text-transparent'
                }`}
              >
                {hasDigit ? '●' : '—'}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg mb-3 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-13 rounded-xl bg-[#252525] hover:bg-[#ff5722] hover:text-white border border-[#353535] text-white font-['Montserrat'] font-bold text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-xl bg-[#202020] hover:bg-[#303030] text-[#b4b5b5] hover:text-white border border-[#353535] text-xs font-bold uppercase transition-all active:scale-95 flex items-center justify-center font-['Montserrat']"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-xl bg-[#252525] hover:bg-[#ff5722] hover:text-white border border-[#353535] text-white font-['Montserrat'] font-bold text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-xl bg-[#202020] hover:bg-red-500/20 text-[#b4b5b5] hover:text-red-400 border border-[#353535] transition-all active:scale-95 flex items-center justify-center"
            title="Apagar"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Default Pin Hint */}
        <div className="mt-5 pt-3 border-t border-[#353535]/60 text-center">
          <p className="text-[11px] text-[#8e8e8e] flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#ff8a65]" />
            <span>PIN padrão inicial: <strong className="text-white">123456</strong> (altere nas Configurações)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
