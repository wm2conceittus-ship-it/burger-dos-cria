import React, { useState } from 'react';
import { X, MapPin, Check, Navigation, Loader2, Compass, AlertCircle, Sparkles } from 'lucide-react';

interface AddressModalProps {
  currentAddress: string;
  onSave: (newAddress: string) => void;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  currentAddress,
  onSave,
  onClose,
}) => {
  const [street, setStreet] = useState(currentAddress.split(' - ')[0] || 'Rua das Flores, 123');
  const [neighborhood, setNeighborhood] = useState(currentAddress.split(' - ')[1] || 'Centro, São Paulo - SP');
  const [complement, setComplement] = useState('Apto 42');
  
  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

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
        setGeoCoords({ lat: latitude, lng: longitude, accuracy });
        setGeoStatus('Coordenadas obtidas! Buscando rua e bairro...');

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
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
            setNeighborhood(detectedNeighborhood);
            setGeoStatus(`Localizado com sucesso! (Precisão: ±${Math.round(accuracy)}m)`);
          } else {
            // Fallback with coordinates
            setStreet(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            setNeighborhood('Região Metropolitana, São Paulo - SP');
            setGeoStatus(`Coordenadas fixadas (±${Math.round(accuracy)}m)`);
          }
        } catch (err) {
          // Fallback if network blocked
          setStreet(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setNeighborhood('Região Central, São Paulo - SP');
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
            'Permissão de GPS negada. Por favor, autorize a localização no navegador ou digite o endereço manualmente.'
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoError('O tempo limite para obter o GPS expirou. Tente novamente ou digite manualmente.');
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

  const handleQuickPreset = (presetStreet: string, presetNeigh: string) => {
    setStreet(presetStreet);
    setNeighborhood(presetNeigh);
    setGeoStatus('Endereço aplicado!');
    setGeoError(null);
  };

  const handleSave = () => {
    const formatted = `${street}${complement ? ` - ${complement}` : ''}, ${neighborhood}`;
    onSave(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#20201f] border border-[#353535] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#353535]/60 pb-3">
          <div className="flex items-center gap-2 text-[#ff5722]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-['Montserrat'] font-bold text-base text-white">
              Definir Endereço de Entrega
            </h3>
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
                  Detecte sua rua e número em tempo real
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
          <div className="flex items-center gap-2 pt-1 border-t border-[#353535]/50">
            <span className="text-[10px] text-[#8e8f8f] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#ff8a65]" /> Atalhos:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPreset('Av. Paulista, 1578', 'Bela Vista, São Paulo - SP')}
              className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
            >
              Av. Paulista
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('Rua Augusta, 450', 'Consolação, São Paulo - SP')}
              className="text-[10px] bg-[#1c1b1b] hover:bg-[#353535] text-[#ffb5a0] px-2 py-0.5 rounded-md border border-[#353535] transition-colors"
            >
              Rua Augusta
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3 text-xs">
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

          <div>
            <label className="block text-[#b4b5b5] mb-1 font-medium">Bairro e Cidade</label>
            <input
              type="text"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              placeholder="Ex: Consolação, São Paulo - SP"
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
            <Check className="w-4 h-4" /> Confirmar Endereço
          </button>
        </div>
      </div>
    </div>
  );
};

