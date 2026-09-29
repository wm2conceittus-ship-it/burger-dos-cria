import React from 'react';
import { Screen } from '../types';
import { Utensils, ShoppingBag, Bike, User, ChefHat } from 'lucide-react';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
  hasActiveOrder?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  hasActiveOrder = true,
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
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 relative ${
            currentScreen === 'cart'
              ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Carrinho</span>
          {cartCount > 0 && (
            <span className="absolute 0 top-0.5 right-2 bg-[#ff5722] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full font-['Montserrat'] shadow-sm">
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

        <button
          onClick={() => onNavigate('kitchen')}
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-150 active:scale-90 ${
            currentScreen === 'kitchen'
              ? 'text-[#ff5722] bg-[#ff5722]/10 font-bold'
              : 'text-[#b4b5b5] hover:text-[#ffb5a0]'
          }`}
          title="Painel da Cozinha"
        >
          <ChefHat className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Cozinha</span>
        </button>

        <button
          onClick={() => onNavigate('menu')}
          className="flex flex-col items-center justify-center px-3 py-1 rounded-md text-[#b4b5b5] hover:text-[#ffb5a0] transition-all duration-150 active:scale-90"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-['Montserrat']">Perfil</span>
        </button>
      </div>
    </nav>
  );
};
