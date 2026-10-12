import { Order, StoreSettings } from '../types';

/**
 * Formata número de telefone brasileiro para o padrão internacional do WhatsApp (55 + DDD + número)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Monta o texto detalhado e padronizado do alerta de novo pedido para o WhatsApp do gestor.
 */
export function buildManagerWhatsAppOrderMessage(order: Order, storeSettings?: StoreSettings): string {
  const storeName = storeSettings?.storeName || 'Burguer dos Crias';
  const isTable = order.type === 'Mesa';
  const isPickup = order.type === 'Retirada';

  const typeHeader = isTable
    ? `🍽️ *NOVO PEDIDO NO SALÃO - MESA #${order.tableNumber || 1}*`
    : isPickup
    ? `🛍️ *NOVO PEDIDO PARA RETIRADA NO BALCÃO*`
    : `🛵 *NOVO PEDIDO DELIVERY RECEBIDO!*`;

  const itemsList = (order.items || [])
    .map(it => {
      const sizeNote = it.pizzaSize ? ` [Tam: ${it.pizzaSize}]` : it.juiceSize ? ` [${it.juiceSize}]` : '';
      const obsNote = it.notes ? `\n   ⚠️ _Obs: ${it.notes}_` : '';
      return `• *${it.quantity}x* ${it.name}${sizeNote} - R$ ${((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}${obsNote}`;
    })
    .join('\n');

  const addressText = isTable
    ? `Mesa #${order.tableNumber || 1}`
    : isPickup
    ? `Retirada no Balcão`
    : `${order.address || 'Não informado'}`;

  const paymentText = order.paymentStatus === 'aprovado'
    ? `✅ *${order.paymentMethod}* (PAGO / APROVADO)`
    : `🟡 *${order.paymentMethod}* (Pendente / Conferir)`;

  const changeText = order.changeFor ? `\n💵 *Troco para:* R$ ${order.changeFor}` : '';
  const notesText = order.notes ? `\n💬 *Observação do cliente:* "${order.notes}"` : '';

  return [
    `🔔 *ALERTA DE NOVO PEDIDO - ${storeName.toUpperCase()}*`,
    typeHeader,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📌 *Pedido:* #${order.orderNumber}`,
    `👤 *Cliente:* ${order.customerName}`,
    order.customerPhone ? `📱 *WhatsApp do Cliente:* ${order.customerPhone}` : '',
    `📍 *Local/Entrega:* ${addressText}`,
    `⏰ *Horário:* ${order.createdAt || 'Agora'}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *ITENS DO PEDIDO:*`,
    itemsList,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💵 *Subtotal:* R$ ${(order.subtotal || 0).toFixed(2).replace('.', ',')}`,
    order.deliveryFee > 0 ? `🛵 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}` : '',
    `🔥 *TOTAL:* *R$ ${(order.total || 0).toFixed(2).replace('.', ',')}*`,
    `💳 *Forma de Pagamento:* ${paymentText}${changeText}${notesText}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ _Acesse o Painel do Gestor para aceitar e despachar!_`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Retorna o link direto (wa.me) para enviar a notificação para o WhatsApp do gestor.
 */
export function getManagerWhatsAppNotificationUrl(order: Order, storeSettings?: StoreSettings): string {
  const managerPhone =
    storeSettings?.whatsappManagerAlert ||
    storeSettings?.whatsappSupport ||
    '11987654321';

  const cleanPhone = formatPhoneForWhatsApp(managerPhone);
  const message = buildManagerWhatsAppOrderMessage(order, storeSettings);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
