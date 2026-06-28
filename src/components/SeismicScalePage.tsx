import { Html, Line as DreiLine, OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Outline,
  Select,
  Selection,
} from '@react-three/postprocessing'
import { useEffect, useRef, useState } from 'react'
import { AdditiveBlending, Group, Mesh, Vector3 } from 'three'

interface MagnitudeDatum {
  label: string
  magnitude: number
  note: string
  impact: string
}

const MAGNITUDES: MagnitudeDatum[] = [
  {
    label: 'Ligero',
    magnitude: 4,
    note: 'perceptible, bajo impacto',
    impact:
      'Se percibe ampliamente dentro de edificios, similar al paso de un camion pesado. Objetos colgantes se balancean y vidrios o platos pueden tintinear, pero los danos estructurales son sumamente raros en edificaciones bien construidas.',
  },
  {
    label: 'Moderado',
    magnitude: 5,
    note: '10x mas amplitud que M4',
    impact:
      'Provoca sacudidas fuertes que pueden asustar a la poblacion y desplazar objetos sueltos. Puede causar grietas ligeras en yeso o revestimientos y danos menores en construcciones antiguas o debiles.',
  },
  {
    label: 'Fuerte',
    magnitude: 6,
    note: '100x mas amplitud que M4',
    impact:
      'Libera energia peligrosa capaz de causar danos severos en comunidades hasta unos 160 km del epicentro. Construcciones mal disenadas pueden colapsar parcialmente y caminar durante el evento resulta muy dificil.',
  },
  {
    label: 'Mayor',
    magnitude: 7,
    note: '1.000x mas amplitud que M4',
    impact:
      'Puede provocar desastres generalizados, danos graves en la mayoria de edificios y colapso de infraestructuras sin normas modernas. Tambien puede romper tuberias, destruir vias y activar deslizamientos o licuefaccion.',
  },
  {
    label: 'Grande / catastrofico',
    magnitude: 8,
    note: '10.000x mas amplitud que M4',
    impact:
      'Puede destruir casi por completo comunidades cercanas al epicentro, colapsar edificios masivos y deformar infraestructura. Si ocurre bajo el oceano, puede generar tsunamis devastadores en cuestion de minutos.',
  },
]

const CRACK_PATTERNS = [
  [
    [-0.28, 0.38],
    [-0.14, 0.24],
    [-0.2, 0.06],
    [-0.02, -0.12],
  ],
  [
    [0.12, 0.48],
    [0.22, 0.3],
    [0.16, 0.12],
    [0.34, -0.08],
  ],
  [
    [-0.5, -0.06],
    [-0.28, -0.16],
    [-0.12, -0.34],
    [0.08, -0.42],
  ],
  [
    [0.44, 0.22],
    [0.28, 0.06],
    [0.36, -0.16],
    [0.18, -0.34],
  ],
  [
    [-0.08, 0.62],
    [0.02, 0.42],
    [-0.06, 0.26],
    [0.1, 0.08],
  ],
  [
    [-0.42, 0.16],
    [-0.24, 0.12],
    [-0.08, -0.02],
    [0.08, -0.1],
  ],
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return isMobile
}

function getMagnitudePower(magnitude: number) {
  return Math.pow(10, magnitude / 2)
}

function getMagnitudeScale(magnitude: number) {
  return 0.58 + Math.pow(10, (magnitude - 4) / 5) * 0.52
}

function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 8) {
    return '#b51218'
  }

  if (magnitude >= 7) {
    return '#ff3b1f'
  }

  if (magnitude >= 6) {
    return '#ff9f1c'
  }

  if (magnitude >= 5) {
    return '#ffd43b'
  }

  return '#39d98a'
}

function getCrackPoints(pattern: number[][]) {
  return pattern.map(([x, y]) => {
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y)) + 0.018

    return new Vector3(x, y, z)
  })
}

function CrackLines({
  isMobile,
  magnitude,
}: {
  isMobile: boolean
  magnitude: number
}) {
  const maxCracks = isMobile ? 4 : CRACK_PATTERNS.length
  const visibleCracks = Math.max(1, Math.min(maxCracks, Math.round(magnitude - 3)))
  const crackColor = magnitude >= 7 ? '#fff0d4' : '#1a120d'

  return (
    <group>
      {CRACK_PATTERNS.slice(0, visibleCracks).map((pattern, index) => (
        <DreiLine
          color={crackColor}
          depthTest={false}
          key={`crack-${index}`}
          lineWidth={magnitude >= 7 ? (isMobile ? 2 : 3) : 2}
          points={getCrackPoints(pattern)}
          transparent
          opacity={magnitude >= 7 ? 0.92 : 0.62}
        />
      ))}
    </group>
  )
}

function RichterSphere({
  isMobile,
  onReady,
  selectedMagnitude,
}: {
  isMobile: boolean
  onReady: () => void
  selectedMagnitude: MagnitudeDatum
}) {
  const groupRef = useRef<Group>(null)
  const glowRef = useRef<Mesh>(null)
  const color = getMagnitudeColor(selectedMagnitude.magnitude)
  const sphereScale = getMagnitudeScale(selectedMagnitude.magnitude) * (isMobile ? 0.72 : 1)
  const shake = Math.max(0.004, (selectedMagnitude.magnitude - 3.5) * 0.01)
  const isMajor = selectedMagnitude.magnitude >= 7

  useEffect(() => {
    onReady()
  }, [onReady])

  useFrame((_, delta) => {
    const time = performance.now() * 0.001

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.18 + selectedMagnitude.magnitude * 0.018)
      groupRef.current.rotation.x = Math.sin(time * 1.4) * 0.035
      groupRef.current.position.x = 2.72 + Math.sin(time * 38) * shake
      groupRef.current.position.y = 0.1 + Math.cos(time * 31) * shake
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(time * (2.8 + selectedMagnitude.magnitude * 0.4)) * 0.08
      glowRef.current.scale.setScalar(sphereScale * (1.18 + selectedMagnitude.magnitude * 0.022) * pulse)
    }
  })

  return (
    <group ref={groupRef} position={[isMobile ? 1.85 : 2.72, isMobile ? -0.08 : 0.1, 0]}>
      <Select enabled={isMajor}>
        <mesh castShadow={!isMobile} receiveShadow={!isMobile} scale={sphereScale}>
          <sphereGeometry args={[1, isMobile ? 56 : 96, isMobile ? 56 : 96]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.18 + selectedMagnitude.magnitude * 0.035}
            metalness={0.04}
            roughness={0.42}
          />
        </mesh>
      </Select>

      <group scale={sphereScale * 1.01}>
        <CrackLines isMobile={isMobile} magnitude={selectedMagnitude.magnitude} />
      </group>

      <mesh ref={glowRef} scale={sphereScale * 1.24}>
        <sphereGeometry args={[1, isMobile ? 24 : 48, isMobile ? 24 : 48]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={color}
          depthWrite={false}
          opacity={0.09 + selectedMagnitude.magnitude * 0.01}
          transparent
        />
      </mesh>

      <Text
        anchorX="center"
        anchorY="middle"
        color="#f8f4ec"
        fontSize={isMobile ? 0.22 : 0.28}
        position={[0, -sphereScale - 0.36, 0.24]}
      >
        M {selectedMagnitude.magnitude}.0
      </Text>

      <Html
        center
        distanceFactor={isMobile ? 10 : 8}
        position={[0, sphereScale + (isMobile ? 0.36 : 0.48), 0]}
        transform
      >
        <div className="scale-3d-label">
          <strong>{selectedMagnitude.label}</strong>
          <span>{selectedMagnitude.note}</span>
        </div>
      </Html>
    </group>
  )
}

function MagnitudeScaleScene({
  isMobile,
  onReady,
  selectedMagnitude,
}: {
  isMobile: boolean
  onReady: () => void
  selectedMagnitude: MagnitudeDatum
}) {
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

        <mesh receiveShadow={!isMobile} rotation={[-Math.PI / 2, 0, 0]} position={[isMobile ? 1.85 : 2.7, -2.25, 0]}>
          <circleGeometry args={[isMobile ? 2.45 : 3.2, isMobile ? 48 : 80]} />
          <meshStandardMaterial color="#101b28" roughness={0.82} transparent opacity={0.72} />
        </mesh>

        <EffectComposer multisampling={0} autoClear={false}>
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
            pulseSpeed={0.5}
            visibleEdgeColor={0xfff4c2}
            hiddenEdgeColor={0xff3b1f}
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
}

export function SeismicScalePage({ onBack }: { onBack: () => void }) {
  const isMobile = useIsMobile()
  const [selectedMagnitude, setSelectedMagnitude] = useState(MAGNITUDES[0])
  const [isSceneReady, setIsSceneReady] = useState(false)

  return (
    <section className="scale-page" aria-labelledby="scale-title">
      <div className="scale-copy">
        <p className="eyebrow">La medida de potencia</p>
        <h1 id="scale-title">Escala Sismologica</h1>
        <p className="lede">
          Selecciona una magnitud y observa como la esfera crece de forma
          exponencial. La vibracion y las grietas aumentan con el nivel de
          energia liberada.
        </p>
        <button className="scale-back-button" type="button" onClick={onBack}>
          Volver al mapa
        </button>
      </div>

      <div className="scale-stage" aria-label="Esfera 3D comparativa de magnitud sismica">
        {!isSceneReady ? (
          <div className="scene-loader-overlay" aria-hidden="true">
            <div className="scene-loader">
              <div className="scene-loader-spinner" />
              <strong>Cargando comparador 3D</strong>
              <span>Preparando escena</span>
            </div>
          </div>
        ) : null}
        <MagnitudeScaleScene
          isMobile={isMobile}
          onReady={() => setIsSceneReady(true)}
          selectedMagnitude={selectedMagnitude}
        />
      </div>

      <div className="scale-controls" aria-label="Seleccionar magnitud sismica">
        {MAGNITUDES.map((item) => (
          <button
            aria-pressed={item.magnitude === selectedMagnitude.magnitude}
            key={item.magnitude}
            onClick={() => setSelectedMagnitude(item)}
            type="button"
          >
            <span style={{ background: getMagnitudeColor(item.magnitude) }} />
            <strong>M {item.magnitude}.0</strong>
            <small>{getMagnitudePower(item.magnitude).toLocaleString('es-CO')} potencia</small>
          </button>
        ))}
      </div>

      <div className="scale-formula">
        <span>escala 3D</span>
        <strong>Math.pow(10, (magnitud - 4) / 5)</strong>
      </div>

      <aside className="scale-impact-card" aria-live="polite">
        <span>consecuencias estimadas</span>
        <h2>
          Magnitud {selectedMagnitude.magnitude}.0 · {selectedMagnitude.label}
        </h2>
        <p>{selectedMagnitude.impact}</p>
      </aside>
    </section>
  )
}
