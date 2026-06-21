/**
 * Capa unificada de datos con dos modos:
 *
 *  - `demo`  → store local en `localStorage` (offline, datos sembrados).
 *  - `chain` → contratos Soroban reales en Stellar Testnet.
 *
 * Las páginas usan SIEMPRE esta capa; el modo decide la implementación.
 */
import { chain } from './contracts'
import * as demo from './store'
import { commitBid, generateReservesProof, randomSalt } from './proofs'
import { proveSealedBid, type ZkResult } from './noir'
import type { Auction } from '../types'

/** Resultado de la última prueba ZK generada (para mostrar en la UI). */
export let lastProof: ZkResult | null = null

export type Mode = 'demo' | 'chain'
const MODE_KEY = 'idio.mode'
const SALT_KEY = 'idio.salts'

const listeners = new Set<() => void>()

export function getMode(): Mode {
  return (localStorage.getItem(MODE_KEY) as Mode) || 'demo'
}
export function setMode(m: Mode) {
  localStorage.setItem(MODE_KEY, m)
  emit()
}
export function subscribe(l: () => void): () => void {
  listeners.add(l)
  const unsubStore = demo.subscribe(l)
  return () => {
    listeners.delete(l)
    unsubStore()
  }
}
function emit() {
  listeners.forEach((l) => l())
}

// Guarda el salt de una oferta on-chain para poder revelarla luego.
function saveSalt(auctionId: number, address: string, amount: number, salt: string) {
  const all = JSON.parse(localStorage.getItem(SALT_KEY) || '{}')
  all[`${auctionId}:${address}`] = { amount, salt }
  localStorage.setItem(SALT_KEY, JSON.stringify(all))
}
export function getSalt(auctionId: number, address: string): { amount: number; salt: string } | null {
  const all = JSON.parse(localStorage.getItem(SALT_KEY) || '{}')
  return all[`${auctionId}:${address}`] ?? null
}

// ---- Lectura ----

export async function loadAuctions(): Promise<Auction[]> {
  if (getMode() === 'chain') return chain.listAuctions()
  return demo.getAuctions()
}

// ---- Escritura ----

export interface CreateInput {
  asset: string
  amount: number
  minBid: number
  currency: string
  description: string
  durationHours: number
}

export async function createAuction(input: CreateInput, wallet: string): Promise<void> {
  if (getMode() === 'chain') {
    const { commitment } = await generateReservesProof(input.amount)
    await chain.createAuction(
      wallet,
      input.asset,
      input.amount,
      input.minBid,
      input.durationHours * 3600,
      commitment
    )
    emit()
  } else {
    await demo.createAuction({ ...input, issuer: wallet })
  }
}

export async function submitBid(
  auctionId: number,
  name: string,
  address: string,
  amount: number,
  balance: number,
  minBid: number
): Promise<void> {
  // 1. Compromiso y salt (consistentes con contrato y circuito).
  const salt = randomSalt()
  const commitment = await commitBid(amount, salt)

  // 2. Prueba ZK real: ejecuta el circuito Noir sobre las entradas.
  //    Lanza si la oferta no cumple (balance >= oferta >= mínimo).
  lastProof = await proveSealedBid(amount, balance, minBid, salt, commitment)

  // 3. Registro de la oferta sellada.
  if (getMode() === 'chain') {
    await chain.submitSealedBid(auctionId, address, commitment)
    saveSalt(auctionId, address, amount, salt)
  } else {
    await demo.submitBidWithCommitment(auctionId, name, address, amount, commitment)
  }
  emit()
}

export async function revealBid(auctionId: number, address: string): Promise<void> {
  if (getMode() === 'chain') {
    const s = getSalt(auctionId, address)
    if (!s) throw new Error('No se encontró el salt local para revelar esta oferta')
    await chain.revealBid(auctionId, address, s.amount, s.salt)
    emit()
  }
}

export async function settle(auctionId: number, caller: string): Promise<void> {
  if (getMode() === 'chain') {
    await chain.settle(auctionId, caller)
    emit()
  } else {
    demo.revealAndSettle(auctionId)
  }
}

export function resetDemo() {
  demo.resetDemo()
}
