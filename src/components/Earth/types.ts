export interface EarthquakeFeature {
  id: string
  geometry: {
    coordinates: [number, number, number]
  }
  properties: {
    mag: number | null
    place: string | null
    time: number | null
    tsunami: number | null
    url: string | null
  }
}

export interface EarthquakeFeed {
  features: EarthquakeFeature[]
}

export interface EarthquakePoint {
  id: string
  depth: number
  latitude: number
  longitude: number
  magnitude: number
  place: string
  time: number | null
  tsunami: boolean
  url: string | null
}

export interface FocusLocation {
  id: number | string
  latitude: number
  longitude: number
}

export type FeedStatus = 'loading' | 'ready' | 'error'

export type SeismicRole = 'foreshock' | 'mainshock' | 'aftershock' | 'background'

export interface SeismicRoleInfo {
  role: SeismicRole
  sequenceId: string | null
}

export interface SeismicSequence {
  id: string
  earthquakes: EarthquakePoint[]
  mainshock: EarthquakePoint
  startedAt: number
  endedAt: number
  centerLatitude: number
  centerLongitude: number
  centerDepth: number
  radiusKm: number
}

export interface SeismicSequenceAnalysis {
  sequences: SeismicSequence[]
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
}

export type NearestEarthquakeHandler = (
  distanceKm: number,
  magnitude: number,
  place: string,
) => void