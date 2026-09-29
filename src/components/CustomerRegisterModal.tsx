import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Compass,
  CheckCircle2,
  Sparkles,
  Loader2,
  Search,
  AlertCircle,
  FileText,
  Flame,
} from 'lucide-react';
import { CustomerProfile } from '../types';

interface CustomerRegisterModalProps {
  initialProfile?: CustomerProfile | null;
  onSave: (profile: CustomerProfile) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const CustomerRegisterModal: React.FC<CustomerRegisterModalProps> = ({
  initialProfile,
  onSave,
  onClose,
  canClose = true,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [cep, setCep] = useState(initialProfile?.cep || '');
  const [street, setStreet] = useState(initialProfile?.street || '');
  const [number, setNumber] = useState(initialProfile?.number || '');
  const [neighborhood, setNeighborhood] = useState(initialProfile?.neighborhood || '');
  const [complement, setComplement] = useState(initialProfile?.complement || '');
  const [reference, setReference] = useState(initialProfile?.reference || '');
  const [city, setCity] = useState(initialProfile?.city || 'São Paulo - SP');

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // CEP loading state
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  // Validation errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If initialProfile has an address string but no split fields, parse it
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setPhone(initialProfile.phone || '');
      if (initialProfile.street) setStreet(initialProfile.street);
      if (initialProfile.number) setNumber(initialProfile.number);
      if (initialProfile.neighborhood) setNeighborhood(initialProfile.neighborhood);
      if (initialProfile.complement) setComplement(initialProfile.complement);
      if (initialProfile.reference) setReference(initialProfile.reference);
      if (initialProfile.city) setCity(initialProfile.city);
      if (initialProfile.cep) setCep(initialProfile.cep);

      if (!initialProfile.street && initialProfile.address) {
        // Parse simple string "Rua das Flores, 123 - Centro, São Paulo - SP"
        const parts = initialProfile.address.split(' - ');
        if (parts[0]) {
          const streetParts = parts[0].split(', ');
          setStreet(streetParts[0] || '');
          setNumber(streetParts[1] || '');
        }
        if (parts[1]) {
          setNeighborhood(parts[1]);
        }
      }
    }
  }, [initialProfile]);

  // Phone mask formatting
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length <= 10) {
      // (XX) XXXX-XXXX
      if (raw.length > 2) {
        formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
      }
      if (raw.length > 6) {
        formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6, 10)}`;
      }
    } else {
      // (XX) XXXXX-XXXX
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  // CEP mask & auto-fetch
  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setCep(formatted);
    setCepError(null);

    if (raw.length === 8) {
      fetchCepAddress(raw);
    }
  };

  const fetchCepAddress = async (rawCep: string) => {
    setIsSearchingCep(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (data.erro) {
          setCepError('CEP não encontrado. Digite o endereço manualmente.');
        } else {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade && data.uf) {
            setCity(`${data.localidade} - ${data.uf}`);
          }
        }
      }
    } catch {
      setCepError('Não foi possível consultar o CEP automaticamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // GPS geolocation
  const handleGetGPSLocation = () => {
    setGeoError(null);
    setGeoStatus('Acessando GPS do seu aparelho...');
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
        setGeoStatus('Coordenadas obtidas! Buscando nome da rua...');

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
              `Rua detectada via GPS`;
            const houseNum = address.house_number || '';
            const district =
              address.suburb ||
              address.neighbourhood ||
              address.city_district ||
              address.quarter ||
              'Centro';
            const cityName =
              address.city || address.town || address.village || address.municipality || 'São Paulo';
            const state =
              address.state_code || (address.state ? address.state.slice(0, 2).toUpperCase() : 'SP');

            setStreet(roadName);
            if (houseNum) setNumber(houseNum);
            setNeighborhood(district);
            setCity(`${cityName} - ${state}`);
            if (address.postcode) {
              const cleanPost = address.postcode.replace(/\D/g, '').slice(0, 8);
              if (cleanPost.length === 8) {
                setCep(`${cleanPost.slice(0, 5)}-${cleanPost.slice(5)}`);
              }
            }
            setGeoStatus(`Localizado com sucesso! (Precisão: ±${Math.round(accuracy)}m)`);
          } else {
            setStreet(`Coordenadas (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            setNeighborhood('Região Metropolitana');
            setGeoStatus(`Coordenadas obtidas (±${Math.round(accuracy)}m)`);
          }
        } catch {
          setStreet(`Localização GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setGeoStatus(`Coordenadas obtidas (±${Math.round(accuracy)}m)`);
        } finally {
          setIsLocating(false);
        }
      },
      error => {
        setIsLocating(false);
        setGeoStatus(null);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Permissão de GPS negada. Por favor, digite o endereço manualmente.');
        } else {
          setGeoError('Não foi possível obter sua localização. Digite manualmente.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 3) {
      setErrorMsg('Por favor, digite seu nome completo (pelo menos 3 caracteres).');
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp ou telefone válido com DDD (ex: 11 98765-4321).');
      return;
    }

    const cleanStreet = street.trim();
    if (!cleanStreet) {
      setErrorMsg('Por favor, informe a Rua ou Logradouro da entrega.');
      return;
    }

    const cleanNumber = number.trim();
    if (!cleanNumber) {
      setErrorMsg('Por favor, informe o número da residência (ou S/N).');
      return;
    }

    const cleanNeighborhood = neighborhood.trim();
    if (!cleanNeighborhood) {
      setErrorMsg('Por favor, informe o bairro para entrega.');
      return;
    }

    // Build standard formatted address string
    let fullAddress = `${cleanStreet}, ${cleanNumber}`;
    if (complement.trim()) {
      fullAddress += ` (${complement.trim()})`;
    }
    fullAddress += ` - ${cleanNeighborhood}, ${city.trim()}`;
    if (reference.trim()) {
      fullAddress += ` [Ref: ${reference.trim()}]`;
    }

    const profile: CustomerProfile = {
      id: cleanPhoneDigits,
      name: cleanName,
      phone: phone.trim(),
      address: fullAddress,
      street: cleanStreet,
      number: cleanNumber,
      neighborhood: cleanNeighborhood,
      complement: complement.trim(),
      reference: reference.trim(),
      city: city.trim(),
      cep: cep.trim(),
      registeredAt: initialProfile?.registeredAt || new Date().toISOString(),
    };

    onSave(profile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#1c1b1b] border border-[#353535] rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto text-[#e5e2e1]">
        {/* Close button if permitted */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#b4b5b5] hover:text-white p-1 rounded-full hover:bg-[#2a2a2a] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff5722] to-[#d84315] flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#ff5722]/15 text-[#ff8a65] px-2 py-0.5 rounded font-['Montserrat']">
                {initialProfile ? 'Atualização de Perfil' : 'Cadastro Obrigatório'}
              </span>
            </div>
            <h3 className="font-['Montserrat'] text-xl font-bold text-white leading-tight mt-0.5">
              {initialProfile ? 'Meus Dados de Entrega' : 'Cadastre-se para Pedir'}
            </h3>
            <p className="text-xs text-[#b4b5b5] mt-0.5">
              {initialProfile
                ? 'Mantenha seus dados atualizados para entregas sem erros.'
                : 'Identifique-se para liberar o cardápio e receber seu pedido rapidinho.'}
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-4 bg-red-500/15 border border-red-500/40 rounded-lg p-3 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section: Dados Pessoais */}
          <div className="bg-[#242323] p-3.5 rounded-lg border border-[#353535]/60 space-y-3">
            <h4 className="font-['Montserrat'] font-bold text-white flex items-center gap-1.5 text-xs text-[#ffb5a0]">
              <User className="w-3.5 h-3.5 text-[#ff5722]" /> Dados do Cliente
            </h4>

            <div>
              <label className="block text-[#b4b5b5] font-medium mb-1">
                Nome Completo <span className="text-[#ff5722]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#b4b5b5]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  required
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#b4b5b5] font-medium mb-1">
                WhatsApp / Celular <span className="text-[#ff5722]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#b4b5b5]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="(11) 98765-4321"
                  required
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>
              <p className="text-[10px] text-[#b4b5b5]/70 mt-1">
                Usado para confirmação do pedido e rastreio em tempo real.
              </p>
            </div>
          </div>

          {/* Section: Endereço de Entrega */}
          <div className="bg-[#242323] p-3.5 rounded-lg border border-[#353535]/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-['Montserrat'] font-bold text-white flex items-center gap-1.5 text-xs text-[#ffb5a0]">
                <MapPin className="w-3.5 h-3.5 text-[#ff5722]" /> Endereço de Entrega
              </h4>

              {/* Botão de GPS Rápido */}
              <button
                type="button"
                onClick={handleGetGPSLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-[#ff8a65] hover:text-white bg-[#ff5722]/15 hover:bg-[#ff5722]/30 border border-[#ff5722]/40 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#ff5722]" /> Localizando...
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3 text-[#ff5722]" /> Usar meu GPS
                  </>
                )}
              </button>
            </div>

            {/* GPS Feedback */}
            {geoStatus && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{geoStatus}</span>
              </div>
            )}
            {geoError && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{geoError}</span>
              </div>
            )}

            {/* CEP Field with Search */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  CEP (opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={e => handleCepChange(e.target.value)}
                    placeholder="01234-567"
                    className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                  />
                  {isSearchingCep && (
                    <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-[#ff5722]" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  Cidade / UF
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="São Paulo - SP"
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            {cepError && (
              <p className="text-[10px] text-amber-400 -mt-1">{cepError}</p>
            )}

            {/* Rua e Número */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  Rua / Logradouro <span className="text-[#ff5722]">*</span>
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Ex: Rua das Flores"
                  required
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div>
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  Número <span className="text-[#ff5722]">*</span>
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  placeholder="123 ou S/N"
                  required
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            {/* Bairro e Complemento */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  Bairro <span className="text-[#ff5722]">*</span>
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Ex: Centro"
                  required
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>

              <div>
                <label className="block text-[#b4b5b5] font-medium mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={e => setComplement(e.target.value)}
                  placeholder="Ex: Apto 42, Bloco B"
                  className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
                />
              </div>
            </div>

            {/* Ponto de Referência */}
            <div>
              <label className="block text-[#b4b5b5] font-medium mb-1">
                Ponto de Referência (opcional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ex: Em frente à padaria, portão preto"
                className="w-full bg-[#1c1b1b] border border-[#353535] rounded-md px-3 py-2 text-xs text-white placeholder:text-[#b4b5b5]/40 focus:outline-none focus:border-[#ff5722]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-lg btn-flame font-['Montserrat'] font-bold text-xs uppercase tracking-wider text-white shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>{initialProfile ? 'Salvar Alterações' : 'Concluir Cadastro & Ver Cardápio'}</span>
            </button>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-transparent hover:bg-[#242323] text-[#b4b5b5] hover:text-white text-xs font-semibold transition-colors"
              >
                Continuar navegando no cardápio
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
