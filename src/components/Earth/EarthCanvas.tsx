import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BackSide,
  DirectionalLight,
  Group,
  Mesh,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import earthTextureUrl from '../../assets/models/images/0_Tierra1.jpg'
import cloudTextureUrl from '../../assets/models/images/1_Tierra1 (Nubes).jpg'
import {
  AUTO_ROTATION_SPEED,
  CLOUD_ROTATION_SPEED,
  DEFAULT_CAMERA_DISTANCE,
  EARTH_RADIUS,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
} from './constants'
import { AllEarthquakePoints, EarthquakeMarker } from './EarthMarkers'
import { EarthSequences } from './EarthSequences'
import type {
  EarthquakePoint,
  FocusLocation,
  SeismicRoleInfo,
  SeismicSequence,
} from './types'
import { latLonToVector3 } from './utils/geoUtils'

function RotatingEarth({
  earthquakes,
  focusLocation,
  isInteractingRef,
  rolesByEarthquakeId,
  selectedId,
  seismicSequences,
  onSelectEarthquake,
}: {
  earthquakes: EarthquakePoint[]
  focusLocation: FocusLocation | null
  isInteractingRef: { current: boolean }
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
  selectedId: string | null
  seismicSequences: SeismicSequence[]
  onSelectEarthquake: (earthquake: EarthquakePoint) => void
}) {
  const groupRef = useRef<Group>(null)
  const cloudsRef = useRef<Mesh>(null)
  const focusQuaternionRef = useRef<Quaternion | null>(null)
  const [earthTexture, cloudTexture] = useLoader(TextureLoader, [
    earthTextureUrl,
    cloudTextureUrl,
  ])

  useEffect(() => {
    if (!focusLocation) {
      return
    }

    const locationVector = latLonToVector3(
      focusLocation.latitude,
      focusLocation.longitude,
      EARTH_RADIUS,
    ).normalize()

    focusQuaternionRef.current = new Quaternion().setFromUnitVectors(
      locationVector,
      new Vector3(0, 0, 1),
    )
  }, [focusLocation])

  const selectedEarthquake = useMemo(
    () => earthquakes.find((earthquake) => earthquake.id === selectedId) ?? null,
    [earthquakes, selectedId],
  )

  useFrame((_, delta) => {
    if (focusQuaternionRef.current && groupRef.current) {
      groupRef.current.quaternion.slerp(focusQuaternionRef.current, 0.08)

      if (groupRef.current.quaternion.angleTo(focusQuaternionRef.current) < 0.002) {
        focusQuaternionRef.current = null
      }
    }

    if (!isInteractingRef.current && !focusQuaternionRef.current && groupRef.current) {
      groupRef.current.rotation.y += delta * AUTO_ROTATION_SPEED
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * CLOUD_ROTATION_SPEED
    }
  })

  return (
    <group ref={groupRef} rotation={[0.08, -0.55, -0.12]}>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.88}
          metalness={0.02}
          opacity={0.94}
          transparent
        />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.94, 96, 96]} />
        <meshStandardMaterial
          alphaMap={cloudTexture}
          blending={AdditiveBlending}
          color="#ffffff"
          depthWrite={false}
          opacity={0.34}
          transparent
        />
      </mesh>
      <mesh scale={2.1}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#4aa3ff"
          opacity={0.08}
          side={BackSide}
          transparent
        />
      </mesh>
      <EarthSequences sequences={seismicSequences} />
      <AllEarthquakePoints
        earthquakes={earthquakes}
        rolesByEarthquakeId={rolesByEarthquakeId}
        onSelect={onSelectEarthquake}
      />
      {selectedEarthquake ? (
        <EarthquakeMarker
          earthquake={selectedEarthquake}
          isSelected
          key={selectedEarthquake.id}
          roleInfo={rolesByEarthquakeId[selectedEarthquake.id]}
          onSelect={onSelectEarthquake}
        />
      ) : null}
    </group>
  )
}

function CameraControls({ isInteractingRef }: { isInteractingRef: { current: boolean } }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.rotateSpeed = 0.52
    controls.zoomSpeed = 0.78
    controls.minDistance = MIN_CAMERA_DISTANCE
    controls.maxDistance = MAX_CAMERA_DISTANCE
    controls.target.set(0, 0, 0)

    const handleStart = () => {
      isInteractingRef.current = true
    }
    const handleEnd = () => {
      isInteractingRef.current = false
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)
    controlsRef.current = controls

    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
      controls.dispose()
      controlsRef.current = null
    }
  }, [camera, gl, isInteractingRef])

  useFrame(() => {
    controlsRef.current?.update()
  })

  return null
}

function getSunPosition(date = new Date()) {
  const dayProgress =
    (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = (date.getTime() - yearStart) / 86400000
  const axialTilt = Math.sin(((dayOfYear - 81) / 365) * Math.PI * 2) * 0.41
  const angle = dayProgress * Math.PI * 2

  return new Vector3(Math.cos(angle) * 5, Math.sin(axialTilt) * 3.2, Math.sin(angle) * 5)
}

function SceneLights() {
  const sunRef = useRef<DirectionalLight>(null)

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.copy(getSunPosition())
      sunRef.current.target.position.set(0, 0, 0)
      sunRef.current.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight args={['#f7efe3', '#0d1b2a', 0.45]} />
      <directionalLight ref={sunRef} intensity={4.6} position={getSunPosition()} />
      <pointLight color="#6ac8ff" intensity={1.5} position={[-3, -1, -2]} />
    </>
  )
}

export function EarthCanvas({
  earthquakes,
  focusLocation,
  isInteractingRef,
  rolesByEarthquakeId,
  selectedId,
  seismicSequences,
  onSelectEarthquake,
}: {
  earthquakes: EarthquakePoint[]
  focusLocation: FocusLocation | null
  isInteractingRef: { current: boolean }
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
  selectedId: string | null
  seismicSequences: SeismicSequence[]
  onSelectEarthquake: (earthquake: EarthquakePoint) => void
}) {
  return (
    <Canvas camera={{ fov: 38, position: [0, 0, DEFAULT_CAMERA_DISTANCE] }} dpr={[1, 2]}>
      <color attach="background" args={['#030712']} />
      <SceneLights />
      <CameraControls isInteractingRef={isInteractingRef} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.35}
          luminanceSmoothing={0.22}
          luminanceThreshold={0.58}
          mipmapBlur
          radius={0.62}
        />
      </EffectComposer>
      <Suspense fallback={null}>
        <RotatingEarth
          earthquakes={earthquakes}
          focusLocation={focusLocation}
          isInteractingRef={isInteractingRef}
          rolesByEarthquakeId={rolesByEarthquakeId}
          selectedId={selectedId}
          seismicSequences={seismicSequences}
          onSelectEarthquake={onSelectEarthquake}
        />
      </Suspense>
    </Canvas>
  )
}