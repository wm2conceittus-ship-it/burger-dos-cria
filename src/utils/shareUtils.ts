/**
 * Utilitários para compartilhamento do link público do cardápio para clientes.
 */

// URL Pública Oficial Compartilhada (acessível por qualquer cliente na internet sem login)
export const DEFAULT_APP_URL = 'https://ais-pre-qknixhdqt45vxqtx4kdi6f-358992445078.us-east5.run.app';

/**
 * Retorna sempre o link público ativo para clientes externos.
 * Converte automaticamente links privados de desenvolvimento (ais-dev-) para o link público compartilhado (ais-pre-).
 * Inclui automaticamente o parâmetro ?cliente=1 para ocultar ícones do gestor para os clientes.
 */
export function getPublicMenuUrl(extraQueryOrPath = '', customBaseUrl?: string): string {
  let param = extraQueryOrPath || '';
  if (!param.includes('cliente=1')) {
    if (param.includes('?')) {
      param += '&cliente=1';
    } else if (param.startsWith('/')) {
      param += '?cliente=1';
    } else if (param) {
      param = `/${param}?cliente=1`;
    } else {
      param = '/?cliente=1';
    }
  }

  if (customBaseUrl && customBaseUrl.trim()) {
    let base = customBaseUrl.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    base = base.replace(/\/+$/, '');
    return base + (param.startsWith('/') || param.startsWith('?') ? param : `/${param}`);
  }

  if (typeof window === 'undefined') {
    return DEFAULT_APP_URL + param;
  }

  // Sempre utiliza o origin público real
  let origin = window.location.origin;

  // CRÍTICO: No Google AI Studio, o origin ais-dev-* é privado e exige login de desenvolvedor.
  // O origin ais-pre-* é o Shared App URL público, aberto para qualquer cliente no WhatsApp ou celular!
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  // Se estiver rodando em localhost:3000, usa a URL pública compartilhada
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    origin = DEFAULT_APP_URL;
  }

  return origin + (param.startsWith('/') || param.startsWith('?') ? param : `/${param}`);
}

/**
 * Retorna o link de acesso exclusivo do Gestor no app web (?gestor=1).
 */
export function getManagerMenuUrl(extraQueryOrPath = '', customBaseUrl?: string): string {
  let param = extraQueryOrPath || '';
  if (!param.includes('gestor=1')) {
    if (param.includes('?')) {
      param += '&gestor=1';
    } else if (param.startsWith('/')) {
      param += '?gestor=1';
    } else if (param) {
      param = `/${param}?gestor=1`;
    } else {
      param = '/?gestor=1';
    }
  }

  if (customBaseUrl && customBaseUrl.trim()) {
    let base = customBaseUrl.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    base = base.replace(/\/+$/, '');
    return base + (param.startsWith('/') || param.startsWith('?') ? param : `/${param}`);
  }

  if (typeof window === 'undefined') {
    return DEFAULT_APP_URL + param;
  }

  const origin = window.location.origin;
  return origin + (param.startsWith('/') || param.startsWith('?') ? param : `/${param}`);
}

/**
 * Copia texto para a área de transferência com suporte a fallback universal (inclusive iOS/Safari).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // prossegue para o fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.warn('Fallback de cópia falhou:', err);
    return false;
  }
}
