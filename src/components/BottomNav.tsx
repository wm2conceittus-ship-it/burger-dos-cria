import React from 'react';
import { Screen } from '../types';
import { Utensils, ShoppingBag, Bike, User, ChefHat, Lock } from 'lucide-react';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
  hasActiveOrder?: boolean;
  showManagerIcon?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  hasActiveOrder = true,
  showManagerIcon = true,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-[#20201f]/95 backdrop-blur-xl border-t border-[#353535]/50 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
      <div className="max-w-lg mx-auto flex justify-around items-center px-4 py-2.5">
        <button
          onClick={() => onNavigate('menu')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 ${
            currentScreen === 'menu'
              ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Menu</span>
        </button>

        <button
          onClick={() => onNavigate('cart')}
          className={`flex flex-col items-center justify-center px-2 py-0.5 !rounded-full rounded-full transition-all duration-150 active:scale-90 relative ${
            currentScreen === 'cart'
              ? 'text-[#ff5722] font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
          style={{ borderRadius: '9999px' }}
        >
          <div
            className={`w-7.5 h-7.5 !rounded-full rounded-full flex items-center justify-center transition-all ${
              currentScreen === 'cart'
                ? 'bg-[#ff5722] text-white shadow-md'
                : 'bg-[#2a2a29] text-[#ff8a65] border border-[#ff5722]/25'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-['Montserrat'] mt-0.5">Carrinho</span>
          {cartCount > 0 && (
            <span
              className="absolute top-0 right-1 bg-[#ff5722] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center !rounded-full rounded-full font-['Montserrat'] shadow-sm border border-[#20201f]"
              style={{ borderRadius: '9999px' }}
            >
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('tracking')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 relative ${
            currentScreen === 'tracking'
              ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
        >
          <Bike className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Pedidos</span>
          {hasActiveOrder && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-[#ff5722] animate-ping" />
          )}
        </button>

        {showManagerIcon && (
          <button
            onClick={() => onNavigate('kitchen')}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 relative ${
              currentScreen === 'kitchen'
                ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
                : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
            }`}
            title="Painel do Gestor (Restrito com PIN)"
          >
            <div className="relative">
              <ChefHat className="w-5 h-5 mb-0.5" />
              <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-[#1c1b1b] border border-[#ff5722] rounded-full flex items-center justify-center text-[#ff5722]">
                <Lock className="w-1.5 h-1.5" />
              </span>
            </div>
            <span className="text-[11px] font-['Montserrat']">Gestor</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 ${
            currentScreen === 'profile'
              ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Perfil</span>
        </button>
      </div>
    </nav>
  );
};
