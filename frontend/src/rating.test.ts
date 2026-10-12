import { describe, expect, it } from 'vitest'
import { formatRating, stepRating, toRating } from './rating'

describe('formatRating', () => {
  it('always shows one decimal', () => {
    expect(formatRating(8)).toBe('8.0/10')
    expect(formatRating(8.5)).toBe('8.5/10')
    expect(formatRating(10)).toBe('10.0/10')
    expect(formatRating(1)).toBe('1.0/10')
  })

  it('handles Decimal serialized as string', () => {
    expect(formatRating('8.5')).toBe('8.5/10')
    expect(formatRating('10.0')).toBe('10.0/10')
  })

  it('shows Sin puntuar for null/undefined/invalid, never null/NaN/0', () => {
    for (const v of [null, undefined, '', 'abc', NaN, 0, 0.5, 10.5, 7.3, -1, {}]) {
      expect(formatRating(v)).toBe('Sin puntuar')
    }
  })
})

describe('toRating', () => {
  it('returns numbers, never strings (no accidental concatenation)', () => {
    expect(toRating('7.5')).toBe(7.5)
    expect(typeof toRating('7.5')).toBe('number')
    expect((toRating('7.5') ?? 0) + 1).toBe(8.5)
  })
})

describe('stepRating', () => {
  it('null + starts at 5.0', () => expect(stepRating(null, 1)).toBe(5))
  it('null - stays null', () => expect(stepRating(null, -1)).toBeNull())
  it('5.0 + -> 5.5', () => expect(stepRating(5, 1)).toBe(5.5))
  it('5.5 - -> 5.0', () => expect(stepRating(5.5, -1)).toBe(5))
  it('clamps at 1.0', () => expect(stepRating(1, -1)).toBe(1))
  it('clamps at 10.0', () => expect(stepRating(10, 1)).toBe(10))
})
