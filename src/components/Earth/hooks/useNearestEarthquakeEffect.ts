import { useEffect } from 'react'
import type { EarthquakePoint, FocusLocation, NearestEarthquakeHandler } from '../types'
import { getDistanceKm } from '../utils/geoUtils'

export function useNearestEarthquakeEffect(
  focusLocation: FocusLocation | null,
  earthquakes: EarthquakePoint[],
  onNearestEarthquake: NearestEarthquakeHandler,
) {
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
      onNearestEarthquake(
        nearest.distanceKm,
        nearest.earthquake.magnitude,
        nearest.earthquake.place,
      )
    }
  }, [earthquakes, focusLocation, onNearestEarthquake])
}
