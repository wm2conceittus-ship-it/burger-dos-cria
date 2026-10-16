import React, { useState } from 'react';
import { DayKey, DaySchedule, StoreSettings, WeeklySchedule } from '../types';
import {
  DAYS_ORDER,
  DAY_METADATA,
  DEFAULT_WEEKLY_SCHEDULE,
  generateScheduleSummaryText,
  getNormalizedWeeklySchedule,
  getStoreOperatingStatus,
  INDEX_TO_DAY_KEY,
} from '../utils/scheduleUtils';
import {
  Clock,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  Power,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Moon,
  Info,
} from 'lucide-react';

interface WeeklyScheduleManagerProps {
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
  showToast?: (message: string) => void;
}

export const WeeklyScheduleManager: React.FC<WeeklyScheduleManagerProps> = ({
  storeSettings,
  onUpdateStoreSettings,
  showToast,
}) => {
  const schedule = getNormalizedWeeklySchedule(storeSettings.weeklySchedule);
  const mode = storeSettings.scheduleMode || 'auto';
  const operatingStatus = getStoreOperatingStatus(storeSettings);

  const currentDayIndex = new Date().getDay();
  const todayKey = INDEX_TO_DAY_KEY[currentDayIndex];

  const updateSchedule = (newSchedule: WeeklySchedule, newMode?: 'auto' | 'manual') => {
    const summary = generateScheduleSummaryText(newSchedule);
    onUpdateStoreSettings({
      ...storeSettings,
      weeklySchedule: newSchedule,
      scheduleMode: newMode !== undefined ? newMode : mode,
      openingHours: summary,
    });
  };

  const handleToggleDay = (dayKey: DayKey) => {
    const current = schedule[dayKey];
    const updated: WeeklySchedule = {
      ...schedule,
      [dayKey]: {
        ...current,
        isOpen: !current.isOpen,
      },
    };
    updateSchedule(updated);
    if (showToast) {
      showToast(
        `${DAY_METADATA[dayKey].label} marcado como ${!current.isOpen ? 'Aberto' : 'Fechado/Folga'}`
      );
    }
  };

  const handleTimeChange = (
    dayKey: DayKey,
    field: 'openTime' | 'closeTime',
    val: string
  ) => {
    const current = schedule[dayKey];
    const updated: WeeklySchedule = {
      ...schedule,
      [dayKey]: {
        ...current,
        [field]: val,
      },
    };
    updateSchedule(updated);
  };

  const handleCopyDayToAll = (fromDayKey: DayKey) => {
    const source = schedule[fromDayKey];
    const updated: WeeklySchedule = { ...schedule };
    DAYS_ORDER.forEach(d => {
      updated[d] = {
        isOpen: source.isOpen,
        openTime: source.openTime,
        closeTime: source.closeTime,
      };
    });
    updateSchedule(updated);
    if (showToast) {
      showToast(
        `Horário de ${DAY_METADATA[fromDayKey].label} replicado para todos os dias!`
      );
    }
  };

  const handleApplyPreset = (presetType: 'burger_standard' | 'all_days' | 'extended_weekend') => {
    let preset: WeeklySchedule;
    if (presetType === 'burger_standard') {
      preset = {
        monday: { isOpen: false, openTime: '18:00', closeTime: '23:30' },
        tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        thursday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        friday: { isOpen: true, openTime: '18:00', closeTime: '00:30' },
        saturday: { isOpen: true, openTime: '18:00', closeTime: '00:30' },
        sunday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
      };
    } else if (presetType === 'all_days') {
      preset = {
        monday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        thursday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
        friday: { isOpen: true, openTime: '18:00', closeTime: '00:00' },
        saturday: { isOpen: true, openTime: '18:00', closeTime: '00:00' },
        sunday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
      };
    } else {
      // Almoço e Noite
      preset = {
        monday: { isOpen: false, openTime: '11:30', closeTime: '23:30' },
        tuesday: { isOpen: true, openTime: '11:30', closeTime: '23:30' },
        wednesday: { isOpen: true, openTime: '11:30', closeTime: '23:30' },
        thursday: { isOpen: true, openTime: '11:30', closeTime: '23:30' },
        friday: { isOpen: true, openTime: '11:30', closeTime: '01:00' },
        saturday: { isOpen: true, openTime: '11:30', closeTime: '01:00' },
        sunday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
      };
    }

    updateSchedule(preset);
    if (showToast) {
      showToast('Modelo de horários aplicado com sucesso!');
    }
  };

  const handleToggleMode = (newMode: 'auto' | 'manual') => {
    onUpdateStoreSettings({
      ...storeSettings,
      scheduleMode: newMode,
    });
    if (showToast) {
      showToast(
        newMode === 'auto'
          ? 'Modo Automático ativado! O cardápio abrirá/fechará pelos horários.'
          : 'Modo Manual ativado! A loja respeitará apenas o botão Liga/Desliga.'
      );
    }
  };

  const handleToggleEmergencyClosure = () => {
    const willBeOpen = !storeSettings.isOpen;
    onUpdateStoreSettings({
      ...storeSettings,
      isOpen: willBeOpen,
    });
    if (showToast) {
      showToast(
        willBeOpen
          ? 'Loja reaberta com sucesso!'
          : 'Loja pausada/fechada manualmente com trava de emergência!'
      );
    }
  };

  const summaryText = generateScheduleSummaryText(schedule);

  return (
    <div className="bg-[#1c1b1b] p-4 sm:p-5 rounded-xl border border-[#353535] space-y-4 shadow-md">
      {/* Header com Ícone e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#353535]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
              Horário de Funcionamento Semanal
              <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] px-2 py-0.5 rounded-full font-bold">
                7 Dias
              </span>
            </h4>
            <p className="text-[11px] text-[#b4b5b5]">
              Defina o expediente para cada dia da semana. O cardápio do cliente avisa se a loja estiver fechada.
            </p>
          </div>
        </div>

        {/* Live Operating Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-['Montserrat'] flex items-center gap-2 ${
              operatingStatus.isOpen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                operatingStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{operatingStatus.isOpen ? 'LOJA ABERTA AGORA' : 'LOJA FECHADA AGORA'}</span>
          </div>
        </div>
      </div>

      {/* Modo de Operação (Automático vs Manual) & Trava de Emergência */}
      <div className="bg-[#242323] p-3.5 rounded-lg border border-[#353535] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-['Montserrat']">
              Controle de Abertura:
            </span>
            <div className="inline-flex rounded-md p-0.5 bg-[#121212] border border-[#353535]">
              <button
                type="button"
                onClick={() => handleToggleMode('auto')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                  mode === 'auto'
                    ? 'bg-[#ff5722] text-white shadow-sm'
                    : 'text-[#b4b5b5] hover:text-white'
                }`}
              >
                Automático por Horário
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('manual')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                  mode === 'manual'
                    ? 'bg-[#ff5722] text-white shadow-sm'
                    : 'text-[#b4b5b5] hover:text-white'
                }`}
              >
                Manual (Chave Única)
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#b4b5b5]">
            {mode === 'auto'
              ? '✅ No modo automático, o cardápio abre e fecha pontualmente conforme a grade semanal abaixo.'
              : '⚠️ No modo manual, a loja permanece aberta ou fechada conforme o botão de trava.'}
          </p>
        </div>

        {/* Trava Rápida / Emergência */}
        <button
          type="button"
          onClick={handleToggleEmergencyClosure}
          className={`px-3.5 py-2 rounded-lg font-['Montserrat'] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
            storeSettings.isOpen
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>
            {storeSettings.isOpen
              ? 'Pausar Atendimento (Fechar Agora)'
              : 'Forçar Abertura Imediata'}
          </span>
        </button>
      </div>

      {/* Modelos Prontos (Presets) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] text-[#b4b5b5] font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#ff8a65]" /> Preencher modelo:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset('burger_standard')}
          className="text-[11px] px-2.5 py-1 rounded bg-[#20201f] border border-[#353535] hover:border-[#ff5722] text-[#e5e2e1] hover:text-white transition-colors"
        >
          ⚡ Padrão Burger (Ter a Dom 18h-23h30 | Seg Fechado)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('all_days')}
          className="text-[11px] px-2.5 py-1 rounded bg-[#20201f] border border-[#353535] hover:border-[#ff5722] text-[#e5e2e1] hover:text-white transition-colors"
        >
          ⚡ Todos os Dias (18h-23h30)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('extended_weekend')}
          className="text-[11px] px-2.5 py-1 rounded bg-[#20201f] border border-[#353535] hover:border-[#ff5722] text-[#e5e2e1] hover:text-white transition-colors"
        >
          ⚡ Almoço e Jantar
        </button>
      </div>

      {/* Tabela Interativa dos 7 Dias */}
      <div className="space-y-2 pt-1">
        {DAYS_ORDER.map(dayKey => {
          const item = schedule[dayKey];
          const meta = DAY_METADATA[dayKey];
          const isToday = dayKey === todayKey;

          // Verifica se o fechamento é na madrugada (overnight)
          const isOvernight =
            item.isOpen &&
            item.openTime &&
            item.closeTime &&
            item.closeTime < item.openTime;

          return (
            <div
              key={dayKey}
              className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isToday
                  ? 'bg-[#262422] border-[#ff5722]/50 shadow-sm'
                  : 'bg-[#20201f] border-[#353535]/60 hover:border-[#454545]'
              }`}
            >
              {/* Dia da Semana & Status */}
              <div className="flex items-center gap-2.5 min-w-[150px]">
                <button
                  type="button"
                  onClick={() => handleToggleDay(dayKey)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-colors ${
                    item.isOpen
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-[#303030] text-[#8e8f8f] hover:bg-[#383838]'
                  }`}
                  title={item.isOpen ? 'Clique para marcar como Fechado' : 'Clique para marcar como Aberto'}
                >
                  {item.isOpen ? <Check className="w-4 h-4" /> : '✕'}
                </button>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-white' : 'text-[#e5e2e1]'
                      }`}
                    >
                      {meta.label}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-extrabold uppercase bg-[#ff5722] text-white px-1.5 py-0.2 rounded tracking-wide">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8e8f8f]">
                    {item.isOpen ? 'Aberto' : 'Fechado (Folga)'}
                  </span>
                </div>
              </div>

              {/* Horários (Abertura e Fechamento) */}
              {item.isOpen ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#b4b5b5] font-semibold">Abertura:</span>
                    <input
                      type="time"
                      value={item.openTime || '18:00'}
                      onChange={e => handleTimeChange(dayKey, 'openTime', e.target.value)}
                      className="bg-[#121212] border border-[#353535] rounded-md px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>

                  <span className="text-[#8e8f8f] text-xs">às</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#b4b5b5] font-semibold">Fechamento:</span>
                    <input
                      type="time"
                      value={item.closeTime || '23:30'}
                      onChange={e => handleTimeChange(dayKey, 'closeTime', e.target.value)}
                      className="bg-[#121212] border border-[#353535] rounded-md px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#ff5722]"
                    />
                  </div>

                  {isOvernight && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Moon className="w-2.5 h-2.5" /> Fecha na madrugada
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyDayToAll(dayKey)}
                    className="text-[10px] text-[#ffb5a0] hover:text-white px-2 py-1 rounded bg-[#2a2a2a] hover:bg-[#353535] border border-[#3d3d3d] flex items-center gap-1 transition-colors ml-auto sm:ml-0"
                    title="Copiar estes horários para todos os outros 6 dias da semana"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copiar p/ todos</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-[11px] text-[#8e8f8f]">
                  <span>Sem atendimento neste dia (Folga da hamburgueria).</span>
                  <button
                    type="button"
                    onClick={() => handleToggleDay(dayKey)}
                    className="text-[10px] text-[#ff8a65] underline font-bold hover:text-white"
                  >
                    Abrir este dia
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo formatado exibido no cardápio */}
      <div className="bg-[#171717] p-3 rounded-lg border border-[#353535]/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#b4b5b5] uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#ff5722]" />
            Como os clientes visualizam no cardápio:
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
            Sincronizado no Firebase
          </span>
        </div>
        <p className="text-xs text-white font-medium pl-5">
          "{summaryText}"
        </p>
      </div>
    </div>
  );
};
