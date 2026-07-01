/**
 * Generación de pruebas Groth16 (BN254) en el navegador vía el prover arkworks
 * compilado a WASM. La misma prueba se verifica on-chain por `idio-verifier`
 * (cross-contract desde la subasta) — este es el puente Noir→Groth16:
 * prueba ZK generada en el cliente, verificada por el contrato.
 */
import init, {
  prove_eligibility_hex,
  prove_reserves_hex,
  prove_membership_hex,
} from '../prover-wasm/idio_prover'

export interface GrothProof {
  a: string // hex 64 bytes
  b: string // hex 128 bytes
  c: string // hex 64 bytes
}

/** Resultado de una prueba de membresía Covenant. */
export interface MembershipProof {
  proof: GrothProof
  /** Nullifier de un solo uso (hex 32 bytes). */
  nullifier: string
  /** Raíz Merkle del set de miembros (hex 32 bytes). */
  root: string
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

/**
 * Prueba de elegibilidad sellada: cupo ≥ oferta ≥ mínimo y el compromiso
 * SHA-256(be16(oferta)‖salt) queda ligado a la prueba (3 entradas públicas on-chain).
 */
export async function proveEligibility(
  minBid: number,
  capacity: number,
  bid: number,
  saltHex: string
): Promise<GrothProof> {
  await ensure()
  const hex = prove_eligibility_hex(BigInt(minBid), BigInt(capacity), BigInt(bid), saltHex, seed())
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

/**
 * Prueba de membresía (Covenant): el banco demuestra que pertenece al set de
 * miembros aprobados (árbol de Merkle) sin revelar cuál es, y emite un
 * nullifier de un solo uso. `secretsCsv` es la lista de secretos del árbol y
 * `index` la posición del banco. La misma prueba la verifica el ASP on-chain.
 */
export async function proveMembership(
  secretsCsv: string,
  index: number
): Promise<MembershipProof> {
  await ensure()
  const hex = prove_membership_hex(secretsCsv, index, seed())
  // Layout: a(128) ‖ b(256) ‖ c(128) ‖ nullifier(64) ‖ root(64) = 640 chars.
  return {
    proof: { a: hex.slice(0, 128), b: hex.slice(128, 384), c: hex.slice(384, 512) },
    nullifier: hex.slice(512, 576),
    root: hex.slice(576, 640),
  }
}
