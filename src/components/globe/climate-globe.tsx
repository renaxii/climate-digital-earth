"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { memo, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { climateLayers, regions } from "@/data/climateData";
import { useClimateStore } from "@/stores/useClimateStore";

function Earth() {
  const mesh = useRef<THREE.Mesh>(null);
  const { selectedLayer, selectedRegionId, selectedScenario } = useClimateStore();
  const region = regions.find((entry) => entry.id === selectedRegionId) ?? regions[regions.length - 1];
  const layer = climateLayers.find((entry) => entry.key === selectedLayer) ?? climateLayers[0];
  const scenarioMultiplier = selectedScenario === "+1.5°C" ? 0.85 : selectedScenario === "+2.0°C" ? 1 : selectedScenario === "+3.0°C" ? 1.35 : 1.7;

  useFrame(({ clock }, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.14;
      mesh.current.rotation.x = Math.sin(clock.elapsedTime * 0.15) * 0.02;
    }
  });

  const overlayColor = useMemo(() => new THREE.Color(layer.accent), [layer.accent]);

  return (
    <group>
      <mesh ref={mesh} castShadow receiveShadow>
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

      {region.id !== "global" ? <Marker lat={region.lat} lon={region.lon} color={layer.accent} intensity={scenarioMultiplier} /> : null}

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

function latLonToPosition(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)] as [number, number, number];
}

function GlobeScene() {
  return (
    <>
      <Suspense fallback={null}>
        <Stars radius={100} depth={60} count={1800} factor={3.5} saturation={0} fade speed={0.75} />
        <Earth />
      </Suspense>
      <OrbitControls enablePan enableZoom minDistance={2.2} maxDistance={4.5} enableDamping dampingFactor={0.08} rotateSpeed={0.4} />
    </>
  );
}

export const ClimateGlobe = memo(function ClimateGlobe() {
  return (
    <div className="h-[500px] w-full min-h-[500px] lg:h-[700px]">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.6], fov: 38 }}>
        <GlobeScene />
      </Canvas>
    </div>
  );
});
