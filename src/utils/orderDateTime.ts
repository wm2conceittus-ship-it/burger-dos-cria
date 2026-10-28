/**
 * Utilitários robustos para extração e formatação padronizada da data e hora dos pedidos.
 * Suporta múltiplos formatos: Firestore Timestamp, string ISO, formato brasileiro (DD/MM/YYYY),
 * milissegundos numéricos, timestamp extraído do ID do pedido (ex: ord-1730123456789) e fallbacks seguros.
 */

export interface OrderDateTimeInput {
  orderDate?: string | null;
  createdAt?: string | number | { seconds?: number; _seconds?: number; toDate?: () => Date } | Date | null;
  id?: string | null;
  orderNumber?: string | number | null;
  timestamp?: number | string | { seconds?: number; _seconds?: number; toDate?: () => Date } | Date | null;
  date?: string | null;
  updatedAt?: string | number | null;
  timeAgo?: string | null;
  [key: string]: any;
}

interface ParsedDateTime {
  day: string;
  month: string;
  year: string;
  hours: string;
  minutes: string;
  dateObj?: Date;
}

/**
 * Analisa qualquer objeto de pedido e extrai dia, mês, ano, hora e minuto com máxima precisão.
 */
export function parseOrderDateTime(order?: OrderDateTimeInput | null): ParsedDateTime {
  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
  const defaultDay = String(now.getDate()).padStart(2, '0');
  const defaultHours = String(now.getHours()).padStart(2, '0');
  const defaultMinutes = String(now.getMinutes()).padStart(2, '0');

  if (!order) {
    return {
      day: defaultDay,
      month: defaultMonth,
      year: defaultYear,
      hours: defaultHours,
      minutes: defaultMinutes,
      dateObj: now,
    };
  }

  let extractedDateObj: Date | null = null;
  let explicitDay = '';
  let explicitMonth = '';
  let explicitYear = '';
  let explicitTime = '';

  // 1. Tenta extrair Date de createdAt quando for Firestore Timestamp ou Date nativo
  if (order.createdAt) {
    if (order.createdAt instanceof Date && !isNaN(order.createdAt.getTime())) {
      extractedDateObj = order.createdAt;
    } else if (typeof order.createdAt === 'object') {
      const tsObj = order.createdAt as any;
      if (typeof tsObj.toDate === 'function') {
        const d = tsObj.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) extractedDateObj = d;
      } else if (typeof tsObj.seconds === 'number') {
        extractedDateObj = new Date(tsObj.seconds * 1000);
      } else if (typeof tsObj._seconds === 'number') {
        extractedDateObj = new Date(tsObj._seconds * 1000);
      }
    } else if (typeof order.createdAt === 'number') {
      if (order.createdAt > 1000000000000) {
        extractedDateObj = new Date(order.createdAt);
      } else if (order.createdAt > 1000000000) {
        extractedDateObj = new Date(order.createdAt * 1000);
      }
    } else if (typeof order.createdAt === 'string') {
      const rawStr = order.createdAt.trim();
      // Formato ISO ou string completa de data
      if (rawStr.includes('T') || (rawStr.includes('-') && rawStr.length >= 10) || (rawStr.includes('/') && rawStr.length >= 10)) {
        const parsed = new Date(rawStr);
        if (!isNaN(parsed.getTime())) {
          extractedDateObj = parsed;
        }
      }
      // Tenta extrair horário no formato HH:mm ou HH:mm:ss
      const timeMatch = rawStr.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        explicitTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      }
    }
  }

  // 2. Tenta extrair a partir de order.orderDate (ex: "28/10/2026", "28/10", "2026-10-28")
  if (order.orderDate && typeof order.orderDate === 'string') {
    const rawDate = order.orderDate.trim();
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length >= 2) {
        explicitDay = parts[0].trim().padStart(2, '0');
        explicitMonth = parts[1].trim().padStart(2, '0');
        if (parts.length >= 3 && parts[2].trim()) {
          const yr = parts[2].trim();
          explicitYear = yr.length === 2 ? `20${yr}` : yr.slice(0, 4);
        }
      }
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length >= 3) {
        // YYYY-MM-DD
        explicitYear = parts[0].trim().slice(0, 4);
        explicitMonth = parts[1].trim().padStart(2, '0');
        explicitDay = parts[2].trim().slice(0, 2).padStart(2, '0');
      }
    }
  }

  // 3. Se ainda não tem data completa, tenta extrair timestamp numérico a partir do ID do pedido
  // (ex: "ord-1730123456789" ou "1730123456789")
  if (!extractedDateObj && (!explicitDay || !explicitYear) && order.id) {
    const digits = String(order.id).replace(/\D/g, '');
    if (digits.length >= 12) {
      const num = parseInt(digits.slice(0, 13), 10);
      if (!isNaN(num) && num > 1500000000000 && num < 2500000000000) {
        extractedDateObj = new Date(num);
      }
    }
  }

  // 4. Se encontrou um objeto Date válido, preenche o que estiver faltando
  if (extractedDateObj && !isNaN(extractedDateObj.getTime())) {
    if (!explicitDay) explicitDay = String(extractedDateObj.getDate()).padStart(2, '0');
    if (!explicitMonth) explicitMonth = String(extractedDateObj.getMonth() + 1).padStart(2, '0');
    if (!explicitYear) explicitYear = String(extractedDateObj.getFullYear());
    if (!explicitTime) {
      explicitTime = `${String(extractedDateObj.getHours()).padStart(2, '0')}:${String(extractedDateObj.getMinutes()).padStart(2, '0')}`;
    }
  }

  // 5. Fallbacks para garantir que nunca fique vazio
  const finalYear = explicitYear || defaultYear;
  const finalMonth = explicitMonth || defaultMonth;
  const finalDay = explicitDay || defaultDay;

  let finalHours = defaultHours;
  let finalMinutes = defaultMinutes;
  if (explicitTime && explicitTime.includes(':')) {
    const [h, m] = explicitTime.split(':');
    finalHours = h.padStart(2, '0');
    finalMinutes = m.padStart(2, '0');
  }

  const finalDateObj = extractedDateObj || new Date(Number(finalYear), Number(finalMonth) - 1, Number(finalDay), Number(finalHours), Number(finalMinutes));

  return {
    day: finalDay,
    month: finalMonth,
    year: finalYear,
    hours: finalHours,
    minutes: finalMinutes,
    dateObj: finalDateObj,
  };
}

/**
 * Retorna apenas a data do pedido no formato 'DD/MM/YYYY' (ex: '28/10/2026').
 */
export function getOrderDate(order?: OrderDateTimeInput | null): string {
  const parsed = parseOrderDateTime(order);
  return `${parsed.day}/${parsed.month}/${parsed.year}`;
}

/**
 * Retorna apenas o horário de criação no formato 'HH:mm' (ex: '14:27').
 */
export function getOrderTime(order?: OrderDateTimeInput | null): string {
  const parsed = parseOrderDateTime(order);
  return `${parsed.hours}:${parsed.minutes}`;
}

/**
 * Formata a data e hora do pedido de forma limpa e visível.
 * Formato padrão: 'DD/MM/YYYY - HH:mm' (ex: '28/10/2026 - 14:27').
 */
export function formatOrderCreationDateTime(
  order?: OrderDateTimeInput | null,
  options?: { shortYear?: boolean; separator?: string }
): string {
  const parsed = parseOrderDateTime(order);
  const sep = options?.separator || ' - ';
  const yearDisplay = options?.shortYear ? parsed.year.slice(-2) : parsed.year;
  return `${parsed.day}/${parsed.month}/${yearDisplay}${sep}${parsed.hours}:${parsed.minutes}`;
}

/**
 * Formata com texto explicativo completo (ex: '28/10/2026 às 14:27').
 */
export function formatOrderFullDateTime(order?: OrderDateTimeInput | null): string {
  const parsed = parseOrderDateTime(order);
  return `${parsed.day}/${parsed.month}/${parsed.year} às ${parsed.hours}:${parsed.minutes}`;
}
