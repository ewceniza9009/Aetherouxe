import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import {
  Trees,
  MapPin,
  CheckCircle,
  Sparkles,
  X,
  Bed,
  Bath,
  Maximize,
  Compass,
  Home,
} from 'lucide-react';
import type { Unit3DData } from './BuildingDigitalTwin';

export interface SubdivisionMasterplanProps {
  subdivision: {
    id: string;
    name: string;
    projectName?: string;
    units: Unit3DData[];
    activeUnitId?: string;
  };
  onSelectUnit?: (unit: Unit3DData) => void;
  onReserveUnit?: (unit: Unit3DData) => void;
}

const STATUS_COLORS: Record<
  string,
  { main: string; glow: string; text: string; bg: string; label: string; stroke: string }
> = {
  available: {
    main: '#10B981',
    glow: '#34D399',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    stroke: '#10B981',
    label: 'Available',
  },
  reserved: {
    main: '#F59E0B',
    glow: '#FBBF24',
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
    stroke: '#F59E0B',
    label: 'Reserved',
  },
  sold: {
    main: '#EF4444',
    glow: '#F87171',
    text: 'text-rose-400',
    bg: 'bg-rose-500/15',
    stroke: '#EF4444',
    label: 'Sold',
  },
  occupied: {
    main: '#E11D48',
    glow: '#FB7185',
    text: 'text-rose-400',
    bg: 'bg-rose-500/15',
    stroke: '#E11D48',
    label: 'Occupied',
  },
  rto_active: {
    main: '#0284C7',
    glow: '#38BDF8',
    text: 'text-sky-400',
    bg: 'bg-sky-500/15',
    stroke: '#0284C7',
    label: 'RTO Active',
  },
  rented: {
    main: '#6366F1',
    glow: '#818CF8',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    stroke: '#6366F1',
    label: 'Rented',
  },
  under_maintenance: {
    main: '#64748B',
    glow: '#94A3B8',
    text: 'text-slate-400',
    bg: 'bg-slate-500/15',
    stroke: '#64748B',
    label: 'Maintenance',
  },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.available;
}

export const SubdivisionMasterplanView: React.FC<SubdivisionMasterplanProps> = ({
  subdivision,
  onSelectUnit,
  onReserveUnit,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<Unit3DData | null>(
    subdivision.units.find((u) => u.id === subdivision.activeUnitId) || null,
  );
  const [hoveredUnit, setHoveredUnit] = useState<Unit3DData | null>(null);

  const unitsList =
    subdivision.units.length > 0
      ? subdivision.units
      : [
          {
            id: 'l-1',
            unitNumber: 'Blk 1 Lot 1',
            unitType: 'house_and_lot',
            status: 'available',
            squareMeters: 240,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 16500000,
          },
          {
            id: 'l-2',
            unitNumber: 'Blk 1 Lot 2',
            unitType: 'house_and_lot',
            status: 'sold',
            squareMeters: 240,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 16500000,
          },
          {
            id: 'l-3',
            unitNumber: 'Blk 1 Lot 3',
            unitType: 'house_and_lot',
            status: 'reserved',
            squareMeters: 260,
            bedrooms: 4,
            bathrooms: 3,
            listPrice: 18200000,
          },
          {
            id: 'l-4',
            unitNumber: 'Blk 1 Lot 4',
            unitType: 'house_and_lot',
            status: 'occupied',
            squareMeters: 280,
            bedrooms: 4,
            bathrooms: 3.5,
            listPrice: 19800000,
          },
          {
            id: 'l-5',
            unitNumber: 'Blk 2 Lot 1',
            unitType: 'house_and_lot',
            status: 'available',
            squareMeters: 220,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 15400000,
          },
          {
            id: 'l-6',
            unitNumber: 'Blk 2 Lot 2',
            unitType: 'house_and_lot',
            status: 'rto_active',
            squareMeters: 240,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 16800000,
          },
          {
            id: 'l-7',
            unitNumber: 'Blk 2 Lot 3',
            unitType: 'house_and_lot',
            status: 'available',
            squareMeters: 310,
            bedrooms: 4,
            bathrooms: 3,
            listPrice: 21500000,
          },
          {
            id: 'l-8',
            unitNumber: 'Blk 2 Lot 4',
            unitType: 'house_and_lot',
            status: 'sold',
            squareMeters: 240,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 16500000,
          },
        ];

  // Organize into Block 1 and Block 2
  const half = Math.ceil(unitsList.length / 2);
  const block1 = unitsList.slice(0, half);
  const block2 = unitsList.slice(half);

  const handleUnitClick = (unit: Unit3DData) => {
    setSelectedUnit(unit);
    if (onSelectUnit) onSelectUnit(unit);
  };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none"
      style={{ backgroundColor: '#070b14', border: '1px solid #1e293b' }}
    >
      {/* Header Bar */}
      <div
        className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: '#0a0f1d', borderBottom: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">{subdivision.name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Subdivision Masterplan & Lot Plotter
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gated Estate Subdivision • Ground Parcels with Block & Lot Land Titles
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {Object.entries(STATUS_COLORS)
            .slice(0, 5)
            .map(([statusKey, cfg]) => (
              <div
                key={statusKey}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.main }} />
                <span>{cfg.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Main Masterplan Canvas */}
      <div className="relative w-full h-[480px] bg-gradient-to-b from-[#070b14] via-[#091224] to-[#040813] overflow-hidden p-6 flex items-center justify-center">
        {/* Landscaped Estate Masterplan Canvas SVG */}
        <div className="w-full max-w-4xl h-full flex flex-col justify-between relative bg-slate-950/60 rounded-xl border border-slate-800/80 p-5 backdrop-blur-sm">
          {/* North Direction Marker */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>N 14°35' E</span>
          </div>

          {/* Block 1 (North Parcel Row) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span className="uppercase tracking-widest text-[11px] text-emerald-400">
                Block 1 — Garden Enclave
              </span>
              <span className="text-[10px] text-slate-500">North Ridge Boulevard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {block1.map((unit) => {
                const color = getStatusColor(unit.status);
                const isSelected = selectedUnit?.id === unit.id;
                const isHovered = hoveredUnit?.id === unit.id;

                return (
                  <button
                    key={unit.id}
                    onClick={() => handleUnitClick(unit)}
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                    className={`relative p-3 rounded-xl transition-all text-left flex flex-col justify-between min-h-[110px] border ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                        : isHovered
                          ? 'border-slate-500 bg-slate-800/60 scale-[1.02]'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono font-bold text-white text-xs">
                          {unit.unitNumber.includes('Lot')
                            ? unit.unitNumber
                            : `Lot ${unit.unitNumber}`}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color.main }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}
                      >
                        {unit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="border-t border-slate-800/80 pt-1.5 mt-2 flex items-center justify-between text-[11px] text-slate-300">
                      <span>{unit.squareMeters ? `${unit.squareMeters} sqm` : '240 sqm'}</span>
                      {unit.listPrice && (
                        <span className="font-bold text-emerald-400 text-[10px]">
                          {formatCurrency(Number(unit.listPrice))}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Central Access Avenue / Driveway */}
          <div className="my-2 py-2 px-4 rounded-lg bg-slate-900/90 border border-dashed border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[10px] tracking-widest font-mono uppercase text-slate-400">
              ━━━ 12-Meter Concrete Access Road (Main Drive) ━━━
            </span>
            <span className="text-[10px] font-bold text-amber-400/80">Speed Limit: 20 km/h</span>
          </div>

          {/* Block 2 (South Parcel Row) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span className="uppercase tracking-widest text-[11px] text-teal-400">
                Block 2 — Parkside Crest
              </span>
              <span className="text-[10px] text-slate-500">Clubhouse & Amenity Access</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {block2.map((unit) => {
                const color = getStatusColor(unit.status);
                const isSelected = selectedUnit?.id === unit.id;
                const isHovered = hoveredUnit?.id === unit.id;

                return (
                  <button
                    key={unit.id}
                    onClick={() => handleUnitClick(unit)}
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                    className={`relative p-3 rounded-xl transition-all text-left flex flex-col justify-between min-h-[110px] border ${
                      isSelected
                        ? 'ring-2 ring-teal-400 border-teal-400 bg-teal-950/40 shadow-lg shadow-teal-500/20'
                        : isHovered
                          ? 'border-slate-500 bg-slate-800/60 scale-[1.02]'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono font-bold text-white text-xs">
                          {unit.unitNumber.includes('Lot')
                            ? unit.unitNumber
                            : `Lot ${unit.unitNumber}`}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color.main }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}
                      >
                        {unit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="border-t border-slate-800/80 pt-1.5 mt-2 flex items-center justify-between text-[11px] text-slate-300">
                      <span>{unit.squareMeters ? `${unit.squareMeters} sqm` : '240 sqm'}</span>
                      {unit.listPrice && (
                        <span className="font-bold text-emerald-400 text-[10px]">
                          {formatCurrency(Number(unit.listPrice))}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Lot Deep Inspection Drawer */}
        {selectedUnit && (
          <div className="absolute top-0 right-0 w-84 max-w-full h-full bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 p-6 z-30 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">
                      {selectedUnit.unitNumber.includes('Lot')
                        ? selectedUnit.unitNumber
                        : `Lot ${selectedUnit.unitNumber}`}
                    </h4>
                    <p className="text-xs text-slate-400">Single-Family House & Lot Title</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusColor(selectedUnit.status).text} ${getStatusColor(selectedUnit.status).bg} border`}
                  >
                    {selectedUnit.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5 text-emerald-400" /> Lot Area
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.squareMeters ? `${selectedUnit.squareMeters} sqm` : '240 sqm'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5 text-teal-400" /> Floor Area
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.squareMeters
                        ? `${Math.round(Number(selectedUnit.squareMeters) * 0.75)} sqm`
                        : '180 sqm'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" /> Bedrooms
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.bedrooms ?? 3} Bedrooms
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-slate-400" /> Bathrooms
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.bathrooms ?? 2} Baths
                    </span>
                  </div>
                </div>

                {selectedUnit.listPrice && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
                    <span className="font-medium">Total Contract Price:</span>
                    <span className="text-base font-black">
                      {formatCurrency(Number(selectedUnit.listPrice))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              {onSelectUnit && (
                <button
                  onClick={() => onSelectUnit(selectedUnit)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Parcel Details
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
