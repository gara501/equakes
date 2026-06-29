import { memo } from 'react'
import type { MagnitudeDatum } from '../../constants/magnitudeData'
import { MagnitudeScene } from './scene/MagnitudeScene'

interface MagnitudeSceneContainerProps {
  isMobile: boolean
  isSceneReady: boolean
  onReady: () => void
  selectedMagnitude: MagnitudeDatum
}

export const MagnitudeSceneContainer = memo(function MagnitudeSceneContainer({
  isMobile,
  isSceneReady,
  onReady,
  selectedMagnitude,
}: MagnitudeSceneContainerProps) {
  return (
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

      <MagnitudeScene
        isMobile={isMobile}
        onReady={onReady}
        selectedMagnitude={selectedMagnitude}
      />
    </div>
  )
})
