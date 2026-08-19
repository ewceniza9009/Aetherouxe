import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { formatCurrency } from '../../lib/utils';
import {
  Building2,
  Maximize2,
  Sparkles,
  Layers,
  Info,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  X,
  Compass,
} from 'lucide-react';

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

const STATUS_COLORS: Record<string, { main: string; glow: string; text: string; label: string }> = {
  available: { main: '#10B981', glow: '#34D399', text: 'text-emerald-400', label: 'Available' },
  reserved: { main: '#F59E0B', glow: '#FBBF24', text: 'text-amber-400', label: 'Reserved' },
  sold: { main: '#EF4444', glow: '#F87171', text: 'text-rose-400', label: 'Sold' },
  occupied: { main: '#E11D48', glow: '#FB7185', text: 'text-rose-400', label: 'Occupied' },
  rto_active: { main: '#0284C7', glow: '#38BDF8', text: 'text-sky-400', label: 'RTO Active' },
  rented: { main: '#6366F1', glow: '#818CF8', text: 'text-indigo-400', label: 'Rented' },
  under_maintenance: {
    main: '#64748B',
    glow: '#94A3B8',
    text: 'text-slate-400',
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
      meshRef.current.scale.lerp(new THREE.Vector3(1.08, 1.15, 1.08), delta * 12);
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
          roughness={0.25}
          metalness={0.6}
          emissive={isHovered || isSelected ? colorInfo.main : '#000000'}
          emissiveIntensity={isHovered || isSelected ? 0.6 : 0.05}
          transparent
          opacity={0.92}
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
    const totalFloorCount = Math.max(building.floorCount || 6, 4);

    // Group units by floor
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

    // Ensure we have floor rows
    const result: { floorNumber: number; units: Unit3DData[] }[] = [];
    for (let f = 1; f <= totalFloorCount; f++) {
      const unitsOnFloor = floorsMap.get(f) || [];
      if (unitsOnFloor.length === 0) {
        // Procedural fallback units per floor
        for (let u = 1; u <= 4; u++) {
          unitsOnFloor.push({
            id: `gen-${f}-${u}`,
            unitNumber: `${f}0${u}`,
            unitType: u === 1 ? 'studio' : u === 2 ? 'one_br' : u === 3 ? 'two_br' : 'three_br',
            status:
              u === 1 ? 'available' : u === 2 ? 'reserved' : u === 3 ? 'rto_active' : 'occupied',
            floorNumber: f,
            squareMeters: u * 28 + 24,
            bedrooms: u - 1,
            bathrooms: u > 2 ? 2 : 1,
            listPrice: (u * 28 + 24) * 115000,
            facingDirection:
              u === 1
                ? 'North (Skyline View)'
                : u === 2
                  ? 'East (Sunrise View)'
                  : 'South (Pool View)',
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
    <div className="relative w-full h-[650px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 shadow-lg">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">{building.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-emerald-400" />
            3D Digital Twin • {processedFloors.length} Floors
          </p>
        </div>
      </div>

      {/* Status Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700/60 shadow-lg">
        {Object.entries(STATUS_COLORS)
          .slice(0, 5)
          .map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-xs text-slate-300"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: val.main }}
              />
              <span>{val.label}</span>
            </div>
          ))}
      </div>

      {/* Floor Filter Controls */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          onClick={() => setSelectedFloor('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            selectedFloor === 'all'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Floors
        </button>
        {processedFloors.map((f) => (
          <button
            key={f.floorNumber}
            onClick={() => setSelectedFloor(f.floorNumber)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedFloor === f.floorNumber
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            F{f.floorNumber}
          </button>
        ))}
      </div>

      {/* R3F 3D Canvas */}
      <Canvas
        camera={{ position: [9, 8, 12], fov: 45 }}
        onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[12, 20, 15]} intensity={1.5} />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#38BDF8" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />

        {/* 3D Scene Contents */}
        <group position={[0, -2.5, 0]}>
          {/* Ground grid */}
          <gridHelper args={[24, 24, '#334155', '#1e293b']} position={[0, 0, 0]} />

          {/* Building Floors & Unit Cubes */}
          {processedFloors.map((floor) => {
            const isFloorVisible = selectedFloor === 'all' || selectedFloor === floor.floorNumber;
            if (!isFloorVisible) return null;

            const yPos = (floor.floorNumber - 1) * 1.25 + 0.6;
            const unitsCount = floor.units.length;

            return (
              <group key={floor.floorNumber} position={[0, yPos, 0]}>
                {/* Floor Slab Plate */}
                <RoundedBox
                  args={[4.4, 0.12, 4.4]}
                  radius={0.03}
                  smoothness={2}
                  position={[0, -0.55, 0]}
                >
                  <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
                </RoundedBox>

                {/* Floor Number Indicator */}
                <Text
                  position={[-2.4, 0, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                  fontSize={0.28}
                  color="#94A3B8"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`F${floor.floorNumber}`}
                </Text>

                {/* Units Matrix on this floor */}
                {floor.units.map((unit, uIdx) => {
                  // Position units around the perimeter of the floor slab
                  const cols = 2;
                  const row = Math.floor(uIdx / cols);
                  const col = uIdx % cols;
                  const x = (col - 0.5) * 1.8;
                  const z = (row - 0.5) * 1.8;

                  const isHovered = hoveredUnit?.id === unit.id;
                  const isSelected = selectedUnit?.id === unit.id;

                  return (
                    <UnitMesh
                      key={unit.id}
                      unit={unit}
                      position={[x, 0, z]}
                      size={[1.6, 0.95, 1.6]}
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
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>

      {/* Live Raycasting Floating Hover Tooltip */}
      {hoveredUnit && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 transition-opacity duration-150"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1 min-w-[180px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white text-sm">Unit {hoveredUnit.unitNumber}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getStatusColor(hoveredUnit.status).text} bg-slate-800`}
              >
                {hoveredUnit.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-slate-300 flex items-center justify-between">
              <span>Type:</span>
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
                <span>List Price:</span>
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
        <div className="absolute top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 p-6 z-20 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Unit {selectedUnit.unitNumber}</h4>
                  <p className="text-xs text-slate-400">Floor {selectedUnit.floorNumber || 1}</p>
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
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] uppercase ${getStatusColor(selectedUnit.status).text} bg-slate-900 border border-slate-800`}
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

              {selectedUnit.facingDirection && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-300">
                  <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{selectedUnit.facingDirection}</span>
                </div>
              )}

              {selectedUnit.listPrice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400/80 uppercase font-semibold">
                    Total Price / Value
                  </span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {formatCurrency(Number(selectedUnit.listPrice))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            {selectedUnit.status === 'available' && onReserveUnit && (
              <button
                onClick={() => onReserveUnit(selectedUnit)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                Reserve Unit Now
              </button>
            )}
            <button
              onClick={() => setSelectedUnit(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
