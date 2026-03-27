import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, MeshWobbleMaterial, Sphere, Box, Cylinder, TorusKnot } from "@react-three/drei";
import * as THREE from "three";
import { useControls } from "leva";

interface MedicalModelProps {
  selectedLayer: string;
  module: string;
  onAnnotation: (annotation: { title: string; description: string; x: number; y: number }) => void;
  highlightedPart?: string | null;
}

export function MedicalModel({ selectedLayer, module, onAnnotation, highlightedPart }: MedicalModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const handleMeshClick = (e: any, title: string, description: string) => {
    e.stopPropagation();
    onAnnotation({ title, description, x: e.clientX, y: e.clientY });
  };

  const getMaterial = (title: string, defaultMaterial: React.ReactElement) => {
    if (highlightedPart === title) {
      return (
        <meshStandardMaterial 
          color="#3b82f6" 
          emissive="#3b82f6" 
          emissiveIntensity={2} 
          roughness={0.2} 
        />
      );
    }
    return defaultMaterial;
  };

  const { rotationSpeed, modelScale } = useControls("Modèle 3D", {
    rotationSpeed: { value: 0.005, min: 0, max: 0.05, step: 0.001, label: "Vitesse Rotation" },
    modelScale: { value: 1, min: 0.5, max: 2, step: 0.1, label: "Échelle" },
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  const renderAnatomy = () => (
    <>
      {/* Squelette - Base Structure */}
      <group visible={selectedLayer === "Système Squelettique" || selectedLayer === "Squelette"}>
        <Cylinder args={[0.5, 0.5, 3, 32]} position={[0, 0, 0]} onClick={(e) => handleMeshClick(e, "Fémur", "Os de la cuisse")}>
          {getMaterial("Fémur", <meshStandardMaterial color="#f5f5dc" roughness={0.1} metalness={0.2} />)}
        </Cylinder>
        <Sphere args={[0.6, 32, 32]} position={[0, 1.8, 0]} onClick={(e) => handleMeshClick(e, "Crâne", "Structure osseuse de la tête")}>
          {getMaterial("Crâne", <meshStandardMaterial color="#f5f5dc" roughness={0.1} metalness={0.2} />)}
        </Sphere>
      </group>

      {/* Muscles */}
      <group visible={selectedLayer === "Système Musculaire" || selectedLayer === "Muscles"}>
        <Sphere args={[0.7, 64, 64]} position={[0, 0.5, 0]} scale={[1, 1.5, 0.8]} onClick={(e) => handleMeshClick(e, "Muscle", "Tissu contractile")}>
          {getMaterial("Muscle", <MeshWobbleMaterial color="#cd5c5c" speed={1} factor={0.2} />)}
        </Sphere>
      </group>

      {/* Vasculaire */}
      <group visible={selectedLayer === "Système Cardiovasculaire" || selectedLayer === "Vasculaire"}>
        <Cylinder args={[0.1, 0.1, 4, 32]} position={[0.1, 0, 0]}>
          <meshStandardMaterial color="#b22222" emissive="#b22222" emissiveIntensity={1} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 4, 32]} position={[-0.1, 0, 0]}>
          <meshStandardMaterial color="#4169e1" emissive="#4169e1" emissiveIntensity={1} />
        </Cylinder>
      </group>

      {/* Nerveux */}
      <group visible={selectedLayer === "Système Nerveux"}>
        <Cylinder args={[0.05, 0.05, 4, 32]} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </Cylinder>
      </group>

      {/* Peau */}
      <group visible={selectedLayer === "Peau"}>
        <Cylinder args={[0.8, 0.8, 3.2, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ffdbac" transparent opacity={0.3} />
        </Cylinder>
      </group>
    </>
  );

  const renderOdontology = () => (
    <group>
      {/* Dental Arch */}
      <group position={[0, -0.5, 0]}>
        {[...Array(8)].map((_, i) => (
          <group key={i} position={[Math.sin(i * 0.4) * 1.2, 0, Math.cos(i * 0.4) * 1.2]} rotation={[0, i * 0.4, 0]}>
            {/* Tooth representation */}
            <Box args={[0.3, 0.4, 0.3]} position={[0, 0.2, 0]} onClick={(e) => handleMeshClick(e, "Dent", "Une dent de l'arcade dentaire")}>
              <meshStandardMaterial color="#fffaf0" roughness={0.05} metalness={0.1} />
            </Box>
            <Box args={[0.35, 0.1, 0.35]} position={[0, 0, 0]} onClick={(e) => handleMeshClick(e, "Gencive", "Tissu gingival")}>
              <meshStandardMaterial color="#ffdbac" />
            </Box>
          </group>
        ))}
      </group>
      {/* Jaw Bone */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} onClick={(e) => handleMeshClick(e, "Mâchoire", "Os de la mâchoire")}>
        <torusGeometry args={[1.3, 0.2, 16, 100, Math.PI]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
    </group>
  );

  const renderCardiology = () => (
    <group>
      <Sphere args={[0.8, 64, 64]} scale={[1, 1.2, 0.9]} onClick={(e) => handleMeshClick(e, "Cœur", "Organe musculaire central")}>
        <MeshWobbleMaterial color="#b22222" speed={2} factor={0.3} />
      </Sphere>
      {/* Aorta */}
      <TorusKnot args={[0.3, 0.1, 64, 16]} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={(e) => handleMeshClick(e, "Aorte", "Artère principale")}>
        <meshStandardMaterial color="#ef4444" />
      </TorusKnot>
      {/* Vena Cava */}
      <Cylinder args={[0.15, 0.15, 2, 32]} position={[-0.4, 0, 0]} onClick={(e) => handleMeshClick(e, "Veine Cave", "Veine principale")}>
        <meshStandardMaterial color="#4169e1" />
      </Cylinder>
    </group>
  );

  const renderNeurology = () => (
    <group>
      <Sphere args={[1, 64, 64]} scale={[1, 0.8, 1.1]} onClick={(e) => handleMeshClick(e, "Cerveau", "Centre du système nerveux")}>
        <MeshDistortMaterial color="#deb887" speed={1} distort={0.2} />
      </Sphere>
      {/* Brain Stem */}
      <Cylinder args={[0.2, 0.3, 1.5, 32]} position={[0, -0.8, -0.2]} rotation={[0.2, 0, 0]} onClick={(e) => handleMeshClick(e, "Tronc Cérébral", "Connexion cerveau-moelle")}>
        <meshStandardMaterial color="#faf0e6" />
      </Cylinder>
    </group>
  );

  const renderOrthopedics = () => (
    <group>
      <Cylinder args={[0.3, 0.3, 2, 32]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial color="#f5f5dc" />
      </Cylinder>
      <Sphere args={[0.4, 32, 32]} position={[0.7, 0.7, 0]}>
        <meshStandardMaterial color="#f5f5dc" />
      </Sphere>
    </group>
  );

  const renderOphthalmology = () => (
    <group>
      <Sphere args={[0.8, 64, 64]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.4, 32, 32]} position={[0, 0, 0.6]}>
        <meshStandardMaterial color="#3b82f6" />
      </Sphere>
      <Sphere args={[0.15, 32, 32]} position={[0, 0, 0.9]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
    </group>
  );

  return (
    <group ref={groupRef} scale={modelScale}>
      {module === "Odontologie" && renderOdontology()}
      {module === "Cardiologie" && renderCardiology()}
      {module === "Neurologie" && renderNeurology()}
      {module === "Orthopédie" && renderOrthopedics()}
      {module === "Ophtalmologie" && renderOphthalmology()}
      {(module === "Anatomie Générale" || module === "Anatomie" || module === "Tableau de bord") && renderAnatomy()}
    </group>
  );
}
