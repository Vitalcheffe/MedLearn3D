import { MeshDistortMaterial, Sphere } from "@react-three/drei";

export function PlaceholderModel() {
  return (
    <group>
      <Sphere args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#1a5276"
          speed={2}
          distort={0.4}
          radius={1}
        />
      </Sphere>
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </group>
  );
}
