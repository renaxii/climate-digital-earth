"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { memo, Suspense, useMemo, useRef } from "react";
import type { ElementRef, RefObject } from "react";
import * as THREE from "three";
import { climateLayers, countryFeatureCollection, regions } from "@/data/climateData";
import { useClimateStore } from "@/stores/useClimateStore";
import type { CountryFocusTarget, GeoCountryFeature } from "@/types/climate";

type Ring = number[][];

function Earth() {
  const { focusedCountry, selectedLayer, selectedRegionId, selectedScenario, setFocusedCountry } = useClimateStore();
  const region = regions.find((entry) => entry.id === selectedRegionId) ?? regions[regions.length - 1];
  const layer = climateLayers.find((entry) => entry.key === selectedLayer) ?? climateLayers[0];
  const scenarioMultiplier = selectedScenario === "+1.5°C" ? 0.85 : selectedScenario === "+2.0°C" ? 1 : selectedScenario === "+3.0°C" ? 1.35 : 1.7;

  const overlayColor = useMemo(() => new THREE.Color(layer.accent), [layer.accent]);
  const markerTarget = focusedCountry ?? (region.id !== "global" ? region : null);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.25, 56, 56]} />
        <meshStandardMaterial color="#0b2342" roughness={0.95} metalness={0.08} emissive={overlayColor} emissiveIntensity={0.08 + scenarioMultiplier * 0.02} />
      </mesh>

      <mesh scale={1.03}>
        <sphereGeometry args={[1.27, 56, 56]} />
        <meshBasicMaterial color={layer.accent} transparent opacity={0.08 + scenarioMultiplier * 0.02} />
      </mesh>

      <mesh scale={1.08}>
        <sphereGeometry args={[1.28, 56, 56]} />
        <meshBasicMaterial color="#83dfff" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      <CountryOverlay activeCountryId={focusedCountry?.id ?? null} color={layer.accent} onFocusCountry={setFocusedCountry} />

      {markerTarget ? <Marker lat={markerTarget.lat} lon={markerTarget.lon} color={layer.accent} intensity={scenarioMultiplier} /> : null}

      <mesh position={[0, 0, -1.2]}>
        <sphereGeometry args={[1.34, 36, 36]} />
        <meshBasicMaterial color="#05101f" transparent opacity={0.45} />
      </mesh>

      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 2, 4]} intensity={2.8} color="#d8fbff" />
      <directionalLight position={[-4, -2, -2]} intensity={0.75} color="#12365b" />
      <pointLight position={[0, 0, 3]} intensity={1.6} color="#78e5ff" />
      <Atmosphere />
    </group>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.16}>
      <sphereGeometry args={[1.28, 56, 56]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.28, 0.72, 1.0, 0.08 + intensity * 0.24);
          }
        `}
      />
    </mesh>
  );
}

function Marker({ lat, lon, color, intensity }: { lat: number; lon: number; color: string; intensity: number }) {
  const group = useRef<THREE.Group>(null);
  const position = useMemo(() => latLonToPosition(lat, lon, 1.26), [lat, lon]);

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.045 * intensity);
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.04, 14, 14]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh scale={1.8}>
        <sphereGeometry args={[0.05, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function CountryOverlay({ activeCountryId, color, onFocusCountry }: { activeCountryId: string | null; color: string; onFocusCountry: (country: CountryFocusTarget) => void }) {
  return (
    <group>
      {countryFeatureCollection.features.map((country) => (
        <CountryLines key={country.id} country={country} active={country.id === activeCountryId} color={color} onFocusCountry={onFocusCountry} />
      ))}
    </group>
  );
}

function CountryLines({ country, active, color, onFocusCountry }: { country: GeoCountryFeature; active: boolean; color: string; onFocusCountry: (country: CountryFocusTarget) => void }) {
  const rings = useMemo(() => getCountryRings(country), [country]);
  const geometries = useMemo(() => rings.map((ring) => buildLineGeometry(ring)), [rings]);
  const centroid = country.properties.centroid ?? { lat: 0, lon: 0 };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onFocusCountry({
      id: country.id,
      name: country.properties.name,
      iso3: country.properties.iso_a3,
      lat: centroid.lat,
      lon: centroid.lon
    });
  };

  return (
    <group onClick={handleClick}>
      {geometries.map((geometry, index) => (
        <line key={`${country.id}-${index}`}>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial attach="material" color={active ? color : "#a7d8ff"} transparent opacity={active ? 0.95 : 0.34} />
        </line>
      ))}
    </group>
  );
}

function getCountryRings(country: GeoCountryFeature): Ring[] {
  if (country.geometry.type === "Polygon") {
    return country.geometry.coordinates as Ring[];
  }

  return (country.geometry.coordinates as Ring[][]).flat();
}

function buildLineGeometry(ring: Ring) {
  return new THREE.BufferGeometry().setFromPoints(ring.map(([lon, lat]) => new THREE.Vector3(...latLonToPosition(lat, lon, 1.285))));
}

function latLonToPosition(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)] as [number, number, number];
}

function GlobeScene() {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);

  return (
    <>
      <Suspense fallback={null}>
        <Stars radius={100} depth={60} count={1800} factor={3.5} saturation={0} fade speed={0.75} />
        <Earth />
      </Suspense>
      <CameraRig controls={controls} />
      <OrbitControls ref={controls} enablePan enableZoom minDistance={2.0} maxDistance={4.5} enableDamping dampingFactor={0.08} rotateSpeed={0.4} />
    </>
  );
}

function CameraRig({ controls }: { controls: RefObject<ElementRef<typeof OrbitControls> | null> }) {
  const target = useClimateStore((state) => state.cameraTarget);
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(...latLonToPosition(target.lat, target.lon, target.distance)), [target]);

  useFrame(() => {
    camera.position.lerp(desired, 0.055);
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  });

  return null;
}

export const ClimateGlobe = memo(function ClimateGlobe() {
  const focusedCountry = useClimateStore((state) => state.focusedCountry);

  return (
    <div className="relative h-[500px] min-h-[500px] w-full lg:h-[700px]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.6], fov: 38 }}
        onCreated={({ raycaster }) => {
          raycaster.params.Line = { threshold: 0.035 };
        }}
      >
        <GlobeScene />
      </Canvas>
      {focusedCountry ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/60">Focused country</p>
          <p className="mt-1 text-sm font-semibold text-white">{focusedCountry.name}</p>
        </div>
      ) : null}
    </div>
  );
});
