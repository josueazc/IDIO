export function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-US')}`
}

export function timeLeft(endTime: number): string {
  const ms = endTime - Date.now()
  if (ms <= 0) return 'Cerrada'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
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
