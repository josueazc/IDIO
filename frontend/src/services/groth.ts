/**
 * Generación de pruebas Groth16 (BN254) en el navegador vía el prover arkworks
 * compilado a WASM. La misma prueba se verifica on-chain por `idio-verifier`
 * (cross-contract desde la subasta) — este es el puente Noir→Groth16:
 * prueba ZK generada en el cliente, verificada por el contrato.
 */
import init, { prove_eligibility_hex, prove_reserves_hex } from '../prover-wasm/idio_prover'

export interface GrothProof {
  a: string // hex 64 bytes
  b: string // hex 128 bytes
  c: string // hex 64 bytes
}

let ready: Promise<unknown> | null = null
async function ensure() {
  if (!ready) ready = init()
  await ready
}

function split(hex: string): GrothProof {
  return { a: hex.slice(0, 128), b: hex.slice(128, 384), c: hex.slice(384, 512) }
}

function seed(): bigint {
  return BigInt(Math.floor(Math.random() * 2 ** 31))
}

/** Prueba de elegibilidad: balance ≥ oferta ≥ mínimo (oferta/balance privados). */
export async function proveEligibility(
  minBid: number,
  bid: number,
  balance: number
): Promise<GrothProof> {
  await ensure()
  const hex = prove_eligibility_hex(BigInt(minBid), BigInt(bid), BigInt(balance), seed())
  return split(hex)
}

/**
 * Prueba de reservas (Auspex+): total ≥ monto y liquid/total ≥ pct, sin
 * revelar total ni liquid. `pct` es la política mínima de liquidez (%).
 */
export async function proveReserves(
  auctionAmount: number,
  minLiquidityPct: number,
  total: number,
  liquid: number
): Promise<GrothProof> {
  await ensure()
  const hex = prove_reserves_hex(
    BigInt(auctionAmount),
    BigInt(minLiquidityPct),
    BigInt(total),
    BigInt(liquid),
    seed()
  )
  return split(hex)
}
