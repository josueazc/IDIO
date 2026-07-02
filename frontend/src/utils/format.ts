export function fmtUSD(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-US')}`
}

export function fmtPercent(ratio: number, decimals = 1): string {
  if (!Number.isFinite(ratio)) return '—'
  return `${(ratio * 100).toFixed(decimals)}%`
}

export function timeLeft(endTime: number): string {
  const ms = endTime - Date.now()
  if (ms <= 0) return 'Cerrada'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  if (d >= 1) return `${d}d ${h}h`
  if (h >= 1) return `${h}h ${m}m`
  if (m >= 1) return `${m}m ${s}s`
  return `${s}s`
}

import type { Auction } from '../types'
import type { Role } from '../services/role'

/** Aviso de estado contextual por subasta y rol (banner/badge). */
export function statusHint(
  auction: Auction,
  role: Role | null,
  address?: string | null
): { tone: 'info' | 'warn' | 'success'; text: string } | null {
  const open = auction.status === 'BiddingOpen'
  const closed = open && auction.endTime <= Date.now()

  if (auction.status === 'Settled') {
    const youWon = !!address && auction.winner === address
    if (auction.paid) return { tone: 'success', text: 'Liquidada y pagada.' }
    if (youWon && role === 'oferente') return { tone: 'warn', text: 'Ganaste — te toca pagar.' }
    return { tone: 'success', text: 'Liquidada — resultados públicos.' }
  }
  if (closed) {
    if (role === 'oferente') return { tone: 'warn', text: 'Cerró — revelá tu oferta.' }
    if (role === 'emisor') return { tone: 'warn', text: 'Cerró — podés liquidar.' }
    return { tone: 'info', text: 'Cerró — esperando liquidación.' }
  }
  if (open) {
    const ms = auction.endTime - Date.now()
    const soon = ms < 2 * 3_600_000
    return { tone: soon ? 'warn' : 'info', text: `Abierta — cierra en ${timeLeft(auction.endTime)}` }
  }
  return null
}
