import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  TrackballControls, 
  FirstPersonControls, 
  FlyControls,
  Stage, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  Float,
  useProgress,
  DragControls
} from "@react-three/drei";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-950/80 backdrop-blur-md z-50">
      <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-sky-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm font-medium tracking-widest uppercase">
        Chargement: {Math.round(progress)}%
      </span>
    </div>
  );
}

export type CameraControlType = "Orbit" | "Trackball" | "FirstPerson" | "Fly" | "Gestures";

interface SceneProps {
  children: React.ReactNode;
  controlType?: CameraControlType;
}

export function Scene({ children, controlType = "Orbit" }: SceneProps) {
  return (
    <div className="w-full h-full relative bg-[#0f172a]">
      <Suspense fallback={<LoadingOverlay />}>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
          
          <color attach="background" args={["#0f172a"]} />
          <fog attach="fog" args={["#0f172a", 5, 15]} />

          <Stage 
            intensity={0.6} 
            environment="city" 
            shadows={{ type: 'contact', opacity: 0.3, blur: 3 }} 
            adjustCamera={false}
          >
            <DragControls>
              <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                {children}
              </Float>
            </DragControls>
          </Stage>

          {controlType === "Orbit" && (
            <OrbitControls 
              makeDefault 
              minPolarAngle={0} 
              maxPolarAngle={Math.PI / 1.5} 
              enableDamping 
              dampingFactor={0.05}
              rotateSpeed={0.8}
              zoomSpeed={0.8}
            />
          )}
          {controlType === "Trackball" && <TrackballControls makeDefault />}
          {controlType === "FirstPerson" && <FirstPersonControls makeDefault activeLook={false} />}
          {controlType === "Fly" && <FlyControls makeDefault rollSpeed={0.5} movementSpeed={2} />}
          {controlType === "Gestures" && <OrbitControls makeDefault enablePan={false} enableRotate={true} />}

          <Environment preset="night" />
          
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.5} 
            scale={12} 
            blur={2.5} 
            far={4} 
            color="#000000"
          />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <spotLight 
            position={[-10, 10, 10]} 
            angle={0.15} 
            penumbra={1} 
            intensity={1} 
            castShadow 
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
