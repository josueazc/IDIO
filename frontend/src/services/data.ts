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
import { proveEligibility, proveReserves, proveMembership } from './groth'
import { getProfile, covenantSecretsCsv } from './auth'
import type { Auction } from '../types'

/** Resultado de la última prueba ZK generada (para mostrar en la UI). */
export let lastProof: ZkResult | null = null

/** Secreto de la última oferta (para que el usuario lo guarde y revele luego). */
export let lastBidSecret: { amount: number; salt: string } | null = null

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

/** Aperturas guardadas localmente (para revelar): [{auctionId, address, amount, salt}]. */
export function getMyOpenings(
  address: string | null
): { auctionId: number; amount: number; salt: string }[] {
  const all = JSON.parse(localStorage.getItem(SALT_KEY) || '{}') as Record<
    string,
    { amount: number; salt: string }
  >
  return Object.entries(all)
    .map(([key, v]) => {
      const [auctionId, addr] = key.split(':')
      return { auctionId: Number(auctionId), addr, ...v }
    })
    .filter((o) => !address || o.addr === address)
    .map(({ auctionId, amount, salt }) => ({ auctionId, amount, salt }))
}

// ---- Lectura ----

export async function loadAuctions(): Promise<Auction[]> {
  if (getMode() === 'chain') return chain.listAuctions()
  return demo.getAuctions()
}

// ---- Escritura ----

export interface CreateInput {
  asset: string
  assetType: import('../types').AssetType
  amount: number
  minBid: number
  currency: string
  description: string
  durationHours: number
}

export async function createAuction(input: CreateInput, wallet: string): Promise<void> {
  if (getMode() === 'chain') {
    const { commitment } = await generateReservesProof(input.amount)
    // Prueba Groth16 de reservas (Auspex+): total ≥ monto y liquidez ≥ 30%,
    // verificada on-chain. liquid = total (100% líquido) satisface el ratio.
    const proof = await proveReserves(input.amount, 30, input.amount, input.amount)
    await chain.createAuction(
      wallet,
      input.asset,
      input.amount,
      input.minBid,
      input.durationHours * 3600,
      commitment,
      proof
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

  if (getMode() === 'chain') {
    // Prueba Groth16 de elegibilidad (capacidad ≥ oferta ≥ mínimo), verificada
    // on-chain por el contrato vía cross-contract al verifier (puente real).
    // La capacidad es el cupo registrado on-chain para este banco: es entrada
    // pública, así una oferta por encima del cupo no genera prueba válida.
    const capacity = await chain.getCapacity(address)
    if (capacity <= 0) {
      throw new Error('Este banco no tiene cupo (capacity) registrado on-chain por el emisor/admin.')
    }
    if (amount > capacity) {
      throw new Error(`La oferta excede el cupo registrado (${capacity}).`)
    }
    const proof = await proveEligibility(minBid, capacity, amount)
    lastProof = { proofHex: proof.a, witnessOk: true, proofOk: true, ms: 0 }

    // Gate del bid: si el Covenant está activo on-chain (gate ZK + raíz de
    // membresía configurada), se exige una prueba ZK de pertenencia + nullifier
    // en vez de la allow-list pública. Cae a la allow-list si no está activo.
    let covenantActive = false
    try {
      covenantActive = (await chain.getBidGateZk()) && Boolean(await chain.aspMembershipRoot())
    } catch {
      covenantActive = false
    }

    if (covenantActive) {
      const profile = getProfile(address)
      if (!profile) {
        throw new Error(
          'El Covenant ZK está activo: registrá el banco (Sign up) para poder probar tu membresía y ofertar.'
        )
      }
      const membership = await proveMembership(covenantSecretsCsv(), profile.membershipIndex)
      await chain.submitSealedBidCovenant(
        auctionId,
        address,
        commitment,
        proof,
        membership.proof,
        membership.nullifier
      )
    } else {
      await chain.submitSealedBid(auctionId, address, commitment, proof)
    }
    saveSalt(auctionId, address, amount, salt)
    lastBidSecret = { amount, salt }
  } else {
    // Demo: prueba Noir UltraHonk (verificable off-chain en el navegador).
    lastProof = await proveSealedBid(amount, balance, minBid, salt, commitment)
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

/** Revela con datos provistos manualmente (p. ej. desde otro dispositivo). */
export async function revealBidManual(
  auctionId: number,
  address: string,
  amount: number,
  salt: string
): Promise<void> {
  await chain.revealBid(auctionId, address, amount, salt)
  saveSalt(auctionId, address, amount, salt)
  emit()
}

export async function settle(auctionId: number, caller: string): Promise<void> {
  if (getMode() === 'chain') {
    await chain.settle(auctionId, caller)
    emit()
  } else {
    demo.revealAndSettle(auctionId)
  }
}

/**
 * Pago confidencial del ganador al emisor (Pasos 4-5).
 * En testnet calcula el compromiso Pedersen del monto ganador y llama a
 * `settle_payment`; en demo marca la subasta como pagada.
 */
export async function payWinner(auctionId: number, winner: string, amount: number): Promise<void> {
  if (getMode() === 'chain') {
    const blinding = randomSalt()
    const valueCommitment = await chain.tokenCommitValue(amount, blinding)
    await chain.settlePayment(auctionId, valueCommitment, winner)
    emit()
  } else {
    demo.markPaid(auctionId)
  }
}

export function resetDemo() {
  demo.resetDemo()
}
