/**
 * Utilitário de Notificação Sonora (Audio Alert / Chime) para Novos Pedidos.
 * Utiliza a Web Audio API nativa para síntese sonora pura (sem dependência de arquivos externos).
 * Funciona em background no navegador, mesmo com a aba em segundo plano.
 */

let sharedAudioContext: AudioContext | null = null;

/**
 * Obtém ou inicializa a instância do AudioContext, desbloqueando-a se estiver suspensa.
 */
export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {
        // Aguarda próxima interação do usuário
      });
    }

    return sharedAudioContext;
  } catch (err) {
    console.warn('Erro ao inicializar AudioContext:', err);
    return null;
  }
}

/**
 * Desbloqueia ativamente o áudio através de uma interação do usuário (clique, toque ou tecla).
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Escuta a primeira interação do usuário para desbloquear o AudioContext no navegador
if (typeof window !== 'undefined') {
  const handleUserGesture = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleUserGesture);
    window.removeEventListener('keydown', handleUserGesture);
    window.removeEventListener('touchstart', handleUserGesture);
  };
  window.addEventListener('click', handleUserGesture, { once: true });
  window.addEventListener('keydown', handleUserGesture, { once: true });
  window.addEventListener('touchstart', handleUserGesture, { once: true });
}

/**
 * Toca uma nota sintetizada com envelope suave (fade in e fade out sem estalos).
 */
function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.35,
  type: OscillatorType = 'triangle'
) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope suave anti-clique
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn('Erro ao reproduzir tom:', err);
  }
}

/**
 * Toca o Alerta Sonoro de Novo Pedido (Chime de Restaurante / Cozinha).
 * Padrão sonoro: Ding-Dong Melódico duplo de alta atenção (Do-Mi-Sol-Do agudo).
 */
export function playNewOrderSound(volume = 0.4): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => playMelody(ctx, volume)).catch(() => {});
  } else {
    playMelody(ctx, volume);
  }
}

function playMelody(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime + 0.05;

  // Primeira rodada: D5 (587Hz) -> F#5 (740Hz) -> A5 (880Hz) -> D6 (1174Hz)
  const notesCycle1 = [
    { freq: 587.33, offset: 0.00, dur: 0.12 },
    { freq: 739.99, offset: 0.13, dur: 0.12 },
    { freq: 880.00, offset: 0.26, dur: 0.15 },
    { freq: 1174.66, offset: 0.42, dur: 0.35 },
  ];

  notesCycle1.forEach(n => {
    playTone(ctx, n.freq, now + n.offset, n.dur, volume, 'triangle');
  });

  // Segunda rodada (confirmação após 0.65s): repete mais brilhante (A5 -> D6)
  const notesCycle2 = [
    { freq: 880.00, offset: 0.75, dur: 0.15 },
    { freq: 1174.66, offset: 0.92, dur: 0.45 },
  ];

  notesCycle2.forEach(n => {
    playTone(ctx, n.freq, now + n.offset, n.dur, volume * 1.1, 'sine');
  });
}

/**
 * Pisca o título da aba do navegador para alertar o gestor caso ele esteja em outra aba ou programa.
 */
let titleBlinkInterval: number | null = null;
let originalDocumentTitle = '';

export function startTabNotificationBlink(orderNumber: string): void {
  if (typeof document === 'undefined') return;

  if (!originalDocumentTitle) {
    originalDocumentTitle = document.title || 'Burger Dash - O Sabor do Fogo';
  }

  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
  }

  let showNew = true;
  titleBlinkInterval = window.setInterval(() => {
    document.title = showNew
      ? `🔔 NOVO PEDIDO #${orderNumber}!`
      : `🔥 Burguer dos Crias (${orderNumber})`;
    showNew = !showNew;
  }, 1000);

  // Cancela ao focar na janela
  const handleFocus = () => {
    stopTabNotificationBlink();
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('click', handleFocus);
  };
  window.addEventListener('focus', handleFocus);
  window.addEventListener('click', handleFocus);
}

export function stopTabNotificationBlink(): void {
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (typeof document !== 'undefined' && originalDocumentTitle) {
    document.title = originalDocumentTitle;
  }
}
