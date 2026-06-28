import { Color } from 'three'
import type { SeismicRole } from '../types'

export function clampMagnitude(magnitude: number) {
  return Math.max(1, Math.min(9, magnitude))
}

export function getMagnitudeRatio(magnitude: number) {
  return (clampMagnitude(magnitude) - 1) / 8
}

export function getImpactColor(magnitude: number) {
  if (magnitude >= 7) {
    return new Color('#ff1414')
  }

  if (magnitude >= 6) {
    return new Color('#ff4a1f')
  }

  if (magnitude >= 5) {
    return new Color('#ffd43b')
  }

  return new Color('#2fe66f')
}

export function getSeismicRoleColor(role: SeismicRole) {
  if (role === 'foreshock') {
    return new Color('#ffd43b')
  }

  if (role === 'mainshock') {
    return new Color('#ff1414')
  }

  if (role === 'aftershock') {
    return new Color('#43a7ff')
  }

  return new Color('#9aa3ad')
}

export function getSeismicRoleLabel(role: SeismicRole) {
  if (role === 'foreshock') {
    return 'premonitor'
  }

  if (role === 'mainshock') {
    return 'principal'
  }

  if (role === 'aftershock') {
    return 'réplica'
  }

  return 'fondo'
}

export function getMarkerScale(magnitude: number) {
  return 0.048 + getMagnitudeRatio(magnitude) * 0.125
}

export function getBloomColor(magnitude: number, role: SeismicRole = 'background') {
  const color = role === 'background' ? getImpactColor(magnitude) : getSeismicRoleColor(role)

  return color.multiplyScalar(1.4 + getMagnitudeRatio(magnitude) * 5.4)
}

export function formatMagnitude(magnitude: number) {
  return magnitude.toFixed(1)
}

export function formatDate(time: number | null) {
  if (!time) {
    return 'Hora desconocida'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(time))
}