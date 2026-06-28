import { useEffect, useState } from 'react'
import { EARTHQUAKE_FEED_URL, MIN_VISIBLE_MAGNITUDE } from '../constants'
import type { EarthquakeFeed, EarthquakePoint, FeedStatus } from '../types'

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
        place: feature.properties.place ?? 'Ubicación desconocida',
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

export function useEarthquakeFeed() {
  const [earthquakes, setEarthquakes] = useState<EarthquakePoint[]>([])
  const [status, setStatus] = useState<FeedStatus>('loading')

  useEffect(() => {
    const controller = new AbortController()

    async function loadEarthquakes() {
      try {
        setStatus('loading')
        const response = await fetch(EARTHQUAKE_FEED_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`La solicitud a USGS falló: ${response.status}`)
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
