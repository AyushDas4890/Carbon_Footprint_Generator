import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 1800;
const DEPTH = 120;
const PALETTE = ['#64ffb4', '#00d9ff', '#8b5cf6'].map((c) => new THREE.Color(c));

function Field() {
  const points = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = -Math.random() * DEPTH;
      const c = PALETTE[i % PALETTE.length];
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, []);

  const lastScroll = useRef(0);
  useFrame((state, delta) => {
    const p = points.current;
    if (!p) return;
    // Scrolling flies the camera forward through the field (a warp effect);
    // particles that pass the camera wrap back to the far plane.
    const scroll = window.scrollY;
    const warp = Math.min(Math.abs(scroll - lastScroll.current) * 0.06, 6);
    lastScroll.current = scroll;
    const arr = p.geometry.attributes.position.array as Float32Array;
    const step = delta * 2 + warp;
    for (let i = 2; i < arr.length; i += 3) {
      arr[i] += step;
      if (arr[i] > 10) arr[i] -= DEPTH;
    }
    p.geometry.attributes.position.needsUpdate = true;
    p.rotation.z += delta * 0.01;

    const { x, y } = state.pointer;
    state.camera.position.x += (x * 4 - state.camera.position.x) * 0.03;
    state.camera.position.y += (y * 3 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, -40);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.32} vertexColors transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Fixed full-screen starfield behind every page. */
export default function ParticleField() {
  return (
    <div className="bg-canvas" aria-hidden>
      <Canvas camera={{ position: [0, 0, 10], fov: 70 }} dpr={[1, 1.75]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
        <fog attach="fog" args={['#050810', 30, 110]} />
        <Field />
      </Canvas>
    </div>
  );
}
