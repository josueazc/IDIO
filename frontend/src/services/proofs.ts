/**
 * Generación de pruebas / compromisos en el navegador.
 *
 * En producción esto invoca el circuito Noir compilado a WASM (nargo /
 * @noir-lang/noir_js + barretenberg) para producir una prueba real. Para el
 * MVP de la demo usamos la API WebCrypto del navegador para construir el
 * mismo compromiso `H(monto || salt)` que recalcula el contrato Soroban,
 * de modo que el flujo end-to-end (sellar → revelar → verificar) es
 * consistente y verificable.
 */

/** Genera un salt aleatorio de 32 bytes en hex. */
export function randomSalt(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function i128BeBytes(amount: number): Uint8Array {
  // Representación big-endian de 16 bytes, equivalente a i128::to_be_bytes.
  const buf = new Uint8Array(16)
  let v = BigInt(Math.trunc(amount))
  for (let i = 15; i >= 0; i--) {
    buf[i] = Number(v & 0xffn)
    v >>= 8n
  }
  return buf
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 ? '0' + hex : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compromiso de una oferta sellada: `SHA-256(amount_be || salt)`.
 * Coincide con `AuctionContract::commitment_of` en el contrato.
 */
export async function commitBid(amount: number, salt: string): Promise<string> {
  const amountBytes = i128BeBytes(amount)
  const saltBytes = hexToBytes(salt)
  const preimage = new Uint8Array(amountBytes.length + saltBytes.length)
  preimage.set(amountBytes, 0)
  preimage.set(saltBytes, amountBytes.length)
  const digest = await crypto.subtle.digest('SHA-256', preimage)
  return toHex(digest)
}

export interface SealedBidProof {
  commitment: string
  salt: string
  /** Marca de prueba ZK (en producción: bytes de la prueba Noir). */
  proof: string
}

/**
 * Simula la generación de la prueba ZK de una oferta sellada:
 * verifica balance >= oferta y produce el compromiso.
 */
export async function generateSealedBidProof(
  amount: number,
  availableBalance: number,
  minBid: number
): Promise<SealedBidProof> {
  if (amount < minBid) throw new Error('La oferta no alcanza el mínimo')
  if (availableBalance < amount) throw new Error('Saldo insuficiente para respaldar la oferta')

  // Latencia simulada de generación de la prueba.
  await new Promise((r) => setTimeout(r, 900))

  const salt = randomSalt()
  const commitment = await commitBid(amount, salt)
  const proof = await commitBid(availableBalance, salt) // marcador de prueba
  return { commitment, salt, proof }
}

/** Compromiso de reservas del emisor: `SHA-256(total_be || salt)`. */
export async function generateReservesProof(total: number): Promise<{ commitment: string; salt: string }> {
  await new Promise((r) => setTimeout(r, 700))
  const salt = randomSalt()
  const commitment = await commitBid(total, salt)
  return { commitment, salt }
}
