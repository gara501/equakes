import { useCallback, useState } from 'react'
import { MAGNITUDES } from '../../constants/magnitudeData'
import { useIsMobile } from './hooks/useIsMobile'
import { ImpactInfoCard } from './ImpactInfoCard'
import { MagnitudeControls } from './MagnitudeControls'
import { MagnitudeSceneContainer } from './MagnitudeSceneContainer'

export function SeismicScalePage({ onBack }: { onBack: () => void }) {
  const isMobile = useIsMobile()
  const [selectedMagnitude, setSelectedMagnitude] = useState(() => MAGNITUDES[0])
  const [isSceneReady, setIsSceneReady] = useState(false)

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true)
  }, [])

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

      <MagnitudeSceneContainer
        isMobile={isMobile}
        isSceneReady={isSceneReady}
        onReady={handleSceneReady}
        selectedMagnitude={selectedMagnitude}
      />

      <MagnitudeControls
        magnitudes={MAGNITUDES}
        onSelect={setSelectedMagnitude}
        selectedMagnitude={selectedMagnitude}
      />

      <div className="scale-formula">
        <span>escala 3D</span>
        <strong>Math.pow(10, (magnitud - 4) / 5)</strong>
      </div>

      <ImpactInfoCard selectedMagnitude={selectedMagnitude} />
    </section>
  )
}
