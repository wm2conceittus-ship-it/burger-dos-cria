import React from 'react';
import { Screen } from '../types';
import { Utensils, SlidersHorizontal, ShoppingBag, Bike, ChefHat } from 'lucide-react';

interface ScreenSwitcherBannerProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
}

export const ScreenSwitcherBanner: React.FC<ScreenSwitcherBannerProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
}) => {
  const screens = [
    { id: 'menu' as Screen, num: '1', label: 'Cardápio', icon: Utensils },
    { id: 'product_detail' as Screen, num: '2', label: 'Customização', icon: SlidersHorizontal },
    { id: 'cart' as Screen, num: '3', label: `Carrinho (${cartCount})`, icon: ShoppingBag },
    { id: 'tracking' as Screen, num: '4', label: 'Rastreio', icon: Bike },
    { id: 'kitchen' as Screen, num: '5', label: 'Gestor Cozinha', icon: ChefHat },
  ];

  return (
    <div className="bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#353535]/60 px-3 py-1.5 overflow-x-auto hide-scrollbar z-50 sticky top-0 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 text-[11px] font-['Montserrat']">
        <span className="text-[#8e8f8f] font-extrabold text-[10px] uppercase tracking-wider hidden md:flex items-center gap-1.5 mr-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5722]" />
          Telas do App:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 w-full md:w-auto">
          {screens.map(s => {
            const isActive = currentScreen === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-semibold text-xs active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff5722] to-[#ff3d00] text-white shadow-[0_2px_10px_rgba(255,87,34,0.35)] ring-1 ring-[#ff5722]'
                    : 'bg-[#181818] text-[#b4b5b5] hover:text-white hover:bg-[#252525] border border-[#353535]/70'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#2a2a2a] text-[#ff8a65]'
                }`}>
                  {s.num}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
