import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { formatCurrency } from '../../lib/utils';
import { Building2, Layers, Home, X, Compass, Sparkles } from 'lucide-react';

export interface Unit3DData {
  id: string;
  unitNumber: string;
  unitType: string;
  status:
    'available' | 'reserved' | 'occupied' | 'sold' | 'rto_active' | 'under_maintenance' | string;
  floorNumber?: string | number;
  squareMeters?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  listPrice?: number | string;
  facingDirection?: string;
}

export interface Building3DData {
  id: string;
  name: string;
  buildingType?: string;
  floorCount?: number;
  floors?: {
    id: string;
    floorNumber: string | number;
    units?: Unit3DData[];
  }[];
  units?: Unit3DData[];
}

interface BuildingDigitalTwinProps {
  building: Building3DData;
  onSelectUnit?: (unit: Unit3DData) => void;
  onReserveUnit?: (unit: Unit3DData) => void;
  isReadOnly?: boolean;
}

const STATUS_COLORS: Record<
  string,
  { main: string; glow: string; text: string; bg: string; label: string }
> = {
  available: {
    main: '#10B981',
    glow: '#34D399',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    label: 'Available',
  },
  reserved: {
    main: '#F59E0B',
    glow: '#FBBF24',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    label: 'Reserved',
  },
  sold: {
    main: '#EF4444',
    glow: '#F87171',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    label: 'Sold',
  },
  occupied: {
    main: '#E11D48',
    glow: '#FB7185',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    label: 'Occupied',
  },
  rto_active: {
    main: '#0284C7',
    glow: '#38BDF8',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    label: 'RTO Active',
  },
  rented: {
    main: '#6366F1',
    glow: '#818CF8',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    label: 'Rented',
  },
  under_maintenance: {
    main: '#64748B',
    glow: '#94A3B8',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/30',
    label: 'Maintenance',
  },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.available;
}

interface UnitMeshProps {
  unit: Unit3DData;
  position: [number, number, number];
  size: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

const UnitMesh: React.FC<UnitMeshProps> = ({
  unit,
  position,
  size,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorInfo = useMemo(() => getStatusColor(unit.status), [unit.status]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isHovered || isSelected) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.08, 1.12, 1.08), delta * 12);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 12);
    }
  });

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.06}
        smoothness={4}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={isHovered || isSelected ? colorInfo.glow : colorInfo.main}
          roughness={0.2}
          metalness={0.7}
          emissive={isHovered || isSelected ? colorInfo.main : '#0a0f1d'}
          emissiveIntensity={isHovered || isSelected ? 0.75 : 0.15}
          transparent
          opacity={0.94}
        />
      </RoundedBox>
    </group>
  );
};

export const BuildingDigitalTwin: React.FC<BuildingDigitalTwinProps> = ({
  building,
  onSelectUnit,
  onReserveUnit,
}) => {
  const [hoveredUnit, setHoveredUnit] = useState<Unit3DData | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit3DData | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Organize floors and units
  const processedFloors = useMemo(() => {
    const floorsMap = new Map<number, Unit3DData[]>();
    const totalFloorCount = Math.max(building.floorCount || 8, 4);

    if (building.units && building.units.length > 0) {
      building.units.forEach((u) => {
        const fNum =
          typeof u.floorNumber === 'number'
            ? u.floorNumber
            : parseInt(String(u.floorNumber || 1), 10) || 1;
        if (!floorsMap.has(fNum)) floorsMap.set(fNum, []);
        floorsMap.get(fNum)!.push(u);
      });
    } else if (building.floors && building.floors.length > 0) {
      building.floors.forEach((f, idx) => {
        const fNum =
          typeof f.floorNumber === 'number'
            ? f.floorNumber
            : parseInt(String(f.floorNumber || idx + 1), 10) || idx + 1;
        floorsMap.set(fNum, f.units || []);
      });
    }

    const result: { floorNumber: number; units: Unit3DData[] }[] = [];
    for (let f = 1; f <= totalFloorCount; f++) {
      const unitsOnFloor = floorsMap.get(f) || [];
      if (unitsOnFloor.length === 0) {
        for (let u = 1; u <= 4; u++) {
          unitsOnFloor.push({
            id: `gen-${f}-${u}`,
            unitNumber: `${f}0${u}`,
            unitType: u === 1 ? 'studio' : u === 2 ? 'one_br' : u === 3 ? 'two_br' : 'three_br',
            status:
              u === 1 ? 'available' : u === 2 ? 'reserved' : u === 3 ? 'rto_active' : 'occupied',
            floorNumber: f,
            squareMeters: u * 28 + 24,
            bedrooms: u === 1 ? 0 : u === 2 ? 1 : u === 3 ? 2 : 3,
            bathrooms: u === 4 ? 2 : 1,
            listPrice: 3500000 + f * 250000 + u * 400000,
          });
        }
      }
      result.push({ floorNumber: f, units: unitsOnFloor });
    }
    return result;
  }, [building]);

  const handleUnitClick = (unit: Unit3DData) => {
    setSelectedUnit(unit);
    if (onSelectUnit) onSelectUnit(unit);
  };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none"
      style={{ backgroundColor: '#070b14', border: '1px solid #1e293b' }}
    >
      {/* 1. Control Header Bar (Clean flexbox row - NO OVERLAPPING) */}
      <div
        className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: '#0a0f1d', borderBottom: '1px solid #1e293b' }}
      >
        {/* Left: Building Title */}
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl text-emerald-400"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide" style={{ color: '#ffffff' }}>
                {building.name}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                3D Live Twin
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {processedFloors.length} Architectural Floors • Click any unit to inspect
            </p>
          </div>
        </div>

        {/* Middle: Floor Filter Buttons */}
        <div
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl"
          style={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
        >
          <button
            onClick={() => setSelectedFloor('all')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            style={
              selectedFloor === 'all'
                ? {
                    backgroundColor: '#10b981',
                    color: '#020617',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
                  }
                : { backgroundColor: 'transparent', color: '#94a3b8' }
            }
          >
            All Floors
          </button>
          {processedFloors.map((f) => (
            <button
              key={f.floorNumber}
              onClick={() => setSelectedFloor(f.floorNumber)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={
                selectedFloor === f.floorNumber
                  ? {
                      backgroundColor: '#10b981',
                      color: '#020617',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
                    }
                  : { backgroundColor: 'transparent', color: '#94a3b8' }
              }
            >
              F{f.floorNumber}
            </button>
          ))}
        </div>

        {/* Right: Status Color Legend */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(STATUS_COLORS)
            .slice(0, 5)
            .map(([key, val]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  color: '#e2e8f0',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: val.main, boxShadow: `0 0 8px ${val.glow}` }}
                />
                <span className="text-[11px]" style={{ color: '#f1f5f9' }}>
                  {val.label}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* 2. Dedicated 3D Canvas Viewport */}
      <div className="relative w-full h-[540px] bg-[#070b14] overflow-hidden">
        <Canvas
          camera={{ position: [11, 10, 15], fov: 42 }}
          onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={['#070b14']} />
          <ambientLight intensity={0.95} />
          <directionalLight position={[15, 25, 18]} intensity={2.2} color="#ffffff" />
          <directionalLight position={[-12, 12, -12]} intensity={0.8} color="#38BDF8" />
          <pointLight position={[0, 8, 0]} intensity={1.2} color="#34D399" />

          {/* 3D Scene Contents */}
          <group position={[0, -2.8, 0]}>
            {/* Subtle Ground Grid Plate */}
            <gridHelper args={[26, 26, '#1e293b', '#0f172a']} position={[0, 0, 0]} />

            {/* Building Floors & Unit Cubes */}
            {processedFloors.map((floor) => {
              const isFloorVisible = selectedFloor === 'all' || selectedFloor === floor.floorNumber;
              if (!isFloorVisible) return null;

              const yPos = (floor.floorNumber - 1) * 1.35 + 0.7;

              return (
                <group key={floor.floorNumber} position={[0, yPos, 0]}>
                  {/* Floor Slab Plate */}
                  <RoundedBox
                    args={[4.6, 0.12, 4.6]}
                    radius={0.04}
                    smoothness={3}
                    position={[0, -0.6, 0]}
                  >
                    <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                  </RoundedBox>

                  {/* Units Matrix on this floor */}
                  {floor.units.map((unit, uIdx) => {
                    const cols = 2;
                    const row = Math.floor(uIdx / cols);
                    const col = uIdx % cols;
                    const x = (col - 0.5) * 1.9;
                    const z = (row - 0.5) * 1.9;

                    const isHovered = hoveredUnit?.id === unit.id;
                    const isSelected = selectedUnit?.id === unit.id;

                    return (
                      <UnitMesh
                        key={unit.id}
                        unit={unit}
                        position={[x, 0, z]}
                        size={[1.65, 1.0, 1.65]}
                        isHovered={isHovered}
                        isSelected={isSelected}
                        onPointerOver={(e) => {
                          e.stopPropagation();
                          setHoveredUnit(unit);
                        }}
                        onPointerOut={(e) => {
                          e.stopPropagation();
                          setHoveredUnit((prev) => (prev?.id === unit.id ? null : prev));
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnitClick(unit);
                        }}
                      />
                    );
                  })}
                </group>
              );
            })}
          </group>

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={6}
            maxDistance={32}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>

        {/* Bottom Right Controls Helper */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Rotate: Left Click • Pan: Right Click • Zoom: Scroll</span>
        </div>

        {/* Live Raycasting Floating Hover Tooltip */}
        {hoveredUnit && (
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 transition-opacity duration-150"
            style={{ left: mousePos.x, top: mousePos.y }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">Unit {hoveredUnit.unitNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusColor(hoveredUnit.status).text} ${getStatusColor(hoveredUnit.status).bg} border`}
                >
                  {hoveredUnit.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-slate-300 flex items-center justify-between">
                <span>Layout:</span>
                <span className="font-medium text-white capitalize">
                  {hoveredUnit.unitType.replace('_', ' ')}
                </span>
              </div>
              {hoveredUnit.squareMeters && (
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Floor Area:</span>
                  <span className="font-medium text-white">{hoveredUnit.squareMeters} sqm</span>
                </div>
              )}
              {hoveredUnit.listPrice && (
                <div className="text-slate-300 flex items-center justify-between">
                  <span>Price:</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(Number(hoveredUnit.listPrice))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Unit Deep Inspection Drawer */}
        {selectedUnit && (
          <div className="absolute top-0 right-0 w-84 max-w-full h-full bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 p-6 z-30 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      Unit {selectedUnit.unitNumber}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Floor {selectedUnit.floorNumber || 1} • {building.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Occupancy Status</span>
                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-[11px] uppercase ${getStatusColor(selectedUnit.status).text} ${getStatusColor(selectedUnit.status).bg} border`}
                    >
                      {selectedUnit.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Unit Layout</span>
                    <span className="font-semibold text-white capitalize">
                      {selectedUnit.unitType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Floor Area</span>
                    <span className="font-semibold text-white">
                      {selectedUnit.squareMeters || '—'} sqm
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bedrooms / Baths</span>
                    <span className="font-semibold text-white">
                      {selectedUnit.bedrooms || 1} Bed / {selectedUnit.bathrooms || 1} Bath
                    </span>
                  </div>
                </div>

                {selectedUnit.listPrice && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                    <span className="text-[11px] text-emerald-400 uppercase font-semibold tracking-wider">
                      Indicative Valuation
                    </span>
                    <div className="text-xl font-black text-emerald-400">
                      {formatCurrency(Number(selectedUnit.listPrice))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              {onReserveUnit && selectedUnit.status === 'available' && (
                <button
                  onClick={() => onReserveUnit(selectedUnit)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Reserve Unit Now
                </button>
              )}
              <button
                onClick={() => setSelectedUnit(null)}
                className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
