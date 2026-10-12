/**
 * Shared rating helpers (Monsters, Beers, Alfajores).
 *
 * rating is an optional, secondary reference: null (sin puntuar) or
 * 1.0..10.0 in 0.5 steps. It never affects rank_position.
 *
 * The backend serializes it as a JSON number, but a Decimal could also arrive
 * as a string ("8.5"), so every read goes through toRating().
 */

export const RATING_MIN = 1
export const RATING_MAX = 10
export const RATING_STEP = 0.5
/** Value used when stepping up from "Sin puntuar". */
export const RATING_START = 5

export const NO_RATING_LABEL = 'Sin puntuar'

/** Normalize number | numeric string | null/undefined to a valid rating, else null. */
export function toRating(value: unknown): number | null {
  let n: number
  if (typeof value === 'number') {
    n = value
  } else if (typeof value === 'string' && value.trim() !== '') {
    n = Number(value.trim())
  } else {
    return null
  }
  if (!Number.isFinite(n) || n < RATING_MIN || n > RATING_MAX) return null
  // x * 2 is exact in binary floating point for halves
  if (!Number.isInteger(n * 2)) return null
  return n
}

/** "8.5/10", or "Sin puntuar" when there is no (valid) rating. */
export function formatRating(value: unknown): string {
  const rating = toRating(value)
  return rating === null ? NO_RATING_LABEL : `${rating.toFixed(1)}/10`
}

/** One +/- step. null + up starts at RATING_START; down from null stays null; clamps to 1.0..10.0. */
export function stepRating(current: number | null, direction: 1 | -1): number | null {
  if (current === null) return direction === 1 ? RATING_START : null
  const next = current + direction * RATING_STEP
  return Math.min(RATING_MAX, Math.max(RATING_MIN, next))
}
