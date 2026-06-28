import {
  SEQUENCE_DISTANCE_THRESHOLD_KM,
  SEQUENCE_MIN_EVENTS,
  SEQUENCE_TIME_THRESHOLD_MS,
} from '../constants'
import type {
  EarthquakePoint,
  SeismicRole,
  SeismicSequence,
  SeismicSequenceAnalysis,
} from '../types'
import { getDistanceKm } from './geoUtils'

interface DraftSequence {
  earthquakes: EarthquakePoint[]
}

function hasValidTime(earthquake: EarthquakePoint): earthquake is EarthquakePoint & { time: number } {
  return typeof earthquake.time === 'number' && Number.isFinite(earthquake.time)
}

function getSequenceCenter(earthquakes: EarthquakePoint[]) {
  const total = earthquakes.reduce(
    (acc, earthquake) => ({
      depth: acc.depth + earthquake.depth,
      latitude: acc.latitude + earthquake.latitude,
      longitude: acc.longitude + earthquake.longitude,
    }),
    { depth: 0, latitude: 0, longitude: 0 },
  )

  return {
    depth: total.depth / earthquakes.length,
    latitude: total.latitude / earthquakes.length,
    longitude: total.longitude / earthquakes.length,
  }
}

function getMainshock(earthquakes: EarthquakePoint[]) {
  return earthquakes.reduce((mainshock, earthquake) => {
    if (earthquake.magnitude > mainshock.magnitude) {
      return earthquake
    }

    if (earthquake.magnitude === mainshock.magnitude && (earthquake.time ?? 0) < (mainshock.time ?? 0)) {
      return earthquake
    }

    return mainshock
  }, earthquakes[0])
}

function getSequenceRadiusKm(earthquakes: EarthquakePoint[], centerLatitude: number, centerLongitude: number) {
  return Math.max(
    70,
    ...earthquakes.map((earthquake) =>
      getDistanceKm(centerLatitude, centerLongitude, earthquake.latitude, earthquake.longitude),
    ),
  )
}

function getRole(earthquake: EarthquakePoint, mainshock: EarthquakePoint): SeismicRole {
  if (earthquake.id === mainshock.id) {
    return 'mainshock'
  }

  if ((earthquake.time ?? 0) < (mainshock.time ?? 0)) {
    return 'foreshock'
  }

  return 'aftershock'
}

export function buildSeismicSequences(earthquakes: EarthquakePoint[]): SeismicSequenceAnalysis {
  const timedEarthquakes = [...earthquakes.filter(hasValidTime)].sort((a, b) => a.time - b.time)
  const draftSequences: DraftSequence[] = []

  for (const earthquake of timedEarthquakes) {
    let bestSequenceIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < draftSequences.length; index += 1) {
      const sequence = draftSequences[index]
      const lastEarthquake = sequence.earthquakes.at(-1)

      if (!lastEarthquake || !hasValidTime(lastEarthquake)) {
        continue
      }

      const timeDelta = earthquake.time - lastEarthquake.time

      if (timeDelta < 0 || timeDelta > SEQUENCE_TIME_THRESHOLD_MS) {
        continue
      }

      const distance = getDistanceKm(
        earthquake.latitude,
        earthquake.longitude,
        lastEarthquake.latitude,
        lastEarthquake.longitude,
      )

      if (distance <= SEQUENCE_DISTANCE_THRESHOLD_KM && distance < bestDistance) {
        bestDistance = distance
        bestSequenceIndex = index
      }
    }

    if (bestSequenceIndex >= 0) {
      draftSequences[bestSequenceIndex].earthquakes.push(earthquake)
      continue
    }

    draftSequences.push({ earthquakes: [earthquake] })
  }

  const rolesByEarthquakeId: SeismicSequenceAnalysis['rolesByEarthquakeId'] = {}
  const sequences = draftSequences
    .filter((sequence) => sequence.earthquakes.length >= SEQUENCE_MIN_EVENTS)
    .map((sequence, index): SeismicSequence => {
      const orderedEarthquakes = [...sequence.earthquakes].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
      const mainshock = getMainshock(orderedEarthquakes)
      const center = getSequenceCenter(orderedEarthquakes)
      const sequenceId = `secuencia-${index + 1}`
      const startedAt = orderedEarthquakes[0].time ?? 0
      const endedAt = orderedEarthquakes.at(-1)?.time ?? startedAt

      orderedEarthquakes.forEach((earthquake) => {
        rolesByEarthquakeId[earthquake.id] = {
          role: getRole(earthquake, mainshock),
          sequenceId,
        }
      })

      return {
        id: sequenceId,
        earthquakes: orderedEarthquakes,
        mainshock,
        startedAt,
        endedAt,
        centerLatitude: center.latitude,
        centerLongitude: center.longitude,
        centerDepth: center.depth,
        radiusKm: getSequenceRadiusKm(orderedEarthquakes, center.latitude, center.longitude),
      }
    })

  earthquakes.forEach((earthquake) => {
    rolesByEarthquakeId[earthquake.id] ??= {
      role: 'background',
      sequenceId: null,
    }
  })

  return { sequences, rolesByEarthquakeId }
}