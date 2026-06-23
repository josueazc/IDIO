/**
 * Store de subastas para la demo.
 *
 * Persiste en localStorage y notifica a los componentes suscritos. En
 * producción esta capa se reemplaza por lecturas/escrituras a los
 * contratos Soroban (ver `contracts.ts`).
 */
import type { Auction, AssetType, SealedBid } from '../types'
import { commitBid, generateReservesProof } from './proofs'

const KEY = 'idio.auctions.v1'
type Listener = () => void
const listeners = new Set<Listener>()

const HOUR = 3600 * 1000

function seed(): Auction[] {
  const now = Date.now()
  return [
    {
      id: 1,
      issuer: 'GBANCOCENTRALARG000000000000000000000000000000000000000',
      asset: 'Bonos Soberanos Argentina',
      assetType: 'soberano',
      amount: 500_000_000,
      minBid: 10_000_000,
      currency: 'USDC',
      status: 'BiddingOpen',
      description: 'Emisión de deuda soberana a 10 años. Cupón 5.25%.',
      reservesCommitment: 'a17f…proof',
      createdAt: now - 4 * HOUR,
      endTime: now + 2 * HOUR,
      bids: [
        mkBid('JPMorgan', 12_000_000, false),
        mkBid('Santander', 15_000_000, false),
        mkBid('BBVA', 14_000_000, false),
      ],
    },
    {
      id: 2,
      issuer: 'GBANCOCENTRALBRA000000000000000000000000000000000000000',
      asset: 'RWA: Cartera Hipotecaria Brasil',
      assetType: 'rwa',
      amount: 300_000_000,
      minBid: 8_000_000,
      currency: 'USDC',
      status: 'Settled',
      description: 'Cartera de hipotecas tokenizada (RWA).',
      reservesCommitment: 'b92c…proof',
      createdAt: now - 50 * HOUR,
      endTime: now - 2 * HOUR,
      winner: 'GCITI…',
      winnerName: 'Citi',
      winningAmount: 19_500_000,
      bids: [
        mkBid('Citi', 19_500_000, true),
        mkBid('HSBC', 18_000_000, true),
        mkBid('Itaú', 17_200_000, true),
      ],
    },
    {
      id: 3,
      issuer: 'GBANCOCENTRALMEX000000000000000000000000000000000000000',
      asset: 'Bono Corporativo Pemex',
      assetType: 'corporativo',
      amount: 450_000_000,
      minBid: 9_000_000,
      currency: 'USDC',
      status: 'BiddingOpen',
      description: 'Bono corporativo a 7 años.',
      reservesCommitment: 'c44a…proof',
      createdAt: now - 1 * HOUR,
      endTime: now + 24 * HOUR,
      bids: [mkBid('Goldman Sachs', 13_500_000, false)],
    },
  ]
}

function mkBid(name: string, amount: number, revealed: boolean): SealedBid {
  return {
    bidderName: name,
    bidderAddress: 'G' + name.toUpperCase().replace(/[^A-Z]/g, '').padEnd(55, '0').slice(0, 55),
    commitment: Math.random().toString(16).slice(2, 10) + '…',
    amount,
    revealed,
    timestamp: Date.now(),
    whitelisted: true,
  }
}

function load(): Auction[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Auction[]
  } catch {
    /* ignore */
  }
  const seeded = seed()
  save(seeded)
  return seeded
}

function save(auctions: Auction[]) {
  localStorage.setItem(KEY, JSON.stringify(auctions))
  listeners.forEach((l) => l())
}

export function subscribe(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getAuctions(): Auction[] {
  return load()
}

export function getAuction(id: number): Auction | undefined {
  return load().find((a) => a.id === id)
}

export interface CreateAuctionInput {
  issuer: string
  asset: string
  assetType: AssetType
  amount: number
  minBid: number
  currency: string
  description: string
  durationHours: number
}

export async function createAuction(input: CreateAuctionInput): Promise<Auction> {
  const auctions = load()
  const { commitment } = await generateReservesProof(input.amount)
  const now = Date.now()
  const auction: Auction = {
    id: (auctions.reduce((m, a) => Math.max(m, a.id), 0) || 0) + 1,
    issuer: input.issuer,
    asset: input.asset,
    assetType: input.assetType,
    amount: input.amount,
    minBid: input.minBid,
    currency: input.currency,
    status: 'BiddingOpen',
    description: input.description,
    reservesCommitment: commitment.slice(0, 8) + '…',
    bids: [],
    createdAt: now,
    endTime: now + input.durationHours * HOUR,
  }
  save([auction, ...auctions])
  return auction
}

/** Registra una oferta sellada con un compromiso ya calculado. */
export function submitBidWithCommitment(
  auctionId: number,
  bidderName: string,
  bidderAddress: string,
  amount: number,
  commitment: string
): void {
  const auctions = load()
  const auction = auctions.find((a) => a.id === auctionId)
  if (!auction) throw new Error('Subasta no encontrada')
  auction.bids.push({
    bidderName,
    bidderAddress,
    commitment: commitment.slice(0, 8) + '…',
    amount,
    revealed: false,
    timestamp: Date.now(),
    whitelisted: true,
  })
  save(auctions)
}

/** Cierra y liquida: revela todas las ofertas y elige la mayor. */
export function revealAndSettle(auctionId: number): void {
  const auctions = load()
  const auction = auctions.find((a) => a.id === auctionId)
  if (!auction) return
  auction.bids.forEach((b) => (b.revealed = true))
  const best = auction.bids.reduce<SealedBid | null>(
    (acc, b) => (!acc || b.amount > acc.amount ? b : acc),
    null
  )
  auction.status = 'Settled'
  if (best) {
    auction.winner = best.bidderAddress
    auction.winnerName = best.bidderName
    auction.winningAmount = best.amount
  }
  save(auctions)
}

/** Marca una subasta como pagada (demo). */
export function markPaid(auctionId: number): void {
  const auctions = load()
  const auction = auctions.find((a) => a.id === auctionId)
  if (!auction) return
  auction.paid = true
  save(auctions)
}

export function resetDemo(): void {
  localStorage.removeItem(KEY)
  save(seed())
}

/** Recalcula un compromiso para mostrarlo en la UI (verificación). */
export async function previewCommitment(amount: number, salt: string): Promise<string> {
  return commitBid(amount, salt)
}
