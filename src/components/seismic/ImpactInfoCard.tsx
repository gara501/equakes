import { memo } from 'react'
import type { MagnitudeDatum } from '../../constants/magnitudeData'

interface ImpactInfoCardProps {
  selectedMagnitude: MagnitudeDatum
}

export const ImpactInfoCard = memo(function ImpactInfoCard({
  selectedMagnitude,
}: ImpactInfoCardProps) {
  return (
    <aside className="scale-impact-card" aria-live="polite">
      <span>consecuencias estimadas</span>
      <h2>
        Magnitud {selectedMagnitude.magnitude}.0 - {selectedMagnitude.label}
      </h2>
      <p>{selectedMagnitude.impact}</p>
    </aside>
  )
})
