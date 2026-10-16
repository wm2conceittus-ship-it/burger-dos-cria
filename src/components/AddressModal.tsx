import React, { useState, useMemo } from 'react';
import { X, MapPin, Check, Navigation, Loader2, Compass, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { StoreSettings } from '../types';
import { getDeliveryFeeForNeighborhood } from '../utils/deliveryFee';

interface AddressModalProps {
  currentAddress: string;
  storeSettings?: StoreSettings;
  currentNeighborhood?: string;
  onSave: (newAddress: string, chosenNeighborhood?: string, cep?: string) => void;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  currentAddress,
  storeSettings,
  currentNeighborhood,
  onSave,
  onClose,
}) => {
  const [street, setStreet] = useState(() => currentAddress.split(' - ')[0] || 'Rua das Flores, 123');
  const [neighborhood, setNeighborhood] = useState(() => {
    if (currentNeighborhood) return currentNeighborhood;
    const parts = currentAddress.split(' - ');
    return parts[1] || 'Consolação, São Paulo - SP';
  });
  const [complement, setComplement] = useState('');
  const [cep, setCep] = useState(() => {
    const match = currentAddress.match(/CEP:\s*(\d{5}-?\d{3})/i);
    return match ? match[1] : '';
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setCep(formatted);
    setCepError(null);

    if (raw.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (data.erro) {
            setCepError('CEP não encontrado. Digite o endereço manualmente.');
          } else {
            if (data.logradouro) setStreet(data.logradouro);
            if (data.bairro) setNeighborhood(data.bairro);
          }
        }
      } catch {
        setCepError('Não foi possível consultar o CEP automaticamente.');
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Active zones for quick selection
  const activeZones = useMemo(
    () => (storeSettings?.deliveryArea?.zones || []).filter(z => z.active),
    [storeSettings?.deliveryArea?.zones]
  );

  // Live fee calculation based on entered/selected neighborhood
  const feeInfo = useMemo(() => {
    return getDeliveryFeeForNeighborhood(neighborhood, storeSettings);
  }, [neighborhood, storeSettings]);

  const handleGetGPSLocation = () => {
    setGeoError(null);
    setGeoStatus('Acessando o GPS do dispositivo...');
    setIsLocating(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setGeoStatus(null);
      setGeoError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeoStatus('Coordenadas obtidas! Buscando rua e bairro...');

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'pt-BR,pt;q=0.9',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            const roadName =
              address.road ||
              address.pedestrian ||
              address.street ||
              address.residential ||
              `Coordenadas (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            const houseNum = address.house_number ? `, ${address.house_number}` : '';
            const detectedStreet = `${roadName}${houseNum}`;
            const district =
              address.suburb ||
              address.neighbourhood ||
              address.city_district ||
              address.quarter ||
              'Centro';
            const city = address.city || address.town || address.village || address.municipality || 'São Paulo';
            const state = address.state_code || (address.state ? address.state.slice(0, 2).toUpperCase() : 'SP');
            const detectedNeighborhood = `${district}, ${city} - ${state}`;

            setStreet(detectedStreet);
            setNeighborhood(district || detectedNeighborhood);
            if (address.postcode) {
              const cleanPost = address.postcode.replace(/\D/g, '').slice(0, 8);
              if (cleanPost.length === 8) {
                setCep(`${cleanPost.slice(0, 5)}-${cleanPost.slice(5)}`);
              }
            }
            setGeoStatus(`Localizado com sucesso! (Precisão: ±${Math.round(accuracy)}m)`);
          } else {
            setStreet(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            setNeighborhood('Consolação, São Paulo - SP');
            setGeoStatus(`Coordenadas fixadas (±${Math.round(accuracy)}m)`);
          }
        } catch {
          setStreet(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setNeighborhood('Consolação, São Paulo - SP');
          setGeoStatus(`Coordenadas fixadas (±${Math.round(accuracy)}m)`);
        } finally {
          setIsLocating(false);
        }
      },
      error => {
        setIsLocating(false);
        setGeoStatus(null);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError(
            'Permissão de GPS negada. Por favor, autorize a localização no navegador ou selecione seu bairro na lista.'
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoError('O tempo limite para obter o GPS expirou. Digite ou selecione o bairro abaixo.');
        } else {
          setGeoError('Não foi possível obter sua posição via satélite. Digite manualmente.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleQuickPreset = (presetStreet: string, presetNeigh: string, presetCep?: string) => {
    setStreet(presetStreet);
    setNeighborhood(presetNeigh);
    if (presetCep) {
      setCep(presetCep);
      setCepError(null);
    }
    setGeoStatus('Endereço, bairro e CEP aplicados!');
    setGeoError(null);
  };

  const handleSave = () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (!cleanCep) {
      setGeoError('O CEP é obrigatório para entrega. Por favor, informe seu CEP.');
      return;
    }
    if (cleanCep.length !== 8) {
      setGeoError('O CEP deve conter 8 dígitos válidos (ex: 01234-567).');
      return;
    }
    const cleanStreet = street.trim();
    if (!cleanStreet) {
      setGeoError('Por favor, informe a rua e número da residência.');
      return;
    }
    const cleanNeigh = neighborhood.trim();
    if (!cleanNeigh) {
      setGeoError('Por favor, informe o bairro de entrega.');
      return;
    }
    const formatted = `${cleanStreet}${complement.trim() ? ` (${complement.trim()})` : ''} - ${cleanNeigh} - CEP: ${cep.trim()}`;
    onSave(formatted, feeInfo.zoneName || cleanNeigh, cep.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#20201f] border border-[#353535] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#353535]/60 pb-3">
          <div className="flex items-center gap-2 text-[#ff5722]">
            <MapPin className="w-5 h-5" />
            <div>
              <h3 className="font-['Montserrat'] font-bold text-base text-white">
                Definir Endereço de Entrega
              </h3>
              <p className="text-[10px] text-[#b4b5b5]">A taxa de entrega é calculada com base no seu bairro</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#b4b5b5] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Action Button Banner */}
        <div className="bg-gradient-to-r from-[#ff5722]/15 via-[#2a2a2a] to-[#20201f] border border-[#ff5722]/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#ff5722] text-white flex items-center justify-center shadow-md">
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <span className="font-['Montserrat'] font-bold text-xs text-white block">
                  Localização Automática por GPS
                </span>
                <span className="text-[10px] text-[#b4b5b5]">
                  Detecte sua rua e bairro em tempo real
                </span>
              </div>
            </div>

            <button
              onClick={handleGetGPSLocation}
              disabled={isLocating}
              className="btn-flame text-white px-3.5 py-2 rounded-xl text-xs font-['Montserrat'] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>Usar GPS</span>
                </>
              )}
            </button>
          </div>

          {/* Status / Feedback message */}
          {geoStatus && (
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{geoStatus}</span>
            </div>
          )}

          {geoError && (
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{geoError}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#353535]/50 flex-wrap">
            <span className="text-[10px] text-[#8e8f8f] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ff8a65]" /> Atalhos:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPreset('Av. Paulista, 1578', 'Bela Vista, São Paulo - SP', '01310-200')}
              className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
            >
              Bela Vista (01310-200)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Rua Augusta, 450', 'Consolação, São Paulo - SP', '01304-000')}
              className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
            >
              Consolação (01304-000)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Praça da Sé, 100', 'Centro Histórico, São Paulo - SP', '01001-000')}
              className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
            >
              Centro (01001-000)
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3 text-xs">
          {/* CEP Input (Obrigatório) */}
          <div className="p-3 bg-[#181818] rounded-2xl border border-[#353535] space-y-1.5">
            <div>
              <label className="text-[#ffb5a0] font-bold text-xs flex items-center gap-1.5">
                <span>CEP <span className="text-[#ff5722]">*</span></span>
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={cep}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="01234-567"
                maxLength={9}
                className={`w-full bg-[#141414] border rounded-xl px-3 py-2 text-white focus:outline-none text-xs ${
                  cepError ? 'border-amber-500 focus:border-amber-500' : 'border-[#353535] focus:border-[#ff5722]'
                }`}
              />
              {isSearchingCep && (
                <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#ff5722]" />
              )}
            </div>
            {cepError ? (
              <p className="text-[10px] text-amber-400 font-medium">{cepError}</p>
            ) : (
              <p className="text-[9.5px] text-[#8e8f8f]">
                Digite o CEP para buscar rua e bairro automaticamente.
              </p>
            )}
          </div>

          {/* Bairro Selector & Badge - Highlighted for neighborhood-based delivery fee */}
          <div className="p-3 bg-[#181818] rounded-2xl border border-[#ff5722]/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[#ffb5a0] font-bold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff5722]" />
                Bairro da Entrega (Cálculo da Taxa) <span className="text-[#ff5722]">*</span>
              </label>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Taxa: R$ {feeInfo.fee.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Dropdown of registered neighborhoods */}
            {activeZones.length > 0 && (
              <div>
                <select
                  value={
                    activeZones.some(z => z.name.toLowerCase() === neighborhood.trim().toLowerCase())
                      ? activeZones.find(z => z.name.toLowerCase() === neighborhood.trim().toLowerCase())?.name
                      : ''
                  }
                  onChange={e => {
                    if (e.target.value) {
                      setNeighborhood(e.target.value);
                    }
                  }}
                  className="w-full bg-[#20201f] border border-[#ff5722]/50 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-[#ff5722]"
                >
                  <option value="">Selecione seu bairro na lista...</option>
                  {activeZones.map(zone => (
                    <option key={zone.id} value={zone.name}>
                      {zone.name} — Taxa: R$ {zone.fee.toFixed(2).replace('.', ',')} ({zone.estimatedTime || '25-35 min'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Ou digite o nome do bairro..."
                className="w-full bg-[#141414] border border-[#353535] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff5722] placeholder:text-[#666]"
              />
              {feeInfo.isMatched && feeInfo.zone && (
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Bairro reconhecido: <strong>{feeInfo.zone.name}</strong> • Taxa R$ {feeInfo.fee.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[#b4b5b5] mb-1 font-medium">Rua e Número</label>
            <input
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="Ex: Rua Augusta, 450"
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
            />
          </div>

          <div>
            <label className="block text-[#b4b5b5] mb-1 font-medium">Complemento / Apto (Opcional)</label>
            <input
              type="text"
              value={complement}
              onChange={e => setComplement(e.target.value)}
              placeholder="Ex: Apto 42, Bloco B, Portaria"
              className="w-full bg-[#1c1b1b] border border-[#353535] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#ff5722]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#353535]">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2a2a2a] hover:bg-[#353535] text-white py-3 rounded-xl text-xs font-semibold font-['Montserrat'] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-flame text-white py-3 rounded-xl text-xs font-bold font-['Montserrat'] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" /> Confirmar (Taxa R$ {feeInfo.fee.toFixed(2).replace('.', ',')})
          </button>
        </div>
      </div>
    </div>
  );
};
