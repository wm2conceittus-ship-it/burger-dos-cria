import { DayKey, DaySchedule, StoreSettings, WeeklySchedule } from '../types';

export const DAYS_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_METADATA: Record<
  DayKey,
  { label: string; short: string; dayIndex: number }
> = {
  sunday: { label: 'Domingo', short: 'Dom', dayIndex: 0 },
  monday: { label: 'Segunda-feira', short: 'Seg', dayIndex: 1 },
  tuesday: { label: 'Terça-feira', short: 'Ter', dayIndex: 2 },
  wednesday: { label: 'Quarta-feira', short: 'Qua', dayIndex: 3 },
  thursday: { label: 'Quinta-feira', short: 'Qui', dayIndex: 4 },
  friday: { label: 'Sexta-feira', short: 'Sex', dayIndex: 5 },
  saturday: { label: 'Sábado', short: 'Sáb', dayIndex: 6 },
};

export const INDEX_TO_DAY_KEY: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { isOpen: false, openTime: '18:00', closeTime: '23:30' },
  tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
  wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
  thursday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
  friday: { isOpen: true, openTime: '18:00', closeTime: '00:30' },
  saturday: { isOpen: true, openTime: '18:00', closeTime: '00:30' },
  sunday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
};

function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().toLowerCase().replace('h', ':');
  const parts = normalized.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export interface StoreOperatingStatus {
  isOpen: boolean;
  isClosed: boolean;
  mode: 'auto' | 'manual';
  isManualOverride: boolean;
  currentDayKey: DayKey;
  currentDayLabel: string;
  todaySchedule: DaySchedule;
  reason: 'manual_closed' | 'scheduled_day_off' | 'scheduled_time_closed' | 'open';
  statusText: string;
  statusSubtext: string;
  nextOpeningText?: string;
  closingTimeText?: string;
  weeklySchedule: WeeklySchedule;
}

/**
 * Retorna a grade semanal garantindo que todos os 7 dias possuam valores válidos.
 */
export function getNormalizedWeeklySchedule(
  schedule?: Partial<WeeklySchedule> | null
): WeeklySchedule {
  if (!schedule) return { ...DEFAULT_WEEKLY_SCHEDULE };
  return {
    monday: schedule.monday || DEFAULT_WEEKLY_SCHEDULE.monday,
    tuesday: schedule.tuesday || DEFAULT_WEEKLY_SCHEDULE.tuesday,
    wednesday: schedule.wednesday || DEFAULT_WEEKLY_SCHEDULE.wednesday,
    thursday: schedule.thursday || DEFAULT_WEEKLY_SCHEDULE.thursday,
    friday: schedule.friday || DEFAULT_WEEKLY_SCHEDULE.friday,
    saturday: schedule.saturday || DEFAULT_WEEKLY_SCHEDULE.saturday,
    sunday: schedule.sunday || DEFAULT_WEEKLY_SCHEDULE.sunday,
  };
}

/**
 * Avalia se a hamburgueria está aberta no momento presente de acordo com a grade semanal e configurações.
 */
export function getStoreOperatingStatus(
  settings?: StoreSettings | null,
  now: Date = new Date()
): StoreOperatingStatus {
  const schedule = getNormalizedWeeklySchedule(settings?.weeklySchedule);
  const mode = settings?.scheduleMode || 'auto';

  // Se o gestor desligou manualmente a chave de abertura (emergência ou pausa temporária)
  // mesmo que o modo seja manual ou auto, o toggle isOpen serve como trava mestra
  const isManuallyClosed = settings?.isOpen === false;

  const currentDayIndex = now.getDay(); // 0 = Domingo, 1 = Segunda ...
  const currentDayKey = INDEX_TO_DAY_KEY[currentDayIndex];
  const currentDayLabel = DAY_METADATA[currentDayKey].label;
  const todaySchedule = schedule[currentDayKey];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Verifica se o turno de ontem era estendido após a meia-noite (overnight)
  const prevDayIndex = (currentDayIndex + 6) % 7;
  const prevDayKey = INDEX_TO_DAY_KEY[prevDayIndex];
  const prevSchedule = schedule[prevDayKey];

  let isOpenBySchedule = false;
  let activeShiftCloseTime = '';

  if (prevSchedule.isOpen) {
    const prevOpenMin = timeStringToMinutes(prevSchedule.openTime);
    const prevCloseMin = timeStringToMinutes(prevSchedule.closeTime);

    // Se o turno de ontem ultrapassa a meia-noite (ex: 18:00 até 02:00)
    if (prevCloseMin < prevOpenMin && nowMinutes < prevCloseMin) {
      isOpenBySchedule = true;
      activeShiftCloseTime = prevSchedule.closeTime;
    }
  }

  // Se não está no turno da madrugada de ontem, verifica o dia de hoje
  if (!isOpenBySchedule && todaySchedule.isOpen) {
    const openMin = timeStringToMinutes(todaySchedule.openTime);
    const closeMin = timeStringToMinutes(todaySchedule.closeTime);

    if (closeMin < openMin) {
      // Turno que vira a noite (ex: 18:00 até 01:00)
      if (nowMinutes >= openMin) {
        isOpenBySchedule = true;
        activeShiftCloseTime = todaySchedule.closeTime;
      }
    } else {
      // Turno dentro do mesmo dia (ex: 18:00 até 23:30)
      if (nowMinutes >= openMin && nowMinutes <= closeMin) {
        isOpenBySchedule = true;
        activeShiftCloseTime = todaySchedule.closeTime;
      }
    }
  }

  // Próxima abertura calculada caso esteja fechado
  let nextOpeningText = '';
  if (!isOpenBySchedule) {
    // 1. Verifica se abre mais tarde hoje
    if (todaySchedule.isOpen) {
      const openMin = timeStringToMinutes(todaySchedule.openTime);
      if (nowMinutes < openMin) {
        nextOpeningText = `Hoje às ${todaySchedule.openTime}`;
      }
    }

    // 2. Se não abre mais tarde hoje, procura nos próximos dias
    if (!nextOpeningText) {
      for (let i = 1; i <= 7; i++) {
        const nextIdx = (currentDayIndex + i) % 7;
        const nextKey = INDEX_TO_DAY_KEY[nextIdx];
        const nextSched = schedule[nextKey];

        if (nextSched.isOpen) {
          if (i === 1) {
            nextOpeningText = `Amanhã (${DAY_METADATA[nextKey].short}) às ${nextSched.openTime}`;
          } else {
            nextOpeningText = `${DAY_METADATA[nextKey].label} às ${nextSched.openTime}`;
          }
          break;
        }
      }
    }
  }

  // Lógica final considerando modo automático vs manual
  let effectiveIsOpen = false;
  let reason: StoreOperatingStatus['reason'] = 'open';
  let statusText = 'Hamburgueria Aberta';
  let statusSubtext = activeShiftCloseTime
    ? `Fechamento previsto às ${activeShiftCloseTime}`
    : 'Aceitando pedidos a todo vapor!';

  if (mode === 'manual') {
    effectiveIsOpen = !isManuallyClosed;
    if (!effectiveIsOpen) {
      reason = 'manual_closed';
      statusText = 'Hamburgueria Fechada no Momento';
      statusSubtext = 'Pausada temporariamente pela administração.';
    }
  } else {
    // Modo automático:
    // Se o gestor deu shutdown manual forçado, respeita
    if (isManuallyClosed) {
      effectiveIsOpen = false;
      reason = 'manual_closed';
      statusText = 'Hamburgueria Fechada Temporariamente';
      statusSubtext = 'Pausada manualmente pelo gestor da cozinha.';
    } else if (isOpenBySchedule) {
      effectiveIsOpen = true;
      reason = 'open';
      statusText = 'Hamburgueria Aberta';
      statusSubtext = activeShiftCloseTime
        ? `Aberto agora • Fecha às ${activeShiftCloseTime}`
        : 'Aberto agora!';
    } else {
      effectiveIsOpen = false;
      if (!todaySchedule.isOpen) {
        reason = 'scheduled_day_off';
        statusText = 'Hamburgueria Fechada Hoje';
        statusSubtext = nextOpeningText
          ? `Folga semanal hoje • Próxima abertura: ${nextOpeningText}`
          : 'Fora do horário de expediente.';
      } else {
        reason = 'scheduled_time_closed';
        statusText = 'Hamburgueria Fechada no Momento';
        statusSubtext = nextOpeningText
          ? `Próxima abertura: ${nextOpeningText}`
          : `Horário de hoje: ${todaySchedule.openTime} às ${todaySchedule.closeTime}`;
      }
    }
  }

  return {
    isOpen: effectiveIsOpen,
    isClosed: !effectiveIsOpen,
    mode,
    isManualOverride: isManuallyClosed && isOpenBySchedule,
    currentDayKey,
    currentDayLabel,
    todaySchedule,
    reason,
    statusText,
    statusSubtext,
    nextOpeningText,
    closingTimeText: activeShiftCloseTime,
    weeklySchedule: schedule,
  };
}

/**
 * Gera um texto resumido descritivo da grade semanal
 */
export function generateScheduleSummaryText(schedule: WeeklySchedule): string {
  const openDays = DAYS_ORDER.filter(day => schedule[day].isOpen);
  if (openDays.length === 0) return 'Temporariamente fechado todos os dias';
  if (openDays.length === 7) {
    const first = schedule.monday;
    const allSameTime = DAYS_ORDER.every(
      d => schedule[d].openTime === first.openTime && schedule[d].closeTime === first.closeTime
    );
    if (allSameTime) {
      return `Todos os dias, ${first.openTime} às ${first.closeTime}`;
    }
  }

  // Verifica se Terça a Domingo é padrão
  const tuesdayToSunday = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayKey[];
  const segFechada = !schedule.monday.isOpen;
  const othersOpen = tuesdayToSunday.every(d => schedule[d].isOpen);

  if (segFechada && othersOpen) {
    const sample = schedule.tuesday;
    return `Terça a Domingo, das ${sample.openTime} às ${sample.closeTime} (Segunda: Fechado)`;
  }

  const parts = openDays.map(d => `${DAY_METADATA[d].short}: ${schedule[d].openTime}-${schedule[d].closeTime}`);
  return parts.join(' | ');
}
