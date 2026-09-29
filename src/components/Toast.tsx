import React from 'react';
import { Flame, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 pointer-events-auto">
      <div
        onClick={onClose}
        className="bg-[#20201f] text-white border border-[#ff5722]/50 px-4 py-2.5 rounded-full shadow-[0_4px_24px_rgba(255,87,34,0.4)] flex items-center gap-2.5 text-xs font-['Montserrat'] font-semibold cursor-pointer backdrop-blur-md"
      >
        {type === 'success' && <Flame className="w-4 h-4 text-[#ff5722] fill-[#ff5722]" />}
        {type === 'info' && <CheckCircle2 className="w-4 h-4 text-[#86cfff]" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-[#ffb4ab]" />}
        <span>{message}</span>
      </div>
    </div>
  );
};
