import React from 'react';
import { Screen } from '../types';
import { APP_IMAGES } from '../data/mockData';
import { ArrowLeft, MessageSquare, Heart } from 'lucide-react';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onOpenChat?: () => void;
  title?: string;
  showBack?: boolean;
  backTarget?: Screen;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenChat,
  title,
  showBack = false,
  backTarget = 'menu',
  isFavorite = false,
  onToggleFavorite,
  transparent = false,
}) => {
  if (transparent) {
    return (
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 pointer-events-none">
        <button
          onClick={() => onNavigate(backTarget)}
          className="pointer-events-auto bg-[#20201f]/80 backdrop-blur-md p-2.5 rounded-full text-[#ffb5a0] hover:bg-[#353535] active:scale-95 transition-all shadow-lg"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleFavorite}
          className="pointer-events-auto bg-[#20201f]/80 backdrop-blur-md p-2.5 rounded-full text-[#ffb5a0] hover:bg-[#353535] active:scale-95 transition-all shadow-lg"
          title="Favoritar"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#ff5722] text-[#ff5722]' : ''}`} />
        </button>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-6 bg-[#131313]/95 backdrop-blur-md border-b border-[#353535]/40 h-16">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => onNavigate(backTarget)}
            className="text-[#ffb5a0] hover:text-white p-1 rounded-full active:scale-95 transition-transform"
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <button 
          onClick={() => onNavigate('menu')}
          className="flex items-center gap-2 group text-left"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#ff5722]/40 shadow-sm flex-shrink-0">
            <img
              src={APP_IMAGES.logo}
              alt="Burger dos Crias Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          {title ? (
            <span className="font-['Montserrat'] font-bold text-sm md:text-base text-[#e5e2e1] truncate max-w-[180px] sm:max-w-xs">
              {title}
            </span>
          ) : (
            <div className="flex flex-col">
              <span className="font-['Montserrat'] font-extrabold text-sm tracking-tight text-white leading-tight">
                BURGER DOS CRIAS
              </span>
              <span className="text-[10px] text-[#ffb5a0] font-medium tracking-wide">
                O SABOR DO FOGO
              </span>
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onOpenChat}
          className="w-10 h-10 rounded-full bg-[#20201f] border border-[#353535] flex items-center justify-center text-[#ffb5a0] hover:text-white hover:border-[#ff5722]/50 active:scale-95 transition-all"
          title="Suporte / WhatsApp"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button 
          onClick={() => onNavigate('kitchen')}
          className="w-10 h-10 rounded-full overflow-hidden border border-[#353535] hover:border-[#ff5722] transition-colors"
          title="Perfil / Alternar para Cozinha"
        >
          <img
            src={APP_IMAGES.userAvatar}
            alt="Avatar do Usuário"
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
