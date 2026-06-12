"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ElementRef, RefObject } from "react";
import * as THREE from "three";
import { countryFeatureCollection } from "@/data/climateData";
import type { ClimateLayerKey, CountryFocusTarget, GeoCountryFeature } from "@/types/climate";

type Ring = number[][];

interface ImmersiveEarthProps {
  layer: ClimateLayerKey;
  visualMode?: ClimateLayerKey | "overview";
  overlayIntensity?: number;
  layerValue?: number;
  camera: {
    lat: number;
    lon: number;
    distance: number;
  };
  focusedCountry: CountryFocusTarget | null;
  selectableCountries?: CountryFocusTarget[];
  autoRotate: boolean;
  resetSignal: number;
  onFocusCountry: (country: CountryFocusTarget) => void;
  onUserInteraction: () => void;
}

const layerColors: Record<ClimateLayerKey, string> = {
  temperature: "#7fe3ff",
  seaIce: "#effcff",
  wildfire: "#ffb38a",
  emissions: "#ffb36c",
  seaLevel: "#9fc3ff"
};

export function ImmersiveEarth({ layer, visualMode = layer, overlayIntensity = 1, layerValue = 0, camera, focusedCountry, selectableCountries = [], autoRotate, resetSignal, onFocusCountry, onUserInteraction }: ImmersiveEarthProps) {
  return (
    <div
      className="pointer-events-auto absolute inset-0"
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.1], fov: 34 }}
        onCreated={({ raycaster }) => {
          raycaster.params.Line = { threshold: 0.03 };
        }}
      >
        <Suspense fallback={null}>
          <Scene layer={layer} visualMode={visualMode} overlayIntensity={overlayIntensity} layerValue={layerValue} cameraTarget={camera} focusedCountry={focusedCountry} selectableCountries={selectableCountries} autoRotate={autoRotate} resetSignal={resetSignal} onFocusCountry={onFocusCountry} onUserInteraction={onUserInteraction} />
        </Suspense>
      </Canvas>
    </div>
  );
}

interface SceneProps {
  layer: ClimateLayerKey;
  visualMode: ClimateLayerKey | "overview";
  overlayIntensity: number;
  layerValue: number;
  cameraTarget: ImmersiveEarthProps["camera"];
  focusedCountry: CountryFocusTarget | null;
  selectableCountries: CountryFocusTarget[];
  autoRotate: boolean;
  resetSignal: number;
  onFocusCountry: (country: CountryFocusTarget) => void;
  onUserInteraction: () => void;
}

function Scene({ layer, visualMode, overlayIntensity, layerValue, cameraTarget, focusedCountry, selectableCountries, autoRotate, resetSignal, onFocusCountry, onUserInteraction }: SceneProps) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const accent = layerColors[layer];

  return (
    <>
      <Stars radius={130} depth={70} count={1800} factor={3.2} saturation={0} fade speed={0.18} />
      <EarthBody accent={accent} layer={layer} visualMode={visualMode} overlayIntensity={overlayIntensity} layerValue={layerValue} focusedCountry={focusedCountry} selectableCountries={selectableCountries} autoRotate={autoRotate} onFocusCountry={onFocusCountry} />
      <CameraRig controls={controls} target={cameraTarget} resetSignal={resetSignal} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 2.2, 5]} intensity={3.2} color="#dff8ff" />
      <directionalLight position={[-5, -2, -3]} intensity={0.55} color="#10356e" />
      <pointLight position={[0, 0, 4]} intensity={1.4} color="#7fe3ff" />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom
        minDistance={2.05}
        maxDistance={4.4}
        enableDamping
        dampingFactor={0.055}
        rotateSpeed={0.2}
        zoomSpeed={0.36}
        autoRotate={autoRotate}
        autoRotateSpeed={0.22}
        onStart={onUserInteraction}
      />
    </>
  );
}

function EarthBody({
  accent,
  layer,
  visualMode,
  overlayIntensity,
  layerValue,
  focusedCountry,
  selectableCountries,
  autoRotate,
  onFocusCountry
}: {
  accent: string;
  layer: ClimateLayerKey;
  visualMode: ClimateLayerKey | "overview";
  overlayIntensity: number;
  layerValue: number;
  focusedCountry: CountryFocusTarget | null;
  selectableCountries: CountryFocusTarget[];
  autoRotate: boolean;
  onFocusCountry: (country: CountryFocusTarget) => void;
}) {
  const earth = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const glow = useMemo(() => new THREE.Color(accent), [accent]);
  const layerPulse = layer === "wildfire" ? 0.08 : layer === "seaIce" ? 0.11 : 0.07;
  const cloudOpacity = visualMode === "seaIce" ? 0.035 : 0.085;

  useFrame(({ clock }, delta) => {
    if (earth.current) {
      earth.current.rotation.y += autoRotate ? delta * 0.025 : delta * 0.006;
      earth.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.012;
    }
    if (clouds.current) {
      clouds.current.rotation.y += delta * 0.055;
      clouds.current.rotation.z = Math.sin(clock.elapsedTime * 0.06) * 0.015;
    }
  });

  return (
    <group ref={earth}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.42, 96, 96]} />
        <shaderMaterial
          uniforms={{
            uAccent: { value: glow },
            uLandA: { value: new THREE.Color("#406f4f") },
            uLandB: { value: new THREE.Color("#8b744f") },
            uOceanA: { value: new THREE.Color("#061b3b") },
            uOceanB: { value: new THREE.Color("#0d3f68") }
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uAccent;
            uniform vec3 uLandA;
            uniform vec3 uLandB;
            uniform vec3 uOceanA;
            uniform vec3 uOceanB;
            varying vec3 vNormal;
            varying vec3 vPosition;

            float hash(vec3 p) {
              return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }

            float softNoise(vec3 p) {
              return (
                hash(floor(p * 3.0)) * 0.48 +
                hash(floor(p * 8.0)) * 0.34 +
                hash(floor(p * 18.0)) * 0.18
              );
            }

            void main() {
              float latitude = abs(vPosition.y);
              float continents = smoothstep(0.48, 0.66, softNoise(vPosition + vec3(0.18, 0.0, 0.31)));
              float polar = smoothstep(0.74, 0.92, latitude);
              vec3 ocean = mix(uOceanA, uOceanB, smoothstep(-0.45, 0.7, vPosition.z));
              vec3 land = mix(uLandA, uLandB, softNoise(vPosition + vec3(1.7)));
              vec3 color = mix(ocean, land, continents);
              color = mix(color, vec3(0.92, 0.98, 1.0), polar * 0.72);
              color += uAccent * 0.045;
              float light = 0.54 + dot(vNormal, normalize(vec3(0.6, 0.35, 0.72))) * 0.46;
              gl_FragColor = vec4(color * clamp(light, 0.26, 1.0), 1.0);
            }
          `}
        />
      </mesh>

      <mesh ref={clouds} scale={1.017}>
        <sphereGeometry args={[1.42, 96, 96]} />
        <meshBasicMaterial color="#f4fbff" transparent opacity={cloudOpacity} depthWrite={false} />
      </mesh>

      <mesh scale={1.04}>
        <sphereGeometry args={[1.42, 96, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={layerPulse} depthWrite={false} />
      </mesh>

      {visualMode === "seaIce" ? (
        <mesh scale={1.046}>
          <sphereGeometry args={[1.42, 96, 96]} />
          <meshBasicMaterial color="#021326" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ) : null}

      <ClimateVisualLayer visualMode={visualMode} accent={accent} intensity={overlayIntensity} value={layerValue} />

      <CountryOverlay visualMode={visualMode} accent={accent} activeCountryId={focusedCountry?.id ?? null} selectableCountries={selectableCountries} onFocusCountry={onFocusCountry} />

      {focusedCountry ? <FocusMarker country={focusedCountry} accent={accent} /> : null}

      <mesh scale={1.18}>
        <sphereGeometry args={[1.42, 96, 96]} />
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
              float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.42, 0.83, 1.0, 0.08 + intensity * 0.32);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function ClimateVisualLayer({ visualMode, accent, intensity, value }: { visualMode: ClimateLayerKey | "overview"; accent: string; intensity: number; value: number }) {
  if (visualMode === "overview") {
    return null;
  }

  return (
    <>
      {visualMode === "temperature" ? <TemperatureOverlay intensity={intensity} anomaly={value} /> : null}
      {visualMode === "seaIce" ? <IceOverlay intensity={intensity} extent={value} /> : null}
      {visualMode === "wildfire" ? <HotspotMarkers accent={accent} kind="wildfire" intensity={intensity} /> : null}
      {visualMode === "emissions" ? <HotspotMarkers accent={accent} kind="emissions" intensity={intensity} /> : null}
      {visualMode === "seaLevel" ? <CoastalHalo intensity={intensity} /> : null}
    </>
  );
}

function TemperatureOverlay({ intensity, anomaly }: { intensity: number; anomaly: number }) {
  const normalized = Math.max(0, Math.min(1, (anomaly + 0.3) / 1.8));
  const warmAlpha = Math.min(0.42, (0.12 + normalized * 0.22) * intensity);

  return (
    <mesh scale={1.052}>
      <sphereGeometry args={[1.42, 96, 96]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{
          uBlue: { value: new THREE.Color("#4bbcff") },
          uYellow: { value: new THREE.Color("#ffe58a") },
          uRed: { value: new THREE.Color("#ff6b3d") },
          uWarmth: { value: normalized },
          uAlpha: { value: warmAlpha }
        }}
        vertexShader={`
          varying vec3 vPosition;
          void main() {
            vPosition = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uBlue;
          uniform vec3 uYellow;
          uniform vec3 uRed;
          uniform float uWarmth;
          uniform float uAlpha;
          varying vec3 vPosition;
          void main() {
            vec3 coolWarm = mix(uBlue, uYellow, smoothstep(0.2, 0.64, uWarmth));
            vec3 color = mix(coolWarm, uRed, smoothstep(0.58, 1.0, uWarmth));
            float band = 0.82 + smoothstep(-0.7, 0.85, vPosition.y) * 0.18;
            float alpha = uAlpha * band;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function IceOverlay({ intensity, extent }: { intensity: number; extent: number }) {
  const normalizedExtent = Math.max(0, Math.min(1, (extent - 3.2) / 4.6));
  const currentThreshold = 0.78 - normalizedExtent * 0.18;

  return (
    <group>
      <mesh scale={1.07}>
        <sphereGeometry args={[1.42, 128, 128]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            uIce: { value: new THREE.Color("#f6feff") },
            uBlue: { value: new THREE.Color("#4ee8ff") },
            uEdge: { value: new THREE.Color("#00b7ff") },
            uCurrentThreshold: { value: currentThreshold },
            uAlpha: { value: Math.min(0.98, 0.86 * intensity) }
          }}
          vertexShader={`
            varying vec3 vPosition;
            void main() {
              vPosition = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uIce;
            uniform vec3 uBlue;
            uniform vec3 uEdge;
            uniform float uCurrentThreshold;
            uniform float uAlpha;
            varying vec3 vPosition;
            void main() {
              float latitude = abs(vPosition.y);
              float historical = smoothstep(0.5, 0.66, latitude) * 0.34;
              float current = smoothstep(uCurrentThreshold, 0.93, latitude) * uAlpha;
              float edgeBand = smoothstep(uCurrentThreshold - 0.035, uCurrentThreshold, latitude) - smoothstep(uCurrentThreshold, uCurrentThreshold + 0.055, latitude);
              float capCore = smoothstep(0.78, 0.98, latitude);
              vec3 color = mix(uBlue, uIce, smoothstep(0.72, 0.96, latitude));
              color = mix(color, uEdge, edgeBand * 0.75);
              color += uEdge * edgeBand * 0.35;
              gl_FragColor = vec4(color, min(0.99, historical + current + edgeBand * 0.62 + capCore * 0.08));
            }
          `}
        />
      </mesh>
      <mesh scale={1.082}>
        <sphereGeometry args={[1.42, 96, 96]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          vertexShader={`
            varying vec3 vPosition;
            void main() {
              vPosition = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vPosition;
            void main() {
              float polarGlow = smoothstep(0.56, 0.9, abs(vPosition.y));
              float rim = smoothstep(0.68, 0.78, abs(vPosition.y)) - smoothstep(0.86, 0.98, abs(vPosition.y));
              gl_FragColor = vec4(0.34, 0.9, 1.0, polarGlow * 0.28 + rim * 0.16);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function CoastalHalo({ intensity }: { intensity: number }) {
  return (
    <mesh scale={1.074}>
      <sphereGeometry args={[1.42, 96, 96]} />
      <meshBasicMaterial color="#8ad9ff" transparent opacity={0.08 * intensity} depthWrite={false} />
    </mesh>
  );
}

const wildfireHotspots = [
  { lat: 37, lon: -120, size: 0.033 },
  { lat: -14, lon: 132, size: 0.03 },
  { lat: -6, lon: -61, size: 0.038 },
  { lat: 39, lon: 26, size: 0.026 },
  { lat: 61, lon: 105, size: 0.034 }
];

const emissionHotspots = [
  { lat: 40.7, lon: -74, size: 0.026 },
  { lat: 51.5, lon: 0, size: 0.024 },
  { lat: 35.7, lon: 139.7, size: 0.027 },
  { lat: 31.2, lon: 121.5, size: 0.032 },
  { lat: 28.6, lon: 77.2, size: 0.029 },
  { lat: 19.1, lon: 72.9, size: 0.026 }
];

function HotspotMarkers({ accent, kind, intensity }: { accent: string; kind: "wildfire" | "emissions"; intensity: number }) {
  const group = useRef<THREE.Group>(null);
  const hotspots = kind === "wildfire" ? wildfireHotspots : emissionHotspots;

  useFrame(({ clock }) => {
    group.current?.children.forEach((child, index) => {
      child.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.4 + index) * (kind === "emissions" ? 0.18 : 0.1));
    });
  });

  return (
    <group ref={group}>
      {hotspots.map((spot) => (
        <group key={`${kind}-${spot.lat}-${spot.lon}`} position={latLonToPosition(spot.lat, spot.lon, 1.49)}>
          <mesh>
            <sphereGeometry args={[spot.size * intensity, 18, 18]} />
            <meshBasicMaterial color={kind === "wildfire" ? "#ff7a30" : "#ff8a34"} transparent opacity={0.9} />
          </mesh>
          <mesh scale={2.2}>
            <sphereGeometry args={[spot.size * intensity, 18, 18]} />
            <meshBasicMaterial color={kind === "wildfire" ? "#ffb36c" : "#ffcf7a"} transparent opacity={kind === "wildfire" ? 0.22 : 0.22} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CountryOverlay({
  visualMode,
  accent,
  activeCountryId,
  selectableCountries,
  onFocusCountry
}: {
  visualMode: ClimateLayerKey | "overview";
  accent: string;
  activeCountryId: string | null;
  selectableCountries: CountryFocusTarget[];
  onFocusCountry: (country: CountryFocusTarget) => void;
}) {
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const lineColor = visualMode === "seaLevel" ? "#98e7ff" : accent;
  const baseOpacity = visualMode === "seaLevel" ? 0.32 : visualMode === "overview" ? 0.07 : 0.11;

  return (
    <group>
      {countryFeatureCollection.features.map((country) => (
        <CountryLines key={country.id} country={country} active={country.id === activeCountryId || country.id === hoveredCountryId} accent={lineColor} baseOpacity={baseOpacity} onFocusCountry={onFocusCountry} />
      ))}
      {selectableCountries.map((country) => (
        <RegionHitTarget
          key={`hit-${country.id}`}
          country={country}
          active={country.id === activeCountryId}
          accent={lineColor}
          onFocusCountry={onFocusCountry}
          onHover={(id) => {
            setHoveredCountryId(id);
          }}
        />
      ))}
    </group>
  );
}

function RegionHitTarget({
  country,
  active,
  accent,
  onFocusCountry,
  onHover
}: {
  country: CountryFocusTarget;
  active: boolean;
  accent: string;
  onFocusCountry: (country: CountryFocusTarget) => void;
  onHover: (id: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const position = useMemo(() => latLonToPosition(country.lat, country.lon, 1.505), [country.lat, country.lon]);

  useFrame(({ clock }) => {
    if (group.current && active) {
      group.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.1) * 0.055);
    }
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(country.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "";
        onFocusCountry(country);
      }}
    >
      <mesh>
        <sphereGeometry args={[active ? 0.04 : 0.026, 18, 18]} />
        <meshBasicMaterial color={accent} transparent opacity={active ? 0.88 : 0.24} depthWrite={false} />
      </mesh>
      <mesh scale={2.8}>
        <sphereGeometry args={[active ? 0.036 : 0.024, 18, 18]} />
        <meshBasicMaterial color={accent} transparent opacity={active ? 0.2 : 0.07} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CountryLines({ country, active, accent, baseOpacity, onFocusCountry }: { country: GeoCountryFeature; active: boolean; accent: string; baseOpacity: number; onFocusCountry: (country: CountryFocusTarget) => void }) {
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
          <lineBasicMaterial attach="material" color={active ? accent : "#b7e5ff"} transparent opacity={active ? 0.95 : baseOpacity} />
        </line>
      ))}
    </group>
  );
}

function FocusMarker({ country, accent }: { country: CountryFocusTarget; accent: string }) {
  const group = useRef<THREE.Group>(null);
  const position = useMemo(() => latLonToPosition(country.lat, country.lon, 1.48), [country.lat, country.lon]);

  useFrame(({ clock }) => {
    group.current?.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.2) * 0.045);
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh scale={2.4}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function CameraRig({ controls, target, resetSignal }: { controls: RefObject<ElementRef<typeof OrbitControls> | null>; target: ImmersiveEarthProps["camera"]; resetSignal: number }) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(...latLonToPosition(target.lat, target.lon, target.distance)), [target.lat, target.lon, target.distance]);
  const transitionUntil = useRef(0);

  useEffect(() => {
    transitionUntil.current = performance.now() + 1150;
  }, [desired, resetSignal]);

  useFrame(() => {
    if (performance.now() < transitionUntil.current) {
      camera.position.lerp(desired, 0.045);
      camera.lookAt(0, 0, 0);
    }
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  });

  return null;
}

function getCountryRings(country: GeoCountryFeature): Ring[] {
  if (country.geometry.type === "Polygon") {
    return country.geometry.coordinates as Ring[];
  }

  return (country.geometry.coordinates as Ring[][]).flat();
}

function buildLineGeometry(ring: Ring) {
  return new THREE.BufferGeometry().setFromPoints(ring.map(([lon, lat]) => new THREE.Vector3(...latLonToPosition(lat, lon, 1.455))));
}

function latLonToPosition(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)] as [number, number, number];
}
