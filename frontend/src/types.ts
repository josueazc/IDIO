export type AuctionStatus = 'BiddingOpen' | 'BiddingClosed' | 'Settled' | 'Cancelled'

export type Role = 'issuer' | 'bidder' | 'auditor' | 'regulator'

export type AssetType = 'soberano' | 'rwa' | 'corporativo' | 'licitacion'

export const ASSET_TYPES: { id: AssetType; label: string }[] = [
  { id: 'soberano', label: 'Bono soberano' },
  { id: 'rwa', label: 'RWA tokenizado' },
  { id: 'corporativo', label: 'Bono corporativo' },
  { id: 'licitacion', label: 'Licitación pública' },
]

export interface SealedBid {
  /** Nombre legible del banco (solo para demo / view key). */
  bidderName: string
  bidderAddress: string
  /** Compromiso H(monto || salt) — lo único público durante la subasta. */
  commitment: string
  /** Monto revelado (oculto hasta el reveal). */
  amount: number
  revealed: boolean
  timestamp: number
  /** Estado de compliance del participante. */
  whitelisted: boolean
}

export interface Auction {
  id: number
  issuer: string
  asset: string
  assetType: AssetType
  amount: number
  minBid: number
  currency: string
  status: AuctionStatus
  description: string
  reservesCommitment: string
  bids: SealedBid[]
  winner?: string
  winnerName?: string
  winningAmount?: number
  /** Si el ganador ya pagó confidencialmente al emisor (Pasos 4-5). */
  paid?: boolean
  createdAt: number
  endTime: number
}
