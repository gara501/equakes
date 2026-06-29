import { memo } from 'react'
import type { MagnitudeDatum } from '../../constants/magnitudeData'
import { getMagnitudeColor, getMagnitudePower } from '../../utils/magnitudeUtils'

interface MagnitudeControlsProps {
  magnitudes: MagnitudeDatum[]
  selectedMagnitude: MagnitudeDatum
  onSelect: (magnitude: MagnitudeDatum) => void
}

export const MagnitudeControls = memo(function MagnitudeControls({
  magnitudes,
  onSelect,
  selectedMagnitude,
}: MagnitudeControlsProps) {
  return (
    <div className="scale-controls" aria-label="Seleccionar magnitud sismica">
      {magnitudes.map((item) => (
        <button
          aria-label={`Seleccionar magnitud ${item.magnitude}.0`}
          aria-pressed={item.magnitude === selectedMagnitude.magnitude}
          key={item.magnitude}
          onClick={() => onSelect(item)}
          type="button"
        >
          <span style={{ background: getMagnitudeColor(item.magnitude) }} />
          <strong>M {item.magnitude}.0</strong>
          <small>{getMagnitudePower(item.magnitude).toLocaleString('es-CO')} potencia</small>
        </button>
      ))}
    </div>
  )
})
