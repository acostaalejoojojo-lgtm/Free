import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '../types';

interface AnimatedAvatarProps {
  config: AvatarConfig;
  name?: string;
  animation?: 'idle' | 'walk' | 'jump' | 'emote';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  showNameTag?: boolean;
}

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  config, 
  name, 
  animation = 'idle',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  showNameTag = true
}) => {
  const group = useRef<THREE.Group>(null);
  const [modelUrl, setModelUrl] = useState<string>(config.base === 'default' ? 'https://cdn.glidrovia.com/avatars/standard_glidrovia.glb' : config.base);
  
  // Use GLTF loader for the base avatar
  // For this implementation, we use a placeholder logic if URLs are broken
  const { scene, animations: modelAnims } = useGLTF(modelUrl, true);
  const { actions, names } = useAnimations(modelAnims, group);

  useEffect(() => {
    // Stop all current animations
    Object.values(actions).forEach(action => action?.stop());

    // Logic for animation selection
    let animToPlay = '';
    
    if (animation === 'idle' && config.animations?.idle) {
      animToPlay = 'idle';
    } else if (animation === 'walk' && config.animations?.walk) {
      animToPlay = 'walk';
    } else if (animation === 'jump' && config.animations?.jump) {
      animToPlay = 'jump';
    }

    // Try to play if found in model animations, otherwise play first available
    if (actions[animToPlay]) {
      actions[animToPlay]?.reset().fadeIn(0.5).play();
    } else if (names.length > 0) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }

    return () => {
      Object.values(actions).forEach(action => action?.fadeOut(0.5));
    };
  }, [animation, actions, names, config]);

  // Apply body colors or textures if the model supports it
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Apply basic tint if materials have specific names
          if (mesh.name.toLowerCase().includes('skin') && config.bodyColors?.head) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(config.bodyColors.head);
          }
        }
      });
    }
  }, [scene, config]);

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
      
      {showNameTag && name && (
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
          <Text
            position={[0, 2.4, 0]}
            fontSize={0.18}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/robotomonocondensed/v7/L0xeDFM9_th2s8_DnyX_R3Xf.woff"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {name}
          </Text>
        </Float>
      )}
    </group>
  );
};

// Preload standard model
useGLTF.preload('https://cdn.glidrovia.com/avatars/standard_glidrovia.glb');
