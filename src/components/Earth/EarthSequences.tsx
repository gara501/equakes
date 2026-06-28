import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  Quaternion,
  Vector3,
} from 'three'
import { SURFACE_MARKER_RADIUS } from './constants'
import type { EarthquakePoint, SeismicSequence } from './types'
import { getDepthRadius, latLonToVector3 } from './utils/geoUtils'
import { getMarkerScale, getSeismicRoleColor } from './utils/formatters'

const OUTWARD_AXIS = new Vector3(0, 1, 0)
const EARTH_CIRCUMFERENCE_KM = 40075

function getFaultScale(radiusKm: number) {
  const surfaceUnits = (radiusKm / EARTH_CIRCUMFERENCE_KM) * Math.PI * 2 * SURFACE_MARKER_RADIUS

  return Math.max(0.12, Math.min(0.58, surfaceUnits * 2.2))
}

function getEarthquakePosition(earthquake: EarthquakePoint) {
  return latLonToVector3(
    earthquake.latitude,
    earthquake.longitude,
    getDepthRadius(earthquake.depth),
  )
}

function getEarthquakeRole(earthquake: EarthquakePoint, sequence: SeismicSequence) {
  if (earthquake.id === sequence.mainshock.id) {
    return 'mainshock'
  }

  if ((earthquake.time ?? 0) < (sequence.mainshock.time ?? 0)) {
    return 'foreshock'
  }

  return 'aftershock'
}

function SequenceLines({ sequence }: { sequence: SeismicSequence }) {
  const lines = useMemo(
    () =>
      sequence.earthquakes.slice(1).map((earthquake, index) => {
        const previousEarthquake = sequence.earthquakes[index]
        const role = getEarthquakeRole(earthquake, sequence)
        const geometry = new BufferGeometry().setFromPoints([
          getEarthquakePosition(previousEarthquake),
          getEarthquakePosition(earthquake),
        ])
        const material = new LineBasicMaterial({
          color: getSeismicRoleColor(role),
          depthTest: false,
          opacity: role === 'mainshock' ? 0.92 : 0.66,
          transparent: true,
        })

        return new Line(geometry, material)
      }),
    [sequence],
  )

  return (
    <>
      {lines.map((line, index) => (
        <primitive key={`${sequence.id}-line-${index}`} object={line} />
      ))}
    </>
  )
}

function SequenceVolume({ sequence }: { sequence: SeismicSequence }) {
  const position = useMemo(
    () =>
      latLonToVector3(
        sequence.centerLatitude,
        sequence.centerLongitude,
        getDepthRadius(sequence.centerDepth),
      ),
    [sequence.centerDepth, sequence.centerLatitude, sequence.centerLongitude],
  )
  const orientation = useMemo(() => {
    const normal = position.clone().normalize()

    return new Quaternion().setFromUnitVectors(OUTWARD_AXIS, normal)
  }, [position])
  const scale = getFaultScale(sequence.radiusKm)

  return (
    <mesh position={position} quaternion={orientation} scale={[scale, scale * 0.46, scale]}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial
        blending={AdditiveBlending}
        color="#ff5a1f"
        depthWrite={false}
        opacity={0.11}
        transparent
      />
    </mesh>
  )
}

function MainshockRing({ earthquake }: { earthquake: EarthquakePoint }) {
  const ref = useRef<Mesh>(null)
  const { camera } = useThree()
  const position = useMemo(() => getEarthquakePosition(earthquake), [earthquake])
  const scale = getMarkerScale(earthquake.magnitude) * 5.2

  useFrame(() => {
    ref.current?.lookAt(camera.position)
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[1, 0.065, 12, 56]} />
      <meshBasicMaterial
        blending={AdditiveBlending}
        color={getSeismicRoleColor('mainshock')}
        depthTest={false}
        opacity={0.82}
        toneMapped={false}
        transparent
      />
    </mesh>
  )
}

export function EarthSequences({ sequences }: { sequences: SeismicSequence[] }) {
  if (sequences.length === 0) {
    return null
  }

  return (
    <>
      {sequences.map((sequence) => (
        <group key={sequence.id}>
          <SequenceVolume sequence={sequence} />
          <SequenceLines sequence={sequence} />
          <MainshockRing earthquake={sequence.mainshock} />
        </group>
      ))}
    </>
  )
}