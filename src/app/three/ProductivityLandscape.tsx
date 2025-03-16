import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Plane, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Task, ProductivityStats } from '../store/useTaskStore';
import TaskObject3D from './TaskObject3D';

interface ProductivityLandscapeProps {
  tasks: Task[];
  stats: ProductivityStats;
  onTaskClick?: (taskId: string) => void;
}

export default function ProductivityLandscape({ tasks, stats, onTaskClick }: ProductivityLandscapeProps) {
  const groundRef = useRef<THREE.Mesh>(null);
  const focusMountainRef = useRef<THREE.Mesh>(null);
  const procrastinationSwampRef = useRef<THREE.Mesh>(null);
  
  // Simulate landscape features based on productivity
  const landscapeFeatures = useMemo(() => {
    // Calculate average procrastination level
    const avgProcrastination = tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + task.procrastinationLevel, 0) / tasks.length 
      : 0;
    
    // Calculate completion ratio
    const completionRatio = tasks.length > 0 
      ? tasks.filter(t => t.status === 'completed').length / tasks.length 
      : 0;
    
    // Height of the focus mountain increases with task completion
    const focusMountainHeight = 1 + completionRatio * 3;
    
    // Size of procrastination swamp increases with procrastination level
    const swampSize = 5 + avgProcrastination * 0.1;
    
    // Color of the ground changes based on overall productivity
    const productivityScore = Math.min(1, stats.totalTasksCompleted / Math.max(10, tasks.length * 0.5));
    const groundColor = new THREE.Color().setHSL(
      0.3 * productivityScore, // Greener as productivity increases
      0.8,
      0.4 + productivityScore * 0.2
    );
    
    return {
      focusMountainHeight,
      swampSize,
      groundColor
    };
  }, [tasks, stats]);
  
  // Easter eggs that appear based on achievements
  const hasAchievements = stats.achievements && stats.achievements.length > 0;
  const timeWarped = tasks.some(t => t.procrastinationLevel > 80);
  
  // Ground plane with noise displacement
  useFrame(({ clock }) => {
    if (groundRef.current) {
      // Subtle ground movement
      groundRef.current.material.uniforms.time.value = clock.getElapsedTime() * 0.2;
    }
    
    if (focusMountainRef.current) {
      // Mountain pulsates slightly when you're productive
      focusMountainRef.current.scale.y = landscapeFeatures.focusMountainHeight * 
        (1 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05);
    }
    
    if (procrastinationSwampRef.current) {
      // Swamp bubbles and shifts when you procrastinate
      procrastinationSwampRef.current.material.uniforms.time.value = clock.getElapsedTime() * 0.5;
      const swampBubbleIntensity = tasks.filter(t => t.status === 'running-away').length * 0.1;
      procrastinationSwampRef.current.material.uniforms.distortionScale.value = 0.2 + swampBubbleIntensity;
    }
  });
  
  // Custom swamp material with bubbling effect
  const swampMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#2d3436') },
        time: { value: 0 },
        distortionScale: { value: 0.2 }
      },
      vertexShader: `
        uniform float time;
        uniform float distortionScale;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Add bubbling effect
          float bubbleX = sin(pos.x * 2.0 + time) * distortionScale;
          float bubbleZ = cos(pos.z * 2.0 + time * 0.7) * distortionScale;
          
          pos.y += bubbleX * bubbleZ;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec3 finalColor = color;
          
          // Add some bubble patterns
          float bubble = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time * 0.5);
          bubble = smoothstep(0.9, 1.0, bubble);
          
          finalColor += vec3(0.1, 0.2, 0.3) * bubble;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }, []);
  
  // Custom ground material with noise
  const groundMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: landscapeFeatures.groundColor },
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        
        // Simple noise function
        float noise(vec2 p) {
          return sin(p.x * 10.0) * sin(p.y * 10.0);
        }
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Subtle terrain displacement
          float noiseValue = noise(pos.xz * 0.1 + time * 0.05);
          pos.y += noiseValue * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;
        
        void main() {
          // Add some texture
          float stripe = mod(vUv.x * 20.0, 1.0);
          stripe = smoothstep(0.4, 0.5, stripe) - smoothstep(0.5, 0.6, stripe);
          
          vec3 finalColor = color + color * stripe * 0.1;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }, [landscapeFeatures.groundColor]);
  
  return (
    <group>
      {/* Ground plane */}
      <mesh 
        ref={groundRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]}
      >
        <planeGeometry args={[30, 30, 32, 32]} />
        <primitive object={groundMaterial} />
      </mesh>
      
      {/* Focus Mountain */}
      <group position={[0, 0, -8]}>
        <mesh
          ref={focusMountainRef}
          position={[0, landscapeFeatures.focusMountainHeight / 2, 0]}
        >
          <coneGeometry args={[3, landscapeFeatures.focusMountainHeight, 16]} />
          <meshStandardMaterial color="#6d28d9" roughness={0.7} />
        </mesh>
        
        <Text
          position={[0, landscapeFeatures.focusMountainHeight + 1, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          FOCUS MOUNTAIN
        </Text>
        
        {stats.currentStreak > 5 && (
          <mesh position={[0, landscapeFeatures.focusMountainHeight + 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.5, 16]} />
            <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={1} />
          </mesh>
        )}
      </group>
      
      {/* Procrastination Swamp */}
      <group position={[-8, -0.3, 5]}>
        <mesh
          ref={procrastinationSwampRef}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[landscapeFeatures.swampSize, landscapeFeatures.swampSize, 20, 20]} />
          <primitive object={swampMaterial} />
        </mesh>
        
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.4}
          color="#fb923c"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          PROCRASTINATION SWAMP
        </Text>
        
        {tasks.filter(t => t.status === 'running-away').length > 0 && (
          <group position={[0, 0.1, 0]}>
            {Array(3).fill(0).map((_, i) => (
              <mesh key={i} position={[
                (Math.random() - 0.5) * landscapeFeatures.swampSize * 0.5,
                Math.random() * 0.2,
                (Math.random() - 0.5) * landscapeFeatures.swampSize * 0.5
              ]}>
                <sphereGeometry args={[0.2 + Math.random() * 0.3, 16, 16]} />
                <meshStandardMaterial 
                  color="#2d3436" 
                  transparent 
                  opacity={0.8} 
                  emissive="#fb923c"
                  emissiveIntensity={0.2}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>
      
      {/* Achievement Island */}
      {hasAchievements && (
        <group position={[8, -0.2, 6]}>
          <mesh>
            <cylinderGeometry args={[2, 2.5, 0.5, 16]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            ACHIEVEMENT ISLAND
          </Text>
          
          {stats.achievements.filter(a => a.isUnlocked).map((achievement, index) => (
            <mesh key={index} position={[
              1.5 * Math.cos(index * Math.PI / 3),
              0.3,
              1.5 * Math.sin(index * Math.PI / 3)
            ]}>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial 
                color="#f97316" 
                emissive="#f97316"
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Time Warp Zone */}
      {timeWarped && (
        <group position={[0, 0, 8]}>
          <mesh>
            <torusGeometry args={[3, 0.5, 16, 32]} />
            <meshStandardMaterial 
              color="#d946ef" 
              emissive="#d946ef"
              emissiveIntensity={0.5}
              wireframe={true}
            />
          </mesh>
          
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.4}
            color="#e879f9"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            TIME WARP ZONE
          </Text>
        </group>
      )}
      
      {/* Render 3D task objects */}
      {tasks.map((task) => (
        <TaskObject3D 
          key={task.id} 
          task={task} 
          onClick={() => onTaskClick && onTaskClick(task.id)} 
        />
      ))}
      
      {/* Add a ridiculous productivity evaluation sign */}
      <group position={[0, 1, 0]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[5, 1.5, 0.2]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
        
        <Text
          position={[0, 3, 0.2]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {stats.totalTasksCompleted < 3 
            ? "PRODUCTIVITY STATUS: PATHETIC" 
            : stats.totalTasksCompleted < 10
              ? "PRODUCTIVITY STATUS: MEDIOCRE AT BEST"
              : "PRODUCTIVITY STATUS: SURPRISINGLY ADEQUATE"
          }
        </Text>
      </group>
    </group>
  );
} 