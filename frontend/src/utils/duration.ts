export type DurationUnit = 'minutes' | 'hours' | 'days'

const UNIT_SECONDS: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
}

const UNIT_LABEL: Record<DurationUnit, string> = {
  minutes: 'minutos',
  hours: 'horas',
  days: 'días',
}

/** Convierte valor + unidad a segundos (mínimo 60 s). */
export function durationToSeconds(value: number, unit: DurationUnit): number {
  const n = Math.max(1, Math.floor(Number(value) || 1))
  return Math.max(60, n * UNIT_SECONDS[unit])
}

/** Texto legible para el resumen de la subasta. */
export function formatDuration(value: number, unit: DurationUnit): string {
  const n = Math.max(1, Math.floor(Number(value) || 1))
  const label = UNIT_LABEL[unit]
  return `${n} ${label}`
}

export const DURATION_PRESETS: { label: string; value: number; unit: DurationUnit }[] = [
  { label: '5 min', value: 5, unit: 'minutes' },
  { label: '15 min', value: 15, unit: 'minutes' },
  { label: '30 min', value: 30, unit: 'minutes' },
  { label: '1 h', value: 1, unit: 'hours' },
  { label: '24 h', value: 24, unit: 'hours' },
  { label: '48 h', value: 48, unit: 'hours' },
  { label: '3 días', value: 3, unit: 'days' },
]
