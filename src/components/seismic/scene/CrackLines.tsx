import { memo, useMemo } from 'react'
import { Line as DreiLine } from '@react-three/drei'
import { CRACK_PATTERNS, getCrackPoints } from '../../../utils/magnitudeUtils'

interface CrackLinesProps {
  isMobile: boolean
  magnitude: number
}

export const CrackLines = memo(function CrackLines({
  isMobile,
  magnitude,
}: CrackLinesProps) {
  const maxCracks = isMobile ? 4 : CRACK_PATTERNS.length
  const visibleCracks = Math.max(1, Math.min(maxCracks, Math.round(magnitude - 3)))
  const crackColor = magnitude >= 7 ? '#fff0d4' : '#1a120d'
  const visiblePatterns = useMemo(
    () => CRACK_PATTERNS.slice(0, visibleCracks),
    [visibleCracks],
  )

  return (
    <group>
      {visiblePatterns.map((pattern, index) => (
        <DreiLine
          color={crackColor}
          depthTest={false}
          key={`crack-${index}`}
          lineWidth={magnitude >= 7 ? (isMobile ? 2 : 3) : 2}
          opacity={magnitude >= 7 ? 0.92 : 0.62}
          points={getCrackPoints(pattern)}
          transparent
        />
      ))}
    </group>
  )
})
