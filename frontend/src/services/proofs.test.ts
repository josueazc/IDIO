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
})

describe('randomSalt', () => {
  it('genera 32 bytes en hex', () => {
    const s = randomSalt()
    expect(s).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(s)).toBe(true)
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
})
