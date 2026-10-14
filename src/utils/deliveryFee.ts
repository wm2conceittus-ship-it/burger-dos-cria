import { DeliveryZone, StoreSettings } from '../types';

/**
 * Remove acentuação e converte para minúsculas para comparação flexível
 */
export function normalizeNeighborhoodName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retorna os bairros cadastrados ativos na loja
 */
export function getActiveDeliveryZones(storeSettings?: StoreSettings): DeliveryZone[] {
  const zones = storeSettings?.deliveryArea?.zones || [];
  return zones.filter(z => z.active);
}

/**
 * Calcula a taxa de entrega baseada no Bairro do cliente
 */
export function getDeliveryFeeForNeighborhood(
  neighborhoodOrAddress: string | undefined,
  storeSettings?: StoreSettings
): { fee: number; zone?: DeliveryZone; isMatched: boolean; zoneName?: string } {
  const defaultFee = storeSettings?.defaultDeliveryFee ?? 7.00;
  if (!neighborhoodOrAddress) {
    return { fee: defaultFee, isMatched: false };
  }

  const normalizedInput = normalizeNeighborhoodName(neighborhoodOrAddress);
  if (!normalizedInput) {
    return { fee: defaultFee, isMatched: false };
  }

  const activeZones = getActiveDeliveryZones(storeSettings);

  // Ordena por comprimento decrescente para priorizar nomes mais específicos
  const sortedZones = [...activeZones].sort((a, b) => b.name.length - a.name.length);

  for (const zone of sortedZones) {
    const normZone = normalizeNeighborhoodName(zone.name);
    // Divide também caso a zona tenha múltiplas barras (Ex: "Bela Vista / Bixiga")
    const parts = normZone.split(/[\/\-–,]/).map(p => p.trim()).filter(Boolean);
    parts.push(normZone);

    for (const part of parts) {
      if (!part) continue;
      const exactMatch = normalizedInput === part;
      const inputHasZonePart = part.length >= 3 && normalizedInput.includes(part);
      const zonePartHasInput = normalizedInput.length >= 3 && part.includes(normalizedInput);

      if (exactMatch || inputHasZonePart || zonePartHasInput) {
        return {
          fee: Number(zone.fee),
          zone,
          isMatched: true,
          zoneName: zone.name,
        };
      }
    }
  }

  return {
    fee: defaultFee,
    isMatched: false,
  };
}
