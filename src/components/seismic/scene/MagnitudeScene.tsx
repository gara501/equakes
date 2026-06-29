import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Outline,
  Selection,
} from '@react-three/postprocessing'
import { memo } from 'react'
import type { MagnitudeDatum } from '../../../constants/magnitudeData'
import { RichterSphere } from './RichterSphere'

interface MagnitudeSceneProps {
  isMobile: boolean
  onReady: () => void
  selectedMagnitude: MagnitudeDatum
}

export const MagnitudeScene = memo(function MagnitudeScene({
  isMobile,
  onReady,
  selectedMagnitude,
}: MagnitudeSceneProps) {
  return (
    <Canvas
      camera={{ fov: isMobile ? 44 : 42, position: isMobile ? [0, 0.75, 10.8] : [0, 0.8, 8.8] }}
      dpr={isMobile ? [1, 1.3] : [1, 2]}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      shadows={!isMobile}
    >
      <color attach="background" args={['#0a1420']} />
      <ambientLight intensity={0.42} />
      <directionalLight castShadow={!isMobile} intensity={3.2} position={[4, 5, 5]} />
      <pointLight color="#ffcf6e" intensity={3.2} position={[-2.6, 2.5, 3]} />
      <pointLight color="#43a7ff" intensity={1.5} position={[4, -1, 2.8]} />

      <Selection>
        <RichterSphere
          isMobile={isMobile}
          onReady={onReady}
          selectedMagnitude={selectedMagnitude}
        />

        <mesh
          receiveShadow={!isMobile}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[isMobile ? 1.85 : 2.7, -2.25, 0]}
        >
          <circleGeometry args={[isMobile ? 2.45 : 3.2, isMobile ? 48 : 80]} />
          <meshStandardMaterial color="#101b28" roughness={0.82} transparent opacity={0.72} />
        </mesh>

        <EffectComposer autoClear={false} multisampling={0}>
          <Bloom
            intensity={isMobile ? 1.15 : 1.45}
            luminanceThreshold={0.24}
            luminanceSmoothing={0.16}
            mipmapBlur={!isMobile}
            radius={isMobile ? 0.42 : 0.7}
          />
          {isMobile ? (
            <></>
          ) : (
            <DepthOfField focusDistance={0.018} focalLength={0.026} bokehScale={1.05} />
          )}
          <Outline
            blur
            edgeStrength={isMobile ? 3.2 : 4.2}
            hiddenEdgeColor={0xff3b1f}
            pulseSpeed={0.5}
            visibleEdgeColor={0xfff4c2}
          />
        </EffectComposer>
      </Selection>

      <OrbitControls
        enableDamping
        enablePan={false}
        maxDistance={11}
        minDistance={6.4}
        target={isMobile ? [1.75, -0.06, 0] : [2.4, 0, 0]}
      />
    </Canvas>
  )
})
