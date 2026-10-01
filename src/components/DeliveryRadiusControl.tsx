import React, { useState, useEffect } from 'react';
import { StoreSettings, DeliveryZone } from '../types';
import {
  MapPin,
  Navigation,
  Compass,
  DollarSign,
  Clock,
  Sparkles,
  Check,
  RefreshCw,
  Sliders,
  Radio,
  Flame,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  CloudUpload,
  CheckCircle,
} from 'lucide-react';

interface DeliveryRadiusControlProps {
  storeSettings: StoreSettings;
  onUpdateStoreSettings: (newSettings: StoreSettings) => void;
}

const DEFAULT_ZONES_WITH_DISTANCE: DeliveryZone[] = [
  { id: 'zone-1', name: 'Consolação', fee: 5.0, distanceKm: 1.5, estimatedTime: '20-30 min', active: true },
  { id: 'zone-2', name: 'Bela Vista / Bixiga', fee: 6.0, distanceKm: 2.5, estimatedTime: '25-35 min', active: true },
  { id: 'zone-3', name: 'Centro Histórico', fee: 7.0, distanceKm: 3.5, estimatedTime: '30-40 min', active: true },
  { id: 'zone-4', name: 'Higienópolis', fee: 7.5, distanceKm: 3.0, estimatedTime: '25-35 min', active: true },
  { id: 'zone-5', name: 'Jardins / Cerqueira César', fee: 8.0, distanceKm: 4.0, estimatedTime: '30-45 min', active: true },
  { id: 'zone-6', name: 'Perdizes', fee: 8.5, distanceKm: 4.8, estimatedTime: '30-45 min', active: true },
  { id: 'zone-7', name: 'Pinheiros', fee: 9.0, distanceKm: 5.5, estimatedTime: '35-50 min', active: true },
  { id: 'zone-8', name: 'Vila Madalena', fee: 10.0, distanceKm: 6.8, estimatedTime: '40-55 min', active: true },
  { id: 'zone-9', name: 'Moema', fee: 12.5, distanceKm: 8.2, estimatedTime: '45-60 min', active: true },
  { id: 'zone-10', name: 'Itaim Bibi', fee: 13.5, distanceKm: 9.0, estimatedTime: '50-65 min', active: true },
];

export const DeliveryRadiusControl: React.FC<DeliveryRadiusControlProps> = ({
  storeSettings,
  onUpdateStoreSettings,
}) => {
  // Radius and calculation state
  const currentArea = storeSettings.deliveryArea || {};
  const [radiusKm, setRadiusKm] = useState<number>(currentArea.radiusKm || 7);
  const [baseFee, setBaseFee] = useState<number>(currentArea.baseFee || 5.0);
  const [baseRadiusKm, setBaseRadiusKm] = useState<number>(currentArea.baseRadiusKm || 3.0);
  const [feePerKm, setFeePerKm] = useState<number>(currentArea.feePerKm || 1.5);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(
    currentArea.freeDeliveryThreshold ?? 120
  );
  const [baseAddress, setBaseAddress] = useState<string>(
    currentArea.baseAddress || 'Rua Augusta, 1000 - Consolação, São Paulo - SP'
  );
  const [allowPickup, setAllowPickup] = useState<boolean>(currentArea.allowPickup ?? true);
  const [zones, setZones] = useState<DeliveryZone[]>(() => {
    if (currentArea.zones && currentArea.zones.length > 0) {
      return currentArea.zones.map((z, idx) => ({
        ...z,
        distanceKm: z.distanceKm || (idx + 1) * 1.2,
      }));
    }
    return DEFAULT_ZONES_WITH_DISTANCE;
  });

  // Simulator distance state
  const [simDistance, setSimDistance] = useState<number>(4.5);

  // Sync state feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual_radar' | 'calc_engine' | 'zones_list'>('visual_radar');

  // New zone form state
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDistance, setNewZoneDistance] = useState('4.0');

  // Synchronize internal state when storeSettings updates from Firebase
  useEffect(() => {
    if (storeSettings.deliveryArea) {
      if (storeSettings.deliveryArea.radiusKm !== undefined) {
        setRadiusKm(storeSettings.deliveryArea.radiusKm);
      }
      if (storeSettings.deliveryArea.baseFee !== undefined) {
        setBaseFee(storeSettings.deliveryArea.baseFee);
      }
      if (storeSettings.deliveryArea.baseRadiusKm !== undefined) {
        setBaseRadiusKm(storeSettings.deliveryArea.baseRadiusKm);
      }
      if (storeSettings.deliveryArea.feePerKm !== undefined) {
        setFeePerKm(storeSettings.deliveryArea.feePerKm);
      }
      if (storeSettings.deliveryArea.freeDeliveryThreshold !== undefined) {
        setFreeDeliveryThreshold(storeSettings.deliveryArea.freeDeliveryThreshold);
      }
      if (storeSettings.deliveryArea.baseAddress) {
        setBaseAddress(storeSettings.deliveryArea.baseAddress);
      }
      if (storeSettings.deliveryArea.allowPickup !== undefined) {
        setAllowPickup(storeSettings.deliveryArea.allowPickup);
      }
      if (storeSettings.deliveryArea.zones && storeSettings.deliveryArea.zones.length > 0) {
        setZones(storeSettings.deliveryArea.zones);
      }
    }
  }, [storeSettings.deliveryArea]);

  // Formula to calculate fee dynamically by distance
  const calculateFeeForDistance = (dist: number): number => {
    if (dist <= baseRadiusKm) {
      return baseFee;
    }
    const extraKm = dist - baseRadiusKm;
    const computed = baseFee + extraKm * feePerKm;
    // Round to nearest 0.50
    return Math.round(computed * 2) / 2;
  };

  // Recalculate fees for all registered zones based on current formula
  const handleRecalculateZoneFees = () => {
    const updated = zones.map(zone => {
      const dist = zone.distanceKm || 3.0;
      const newFee = calculateFeeForDistance(dist);
      return {
        ...zone,
        fee: newFee,
      };
    });
    setZones(updated);
  };

  // Save changes to Firebase Firestore via parent handler
  const handleSaveToFirebase = (overrideZones?: DeliveryZone[], overrideRadius?: number) => {
    setIsSaving(true);
    setSaveSuccess(false);

    const targetRadius = overrideRadius !== undefined ? overrideRadius : radiusKm;
    const targetZones = overrideZones || zones;

    const newDeliveryArea = {
      baseAddress,
      radiusKm: targetRadius,
      baseFee,
      baseRadiusKm,
      feePerKm,
      freeDeliveryThreshold,
      allowPickup,
      calculationMode: 'dynamic_km' as const,
      zones: targetZones,
    };

    const newSettings: StoreSettings = {
      ...storeSettings,
      defaultDeliveryFee: baseFee,
      deliveryArea: newDeliveryArea,
    };

    onUpdateStoreSettings(newSettings);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  // Handle radius change slider / buttons
  const handleRadiusChange = (newRadius: number) => {
    const clamped = Math.max(1, Math.min(30, newRadius));
    setRadiusKm(clamped);
  };

  // Preset buttons
  const RADIUS_PRESETS = [3, 5, 7, 10, 12, 15, 20];

  // Zones statistics
  const zonesInRadius = zones.filter(z => (z.distanceKm || 0) <= radiusKm);
  const zonesOutsideRadius = zones.filter(z => (z.distanceKm || 0) > radiusKm);

  // Coverage area in km2: π * r²
  const coverageAreaKm2 = (Math.PI * Math.pow(radiusKm, 2)).toFixed(1);

  // Estimated max delivery time
  const maxDeliveryTimeMin = Math.round(15 + radiusKm * 2.5);
  const maxDeliveryTimeMax = Math.round(25 + radiusKm * 3.5);

  return (
    <div className="space-y-4">
      {/* Top Banner: Real-time Firebase Status & Quick Action */}
      <div className="bg-gradient-to-r from-[#201d1c] via-[#241f1c] to-[#1c1a19] p-4 rounded-xl border border-[#ff5722]/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff5722]/15 border border-[#ff5722]/30 text-[#ff5722] flex items-center justify-center flex-shrink-0 shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Montserrat'] font-bold text-sm text-white">
                Raio de Atendimento & Cálculo Dinâmico
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-extrabold uppercase">
                Firebase Firestore Ativo
              </span>
            </div>
            <p className="text-[11px] text-[#b4b5b5] mt-0.5">
              Edite o alcance da loja e as taxas de entrega calculadas em tempo real.
            </p>
          </div>
        </div>

        {/* Firebase Sync Button */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Sincronizado!
            </span>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveToFirebase()}
            className="btn-flame text-white px-4 py-2 rounded-xl font-bold font-['Montserrat'] text-xs flex items-center gap-1.5 shadow-lg shadow-[#ff5722]/30 active:scale-95 transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gravando no Firebase...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Salvar no Firebase</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Radius Control Deck */}
      <div className="bg-[#20201f] border border-[#353535] rounded-xl p-5 space-y-5 shadow-xl">
        {/* Slider & Radius Value Display */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <label className="text-xs font-bold text-white font-['Montserrat'] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#ff5722]" />
                <span>Raio Máximo de Atendimento (Alcance em Km)</span>
              </label>
              <span className="text-[11px] text-[#b4b5b5]">
                Determina até qual distância a hamburgueria realiza entregas a partir do endereço base.
              </span>
            </div>

            {/* Glowing Metric Badge */}
            <div className="flex items-center gap-2 bg-[#171616] px-3.5 py-1.5 rounded-xl border border-[#ff5722]/40 shadow-inner">
              <span className="text-[10px] text-[#8e8f8f] font-bold uppercase">Raio Atual:</span>
              <span className="font-mono text-xl font-black text-[#ff5722] tracking-tight">
                {radiusKm} <span className="text-xs text-white">km</span>
              </span>
            </div>
          </div>

          {/* Interactive Range Slider with Flame Styling */}
          <div className="space-y-2 pt-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={radiusKm}
                onChange={e => handleRadiusChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#ff5722] border border-[#353535] focus:outline-none"
              />
            </div>

            {/* Min and Max Markers */}
            <div className="flex justify-between text-[10px] font-mono text-[#8e8f8f]">
              <span>1 km (Ultra local)</span>
              <span>10 km (Intermediário)</span>
              <span>25 km (Regional Máximo)</span>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-[#8e8f8f] font-semibold mr-1">Atalhos rápidos:</span>
            {RADIUS_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handleRadiusChange(preset)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  radiusKm === preset
                    ? 'bg-[#ff5722] text-white shadow-md shadow-[#ff5722]/40 ring-1 ring-white/30'
                    : 'bg-[#181818] hover:bg-[#252525] text-[#b4b5b5] hover:text-white border border-[#353535]'
                }`}
              >
                {preset} km
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#353535]/60 text-xs">
          <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
            <span className="text-[10px] text-[#8e8f8f] uppercase block font-bold">Área Coberta</span>
            <span className="font-mono text-sm font-bold text-white mt-0.5 block">
              ~{coverageAreaKm2} km²
            </span>
          </div>

          <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
            <span className="text-[10px] text-[#8e8f8f] uppercase block font-bold">Bairros no Alcance</span>
            <span className="font-mono text-sm font-bold text-emerald-400 mt-0.5 block">
              {zonesInRadius.length} de {zones.length}
            </span>
          </div>

          <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
            <span className="text-[10px] text-[#8e8f8f] uppercase block font-bold">Tempo de Despacho</span>
            <span className="font-mono text-sm font-bold text-amber-400 mt-0.5 block">
              {maxDeliveryTimeMin} - {maxDeliveryTimeMax} min
            </span>
          </div>

          <div className="bg-[#181818] p-3 rounded-xl border border-[#353535]">
            <span className="text-[10px] text-[#8e8f8f] uppercase block font-bold">Taxa no Raio Máx.</span>
            <span className="font-mono text-sm font-bold text-white mt-0.5 block">
              R$ {calculateFeeForDistance(radiusKm).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Radar Visual vs Engine de Cálculo vs Lista de Bairros */}
      <div className="flex gap-2 border-b border-[#353535] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('visual_radar')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-['Montserrat'] transition-all whitespace-nowrap ${
            activeTab === 'visual_radar'
              ? 'bg-[#ff5722] text-white shadow-md'
              : 'bg-[#181818] text-[#b4b5b5] hover:text-white border border-[#353535]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Radar de Cobertura Visual</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calc_engine')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-['Montserrat'] transition-all whitespace-nowrap ${
            activeTab === 'calc_engine'
              ? 'bg-[#ff5722] text-white shadow-md'
              : 'bg-[#181818] text-[#b4b5b5] hover:text-white border border-[#353535]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fórmula de Taxa por Km & Simulador</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones_list')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-['Montserrat'] transition-all whitespace-nowrap ${
            activeTab === 'zones_list'
              ? 'bg-[#ff5722] text-white shadow-md'
              : 'bg-[#181818] text-[#b4b5b5] hover:text-white border border-[#353535]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bairros & Taxas Individuais ({zones.length})</span>
        </button>
      </div>

      {/* TAB 1: RADAR VISUAL INTERATIVO */}
      {activeTab === 'visual_radar' && (
        <div className="bg-[#20201f] border border-[#353535] rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                <span>Mapa Radar de Atendimento em Tempo Real</span>
                <span className="text-[10px] bg-[#ff5722]/20 text-[#ff8a65] px-2 py-0.5 rounded font-bold">
                  {radiusKm} km de raio
                </span>
              </h4>
              <p className="text-[11px] text-[#b4b5b5]">
                Visualize como a expansão do raio engloba novos bairros e clientes potenciais.
              </p>
            </div>
            <div className="text-[11px] text-[#8e8f8f] bg-[#141414] px-2.5 py-1 rounded-lg border border-[#353535]">
              Centro: <strong className="text-white font-mono">{baseAddress.split(' - ')[0]}</strong>
            </div>
          </div>

          {/* Interactive Radar Box */}
          <div className="relative bg-gradient-to-b from-[#121212] to-[#181717] border border-[#353535] rounded-2xl h-80 flex items-center justify-center overflow-hidden shadow-inner">
            {/* Concentric distance rings scaling with radius */}
            <div
              className="absolute rounded-full border border-dashed border-[#ff5722]/20 pointer-events-none transition-all duration-300"
              style={{ width: '90%', height: '90%' }}
            />
            <div
              className="absolute rounded-full border border-[#ff5722]/30 bg-[#ff5722]/5 pointer-events-none transition-all duration-300"
              style={{ width: '70%', height: '70%' }}
            />
            <div
              className="absolute rounded-full border border-[#ff5722]/40 bg-[#ff5722]/10 pointer-events-none transition-all duration-300"
              style={{ width: '45%', height: '45%' }}
            />
            <div
              className="absolute rounded-full border border-[#ff5722]/60 bg-[#ff5722]/20 pointer-events-none animate-ping"
              style={{ width: '20%', height: '20%' }}
            />

            {/* Crosshair Lines */}
            <div className="absolute w-full h-[1px] bg-[#353535]/60 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-[#353535]/60 pointer-events-none" />

            {/* Central Store Pin */}
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-[#ff5722] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,87,34,0.6)] border-2 border-white animate-bounce-short">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] font-black text-white bg-black/90 px-2 py-0.5 rounded-md mt-1 font-['Montserrat'] border border-[#ff5722] shadow-md whitespace-nowrap">
                {storeSettings.storeName || 'BURGER DOS CRIAS (BASE)'}
              </span>
            </div>

            {/* Plotted Neighborhood Zones on the Radar */}
            {zones.map((zone, idx) => {
              const dist = zone.distanceKm || 3.0;
              const isInside = dist <= radiusKm;

              // Distribute angles in a circular layout
              const angle = (idx * (360 / zones.length) * Math.PI) / 180;
              // Scale distance relative to max display (up to ~12km or radiusKm * 1.3)
              const maxScaleDist = Math.max(12, radiusKm * 1.25);
              const normalizedDist = Math.min(dist / maxScaleDist, 0.42);

              const leftPercent = 50 + Math.cos(angle) * normalizedDist * 100;
              const topPercent = 50 + Math.sin(angle) * normalizedDist * 100;

              return (
                <div
                  key={zone.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer transition-all duration-300"
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                >
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold shadow-md transition-all ${
                      isInside
                        ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:scale-110 ring-1 ring-emerald-500/40'
                        : 'bg-black/70 border-red-500/40 text-gray-400 line-through opacity-70'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isInside ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                      }`}
                    />
                    <span className="truncate max-w-[85px]">{zone.name}</span>
                    <span className="font-mono font-black ml-0.5">
                      R${zone.fee.toFixed(0)}
                    </span>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 p-2 bg-black/95 text-white text-[10px] rounded-lg shadow-xl border border-[#353535] whitespace-nowrap z-30">
                    <p className="font-bold">{zone.name}</p>
                    <p className="text-gray-400">Distância: ~{dist} km</p>
                    <p className="text-emerald-400 font-bold">Taxa: R$ {zone.fee.toFixed(2)}</p>
                    <p className={isInside ? 'text-emerald-400' : 'text-red-400'}>
                      {isInside ? '✓ Dentro do raio de entrega' : '✗ Fora da área de cobertura'}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Corner Range Legend */}
            <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1.5 rounded-lg border border-[#353535] text-[10px] font-mono space-y-0.5">
              <span className="text-[#8e8f8f] block">Cobertura Ativa:</span>
              <span className="text-emerald-400 font-bold block">0 km → {radiusKm} km</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1.5 rounded-lg border border-[#353535] text-[10px] flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white">Atendido</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-gray-400">Fora do Raio</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FÓRMULA DE CÁLCULO DINÂMICO & SIMULADOR */}
      {activeTab === 'calc_engine' && (
        <div className="bg-[#20201f] border border-[#353535] rounded-xl p-5 space-y-5 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-[#353535]">
            <div>
              <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#ff5722]" />
                <span>Configuração da Fórmula Dinâmica de Frete</span>
              </h4>
              <p className="text-[11px] text-[#b4b5b5]">
                Taxa Base fixa para distâncias curtas + acréscimo proporcional por km adicional.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRecalculateZoneFees}
              className="bg-[#252525] hover:bg-[#333] text-[#ff8a65] border border-[#ff5722]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Aplica a fórmula a todos os bairros da lista"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalcular Taxas dos Bairros</span>
            </button>
          </div>

          {/* Formula Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Base Fee */}
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-1">
              <label className="text-[11px] text-[#b4b5b5] font-semibold block">
                1. Taxa Base Inicial
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-bold text-[#8e8f8f]">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={baseFee}
                  onChange={e => setBaseFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg pl-8 pr-2 py-1.5 text-white font-bold font-mono text-sm focus:outline-none focus:border-[#ff5722]"
                />
              </div>
              <span className="text-[10px] text-[#8e8f8f]">Cobrado na área central</span>
            </div>

            {/* Base Radius */}
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-1">
              <label className="text-[11px] text-[#b4b5b5] font-semibold block">
                2. Até Qual Distância (Raio Base)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={baseRadiusKm}
                  onChange={e => setBaseRadiusKm(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-1.5 text-white font-bold font-mono text-sm focus:outline-none focus:border-[#ff5722]"
                />
                <span className="text-xs text-[#8e8f8f] font-bold">km</span>
              </div>
              <span className="text-[10px] text-[#8e8f8f]">Distância coberta pela taxa base</span>
            </div>

            {/* Fee Per Additional Km */}
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-1">
              <label className="text-[11px] text-[#b4b5b5] font-semibold block">
                3. Valor Adicional por Km Excedente
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-bold text-[#ff8a65]">R$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={feePerKm}
                  onChange={e => setFeePerKm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg pl-8 pr-2 py-1.5 text-white font-bold font-mono text-sm focus:outline-none focus:border-[#ff5722]"
                />
              </div>
              <span className="text-[10px] text-[#8e8f8f]">Cobrado por km além dos {baseRadiusKm} km</span>
            </div>
          </div>

          {/* Formula Summary Box */}
          <div className="bg-[#181818] p-3 rounded-xl border border-[#ff5722]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#ff5722] flex-shrink-0" />
              <span className="text-white font-medium">
                Fórmula Ativa: Frete = R$ {baseFee.toFixed(2)} + (Distância - {baseRadiusKm} km) × R$ {feePerKm.toFixed(2)}/km
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Cálculo Dinâmico Automático
            </span>
          </div>

          {/* Simulator Bar */}
          <div className="bg-[#171616] p-4 rounded-xl border border-[#353535] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                Simulador de Entrega: Teste uma Distância
              </span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                Distância: {simDistance} km
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max={radiusKm}
              step="0.5"
              value={simDistance}
              onChange={e => setSimDistance(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#121212] rounded-lg appearance-none cursor-pointer accent-amber-400 border border-[#353535]"
            />

            <div className="p-3 bg-[#121212] rounded-lg border border-[#353535] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#8e8f8f] block">Resultado para {simDistance} km:</span>
                <span className="text-white font-bold text-sm">
                  {simDistance <= baseRadiusKm
                    ? `Taxa Base (dentro de ${baseRadiusKm} km)`
                    : `Taxa Base R$ ${baseFee.toFixed(2)} + ${(simDistance - baseRadiusKm).toFixed(1)} km × R$ ${feePerKm.toFixed(2)}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Taxa Calculada</span>
                <span className="font-mono text-lg font-black text-emerald-400">
                  R$ {calculateFeeForDistance(simDistance).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LISTA DE BAIRROS E TAXAS INDIVIDUAIS */}
      {activeTab === 'zones_list' && (
        <div className="bg-[#20201f] border border-[#353535] rounded-xl p-5 space-y-4 shadow-xl text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-[#353535]">
            <div>
              <h4 className="font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2">
                <span>Tabela de Bairros & Taxas por Distância</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  {zones.length} cadastrados
                </span>
              </h4>
              <p className="text-[11px] text-[#b4b5b5]">
                Bairros com distância maior que {radiusKm} km são automaticamente marcados como fora do alcance.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRecalculateZoneFees}
              className="bg-[#252525] hover:bg-[#333] text-[#ff8a65] border border-[#ff5722]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Taxas dos Bairros pela Fórmula</span>
            </button>
          </div>

          {/* Form to Add New Neighborhood */}
          <div className="bg-[#181818] p-3.5 rounded-xl border border-[#353535] space-y-2">
            <span className="font-bold text-white text-xs block">+ Cadastrar Novo Bairro:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nome do Bairro (Ex: Santana, Tatuapé...)"
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                className="bg-[#121212] border border-[#353535] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff5722]"
              />

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="Distância da Loja (km)"
                  value={newZoneDistance}
                  onChange={e => setNewZoneDistance(e.target.value)}
                  className="w-full bg-[#121212] border border-[#353535] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff5722]"
                />
                <span className="text-xs text-[#8e8f8f] font-bold">km</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newZoneName.trim()) return;
                  const dist = parseFloat(newZoneDistance) || 4.0;
                  const computedFee = calculateFeeForDistance(dist);
                  const newZone: DeliveryZone = {
                    id: 'zone-' + Date.now(),
                    name: newZoneName.trim(),
                    distanceKm: dist,
                    fee: computedFee,
                    estimatedTime: `${Math.round(15 + dist * 3)}-${Math.round(25 + dist * 4)} min`,
                    active: true,
                  };
                  const updated = [...zones, newZone];
                  setZones(updated);
                  setNewZoneName('');
                  handleSaveToFirebase(updated);
                }}
                className="btn-flame text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Bairro
              </button>
            </div>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {zones.map(zone => {
              const dist = zone.distanceKm || 3.0;
              const isInside = dist <= radiusKm;

              return (
                <div
                  key={zone.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isInside
                      ? zone.active
                        ? 'bg-[#181818] border-[#353535]'
                        : 'bg-[#141414] border-[#252525] opacity-60'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = zones.map(z =>
                          z.id === zone.id ? { ...z, active: !z.active } : z
                        );
                        setZones(updated);
                        handleSaveToFirebase(updated);
                      }}
                      className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                        isInside && zone.active
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'bg-[#333] border-[#555]'
                      }`}
                      title={zone.active ? 'Bairro Ativo' : 'Bairro Pausado'}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{zone.name}</span>
                        {!isInside && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold">
                            Fora do Raio ({dist}km &gt; {radiusKm}km)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8e8f8f]">
                        Distância: ~{dist} km • Tempo: {zone.estimatedTime || '25-35 min'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1 text-[10px] text-emerald-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={zone.fee}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = zones.map(z =>
                            z.id === zone.id ? { ...z, fee: val } : z
                          );
                          setZones(updated);
                        }}
                        onBlur={() => handleSaveToFirebase()}
                        className="w-16 bg-[#121212] border border-[#353535] rounded pl-5 pr-1 py-0.5 text-xs font-mono font-bold text-emerald-400 text-right focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = zones.filter(z => z.id !== zone.id);
                        setZones(updated);
                        handleSaveToFirebase(updated);
                      }}
                      className="text-[#8e8f8f] hover:text-red-400 p-1 transition-colors"
                      title="Excluir bairro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
