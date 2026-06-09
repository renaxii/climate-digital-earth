"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Stars } from "@react-three/drei";
import { Suspense } from "react";

function Sphere() {
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial color="#0d2444" roughness={0.85} metalness={0.16} emissive="#09162a" emissiveIntensity={0.2} />
      </mesh>
      <mesh scale={1.05}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshBasicMaterial color="#59d2ff" transparent opacity={0.07} />
      </mesh>
      <mesh position={[0.08, 0.12, 1.13]}>
        <sphereGeometry args={[0.26, 22, 22]} />
        <meshBasicMaterial color="#f4f8ff" transparent opacity={0.88} />
      </mesh>
    </Float>
  );
}

export function LandingGlobe() {
  return (
    <div className="h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.6], fov: 42 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 2, 4]} intensity={2.6} color="#c7f4ff" />
        <directionalLight position={[-4, -2, -2]} intensity={0.65} color="#163a73" />
        <Suspense fallback={null}>
          <Stars radius={80} depth={40} count={1500} factor={3} saturation={0} fade speed={0.8} />
          <Environment preset="night" />
          <Sphere />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.75} />
      </Canvas>
    </div>
  );
}
