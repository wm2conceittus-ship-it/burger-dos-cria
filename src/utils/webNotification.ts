/**
 * Utilitário de Notificações Nativas do Navegador (HTML5 Web Notifications API).
 * Permite alertar o gestor da cozinha sobre novos pedidos e confirmação de PIX
 * mesmo quando a aba estiver em segundo plano, minimizada ou o gestor estiver em outro aplicativo/aba.
 */

import { Order } from '../types';
import { APP_IMAGES } from '../data/mockData';

export type WebNotificationState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ExtendedNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Verifica se o navegador atual suporta a Web Notifications API.
 */
export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna o status atual de permissão de notificações do navegador.
 */
export function getWebNotificationPermission(): WebNotificationState {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as WebNotificationState;
}

/**
 * Solicita autorização ao usuário para exibir notificações nativas.
 * Retorna uma Promise com o resultado ('granted' | 'denied' | 'default').
 */
export async function requestWebNotificationPermission(): Promise<WebNotificationState> {
  if (!isWebNotificationSupported()) {
    console.warn('Web Notifications API não é suportada neste navegador.');
    return 'unsupported';
  }

  try {
    // Suporte a Promise nativa (Chrome, Edge, Firefox, Safari moderno)
    if (typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      return permission as WebNotificationState;
    }
    // Fallback legado com callback
    return new Promise<WebNotificationState>((resolve) => {
      Notification.requestPermission((perm) => {
        resolve(perm as WebNotificationState);
      });
    });
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificação:', err);
    return getWebNotificationPermission();
  }
}

/**
 * Dispara uma notificação nativa para um NOVO PEDIDO recebido.
 * Configurada com requireInteraction: true para não desaparecer até ser vista/clicada.
 */
export function sendOrderWebNotification(
  order: Order,
  onClick?: () => void
): Notification | null {
  if (!isWebNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const formattedTotal = (order.total || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const itemsSummary = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
      : 'Itens no cardápio';

    const orderTypeLabel = order.type === 'Mesa'
      ? `Mesa ${order.tableNumber || 1}`
      : order.type === 'Retirada'
      ? 'Retirada no Balcão'
      : 'Delivery';

    const title = `🍔 NOVO PEDIDO #${order.orderNumber}! (${orderTypeLabel})`;
    const body = `Cliente: ${order.customerName || 'Cliente'}\nTotal: ${formattedTotal} • ${order.paymentMethod || 'Pix'}\n${itemsSummary}`;

    const iconUrl = APP_IMAGES.logo || '/favicon.ico';

    const options: ExtendedNotificationOptions = {
      body,
      icon: iconUrl,
      badge: iconUrl,
      tag: `order-${order.id}`,
      renotify: true,
      requireInteraction: true, // Mantém a notificação na tela até interação
      silent: false,
    };

    const notification = new Notification(title, options as NotificationOptions);

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Falha ao disparar Web Notification de pedido:', err);
    return null;
  }
}

/**
 * Dispara uma notificação nativa para PIX CONFIRMADO pelo banco.
 */
export function sendPixWebNotification(
  order: Order,
  onClick?: () => void
): Notification | null {
  if (!isWebNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const formattedTotal = (order.total || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const title = `💰 PIX CONFIRMADO • Pedido #${order.orderNumber}!`;
    const body = `Pagamento de ${formattedTotal} recebido com sucesso de ${order.customerName || 'Cliente'}. Pronto para preparo!`;

    const iconUrl = APP_IMAGES.logo || '/favicon.ico';

    const options: ExtendedNotificationOptions = {
      body,
      icon: iconUrl,
      badge: iconUrl,
      tag: `pix-${order.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
    };

    const notification = new Notification(title, options as NotificationOptions);

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Falha ao disparar Web Notification de Pix:', err);
    return null;
  }
}

/**
 * Dispara uma notificação de teste para verificar se o sistema operacional e navegador estão recebendo.
 */
export function sendTestWebNotification(onClick?: () => void): Notification | null {
  if (!isWebNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const title = `🔥 Burguer dos Crias • Notificações Ativas!`;
    const body = `Tudo pronto! Você receberá alertas nativos na tela mesmo com o navegador em segundo plano ou em outra aba.`;

    const iconUrl = APP_IMAGES.logo || '/favicon.ico';

    const options: ExtendedNotificationOptions = {
      body,
      icon: iconUrl,
      badge: iconUrl,
      tag: `test-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
    };

    const notification = new Notification(title, options as NotificationOptions);

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Falha ao disparar notificação de teste:', err);
    return null;
  }
}
