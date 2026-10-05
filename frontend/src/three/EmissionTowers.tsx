import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export interface Tower {
  label: string;
  value: number;
  color: string;
}

const MAX_HEIGHT = 2.6;

function TowerMesh({ tower, x, height, delay }: { tower: Tower; x: number; height: number; delay: number }) {
  const mesh = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    born.current ??= clock.elapsedTime;
    // Grow from the floor with an overshooting spring-like ease after a stagger.
    const t = Math.max(0, Math.min(1, (clock.elapsedTime - born.current - delay) / 1.2));
    const eased = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
    const h = Math.max(0.001, height * eased);
    mesh.current.scale.y = h;
    mesh.current.position.y = h / 2;
  });
  return (
    <group position={[x, 0, 0]}>
      <group ref={mesh} scale={[1, 0.001, 1]}>
        <RoundedBox args={[0.9, 1, 0.9]} radius={0.08} smoothness={4}>
          <meshStandardMaterial color={tower.color} emissive={tower.color} emissiveIntensity={0.35} roughness={0.2} metalness={0.5} transparent opacity={0.92} />
        </RoundedBox>
      </group>
    </group>
  );
}

/**
 * Auto-rotating 3D column chart of the emission breakdown (kg CO₂e).
 * Values are shown in a DOM legend over the canvas rather than drei <Html>
 * labels, whose portals broke React's unmount during page transitions.
 */
export default function EmissionTowers({ towers }: { towers: Tower[] }) {
  const max = Math.max(...towers.map((t) => t.value), 0.001);
  const spacing = 1.5;
  const start = -((towers.length - 1) * spacing) / 2;
  return (
    <>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'grid', gap: 6, fontSize: 12, pointerEvents: 'none' }}>
        {towers.map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{t.label}</span>
            <strong style={{ color: t.color, fontFamily: 'var(--font-display)' }}>{t.value.toFixed(2)}</strong>
          </div>
        ))}
      </div>
      <Canvas camera={{ position: [5.2, 3.4, 6.6], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 6, 4]} intensity={80} color="#ffffff" />
        <pointLight position={[-4, 2, -3]} intensity={30} color="#8b5cf6" />
        <group position={[0, -1.1, 0]}>
          {towers.map((t, i) => (
            <TowerMesh key={t.label} tower={t} x={start + i * spacing} height={(t.value / max) * MAX_HEIGHT} delay={i * 0.18} />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
            <circleGeometry args={[3.6, 64]} />
            <meshStandardMaterial color="#0d1525" transparent opacity={0.85} />
          </mesh>
          <gridHelper args={[7, 14, '#1d3a33', '#13202f']} position={[0, 0.002, 0]} />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} minPolarAngle={0.6} maxPolarAngle={1.35} />
      </Canvas>
    </>
  );
}
