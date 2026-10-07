/**
 * Utilitários para compartilhamento do link público do cardápio para clientes.
 */

export const DEFAULT_APP_URL = 'https://ais-dev-qknixhdqt45vxqtx4kdi6f-358992445078.us-east5.run.app';

/**
 * Retorna sempre o link ativo da aplicação onde o servidor está rodando no momento.
 */
export function getPublicMenuUrl(extraQueryOrPath = ''): string {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_URL + extraQueryOrPath;
  }

  // Sempre utiliza o origin real onde o app está hospedado e ativo
  const origin = window.location.origin;
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
