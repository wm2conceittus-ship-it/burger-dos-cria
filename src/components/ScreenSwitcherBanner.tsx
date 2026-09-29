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
    { id: 'menu' as Screen, label: '1. Cardápio', icon: Utensils },
    { id: 'product_detail' as Screen, label: '2. Customização', icon: SlidersHorizontal },
    { id: 'cart' as Screen, label: `3. Carrinho (${cartCount})`, icon: ShoppingBag },
    { id: 'tracking' as Screen, label: '4. Rastreio', icon: Bike },
    { id: 'kitchen' as Screen, label: '5. Gestor Cozinha', icon: ChefHat },
  ];

  return (
    <div className="bg-[#0e0e0e] border-b border-[#353535]/60 px-3 py-1.5 overflow-x-auto hide-scrollbar z-50 sticky top-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 text-[11px] font-['Montserrat']">
        <span className="text-[#b4b5b5] font-semibold text-[10px] uppercase tracking-wider hidden md:inline mr-2">
          Telas do App:
        </span>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          {screens.map(s => {
            const isActive = currentScreen === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md whitespace-nowrap transition-all font-semibold ${
                  isActive
                    ? 'bg-[#ff5722] text-white shadow-[0_0_12px_rgba(255,87,34,0.4)]'
                    : 'bg-[#1c1b1b] text-[#b4b5b5] hover:text-white hover:bg-[#2a2a2a] border border-[#353535]/50'
                }`}
              >
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
