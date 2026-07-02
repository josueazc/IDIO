import { describe, it, expect } from 'vitest'
import { commitBid, randomSalt, generateSealedBidProof } from './proofs'

describe('commitBid', () => {
  it('reproduce el vector cruzado contrato/circuito', async () => {
    // amount=15_000_000, salt = 32 bytes de 0x07.
    // El contrato Soroban y el circuito Noir producen el mismo hash.
    const salt = '07'.repeat(32)
    const commitment = await commitBid(15_000_000, salt)
    expect(commitment).toBe('d772f95448892f507a9803a892c5f6ca436a113f3a20b88730997cd8a1123825')
  })

  it('es determinista y sensible al monto', async () => {
    const salt = randomSalt()
    const a = await commitBid(12_000_000, salt)
    const b = await commitBid(12_000_000, salt)
    const c = await commitBid(12_000_001, salt)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('es sensible al salt', async () => {
    const saltA = randomSalt()
    let saltB = randomSalt()
    while (saltB === saltA) saltB = randomSalt()
    const amount = 10_000_000
    expect(await commitBid(amount, saltA)).not.toBe(await commitBid(amount, saltB))
  })

  it('devuelve hex de 64 chars (32 bytes)', async () => {
    const h = await commitBid(1_000_000, '00'.repeat(32))
    expect(h).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(h)).toBe(true)
  })

  it('vector con salt de ceros', async () => {
    const h = await commitBid(0, '00'.repeat(32))
    expect(h).toHaveLength(64)
  })
})

describe('randomSalt', () => {
  it('genera 32 bytes en hex', () => {
    const s = randomSalt()
    expect(s).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(s)).toBe(true)
  })

  it('siempre genera salts distintos', () => {
    const salts = Array.from({ length: 10 }, randomSalt)
    const unique = new Set(salts)
    expect(unique.size).toBe(salts.length)
  })
})

describe('generateSealedBidProof', () => {
  it('rechaza ofertas bajo el mínimo', async () => {
    await expect(generateSealedBidProof(5_000_000, 50_000_000, 10_000_000)).rejects.toThrow()
  })

  it('rechaza saldo insuficiente', async () => {
    await expect(generateSealedBidProof(20_000_000, 9_000_000, 10_000_000)).rejects.toThrow()
  })

  it('acepta una oferta válida y devuelve compromiso coherente', async () => {
    const { commitment, salt } = await generateSealedBidProof(15_000_000, 50_000_000, 10_000_000)
    expect(await commitBid(15_000_000, salt)).toBe(commitment)
  })

  it('salt en la prueba válida tiene 64 chars hex', async () => {
    const { salt } = await generateSealedBidProof(15_000_000, 50_000_000, 10_000_000)
    expect(salt).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true)
  })

  it('commitment en la prueba válida tiene 64 chars hex', async () => {
    const { commitment } = await generateSealedBidProof(15_000_000, 50_000_000, 10_000_000)
    expect(commitment).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(commitment)).toBe(true)
  })

  it('dos pruebas del mismo monto producen commitments distintos (salt aleatorio)', async () => {
    const a = await generateSealedBidProof(15_000_000, 50_000_000, 10_000_000)
    const b = await generateSealedBidProof(15_000_000, 50_000_000, 10_000_000)
    expect(a.salt).not.toBe(b.salt)
    expect(a.commitment).not.toBe(b.commitment)
  })
})
