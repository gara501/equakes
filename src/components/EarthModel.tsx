import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  Mesh,
  Object3D,
  Quaternion,
  TextureLoader,
  Vector3,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import earthTextureUrl from '../assets/models/images/0_Tierra1.jpg'
import cloudTextureUrl from '../assets/models/images/1_Tierra1 (Nubes).jpg'

const EARTHQUAKE_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
const EARTH_RADIUS = 1.9
const SURFACE_MARKER_RADIUS = 2.04
const DEFAULT_CAMERA_DISTANCE = 6.2
const MIN_CAMERA_DISTANCE = 3.15
const MAX_CAMERA_DISTANCE = 9.2
const AUTO_ROTATION_SPEED = 0.018
const CLOUD_ROTATION_SPEED = 0.035
const MIN_VISIBLE_MAGNITUDE = 4
const MAX_DEPTH_KM = 500
const MAX_DEPTH_OFFSET = 0.62
const OUTWARD_AXIS = new Vector3(0, 1, 0)
const GREEN = new Color('#28d66f')
const YELLOW = new Color('#ffe45e')
const RED = new Color('#ff2020')

interface EarthquakeFeature {
  id: string
  geometry: {
    coordinates: [number, number, number]
  }
  properties: {
    mag: number | null
    place: string | null
    time: number | null
    tsunami: number | null
    url: string | null
  }
}

interface EarthquakeFeed {
  features: EarthquakeFeature[]
}

interface EarthquakePoint {
  id: string
  depth: number
  latitude: number
  longitude: number
  magnitude: number
  place: string
  time: number | null
  tsunami: boolean
  url: string | null
}

interface EarthquakeMarkerProps {
  earthquake: EarthquakePoint
  isSelected: boolean
  onSelect: (earthquake: EarthquakePoint) => void
}

interface FocusLocation {
  id: number
  latitude: number
  longitude: number
}

interface EarthModelProps {
  focusLocation: FocusLocation | null
  onNearestEarthquake: (distanceKm: number, magnitude: number) => void
}

function clampMagnitude(magnitude: number) {
  return Math.max(1, Math.min(9, magnitude))
}

function getMagnitudeRatio(magnitude: number) {
  return (clampMagnitude(magnitude) - 1) / 8
}

function getImpactColor(magnitude: number) {
  const ratio = getMagnitudeRatio(magnitude)

  if (ratio < 0.5) {
    return GREEN.clone().lerp(YELLOW, ratio * 2)
  }

  return YELLOW.clone().lerp(RED, (ratio - 0.5) * 2)
}

function getMarkerScale(magnitude: number) {
  return 0.034 + getMagnitudeRatio(magnitude) * 0.03
}

function getDepthRadius(depth: number) {
  const depthRatio = Math.max(0, Math.min(1, depth / MAX_DEPTH_KM))

  return SURFACE_MARKER_RADIUS - depthRatio * MAX_DEPTH_OFFSET
}

function formatMagnitude(magnitude: number) {
  return magnitude.toFixed(1)
}

function formatDate(time: number | null) {
  if (!time) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(time))
}


function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(toLatitude - fromLatitude)
  const deltaLongitude = toRadians(toLongitude - fromLongitude)
  const fromLat = toRadians(fromLatitude)
  const toLat = toRadians(toLatitude)
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLongitude / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function latLonToVector3(latitude: number, longitude: number, radius: number) {
  const lat = toRadians(latitude)
  const lon = toRadians(longitude)
  const cosLat = Math.cos(lat)

  return new Vector3(
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * cosLat * Math.sin(lon),
  )
}

function normalizeEarthquakes(feed: EarthquakeFeed): EarthquakePoint[] {
  return feed.features
    .map((feature) => {
      const [longitude, latitude, depth] = feature.geometry.coordinates
      const magnitude = feature.properties.mag ?? 0

      return {
        id: feature.id,
        depth,
        latitude,
        longitude,
        magnitude,
        place: feature.properties.place ?? 'Unknown location',
        time: feature.properties.time,
        tsunami: feature.properties.tsunami === 1,
        url: feature.properties.url,
      }
    })
    .filter(
      (earthquake) =>
        Number.isFinite(earthquake.latitude) &&
        Number.isFinite(earthquake.longitude) &&
        Number.isFinite(earthquake.depth) &&
        earthquake.magnitude > MIN_VISIBLE_MAGNITUDE,
    )
}

function useEarthquakeFeed() {
  const [earthquakes, setEarthquakes] = useState<EarthquakePoint[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const controller = new AbortController()

    async function loadEarthquakes() {
      try {
        setStatus('loading')
        const response = await fetch(EARTHQUAKE_FEED_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`USGS request failed: ${response.status}`)
        }

        const feed = (await response.json()) as EarthquakeFeed
        setEarthquakes(normalizeEarthquakes(feed))
        setStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error(error)
        setStatus('error')
      }
    }

    void loadEarthquakes()

    return () => controller.abort()
  }, [])

  return { earthquakes, status }
}

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

function getBloomColor(magnitude: number) {
  return getImpactColor(magnitude).multiplyScalar(1 + getMagnitudeRatio(magnitude) * 4.2)
}

function AllEarthquakePoints({
  earthquakes,
  onSelect,
}: {
  earthquakes: EarthquakePoint[]
  onSelect: (earthquake: EarthquakePoint) => void
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) {
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
      dummy.scale.setScalar(getMarkerScale(earthquake.magnitude))
      dummy.updateMatrix()

      meshRef.current?.setMatrixAt(index, dummy.matrix)
      meshRef.current?.setColorAt(index, getBloomColor(earthquake.magnitude))
    })

    meshRef.current.count = earthquakes.length
    meshRef.current.instanceMatrix.needsUpdate = true

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [dummy, earthquakes])

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
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, earthquakes.length]}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 18, 18]} />
      <meshBasicMaterial depthTest={false} toneMapped={false} vertexColors />
    </instancedMesh>
  )
}
function EarthquakeMarker({
  earthquake,
  isSelected,
  onSelect,
}: EarthquakeMarkerProps) {
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
      color: getImpactColor(earthquake.magnitude),
      opacity: 0.38,
      transparent: true,
    })

    return new Line(new BufferGeometry().setFromPoints([depthPosition, surfacePosition]), material)
  }, [depthPosition, earthquake.magnitude, surfacePosition])
  const impactColor = useMemo(
    () => getImpactColor(earthquake.magnitude),
    [earthquake.magnitude],
  )
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
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={markerScale * 2.45}>
          <torusGeometry args={[1, 0.08, 10, 42]} />
          <meshBasicMaterial
            color={impactColor}
            depthWrite={false}
            opacity={isSelected ? 0.74 : 0.38}
            transparent
          />
        </mesh>
      </group>
    </group>
  )
}

function RotatingEarth({
  earthquakes,
  focusLocation,
  isInteractingRef,
  selectedId,
  onSelectEarthquake,
}: {
  earthquakes: EarthquakePoint[]
  focusLocation: FocusLocation | null
  isInteractingRef: { current: boolean }
  selectedId: string | null
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
    <group
      ref={groupRef}
      rotation={[0.08, -0.55, -0.12]}
    >
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
      <AllEarthquakePoints earthquakes={earthquakes} onSelect={onSelectEarthquake} />
      {earthquakes.map((earthquake) => (
        <EarthquakeMarker
          earthquake={earthquake}
          isSelected={earthquake.id === selectedId}
          key={earthquake.id}
          onSelect={onSelectEarthquake}
        />
      ))}
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

export function EarthModel({ focusLocation, onNearestEarthquake }: EarthModelProps) {
  const { earthquakes, status } = useEarthquakeFeed()
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<EarthquakePoint | null>(null)
  const selectedId = selectedEarthquake?.id ?? null
  const isInteractingRef = useRef(false)

  
  useEffect(() => {
    if (!focusLocation || earthquakes.length === 0) {
      return
    }

    const nearest = earthquakes.reduce(
      (best, earthquake) => {
        const distanceKm = getDistanceKm(
          focusLocation.latitude,
          focusLocation.longitude,
          earthquake.latitude,
          earthquake.longitude,
        )

        if (!best || distanceKm < best.distanceKm) {
          return { distanceKm, earthquake }
        }

        return best
      },
      null as { distanceKm: number; earthquake: EarthquakePoint } | null,
    )

    if (nearest) {
      onNearestEarthquake(nearest.distanceKm, nearest.earthquake.magnitude)
    }
  }, [earthquakes, focusLocation, onNearestEarthquake])

  return (
    <div className="earth-model" aria-label="Interactive 3D earthquake map">
      <Canvas camera={{ fov: 38, position: [0, 0, DEFAULT_CAMERA_DISTANCE] }} dpr={[1, 2]}>
        <color attach="background" args={['#030712']} />
        <SceneLights />
        <CameraControls isInteractingRef={isInteractingRef} />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.95}
            luminanceSmoothing={0.22}
            luminanceThreshold={0.72}
            mipmapBlur
            radius={0.48}
          />
        </EffectComposer>
        <Suspense fallback={null}>
          <RotatingEarth
            earthquakes={earthquakes}
            focusLocation={focusLocation}
            isInteractingRef={isInteractingRef}
            selectedId={selectedId}
            onSelectEarthquake={setSelectedEarthquake}
          />
        </Suspense>
      </Canvas>

      <div className="earthquake-feed-status" data-status={status}>
        <span>{status === 'loading' ? 'Loading USGS feed' : null}</span>
        <span>{status === 'ready' ? `${earthquakes.length} earthquakes today` : null}</span>
        <span>{status === 'error' ? 'USGS feed unavailable' : null}</span>
      </div>

      {selectedEarthquake ? (
        <aside className="earthquake-detail" aria-live="polite">
          <button
            aria-label="Close earthquake detail"
            className="earthquake-detail-close"
            onClick={() => setSelectedEarthquake(null)}
            type="button"
          >
            x
          </button>
          <p className="earthquake-detail-kicker">Impact detail</p>
          <h2>{selectedEarthquake.place}</h2>
          <dl>
            <div>
              <dt>Magnitude</dt>
              <dd>{formatMagnitude(selectedEarthquake.magnitude)}</dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>{selectedEarthquake.depth.toFixed(1)} km</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>
                {selectedEarthquake.latitude.toFixed(2)}, {selectedEarthquake.longitude.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatDate(selectedEarthquake.time)}</dd>
            </div>
          </dl>
          {selectedEarthquake.tsunami ? (
            <p className="earthquake-alert">Tsunami flag reported</p>
          ) : null}
          {selectedEarthquake.url ? (
            <a href={selectedEarthquake.url} rel="noreferrer" target="_blank">
              Open USGS event
            </a>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}












