/**
 * Utilitários para compartilhamento do link público do cardápio para clientes.
 */

export const PUBLIC_APP_URL = 'https://ais-pre-qknixhdqt45vxqtx4kdi6f-358992445078.us-east5.run.app';

/**
 * Retorna sempre o link público que qualquer cliente consegue abrir no celular/WhatsApp.
 * Converte automaticamente URLs de desenvolvimento interno (ais-dev-...) para a URL pública (ais-pre-...).
 */
export function getPublicMenuUrl(extraQueryOrPath = ''): string {
  if (typeof window === 'undefined') {
    return PUBLIC_APP_URL + extraQueryOrPath;
  }

  let origin = window.location.origin;

  // Se estiver no ambiente restrito do desenvolvedor (ais-dev), converte para o link público (ais-pre)
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    origin = PUBLIC_APP_URL;
  }

  return origin + extraQueryOrPath;
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
