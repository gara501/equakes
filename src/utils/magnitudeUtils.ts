import { Vector3 } from 'three'

export const CRACK_PATTERNS = [
  [
    [-0.28, 0.38],
    [-0.14, 0.24],
    [-0.2, 0.06],
    [-0.02, -0.12],
  ],
  [
    [0.12, 0.48],
    [0.22, 0.3],
    [0.16, 0.12],
    [0.34, -0.08],
  ],
  [
    [-0.5, -0.06],
    [-0.28, -0.16],
    [-0.12, -0.34],
    [0.08, -0.42],
  ],
  [
    [0.44, 0.22],
    [0.28, 0.06],
    [0.36, -0.16],
    [0.18, -0.34],
  ],
  [
    [-0.08, 0.62],
    [0.02, 0.42],
    [-0.06, 0.26],
    [0.1, 0.08],
  ],
  [
    [-0.42, 0.16],
    [-0.24, 0.12],
    [-0.08, -0.02],
    [0.08, -0.1],
  ],
] as const

export function getMagnitudePower(magnitude: number) {
  return Math.pow(10, magnitude / 2)
}

export function getMagnitudeScale(magnitude: number) {
  return 0.58 + Math.pow(10, (magnitude - 4) / 5) * 0.52
}

export function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 8) {
    return '#b51218'
  }

  if (magnitude >= 7) {
    return '#ff3b1f'
  }

  if (magnitude >= 6) {
    return '#ff9f1c'
  }

  if (magnitude >= 5) {
    return '#ffd43b'
  }

  return '#39d98a'
}

export function getCrackPoints(pattern: ReadonlyArray<readonly [number, number]>) {
  return pattern.map(([x, y]) => {
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y)) + 0.018

    return new Vector3(x, y, z)
  })
}
