import { useMemo, useRef, useState } from 'react'
import { EarthCanvas } from './EarthCanvas'
import { EarthUI } from './EarthUI'
import { useEarthquakeFeed } from './hooks/useEarthquakeFeed'
import { useNearestEarthquakeEffect } from './hooks/useNearestEarthquakeEffect'
import type { EarthquakePoint, FocusLocation, NearestEarthquakeHandler } from './types'
import { buildSeismicSequences } from './utils/seismicSequences'

interface EarthModelProps {
  focusLocation: FocusLocation | null
  onNearestEarthquake: NearestEarthquakeHandler
}

export function EarthModel({ focusLocation, onNearestEarthquake }: EarthModelProps) {
  const { earthquakes, status } = useEarthquakeFeed()
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<EarthquakePoint | null>(null)
  const seismicAnalysis = useMemo(() => buildSeismicSequences(earthquakes), [earthquakes])
  const selectedId = selectedEarthquake?.id ?? null
  const selectedFocusLocation = useMemo(
    () =>
      selectedEarthquake
        ? {
            id: selectedEarthquake.id,
            latitude: selectedEarthquake.latitude,
            longitude: selectedEarthquake.longitude,
          }
        : null,
    [selectedEarthquake],
  )
  const modelFocusLocation = selectedFocusLocation ?? focusLocation
  const isInteractingRef = useRef(false)

  useNearestEarthquakeEffect(focusLocation, earthquakes, onNearestEarthquake)

  return (
    <div className="earth-model" aria-label="Mapa 3D interactivo de sismos">
      <EarthCanvas
        earthquakes={earthquakes}
        focusLocation={modelFocusLocation}
        isInteractingRef={isInteractingRef}
        rolesByEarthquakeId={seismicAnalysis.rolesByEarthquakeId}
        selectedId={selectedId}
        seismicSequences={seismicAnalysis.sequences}
        onSelectEarthquake={setSelectedEarthquake}
      />
      <EarthUI
        earthquakes={earthquakes}
        rolesByEarthquakeId={seismicAnalysis.rolesByEarthquakeId}
        selectedEarthquake={selectedEarthquake}
        seismicSequences={seismicAnalysis.sequences}
        status={status}
        onSelectEarthquake={setSelectedEarthquake}
        onClearSelection={() => setSelectedEarthquake(null)}
      />
    </div>
  )
}