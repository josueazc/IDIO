export type AuctionStatus = 'BiddingOpen' | 'BiddingClosed' | 'Settled' | 'Cancelled'

export type Role = 'issuer' | 'bidder' | 'auditor' | 'regulator'

export type AssetType = 'soberano' | 'rwa' | 'corporativo' | 'licitacion'

export const ASSET_TYPES: { id: AssetType; label: string }[] = [
  { id: 'soberano', label: 'Sovereign bond' },
  { id: 'rwa', label: 'Tokenized RWA' },
  { id: 'corporativo', label: 'Corporate bond' },
  { id: 'licitacion', label: 'Public tender' },
]

export interface SealedBid {
  bidderName: string
  bidderAddress: string
  commitment: string
  amount: number
  revealed: boolean
  timestamp: number
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
  paid?: boolean
  createdAt: number
  endTime: number
}
