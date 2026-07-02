import { describe, it, expect } from 'vitest'
import { fmtUSD, fmtPercent } from './format'

describe('fmtUSD', () => {
  it('formats billions', () => {
    expect(fmtUSD(1_000_000_000)).toBe('$1B')
    expect(fmtUSD(2_500_000_000)).toBe('$2.5B')
  })

  it('formats millions', () => {
    expect(fmtUSD(500_000_000)).toBe('$500M')
    expect(fmtUSD(1_500_000)).toBe('$1.5M')
    expect(fmtUSD(1_000_000)).toBe('$1M')
  })

  it('formats thousands', () => {
    expect(fmtUSD(10_000)).toBe('$10K')
    expect(fmtUSD(1_000)).toBe('$1K')
    expect(fmtUSD(999_999)).toBe('$1000K')
  })

  it('formats small values', () => {
    expect(fmtUSD(0)).toBe('$0')
    expect(fmtUSD(500)).toBe('$500')
  })

  it('returns — for non-finite values', () => {
    expect(fmtUSD(NaN)).toBe('—')
    expect(fmtUSD(Infinity)).toBe('—')
    expect(fmtUSD(-Infinity)).toBe('—')
  })
})

describe('fmtPercent', () => {
  it('formats ratio to percent string', () => {
    expect(fmtPercent(0.5)).toBe('50.0%')
    expect(fmtPercent(1)).toBe('100.0%')
    expect(fmtPercent(0)).toBe('0.0%')
  })

  it('respects decimals param', () => {
    expect(fmtPercent(0.123, 2)).toBe('12.30%')
    expect(fmtPercent(0.123, 0)).toBe('12%')
  })

  it('returns — for NaN', () => {
    expect(fmtPercent(NaN)).toBe('—')
  })
})
