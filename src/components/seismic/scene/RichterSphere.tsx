import { Html, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Select } from '@react-three/postprocessing'
import { memo, useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Group, Mesh } from 'three'
import type { MagnitudeDatum } from '../../../constants/magnitudeData'
import { getMagnitudeColor, getMagnitudeScale } from '../../../utils/magnitudeUtils'
import { CrackLines } from './CrackLines'

interface RichterSphereProps {
  isMobile: boolean
  onReady: () => void
  selectedMagnitude: MagnitudeDatum
}

export const RichterSphere = memo(function RichterSphere({
  isMobile,
  onReady,
  selectedMagnitude,
}: RichterSphereProps) {
  const groupRef = useRef<Group>(null)
  const glowRef = useRef<Mesh>(null)

  const magnitude = selectedMagnitude.magnitude
  const {
    color,
    glowScale,
    isMajor,
    labelOffset,
    positionX,
    positionY,
    shake,
    sphereScale,
    textOffset,
  } = useMemo(() => {
    const currentSphereScale = getMagnitudeScale(magnitude) * (isMobile ? 0.72 : 1)

    return {
      color: getMagnitudeColor(magnitude),
      glowScale: currentSphereScale * (1.18 + magnitude * 0.022),
      isMajor: magnitude >= 7,
      labelOffset: currentSphereScale + (isMobile ? 0.36 : 0.48),
      positionX: isMobile ? 1.85 : 2.72,
      positionY: isMobile ? -0.08 : 0.1,
      shake: Math.max(0.004, (magnitude - 3.5) * 0.01),
      sphereScale: currentSphereScale,
      textOffset: -currentSphereScale - 0.36,
    }
  }, [isMobile, magnitude])

  useEffect(() => {
    onReady()
  }, [onReady])

  useFrame((_, delta) => {
    const time = performance.now() * 0.001

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.18 + magnitude * 0.018)
      groupRef.current.rotation.x = Math.sin(time * 1.4) * 0.035
      groupRef.current.position.x = positionX + Math.sin(time * 38) * shake
      groupRef.current.position.y = positionY + Math.cos(time * 31) * shake
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(time * (2.8 + magnitude * 0.4)) * 0.08
      glowRef.current.scale.setScalar(glowScale * pulse)
    }
  })

  return (
    <group ref={groupRef} position={[positionX, positionY, 0]}>
      <Select enabled={isMajor}>
        <mesh castShadow={!isMobile} receiveShadow={!isMobile} scale={sphereScale}>
          <sphereGeometry args={[1, isMobile ? 56 : 96, isMobile ? 56 : 96]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.18 + magnitude * 0.035}
            metalness={0.04}
            roughness={0.42}
          />
        </mesh>
      </Select>

      <group scale={sphereScale * 1.01}>
        <CrackLines isMobile={isMobile} magnitude={magnitude} />
      </group>

      <mesh ref={glowRef} scale={glowScale}>
        <sphereGeometry args={[1, isMobile ? 24 : 48, isMobile ? 24 : 48]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={color}
          depthWrite={false}
          opacity={0.09 + magnitude * 0.01}
          transparent
        />
      </mesh>

      <Text
        anchorX="center"
        anchorY="middle"
        color="#f8f4ec"
        fontSize={isMobile ? 0.22 : 0.28}
        position={[0, textOffset, 0.24]}
      >
        M {magnitude}.0
      </Text>

      <Html
        center
        distanceFactor={isMobile ? 10 : 8}
        position={[0, labelOffset, 0]}
        transform
      >
        <div className="scale-3d-label">
          <strong>{selectedMagnitude.label}</strong>
          <span>{selectedMagnitude.note}</span>
        </div>
      </Html>
    </group>
  )
})
