import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { formatCurrency } from '../../lib/utils';
import {
  Home,
  Layers,
  Car,
  CheckCircle,
  Sparkles,
  X,
  Bed,
  Bath,
  Maximize,
  Sun,
  Moon,
  Eye,
  Compass,
} from 'lucide-react';
import type { Unit3DData } from './BuildingDigitalTwin';

export interface TownhouseClusterProps {
  cluster: {
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
  { main: string; glow: string; text: string; bg: string; label: string }
> = {
  available: {
    main: '#10B981',
    glow: '#34D399',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    label: 'Available',
  },
  reserved: {
    main: '#F59E0B',
    glow: '#FBBF24',
    text: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    label: 'Reserved',
  },
  sold: {
    main: '#EF4444',
    glow: '#F87171',
    text: 'text-rose-400',
    bg: 'bg-rose-500/15 border-rose-500/30',
    label: 'Sold',
  },
  occupied: {
    main: '#E11D48',
    glow: '#FB7185',
    text: 'text-rose-400',
    bg: 'bg-rose-500/15 border-rose-500/30',
    label: 'Occupied',
  },
  rto_active: {
    main: '#0284C7',
    glow: '#38BDF8',
    text: 'text-sky-400',
    bg: 'bg-sky-500/15 border-sky-500/30',
    label: 'RTO Active',
  },
  rented: {
    main: '#6366F1',
    glow: '#818CF8',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/15 border-indigo-500/30',
    label: 'Rented',
  },
  under_maintenance: {
    main: '#64748B',
    glow: '#94A3B8',
    text: 'text-slate-400',
    bg: 'bg-slate-500/15 border-slate-500/30',
    label: 'Maintenance',
  },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.available;
}

/* ── Floating Sims-Style Plumbob Diamond ── */
const SimsPlumbob: React.FC<{ color?: string }> = ({ color = '#10B981' }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.04;
    meshRef.current.position.y = 3.6 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
  });

  return (
    <mesh ref={meshRef} position={[0, 3.6, 0]}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

/* ── Stylized Low-Poly Tree ── */
const LowPolyTree: React.FC<{ position: [number, number, number] }> = ({ position }) => (
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
const StreetLamp: React.FC<{ position: [number, number, number]; isNight: boolean }> = ({
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
    {isNight && <pointLight position={[0, 1.85, 0]} intensity={1.8} color="#fef08a" distance={4} />}
  </group>
);

/* ── Stylized Miniature Car in Carport ── */
const CarportCar: React.FC<{ color?: string }> = ({ color = '#3b82f6' }) => (
  <group position={[0, 0.15, 0.7]}>
    {/* Body */}
    <RoundedBox args={[0.9, 0.35, 1.6]} radius={0.06} position={[0, 0.18, 0]}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </RoundedBox>
    {/* Cabin / Windshield */}
    <RoundedBox args={[0.75, 0.28, 0.85]} radius={0.04} position={[0, 0.42, -0.1]}>
      <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
    </RoundedBox>
    {/* Wheels */}
    {[-0.45, 0.45].map((x) =>
      [-0.45, 0.45].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      )),
    )}
  </group>
);

interface TownhouseUnitMeshProps {
  unit: Unit3DData;
  position: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  isCurrentProperty: boolean;
  isCutaway: boolean;
  isNight: boolean;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
  onClick: (e: any) => void;
}

const TownhouseUnitMesh: React.FC<TownhouseUnitMeshProps> = ({
  unit,
  position,
  isHovered,
  isSelected,
  isCurrentProperty,
  isCutaway,
  isNight,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const colorInfo = useMemo(() => getStatusColor(unit.status), [unit.status]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isHovered || isSelected || isCurrentProperty) {
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        isCurrentProperty ? 0.35 : 0.2,
        8,
        delta,
      );
      groupRef.current.scale.lerp(new THREE.Vector3(1.03, 1.03, 1.03), delta * 10);
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 8, delta);
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 10);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Plumbob Diamond on Active / Selected Property */}
      {(isCurrentProperty || isSelected) && (
        <SimsPlumbob color={isCurrentProperty ? '#38bdf8' : colorInfo.glow} />
      )}

      {/* Ground Floor Living & Garage */}
      <RoundedBox args={[2.0, 1.3, 3.2]} radius={0.04} smoothness={3} position={[0, 0.65, 0]}>
        <meshStandardMaterial
          color={
            isCurrentProperty
              ? '#0284c7'
              : isHovered || isSelected
                ? colorInfo.glow
                : colorInfo.main
          }
          roughness={0.25}
          metalness={0.65}
          emissive={
            isNight
              ? '#fbbf24'
              : isCurrentProperty
                ? '#0369a1'
                : isHovered || isSelected
                  ? colorInfo.main
                  : '#0a0f1d'
          }
          emissiveIntensity={
            isNight ? 0.4 : isHovered || isSelected || isCurrentProperty ? 0.75 : 0.15
          }
        />
      </RoundedBox>

      {/* Carport with Parked Vehicle */}
      <group position={[0, 0, 1.4]}>
        <mesh position={[0, 0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <CarportCar color={unit.unitType === 'three_br' ? '#38bdf8' : '#e11d48'} />
      </group>

      {/* Second Floor Master Suites */}
      <RoundedBox args={[1.96, 1.3, 3.0]} radius={0.04} smoothness={3} position={[0, 1.95, 0.1]}>
        <meshStandardMaterial
          color={
            isCurrentProperty
              ? '#0284c7'
              : isHovered || isSelected
                ? colorInfo.glow
                : colorInfo.main
          }
          roughness={0.2}
          metalness={0.7}
          emissive={
            isNight
              ? '#f59e0b'
              : isCurrentProperty
                ? '#0284c7'
                : isHovered || isSelected
                  ? colorInfo.main
                  : '#0a0f1d'
          }
          emissiveIntensity={
            isNight ? 0.5 : isHovered || isSelected || isCurrentProperty ? 0.8 : 0.2
          }
        />
      </RoundedBox>

      {/* Glass Balcony Railing */}
      <RoundedBox args={[1.5, 0.45, 0.08]} radius={0.02} position={[0, 1.6, 1.6]}>
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.75}
        />
      </RoundedBox>

      {/* Sims Cutaway Interior Details vs Pitched Modern Roof */}
      {!isCutaway ? (
        <RoundedBox
          args={[2.1, 0.25, 3.3]}
          radius={0.03}
          position={[0, 2.7, 0.05]}
          rotation={[-0.08, 0, 0]}
        >
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
        </RoundedBox>
      ) : (
        /* Interior Cutaway Room Silhouettes */
        <group position={[0, 2.6, 0]}>
          {/* Master Bed */}
          <RoundedBox args={[0.9, 0.2, 1.1]} position={[-0.3, 0.1, 0]} radius={0.02}>
            <meshStandardMaterial color="#f8fafc" />
          </RoundedBox>
          {/* Wardrobe */}
          <RoundedBox args={[0.3, 0.5, 0.8]} position={[0.6, 0.25, -0.6]} radius={0.02}>
            <meshStandardMaterial color="#78350f" />
          </RoundedBox>
        </group>
      )}

      {/* Front Pathway Stone Pavers */}
      <mesh position={[0.6, 0.02, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 1.0]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
    </group>
  );
};

export const TownhouseClusterView: React.FC<TownhouseClusterProps> = ({
  cluster,
  onSelectUnit,
  onReserveUnit,
}) => {
  const [hoveredUnit, setHoveredUnit] = useState<Unit3DData | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit3DData | null>(
    cluster.units.find((u) => u.id === cluster.activeUnitId) || null,
  );
  const [isCutaway, setIsCutaway] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const unitsList =
    cluster.units.length > 0
      ? cluster.units
      : [
          {
            id: 'demo-1',
            unitNumber: '1A',
            unitType: 'three_br',
            status: 'available',
            squareMeters: 169,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 14500000,
          },
          {
            id: 'demo-2',
            unitNumber: '1B',
            unitType: 'two_br',
            status: 'reserved',
            squareMeters: 145,
            bedrooms: 2,
            bathrooms: 2,
            listPrice: 12800000,
          },
          {
            id: 'demo-3',
            unitNumber: '1C',
            unitType: 'three_br',
            status: 'occupied',
            squareMeters: 175,
            bedrooms: 3,
            bathrooms: 2.5,
            listPrice: 15200000,
          },
          {
            id: 'demo-4',
            unitNumber: '1D',
            unitType: 'three_br',
            status: 'rto_active',
            squareMeters: 169,
            bedrooms: 3,
            bathrooms: 2,
            listPrice: 14900000,
          },
        ];

  const totalCount = unitsList.length;
  const unitSpacing = 2.5;
  const clusterWidth = totalCount * unitSpacing;

  const handleUnitClick = (unit: Unit3DData) => {
    setSelectedUnit(unit);
    if (onSelectUnit) onSelectUnit(unit);
  };

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
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">{cluster.name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                The Sims 3D Rowhouse Diorama
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {totalCount} Attached 2-Story Units • Landscaped Street, Driveways, & Private Garages
            </p>
          </div>
        </div>

        {/* View Controls: Cutaway Mode & Day/Night Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCutaway(!isCutaway)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isCutaway
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isCutaway ? 'Floorplan Cutaway ON' : 'Exterior View'}</span>
          </button>

          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setTimeOfDay('day')}
              className={`p-1.5 rounded-md transition-all ${
                timeOfDay === 'day'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Daylight Mode"
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
        className="relative w-full h-[500px] bg-gradient-to-b from-[#070b14] via-[#091224] to-[#040813] overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <Canvas camera={{ position: [0, 6, clusterWidth * 0.7 + 5], fov: 36 }} shadows>
          {/* Lighting based on Time of Day */}
          <ambientLight
            intensity={timeOfDay === 'night' ? 0.35 : timeOfDay === 'sunset' ? 0.7 : 0.95}
          />
          <directionalLight
            position={[12, 22, 16]}
            intensity={timeOfDay === 'night' ? 0.4 : timeOfDay === 'sunset' ? 2.2 : 1.8}
            color={
              timeOfDay === 'sunset' ? '#fed7aa' : timeOfDay === 'night' ? '#93c5fd' : '#ffffff'
            }
            castShadow
          />
          <pointLight
            position={[0, 8, 4]}
            intensity={timeOfDay === 'night' ? 1.5 : 0.8}
            color="#38bdf8"
          />

          {/* Diorama Environment: Street, Grass Lawn, Trees & Lamps */}
          <group position={[0, 0, 0]}>
            {/* Front Street / Access Driveway */}
            <mesh position={[0, -0.01, 4.0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[clusterWidth + 14, 5.5]} />
              <meshStandardMaterial color="#0b1120" roughness={0.9} />
            </mesh>

            {/* Road Centerline */}
            <mesh position={[0, 0.01, 4.4]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[clusterWidth + 12, 0.12]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.5} />
            </mesh>

            {/* Landscaped Green Lawn Base */}
            <RoundedBox args={[clusterWidth + 6, 0.2, 8.5]} radius={0.1} position={[0, -0.12, 0.6]}>
              <meshStandardMaterial color="#064e3b" roughness={0.7} metalness={0.2} />
            </RoundedBox>

            {/* Sidewalk Curb */}
            <RoundedBox
              args={[clusterWidth + 4, 0.08, 1.2]}
              radius={0.02}
              position={[0, 0.02, 1.8]}
            >
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </RoundedBox>

            {/* Flanking Trees on Left and Right Ends */}
            <LowPolyTree position={[-(clusterWidth / 2 + 1.8), 0, 0.5]} />
            <LowPolyTree position={[-(clusterWidth / 2 + 1.8), 0, 2.0]} />
            <LowPolyTree position={[clusterWidth / 2 + 1.8, 0, 0.5]} />
            <LowPolyTree position={[clusterWidth / 2 + 1.8, 0, 2.0]} />

            {/* Street Lamps */}
            <StreetLamp
              position={[-(clusterWidth / 2 + 0.8), 0, 2.3]}
              isNight={timeOfDay === 'night'}
            />
            <StreetLamp
              position={[clusterWidth / 2 + 0.8, 0, 2.3]}
              isNight={timeOfDay === 'night'}
            />
          </group>

          {/* Row Units Cluster */}
          <group position={[0, 0, 0]}>
            {unitsList.map((unit, idx) => {
              const xPos = (idx - (totalCount - 1) / 2) * unitSpacing;
              const isHovered = hoveredUnit?.id === unit.id;
              const isSelected = selectedUnit?.id === unit.id;
              const isCurrentProperty = unit.id === cluster.activeUnitId;

              return (
                <TownhouseUnitMesh
                  key={unit.id}
                  unit={unit}
                  position={[xPos, 0, 0]}
                  isHovered={isHovered}
                  isSelected={isSelected}
                  isCurrentProperty={isCurrentProperty}
                  isCutaway={isCutaway}
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
            })}
          </group>

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={6}
            maxDistance={28}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>

        {/* Raycast Tooltip */}
        {hoveredUnit && (
          <div
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-4"
            style={{ left: mousePos.x, top: mousePos.y }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[210px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">
                  Townhouse {hoveredUnit.unitNumber}
                </span>
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
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">
                      Townhouse {selectedUnit.unitNumber}
                    </h4>
                    <p className="text-xs text-slate-400 capitalize">
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
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" /> Bedrooms
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.bedrooms ?? 3} Beds
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

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5 text-slate-400" /> Floor Area
                    </span>
                    <span className="text-white font-bold text-sm">
                      {selectedUnit.squareMeters ? `${selectedUnit.squareMeters} sqm` : '169 sqm'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" /> Garage
                    </span>
                    <span className="text-white font-bold text-sm">1–2 Covered</span>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Townhouse Details
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
