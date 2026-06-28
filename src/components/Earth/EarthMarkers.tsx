import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three'
import { SURFACE_MARKER_RADIUS } from './constants'
import type { EarthquakePoint, SeismicRoleInfo } from './types'
import { getDepthRadius, latLonToVector3 } from './utils/geoUtils'
import {
  getBloomColor,
  getMagnitudeRatio,
  getMarkerScale,
  getSeismicRoleColor,
} from './utils/formatters'

const OUTWARD_AXIS = new Vector3(0, 1, 0)

function RippleWave({ color, delay = 0 }: { color: Color; delay?: number }) {
  const ref = useRef<Mesh>(null)
  const materialRef = useRef<MeshBasicMaterial>(null)
  const ageRef = useRef(delay)

  useFrame((_, delta) => {
    ageRef.current = (ageRef.current + delta) % 1.8
    const age = Math.max(0, ageRef.current)
    const progress = age / 1.8

    if (ref.current) {
      const scale = 0.16 + progress * 0.92
      ref.current.scale.setScalar(scale)
    }

    if (materialRef.current) {
      materialRef.current.opacity = Math.max(0, 0.34 * (1 - progress))
    }
  })

  return (
    <mesh ref={ref} raycast={() => null} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.012, 8, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        depthWrite={false}
        opacity={0.32}
        transparent
      />
    </mesh>
  )
}

export function AllEarthquakePoints({
  earthquakes,
  rolesByEarthquakeId,
  onSelect,
}: {
  earthquakes: EarthquakePoint[]
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
  onSelect: (earthquake: EarthquakePoint) => void
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const glowRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useEffect(() => {
    if (!meshRef.current || !glowRef.current) {
      return
    }

    earthquakes.forEach((earthquake, index) => {
      dummy.position.copy(
        latLonToVector3(
          earthquake.latitude,
          earthquake.longitude,
          getDepthRadius(earthquake.depth),
        ),
      )
      const role = rolesByEarthquakeId[earthquake.id]?.role ?? 'background'
      const markerScale = getMarkerScale(earthquake.magnitude)
      const markerColor = getSeismicRoleColor(role)
      const bloomColor = getBloomColor(earthquake.magnitude, role)

      dummy.scale.setScalar(markerScale)
      dummy.updateMatrix()
      meshRef.current?.setMatrixAt(index, dummy.matrix)
      meshRef.current?.setColorAt(index, markerColor)

      dummy.scale.setScalar(markerScale * (1.45 + getMagnitudeRatio(earthquake.magnitude) * 0.8))
      dummy.updateMatrix()
      glowRef.current?.setMatrixAt(index, dummy.matrix)
      glowRef.current?.setColorAt(index, bloomColor)
    })

    meshRef.current.count = earthquakes.length
    glowRef.current.count = earthquakes.length
    meshRef.current.instanceMatrix.needsUpdate = true
    glowRef.current.instanceMatrix.needsUpdate = true

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }

    if (glowRef.current.instanceColor) {
      glowRef.current.instanceColor.needsUpdate = true
    }
  }, [dummy, earthquakes, rolesByEarthquakeId])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (typeof event.instanceId !== 'number') {
      return
    }

    const earthquake = earthquakes[event.instanceId]

    if (earthquake) {
      onSelect(earthquake)
    }
  }

  if (earthquakes.length === 0) {
    return null
  }

  return (
    <>
      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, earthquakes.length]}
        raycast={() => null}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          depthTest={false}
          opacity={0.42}
          toneMapped={false}
          transparent
          vertexColors
        />
      </instancedMesh>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, earthquakes.length]}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 18, 18]} />
        <meshBasicMaterial depthTest={false} toneMapped={false} vertexColors />
      </instancedMesh>
    </>
  )
}

export function EarthquakeMarker({
  earthquake,
  isSelected,
  roleInfo,
  onSelect,
}: {
  earthquake: EarthquakePoint
  isSelected: boolean
  roleInfo: SeismicRoleInfo | undefined
  onSelect: (earthquake: EarthquakePoint) => void
}) {
  const role = roleInfo?.role ?? 'background'
  const surfacePosition = useMemo(
    () => latLonToVector3(earthquake.latitude, earthquake.longitude, SURFACE_MARKER_RADIUS),
    [earthquake.latitude, earthquake.longitude],
  )
  const depthPosition = useMemo(
    () =>
      latLonToVector3(
        earthquake.latitude,
        earthquake.longitude,
        getDepthRadius(earthquake.depth),
      ),
    [earthquake.depth, earthquake.latitude, earthquake.longitude],
  )
  const orientation = useMemo(() => {
    const normal = surfacePosition.clone().normalize()

    return new Quaternion().setFromUnitVectors(OUTWARD_AXIS, normal)
  }, [surfacePosition])
  const depthLine = useMemo(() => {
    const material = new LineBasicMaterial({
      color: getSeismicRoleColor(role),
      opacity: 0.68,
      transparent: true,
    })

    return new Line(new BufferGeometry().setFromPoints([depthPosition, surfacePosition]), material)
  }, [depthPosition, role, surfacePosition])
  const impactColor = useMemo(() => getSeismicRoleColor(role), [role])
  const markerScale = getMarkerScale(earthquake.magnitude)

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(earthquake)
  }

  return (
    <group onClick={handleClick}>
      <primitive object={depthLine} />
      <group position={surfacePosition} quaternion={orientation}>
        {isSelected ? (
          <>
            <RippleWave color={impactColor} />
            <RippleWave color={impactColor} delay={0.72} />
            <RippleWave color={impactColor} delay={1.44} />
          </>
        ) : null}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={markerScale * 3.15}>
          <torusGeometry args={[1, 0.08, 10, 42]} />
          <meshBasicMaterial
            color={impactColor}
            depthWrite={false}
            opacity={isSelected ? 0.88 : 0.58}
            transparent
          />
        </mesh>
      </group>
    </group>
  )
}