import { Vector3 } from 'three'
import { MAX_DEPTH_KM, MAX_DEPTH_OFFSET, SURFACE_MARKER_RADIUS } from '../constants'

export function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function latLonToVector3(latitude: number, longitude: number, radius: number) {
  const lat = toRadians(latitude)
  const lon = toRadians(longitude)
  const cosLat = Math.cos(lat)

  return new Vector3(
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * cosLat * Math.sin(lon),
  )
}

export function getDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(toLatitude - fromLatitude)
  const deltaLongitude = toRadians(toLongitude - fromLongitude)
  const fromLat = toRadians(fromLatitude)
  const toLat = toRadians(toLatitude)
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLongitude / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getDepthRadius(depth: number) {
  const depthRatio = Math.max(0, Math.min(1, depth / MAX_DEPTH_KM))

  return SURFACE_MARKER_RADIUS - depthRatio * MAX_DEPTH_OFFSET
}
