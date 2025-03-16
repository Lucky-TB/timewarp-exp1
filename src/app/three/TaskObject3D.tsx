import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, MeshWobbleMaterial, MeshDistortMaterial } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { Task } from '../store/useTaskStore';

interface TaskObject3DProps {
  task: Task;
  onClick?: () => void;
  scale?: number;
}

// Helper function to calculate urgency based on deadline
const calculateUrgency = (task: Task): number => {
  if (!task.deadline) return 0;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const timeLeft = deadline.getTime() - now.getTime();
  
  // If deadline has passed
  if (timeLeft < 0) return 1;
  
  // If deadline is within 24 hours
  if (timeLeft < 24 * 60 * 60 * 1000) {
    return 0.7 + (0.3 * (1 - timeLeft / (24 * 60 * 60 * 1000)));
  }
  
  // If deadline is within a week
  if (timeLeft < 7 * 24 * 60 * 60 * 1000) {
    return 0.3 + (0.4 * (1 - timeLeft / (7 * 24 * 60 * 60 * 1000)));
  }
  
  return Math.max(0.1, 0.3 * task.importance / 5);
};

export default function TaskObject3D({ task, onClick, scale = 1 }: TaskObject3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const [urgency, setUrgency] = useState(() => calculateUrgency(task));
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(task.position.x, task.position.y, task.position.z)
  );
  
  // Recalculate urgency every second
  useEffect(() => {
    const interval = setInterval(() => {
      setUrgency(calculateUrgency(task));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [task]);
  
  // Spring animation for position, rotation and scale
  const { position, rotation, meshScale } = useSpring({
    position: [targetPosition.x, targetPosition.y, targetPosition.z],
    rotation: hovered 
      ? [0, Math.PI * 2 * urgency, 0] 
      : [0, 0, 0],
    meshScale: hovered 
      ? [scale * 1.2, scale * 1.2, scale * 1.2] 
      : [scale, scale, scale],
    config: { mass: 1, tension: 170, friction: 26 }
  });
  
  // Make tasks run away when procrastinated or when status is "running-away"
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Task is running away
    if (task.status === 'running-away') {
      const time = clock.getElapsedTime();
      const newPos = new THREE.Vector3(
        task.position.x + Math.sin(time) * 0.1 * task.procrastinationLevel,
        task.position.y + Math.abs(Math.sin(time * 2)) * 0.05 * task.procrastinationLevel,
        task.position.z + Math.cos(time * 1.3) * 0.1 * task.procrastinationLevel
      );
      
      // Move further away over time
      const direction = new THREE.Vector3().subVectors(newPos, new THREE.Vector3(0, 0, 0)).normalize();
      newPos.add(direction.multiplyScalar(0.01 * task.procrastinationLevel));
      
      setTargetPosition(newPos);
    }
    
    // Task is completed, make it float gently upward
    if (task.status === 'completed') {
      const time = clock.getElapsedTime();
      setTargetPosition(new THREE.Vector3(
        task.position.x,
        task.position.y + Math.sin(time * 0.5) * 0.05 + 0.01,
        task.position.z
      ));
    }
  });
  
  // Color based on status and urgency
  const getTaskColor = () => {
    if (task.status === 'completed') return '#10b981';
    if (task.status === 'running-away') return '#f97316';
    
    // Color gradient from green to yellow to red based on urgency
    const h = (1 - urgency) * 0.3; // 0.3 = green, 0 = red
    return new THREE.Color().setHSL(h, 0.8, 0.5).getStyle();
  };
  
  // Geometry complexity increases with urgency and task importance
  const getGeometry = () => {
    const complexity = Math.min(10, Math.ceil(2 + task.importance + urgency * 5));
    
    if (task.status === 'running-away') {
      return <tetrahedronGeometry args={[1, Math.floor(complexity / 2)]} />;
    }
    
    if (task.status === 'completed') {
      return <icosahedronGeometry args={[1, 0]} />;
    }
    
    if (urgency > 0.7) {
      return <octahedronGeometry args={[1, Math.floor(complexity / 3)]} />;
    }
    
    return <boxGeometry args={[1, 1, 1, complexity, complexity, complexity]} />;
  };

  return (
    <group>
      <animated.mesh
        ref={meshRef}
        position={position as any}
        rotation={rotation as any}
        scale={meshScale as any}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getGeometry()}
        
        {task.status === 'running-away' ? (
          <MeshDistortMaterial
            color={getTaskColor()}
            speed={urgency * 5}
            distort={urgency * 0.5}
            radius={urgency}
          />
        ) : urgency > 0.5 ? (
          <MeshWobbleMaterial
            color={getTaskColor()}
            factor={urgency * 2}
            speed={urgency * 2}
          />
        ) : (
          <meshStandardMaterial 
            color={getTaskColor()} 
            roughness={0.5} 
            metalness={urgency * 0.5} 
          />
        )}
      </animated.mesh>
      
      <Text
        ref={textRef}
        position={[
          targetPosition.x, 
          targetPosition.y + 1.5 * scale, 
          targetPosition.z
        ]}
        fontSize={0.3 * scale}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {task.title}
      </Text>
      
      {urgency > 0.7 && (
        <Text
          position={[
            targetPosition.x, 
            targetPosition.y + 1.9 * scale, 
            targetPosition.z
          ]}
          fontSize={0.2 * scale}
          color="red"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleString()}` : 'URGENT!'}
        </Text>
      )}
    </group>
  );
} 