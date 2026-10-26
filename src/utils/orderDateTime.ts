/**
 * Formata a data e hora de criação do pedido de forma limpa e padronizada.
 * Padrão exigido: 'DD/MM - HH:mm' (ex: '15/10 - 20:30').
 */
export function formatOrderCreationDateTime(order?: { orderDate?: string; createdAt?: string } | null): string {
  if (!order) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${d}/${m} - ${h}:${min}`;
  }

  let day = '';
  let month = '';
  let time = '';

  // 1. Tenta extrair a partir de ISO string ou timestamp em createdAt
  if (order.createdAt && (order.createdAt.includes('T') || order.createdAt.length > 15)) {
    const parsedDate = new Date(order.createdAt);
    if (!isNaN(parsedDate.getTime())) {
      day = String(parsedDate.getDate()).padStart(2, '0');
      month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      time = `${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
      return `${day}/${month} - ${time}`;
    }
  }

  // 2. Extrai dia e mês a partir de orderDate (DD/MM/YYYY ou YYYY-MM-DD)
  if (order.orderDate) {
    if (order.orderDate.includes('/')) {
      const parts = order.orderDate.split('/');
      if (parts.length >= 2) {
        day = parts[0].trim().padStart(2, '0');
        month = parts[1].trim().padStart(2, '0');
      }
    } else if (order.orderDate.includes('-')) {
      const parts = order.orderDate.split('-');
      if (parts.length >= 3) {
        // YYYY-MM-DD
        day = parts[2].trim().slice(0, 2).padStart(2, '0');
        month = parts[1].trim().padStart(2, '0');
      }
    }
  }

  // Se ainda não tiver dia/mês, usa a data atual de criação
  if (!day || !month) {
    const now = new Date();
    day = String(now.getDate()).padStart(2, '0');
    month = String(now.getMonth() + 1).padStart(2, '0');
  }

  // 3. Extrai horário de createdAt (HH:mm ou HH:mm:ss)
  if (order.createdAt) {
    const timeMatch = order.createdAt.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  }

  // Se não encontrar o horário em createdAt, usa o horário atual
  if (!time) {
    const now = new Date();
    time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  return `${day}/${month} - ${time}`;
}
