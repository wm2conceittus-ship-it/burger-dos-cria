import React from 'react';
import { StoreSettings } from '../types';
import {
  DAYS_ORDER,
  DAY_METADATA,
  getStoreOperatingStatus,
  INDEX_TO_DAY_KEY,
} from '../utils/scheduleUtils';
import {
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Settings,
  Calendar,
} from 'lucide-react';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: StoreSettings;
  onOpenKitchen?: () => void;
  isManager?: boolean;
}

export const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  onOpenKitchen,
  isManager = false,
}) => {
  if (!isOpen) return null;

  const operatingStatus = getStoreOperatingStatus(storeSettings);
  const currentDayIndex = new Date().getDay();
  const todayKey = INDEX_TO_DAY_KEY[currentDayIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353535] flex items-center justify-between bg-[#242323]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-base text-white">
                Horário de Funcionamento
              </h3>
              <p className="text-xs text-[#b4b5b5]">
                {storeSettings?.storeName || 'Burger dos Crias'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1b1b] border border-[#353535] flex items-center justify-center text-[#b4b5b5] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Atual Card */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              operatingStatus.isOpen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {operatingStatus.isOpen ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                <span>{operatingStatus.statusText}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    operatingStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
              </div>
              <p className="text-xs text-[#b4b5b5] mt-0.5">
                {operatingStatus.statusSubtext}
              </p>
            </div>
          </div>

          {/* Lista dos 7 dias da semana */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff8a65] block mb-2 font-['Montserrat']">
              Programação Semanal
            </span>

            {DAYS_ORDER.map(dayKey => {
              const dayData = operatingStatus.weeklySchedule[dayKey];
              const meta = DAY_METADATA[dayKey];
              const isToday = dayKey === todayKey;

              return (
                <div
                  key={dayKey}
                  className={`flex items-center justify-between p-2.5 px-3 rounded-lg border transition-all ${
                    isToday
                      ? 'bg-[#ff5722]/10 border-[#ff5722]/50 shadow-sm'
                      : 'bg-[#20201f] border-[#353535]/60 hover:border-[#454545]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isToday ? 'text-white font-bold' : 'text-[#e5e2e1]'
                      }`}
                    >
                      {meta.label}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-extrabold uppercase bg-[#ff5722] text-white px-1.5 py-0.5 rounded tracking-wide">
                        Hoje
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    {dayData.isOpen ? (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">
                          {dayData.openTime}
                        </span>
                        <span className="text-[#8e8f8f]">às</span>
                        <span className="text-emerald-400 font-bold">
                          {dayData.closeTime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        Fechado (Folga)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Endereço & WhatsApp info */}
          <div className="bg-[#20201f] p-3 rounded-xl border border-[#353535] space-y-2 text-[#b4b5b5] text-[11px]">
            {storeSettings?.address && (
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                <span className="truncate">{storeSettings.address}</span>
              </div>
            )}
            {storeSettings?.whatsappSupport && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                <span>Atendimento WhatsApp: {storeSettings.whatsappSupport}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#8e8f8f] pt-1 border-t border-[#353535]/50">
              <Clock className="w-3.5 h-3.5 text-[#ff8a65] shrink-0" />
              <span>
                Você pode visualizar todo o cardápio e preparar sua sacola a qualquer hora!
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#353535] bg-[#242323] flex items-center justify-between gap-2">
          {isManager && onOpenKitchen ? (
            <button
              onClick={() => {
                onClose();
                onOpenKitchen();
              }}
              className="px-3 py-2 rounded-lg bg-[#303030] hover:bg-[#383838] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-[#ff5722]" />
              <span>Gerenciar Horários</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#ff5722] hover:bg-[#ff5722]/90 text-white font-['Montserrat'] font-bold text-xs shadow-md active:scale-95 transition-transform"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    </div>
  );
};
