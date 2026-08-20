import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { formatCurrency } from '../../lib/utils';
import {
  Building2,
  Layers,
  Home,
  X,
  Compass,
  Sparkles,
  Star,
  Sun,
  Moon,
  Eye,
  Car,
  Trees,
} from 'lucide-react';
import { TownhouseClusterView } from './TownhouseClusterView';
import { SubdivisionMasterplanView } from './SubdivisionMasterplanView';

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
  isCurrentProperty?: boolean;
}

export interface Building3DData {
  id: string;
  name: string;
  buildingType?: string;
  propertyType?: string;
  projectType?: string;
  floorCount?: number;
  floors?: {
    id: string;
    floorNumber: string | number;
    units?: Unit3DData[];
  }[];
  units?: Unit3DData[];
}

export interface BuildingDigitalTwinProps {
  building: Building3DData;
  highlightedUnitId?: string;
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
  return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.available;
}

/* ── Floating Sims-Style Plumbob Diamond ── */
const TowerPlumbob: React.FC<{ color?: string }> = ({ color = '#fbbf24' }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.04;
    meshRef.current.position.y = 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
  });

  return (
    <mesh ref={meshRef} position={[0, 1.3, 0]}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

/* ── Stylized Low-Poly Tree ── */
const TowerTree: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <Cylinder args={[0.08, 0.12, 0.7, 6]} position={[0, 0.35, 0]}>
      <meshStandardMaterial color="#78350f" roughness={0.9} />
    </Cylinder>
    <mesh position={[0, 0.9, 0]}>
      <dodecahedronGeometry args={[0.45, 1]} />
      <meshStandardMaterial color="#15803d" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.3, 0]}>
      <dodecahedronGeometry args={[0.32, 1]} />
      <meshStandardMaterial color="#16a34a" roughness={0.6} />
    </mesh>
  </group>
);

/* ── Stylized Street Lamp ── */
const TowerStreetLamp: React.FC<{ position: [number, number, number]; isNight: boolean }> = ({
  position,
  isNight,
}) => (
  <group position={position}>
    <Cylinder args={[0.04, 0.06, 1.8, 8]} position={[0, 0.9, 0]}>
      <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
    </Cylinder>
    <mesh position={[0, 1.85, 0]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial
        color={isNight ? '#fef08a' : '#94a3b8'}
        emissive={isNight ? '#facc15' : '#000000'}
        emissiveIntensity={isNight ? 1.5 : 0}
      />
    </mesh>
    {isNight && <pointLight position={[0, 1.85, 0]} intensity={1.8} color="#fef08a" distance={5} />}
  </group>
);

/* ── Stylized Miniature Car ── */
const TowerCar: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}> = ({ position, rotation = [0, 0, 0], color = '#3b82f6' }) => (
  <group position={position} rotation={rotation}>
    {/* Body */}
    <RoundedBox args={[0.8, 0.3, 1.5]} radius={0.05} position={[0, 0.15, 0]}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </RoundedBox>
    {/* Cabin */}
    <RoundedBox args={[0.68, 0.24, 0.8]} radius={0.03} position={[0, 0.36, -0.08]}>
      <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
    </RoundedBox>
    {/* Wheels */}
    {[-0.4, 0.4].map((x) =>
      [-0.4, 0.4].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.09, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.07, 10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      )),
    )}
  </group>
);

interface UnitMeshProps {
  unit: Unit3DData;
  position: [number, number, number];
  size: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isNight: boolean;
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
  isHighlighted,
  isNight,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorInfo = useMemo(() => getStatusColor(unit.status), [unit.status]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isHovered || isSelected || isHighlighted) {
      const pulse = isHighlighted ? Math.sin(state.clock.elapsedTime * 4) * 0.05 + 1.05 : 1.08;
      meshRef.current.scale.lerp(new THREE.Vector3(pulse, pulse * 1.05, pulse), delta * 12);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 12);
    }
  });

  return (
    <group position={position}>
      {(isHighlighted || isSelected) && (
        <TowerPlumbob color={isHighlighted ? '#fbbf24' : '#38bdf8'} />
      )}
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
          color={
            isHighlighted ? '#fbbf24' : isHovered || isSelected ? colorInfo.glow : colorInfo.main
          }
          roughness={0.2}
          metalness={0.7}
          emissive={
            isNight
              ? '#fbbf24'
              : isHighlighted
                ? '#f59e0b'
                : isHovered || isSelected
                  ? colorInfo.main
                  : '#0a0f1d'
          }
          emissiveIntensity={
            isNight ? 0.5 : isHighlighted ? 0.95 : isHovered || isSelected ? 0.75 : 0.15
          }
          transparent
          opacity={0.94}
        />
      </RoundedBox>
    </group>
  );
};

export const CondoTowerTwinView: React.FC<BuildingDigitalTwinProps> = ({
  building,
  highlightedUnitId,
  onSelectUnit,
  onReserveUnit,
}) => {
  const [hoveredUnit, setHoveredUnit] = useState<Unit3DData | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit3DData | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Separate residential units from dedicated parking slots
  const { residentialUnits, parkingUnits } = useMemo(() => {
    const all = building.units || [];
    const res: Unit3DData[] = [];
    const park: Unit3DData[] = [];
    all.forEach((u) => {
      if (u.unitType?.toLowerCase() === 'parking' || u.unitNumber.startsWith('P-')) {
        park.push(u);
      } else {
        res.push(u);
      }
    });
    return { residentialUnits: res, parkingUnits: park };
  }, [building.units]);

  // Auto-select highlighted unit on initial load without hiding the tower
  useEffect(() => {
    if (highlightedUnitId && building.units) {
      const found = building.units.find((u) => u.id === highlightedUnitId);
      if (found) {
        setSelectedUnit(found);
      }
    }
  }, [highlightedUnitId, building.units]);

  // Organize floors and residential units
  const processedFloors = useMemo(() => {
    const floorsMap = new Map<number, Unit3DData[]>();

    if (residentialUnits.length > 0) {
      residentialUnits.forEach((u) => {
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
        floorsMap.set(
          fNum,
          (f.units || []).filter((u) => u.unitType?.toLowerCase() !== 'parking'),
        );
      });
    }

    const actualMaxFloor = Array.from(floorsMap.keys()).reduce((max, f) => Math.max(max, f), 1);
    const totalFloorCount = Math.max(
      actualMaxFloor,
      building.floorCount || 1,
      building.floors?.length || 1,
    );

    const result: { floorNumber: number; units: Unit3DData[] }[] = [];
    for (let f = 1; f <= totalFloorCount; f++) {
      const unitsOnFloor = floorsMap.get(f) || [];
      result.push({ floorNumber: f, units: unitsOnFloor });
    }
    return result;
  }, [residentialUnits, building]);

  const handleUnitClick = (unit: Unit3DData) => {
    setSelectedUnit(unit);
    if (onSelectUnit) onSelectUnit(unit);
  };

  const towerHeight = processedFloors.length * 1.35;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none"
      style={{ backgroundColor: '#070b14', border: '1px solid #1e293b' }}
    >
      {/* 1. Control Header Bar */}
      <div
        className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: '#0a0f1d', borderBottom: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-500/30 text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">{building.name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                The Sims 3D Tower & Estate
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {processedFloors.length} Floors • Podium Amenity Deck, Driveways, Cars & Trees
            </p>
          </div>
        </div>

        {/* Floor Switcher & Time of Day Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time of Day */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setTimeOfDay('day')}
              className={`p-1.5 rounded-md transition-all ${
                timeOfDay === 'day'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Daylight"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeOfDay('sunset')}
              className={`p-1.5 rounded-md transition-all ${
                timeOfDay === 'sunset'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Hour Sunset"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              className={`p-1.5 rounded-md transition-all ${
                timeOfDay === 'night'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Night Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Floors */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFloor === 'all'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Floors
            </button>
            {processedFloors.map((f) => (
              <button
                key={f.floorNumber}
                onClick={() => setSelectedFloor(f.floorNumber)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedFloor === f.floorNumber
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                F{f.floorNumber}
              </button>
            ))}
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

      {/* 2. Main 3D Canvas Diorama */}
      <div
        className={`relative w-full h-[560px] overflow-hidden transition-colors duration-500 ${
          timeOfDay === 'night'
            ? 'bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#090d16]'
            : timeOfDay === 'sunset'
              ? 'bg-gradient-to-b from-[#fdba74] via-[#f97316] to-[#431407]'
              : 'bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-[#f8fafc]'
        }`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <Canvas camera={{ position: [14, 12, 18], fov: 38 }} shadows>
          {/* High-Key Architectural Lighting Across All Modes (Daylight, Sunset & Illuminated Night) */}
          <ambientLight
            intensity={timeOfDay === 'night' ? 1.6 : timeOfDay === 'sunset' ? 1.8 : 2.6}
            color={
              timeOfDay === 'sunset' ? '#ffedd5' : timeOfDay === 'night' ? '#bfdbfe' : '#ffffff'
            }
          />
          <directionalLight
            position={[18, 30, 22]}
            intensity={timeOfDay === 'night' ? 2.2 : timeOfDay === 'sunset' ? 3.5 : 3.2}
            color={
              timeOfDay === 'sunset' ? '#fed7aa' : timeOfDay === 'night' ? '#dbeafe' : '#ffffff'
            }
            castShadow
          />
          {/* Fill Light so all sides remain crystal clear */}
          <directionalLight
            position={[-18, 20, -16]}
            intensity={timeOfDay === 'night' ? 1.2 : 1.8}
            color={timeOfDay === 'night' ? '#60a5fa' : '#bae6fd'}
          />
          <pointLight
            position={[0, 14, 10]}
            intensity={timeOfDay === 'night' ? 3.5 : 1.2}
            color={timeOfDay === 'night' ? '#fde047' : '#ffffff'}
          />

          {/* Living Estate Environment: Outdoor Courtyard, Swimming Pool, Parking Bays & Park */}
          <group position={[0, 0, 0]}>
            {/* Lush Green Master Terrain */}
            <RoundedBox args={[28, 0.3, 28]} radius={0.2} position={[0, -0.15, 0]}>
              <meshStandardMaterial
                color={
                  timeOfDay === 'night' ? '#064e3b' : timeOfDay === 'sunset' ? '#15803d' : '#22c55e'
                }
                roughness={0.5}
                metalness={0.05}
              />
            </RoundedBox>

            {/* Main Access Boulevard */}
            <mesh position={[0, 0.02, 10]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[28, 5.5]} />
              <meshStandardMaterial
                color={timeOfDay === 'night' ? '#0f172a' : '#475569'}
                roughness={0.7}
              />
            </mesh>
            <mesh position={[0, 0.03, 10]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[26, 0.16]} />
              <meshStandardMaterial color="#facc15" roughness={0.3} />
            </mesh>

            {/* Grand Driveway Drop-off Apron */}
            <RoundedBox args={[16, 0.12, 8]} radius={0.12} position={[0, 0.04, 4.2]}>
              <meshStandardMaterial
                color={timeOfDay === 'night' ? '#1e293b' : '#94a3b8'}
                roughness={0.5}
              />
            </RoundedBox>

            {/* 🏊 OUTDOOR SWIMMING POOL & AMENITY COURTYARD (Outside the building) */}
            <group position={[-8.5, 0.08, 0]}>
              {/* Pool Wooden Deck Surround */}
              <RoundedBox args={[6.5, 0.15, 9.5]} radius={0.08} position={[0, 0, 0]}>
                <meshStandardMaterial
                  color={timeOfDay === 'night' ? '#78350f' : '#b45309'}
                  roughness={0.4}
                />
              </RoundedBox>
              {/* Pool Basin Coping */}
              <RoundedBox args={[4.8, 0.18, 7.5]} radius={0.05} position={[0, 0.02, 0]}>
                <meshStandardMaterial color="#f8fafc" roughness={0.2} />
              </RoundedBox>
              {/* Sparkling Azure Water */}
              <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[4.2, 6.8]} />
                <meshStandardMaterial
                  color="#06b6d4"
                  emissive="#0891b2"
                  emissiveIntensity={timeOfDay === 'night' ? 0.9 : 0.4}
                  roughness={0.01}
                  metalness={0.95}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </group>

            {/* 🚗 OUTDOOR DEDICATED PARKING LOT (Outside in front of the building) */}
            {parkingUnits.length > 0 ? (
              <group position={[0, 0.06, 5.0]}>
                {parkingUnits.map((pUnit, pIdx) => {
                  const pCount = parkingUnits.length;
                  const pX = (pIdx - (pCount - 1) / 2) * 2.4;
                  const isHovered = hoveredUnit?.id === pUnit.id;
                  const isSelected = selectedUnit?.id === pUnit.id;
                  const isHighlighted = pUnit.id === highlightedUnitId;

                  return (
                    <group
                      key={pUnit.id}
                      position={[pX, 0, 0]}
                      onPointerOver={(e) => {
                        e.stopPropagation();
                        setHoveredUnit(pUnit);
                      }}
                      onPointerOut={(e) => {
                        e.stopPropagation();
                        setHoveredUnit((prev) => (prev?.id === pUnit.id ? null : prev));
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnitClick(pUnit);
                      }}
                    >
                      {/* Parking Stall Asphalt Plate */}
                      <RoundedBox args={[2.0, 0.04, 3.4]} radius={0.02} position={[0, 0.02, 0]}>
                        <meshStandardMaterial
                          color={
                            isHighlighted
                              ? '#f59e0b'
                              : isSelected || isHovered
                                ? '#38bdf8'
                                : '#334155'
                          }
                          roughness={0.6}
                          metalness={0.3}
                          emissive={isHighlighted ? '#f59e0b' : '#000000'}
                          emissiveIntensity={isHighlighted ? 0.9 : 0}
                        />
                      </RoundedBox>
                      {/* Parked Car in Stall */}
                      <TowerCar
                        position={[0, 0.06, 0]}
                        color={isHighlighted ? '#fbbf24' : pIdx % 2 === 0 ? '#0284c7' : '#e11d48'}
                      />
                      {/* Floating Plumbob Diamond on Active Parking */}
                      {(isHighlighted || isSelected) && (
                        <TowerPlumbob color={isHighlighted ? '#fbbf24' : '#38bdf8'} />
                      )}
                    </group>
                  );
                })}
              </group>
            ) : (
              /* Default Driveway Vehicles */
              <>
                <TowerCar position={[-4, 0.14, 5.5]} color="#0284c7" />
                <TowerCar position={[4, 0.14, 5.5]} color="#e11d48" />
                <TowerCar
                  position={[0, 0.14, 11.2]}
                  rotation={[0, Math.PI / 2, 0]}
                  color="#fbbf24"
                />
              </>
            )}

            {/* 🌳 PARK & LANDSCAPING (Trees surrounding the estate perimeter) */}
            <TowerTree position={[-12, 0, 4]} />
            <TowerTree position={[-12, 0, 8.5]} />
            <TowerTree position={[-12, 0, -5]} />
            <TowerTree position={[8.5, 0, 0]} />
            <TowerTree position={[10, 0, 4]} />
            <TowerTree position={[10, 0, 8.5]} />
            <TowerTree position={[10, 0, -5]} />
            <TowerTree position={[0, 0, -9.5]} />
            <TowerTree position={[5, 0, -9.5]} />
            <TowerTree position={[-5, 0, -9.5]} />

            {/* Street Lamps */}
            <TowerStreetLamp position={[-9, 0, 7.8]} isNight={timeOfDay === 'night'} />
            <TowerStreetLamp position={[9, 0, 7.8]} isNight={timeOfDay === 'night'} />
            <TowerStreetLamp position={[0, 0, 7.8]} isNight={timeOfDay === 'night'} />
          </group>

          {/* Building Podium & Floor Plates */}
          <group position={[0, 0, 0]}>
            {processedFloors.map((floor) => {
              const isFloorVisible = selectedFloor === 'all' || selectedFloor === floor.floorNumber;
              const yPos = (floor.floorNumber - 1) * 1.35 + 0.7;

              return (
                <group key={floor.floorNumber} position={[0, yPos, 0]} visible={isFloorVisible}>
                  {/* Floor Slab Plate - Sleek Bright Concrete & Frosted Glass Edge */}
                  <RoundedBox
                    args={[4.8, 0.14, 4.8]}
                    radius={0.05}
                    smoothness={3}
                    position={[0, -0.6, 0]}
                  >
                    <meshStandardMaterial
                      color="#334155"
                      metalness={0.7}
                      roughness={0.3}
                      emissive="#1e293b"
                      emissiveIntensity={0.2}
                    />
                  </RoundedBox>

                  {/* If floor has no individual units, render a solid architectural glass facade */}
                  {floor.units.length === 0 ? (
                    <group position={[0, 0, 0]}>
                      <RoundedBox
                        args={[4.4, 1.05, 4.4]}
                        radius={0.04}
                        smoothness={3}
                        position={[0, 0, 0]}
                      >
                        <meshStandardMaterial
                          color="#38bdf8"
                          roughness={0.15}
                          metalness={0.85}
                          transparent
                          opacity={0.35}
                          emissive={timeOfDay === 'night' ? '#fbbf24' : '#0369a1'}
                          emissiveIntensity={timeOfDay === 'night' ? 0.35 : 0.1}
                        />
                      </RoundedBox>
                      {/* Floor mullion vertical lines */}
                      {[-1.5, 0, 1.5].map((mx) => (
                        <RoundedBox key={mx} args={[0.06, 1.05, 4.42]} position={[mx, 0, 0]}>
                          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
                        </RoundedBox>
                      ))}
                    </group>
                  ) : (
                    floor.units.map((unit, uIdx) => {
                      const count = floor.units.length;
                      let x = 0;
                      let z = 0;
                      let uSize: [number, number, number] = [1.65, 1.0, 1.65];

                      if (count === 1) {
                        x = 0;
                        z = 0;
                        uSize = [2.4, 1.0, 2.4];
                      } else if (count === 2) {
                        x = (uIdx - 0.5) * 2.0;
                        z = 0;
                        uSize = [1.8, 1.0, 2.0];
                      } else if (count <= 4) {
                        const cols = 2;
                        const row = Math.floor(uIdx / cols);
                        const col = uIdx % cols;
                        x = (col - 0.5) * 1.9;
                        z = (row - 0.5) * 1.9;
                        uSize = [1.65, 1.0, 1.65];
                      } else {
                        const cols = Math.ceil(Math.sqrt(count));
                        const rows = Math.ceil(count / cols);
                        const row = Math.floor(uIdx / cols);
                        const col = uIdx % cols;
                        const stepX = 3.8 / cols;
                        const stepZ = 3.8 / rows;
                        x = (col - (cols - 1) / 2) * stepX;
                        z = (row - (rows - 1) / 2) * stepZ;
                        uSize = [Math.max(0.7, stepX * 0.85), 1.0, Math.max(0.7, stepZ * 0.85)];
                      }

                      const isHovered = hoveredUnit?.id === unit.id;
                      const isSelected = selectedUnit?.id === unit.id;
                      const isHighlighted = unit.id === highlightedUnitId;

                      return (
                        <UnitMesh
                          key={unit.id}
                          unit={unit}
                          position={[x, 0, z]}
                          size={uSize}
                          isHovered={isHovered}
                          isSelected={isSelected}
                          isHighlighted={isHighlighted}
                          isNight={timeOfDay === 'night'}
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
                    })
                  )}
                </group>
              );
            })}
          </group>

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={7}
            maxDistance={35}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>

        {/* Hover Tooltip */}
        {hoveredUnit && (
          <div
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3"
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-lg font-bold text-white leading-tight">
                        Unit {selectedUnit.unitNumber}
                      </h4>
                      {selectedUnit.id === highlightedUnitId && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Floor {selectedUnit.floorNumber ?? 1} •{' '}
                      {selectedUnit.unitType.replace('_', ' ')}
                    </p>
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
                    <span className="text-slate-400 block mb-1">Bedrooms</span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.bedrooms ?? 1} BR
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Bathrooms</span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.bathrooms ?? 1} Bath
                    </span>
                  </div>
                </div>

                {selectedUnit.squareMeters && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">Floor Area</span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.squareMeters} sqm
                    </span>
                  </div>
                )}

                {selectedUnit.listPrice && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
                    <span className="font-medium">List Price:</span>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Unit Details
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const BuildingDigitalTwin: React.FC<BuildingDigitalTwinProps> = ({
  building,
  highlightedUnitId,
  onSelectUnit,
  onReserveUnit,
  isReadOnly,
}) => {
  const pType = (building.propertyType || '').toLowerCase();
  const bType = (building.buildingType || '').toLowerCase();
  const projType = (building.projectType || '').toLowerCase();

  // 1. If Townhouse / Cluster -> render Townhouse Row Cluster View
  if (pType === 'townhouse' || bType === 'cluster') {
    return (
      <TownhouseClusterView
        cluster={{
          id: building.id,
          name: building.name,
          units: building.units || [],
          activeUnitId: highlightedUnitId,
        }}
        onSelectUnit={onSelectUnit}
        onReserveUnit={onReserveUnit}
      />
    );
  }

  // 2. If House & Lot / Village / Subdivision Block -> render Subdivision Masterplan View
  if (pType === 'house_and_lot' || bType === 'block' || projType === 'village') {
    return (
      <SubdivisionMasterplanView
        subdivision={{
          id: building.id,
          name: building.name,
          units: building.units || [],
          activeUnitId: highlightedUnitId,
        }}
        onSelectUnit={onSelectUnit}
        onReserveUnit={onReserveUnit}
      />
    );
  }

  // 3. Otherwise -> render 3D High-Rise Condo Tower View with full Sims Environment
  return (
    <CondoTowerTwinView
      building={building}
      highlightedUnitId={highlightedUnitId}
      onSelectUnit={onSelectUnit}
      onReserveUnit={onReserveUnit}
      isReadOnly={isReadOnly}
    />
  );
};
