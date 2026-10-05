import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/** A CO₂ molecule (carbon + two oxygens) orbiting the planet on a tilted ring. */
function Molecule({ radius, speed, tilt, offset }: { radius: number; speed: number; tilt: number; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + offset;
    if (!ref.current) return;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t) * radius * Math.sin(tilt), Math.sin(t) * radius * Math.cos(tilt));
    ref.current.rotation.set(t * 2, t, 0);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#1b2333" emissive="#64ffb4" emissiveIntensity={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0, 0]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitRing({ radius, tilt, color }: { radius: number; tilt: [number, number, number]; color: string }) {
  return (
    <mesh rotation={tilt}>
      <torusGeometry args={[radius, 0.006, 8, 200]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} />
    </mesh>
  );
}

function Planet({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const molecules = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({
      radius: 2.1 + (i % 3) * 0.35,
      speed: 0.35 + (i % 4) * 0.08,
      tilt: (i * Math.PI) / 4.5,
      offset: i * 1.7,
    })),
    [],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current; // 0 → 1 as the hero scrolls away
    // Follow the pointer, spin, and recede/tilt as the user scrolls past the hero.
    g.rotation.y += delta * 0.15;
    g.rotation.x += (state.pointer.y * 0.35 + p * 0.8 - g.rotation.x) * 0.05;
    g.rotation.z += (-state.pointer.x * 0.25 - g.rotation.z) * 0.05;
    const s = 1 - p * 0.35;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, 0.1));
    g.position.y = THREE.MathUtils.lerp(g.position.y, p * 1.2, 0.1);
    if (wire.current) wire.current.rotation.y -= delta * 0.08;
  });

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh>
          <icosahedronGeometry args={[1.45, 32]} />
          <MeshDistortMaterial color="#0a1a22" emissive="#0b3d2e" emissiveIntensity={0.7} roughness={0.25} metalness={0.6} distort={0.28} speed={1.6} />
        </mesh>
        <mesh ref={wire}>
          <icosahedronGeometry args={[1.62, 3]} />
          <meshBasicMaterial color="#64ffb4" wireframe transparent opacity={0.22} />
        </mesh>
        {/* Atmosphere: back-face shell that glows at the rim */}
        <mesh scale={1.25}>
          <sphereGeometry args={[1.45, 48, 48]} />
          <meshBasicMaterial color="#00d9ff" transparent opacity={0.07} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </Float>
      <OrbitRing radius={2.25} tilt={[Math.PI / 2.3, 0, 0]} color="#64ffb4" />
      <OrbitRing radius={2.65} tilt={[Math.PI / 1.8, 0.4, 0]} color="#00d9ff" />
      <OrbitRing radius={2.95} tilt={[Math.PI / 2.8, -0.5, 0.3]} color="#8b5cf6" />
      {molecules.map((m, i) => <Molecule key={i} {...m} />)}
      <Sparkles count={70} scale={6} size={2.2} speed={0.35} color="#64ffb4" opacity={0.7} />
    </group>
  );
}

/** Hero scene. `progress` is a 0–1 ref fed by a GSAP ScrollTrigger on the hero. */
export default function CarbonGlobe({ progress }: { progress: MutableRefObject<number> }) {
  return (
    <Canvas camera={{ position: [0, 0, 7.4], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 4, 5]} intensity={60} color="#64ffb4" />
      <pointLight position={[-5, -3, 2]} intensity={40} color="#8b5cf6" />
      <directionalLight position={[0, 5, 5]} intensity={0.8} />
      <Planet progress={progress} />
    </Canvas>
  );
}
