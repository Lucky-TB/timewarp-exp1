import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeCanvasProps {
  children: React.ReactNode;
  showStats?: boolean;
  backgroundColor?: string;
  cameraPosition?: [number, number, number];
}

const CameraController = ({ cameraPosition }: { cameraPosition?: [number, number, number] }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  
  React.useEffect(() => {
    if (cameraPosition) {
      camera.position.set(...cameraPosition);
      camera.lookAt(0, 0, 0);
    }
  }, [camera, cameraPosition]);
  
  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />;
};

const TimeWarpEffect = () => {
  const { scene } = useThree();
  const timeRef = useRef(0);
  
  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
    
    // Create a subtle color shift effect
    const hue = (Math.sin(timeRef.current * 0.1) + 1) * 0.1;
    scene.background = new THREE.Color().setHSL(hue, 0.5, 0.2);
  });
  
  return null;
};

export default function ThreeCanvas({ 
  children, 
  showStats = false, 
  backgroundColor = '#050505',
  cameraPosition = [0, 2, 5]
}: ThreeCanvasProps) {
  return (
    <Canvas
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
      camera={{ position: cameraPosition, fov: 70 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[backgroundColor]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>
        {children}
        <Environment preset="city" />
      </Suspense>
      <CameraController cameraPosition={cameraPosition} />
      <TimeWarpEffect />
      {showStats && <Stats />}
    </Canvas>
  );
} 