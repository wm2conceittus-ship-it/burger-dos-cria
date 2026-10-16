/**
 * gpsRouteUtils.ts
 * Utilitários para limpeza, formatação e geração precisa de links de rota GPS (Google Maps e Waze).
 * Resolve problemas onde complementos (Apto, Bloco), pontos de referência e textos como
 * "Bairro:" ou "CEP:" quebravam a geolocalização no aplicativo de navegação dos entregadores.
 */

export interface GpsCoords {
  lat?: number;
  lng?: number;
}

/**
 * Higieniza o endereço textual para que o geocodificador do Google Maps e Waze
 * encontre com 100% de precisão o número e a rua correta sem ruídos.
 */
export function getCleanAddressForGps(rawAddress?: string): string {
  if (!rawAddress) return '';

  const trimmed = rawAddress.trim();

  // 1. Se o endereço contiver coordenadas GPS em formato texto, ex:
  // "Localização GPS (-23.5505, -46.6333)" ou "(-23.55052, -46.63330)"
  const coordMatch = trimmed.match(/(-?\d{1,2}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/);
  if (coordMatch) {
    return `${coordMatch[1]},${coordMatch[2]}`;
  }

  // Se for endereço de consumo local ou retirada
  if (
    trimmed.toLowerCase().includes('consumo no local') ||
    trimmed.toLowerCase().includes('retirada no balcão')
  ) {
    return trimmed;
  }

  // 2. Extrair CEP (caso exista)
  const cepMatch = trimmed.match(/\b\d{5}-?\d{3}\b/);
  const cleanCep = cepMatch ? cepMatch[0] : null;

  // 3. Remover complementos entre parênteses: (Apto 42), (Bloco B), (Casa 2), etc.
  let cleaned = trimmed.replace(/\(.*?\)/g, ' ');

  // 4. Remover referências entre colchetes: [Ref: ...], [Ponto de Ref: ...]
  cleaned = cleaned.replace(/\[.*?\]/g, ' ');

  // 5. Remover palavras "Ref:", "Ponto de referência:" caso estejam soltas
  cleaned = cleaned.replace(/\b(ref|referência|ponto de ref|ponto de referência):\s*[^,\n-]+/gi, ' ');

  // 6. Remover rótulos "Bairro:", "CEP:"
  cleaned = cleaned.replace(/\bBairro:\s*/gi, ' ');
  cleaned = cleaned.replace(/\bCEP:\s*\d{5}-?\d{3}/gi, ' ');
  cleaned = cleaned.replace(/\bCEP:\s*/gi, ' ');
  cleaned = cleaned.replace(/\b\d{5}-?\d{3}\b/g, ' ');

  // 7. Substituir hífens separadores por vírgulas
  cleaned = cleaned.replace(/\s*[-–—]\s*/g, ', ');

  // 8. Normalizar vírgulas e espaços
  cleaned = cleaned
    .replace(/,+/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[, ]+|[, ]+$/g, '');

  // 9. Desduplicar termos repetidos (ex: bairro repetido 2 vezes)
  const segments = cleaned
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const uniqueSegments: string[] = [];
  for (const seg of segments) {
    const isDuplicate = uniqueSegments.some(
      existing => existing.toLowerCase() === seg.toLowerCase()
    );
    if (!isDuplicate) {
      uniqueSegments.push(seg);
    }
  }

  let finalAddress = uniqueSegments.join(', ');

  // 10. Reanexar o CEP limpo para máxima precisão no mapa
  if (cleanCep && !finalAddress.includes(cleanCep)) {
    finalAddress += `, ${cleanCep}`;
  }

  // 11. Garantir país Brasil para não resolver endereço com mesmo nome fora do Brasil
  if (
    !finalAddress.toLowerCase().includes('brasil') &&
    !finalAddress.toLowerCase().includes('brazil')
  ) {
    finalAddress += ', Brasil';
  }

  return finalAddress;
}

/**
 * Retorna o destino otimizado para navegação (seja coordenadas lat/lng ou endereço higienizado).
 */
export function getOptimizedDestination(
  rawAddress?: string,
  coords?: GpsCoords | null
): string {
  // Se coordenadas explícitas e válidas estiverem disponíveis, prioriza sempre
  if (
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat !== 0 &&
    coords.lng !== 0
  ) {
    return `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
  }

  return getCleanAddressForGps(rawAddress);
}

/**
 * Gera URL direta do Google Maps para traçar rota de navegação GPS até o cliente.
 */
export function getGoogleMapsRouteUrl(
  rawAddress?: string,
  coords?: GpsCoords | null
): string {
  const dest = getOptimizedDestination(rawAddress, coords);
  if (!dest) return 'https://www.google.com/maps';

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/**
 * Gera URL direta do Waze para iniciar navegação GPS imediata.
 */
export function getWazeRouteUrl(
  rawAddress?: string,
  coords?: GpsCoords | null
): string {
  if (
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat !== 0 &&
    coords.lng !== 0
  ) {
    return `https://waze.com/ul?ll=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}&navigate=yes`;
  }

  const clean = getCleanAddressForGps(rawAddress);
  if (!clean) return 'https://waze.com';

  return `https://waze.com/ul?q=${encodeURIComponent(clean)}&navigate=yes`;
}
