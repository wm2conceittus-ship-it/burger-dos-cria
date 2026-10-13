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
    '88992176318';

  const cleanPhone = formatPhoneForWhatsApp(managerPhone);
  const message = buildManagerWhatsAppOrderMessage(order, storeSettings);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Monta a mensagem para o WhatsApp do CLIENTE avisando que o pedido foi despachado e está a caminho.
 */
export function buildCustomerDispatchWhatsAppMessage(
  order: Order,
  courierInfo?: { name?: string; phone?: string; vehicle?: string; plate?: string },
  storeSettings?: StoreSettings
): string {
  const storeName = storeSettings?.storeName || 'Burguer dos Crias';
  const courierName = courierInfo?.name || order.courierName;
  const courierVehicle = courierInfo?.vehicle || order.courierVehicle;
  const courierPlate = courierInfo?.plate || order.courierPlate;

  const isOnlinePaid = Boolean(order.mercadoPagoPaymentId || order.paymentStatus === 'aprovado');
  const paymentText = isOnlinePaid
    ? '✅ *PAGO ONLINE (Pix/Cartão)*'
    : `💵 *${order.paymentMethod || 'A pagar na entrega'}*${order.changeFor ? ` (Troco para R$ ${order.changeFor})` : ''}`;

  const itemsList = (order.items || [])
    .map(it => {
      const sizeNote = it.pizzaSize ? ` [Tam: ${it.pizzaSize}]` : it.juiceSize ? ` [${it.juiceSize}]` : '';
      return `• *${it.quantity}x* ${it.name}${sizeNote}`;
    })
    .join('\n');

  const courierLine = courierName
    ? `🛵 *Entregador(a):* ${courierName}${courierVehicle ? ` (${courierVehicle})` : ''}${courierPlate ? ` • Placa: ${courierPlate}` : ''}`
    : `🛵 *Entrega:* Despachado pela nossa equipe`;

  const addressLine = order.address ? `📍 *Endereço:* ${order.address}` : '';
  const timeLine = storeSettings?.estimatedDeliveryTime
    ? `⏱️ *Previsão de Entrega:* ~${storeSettings.estimatedDeliveryTime}`
    : '';

  return [
    `🛵💨 *SEU PEDIDO ESTÁ A CAMINHO!*`,
    `🍔 *${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Olá, *${order.customerName}*! Ótima notícia: seu pedido acabou de sair para entrega! 🎉`,
    ``,
    `📌 *Pedido:* #${order.orderNumber}`,
    courierLine,
    addressLine,
    timeLine,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Resumo dos Itens:*`,
    itemsList,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Total:* *R$ ${(order.total || 0).toFixed(2).replace('.', ',')}*`,
    `💳 *Forma de Pagamento:* ${paymentText}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🔔 *Dica:* Por favor, fique atento(a) ao interfone, campainha ou celular!`,
    storeSettings?.whatsappSupport ? `📞 *Suporte da Hamburgueria:* ${storeSettings.whatsappSupport}` : '',
    `\nAgradecemos a preferência e bom apetite! 😋🍔✨`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Retorna o link direto (wa.me) para enviar a notificação "Pedido a caminho" para o WhatsApp do cliente.
 */
export function getCustomerDispatchWhatsAppUrl(
  order: Order,
  courierInfo?: { name?: string; phone?: string; vehicle?: string; plate?: string },
  storeSettings?: StoreSettings
): string {
  if (!order.customerPhone) return '';
  const cleanPhone = formatPhoneForWhatsApp(order.customerPhone);
  if (!cleanPhone || cleanPhone.length < 10) return '';
  const message = buildCustomerDispatchWhatsAppMessage(order, courierInfo, storeSettings);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Abre o link do WhatsApp com compatibilidade garantida em navegadores desktop e mobile.
 */
export function openWhatsAppLink(url: string): boolean {
  if (!url) return false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return true;
  } catch {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }
}
