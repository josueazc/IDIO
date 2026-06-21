import { useEffect, useState } from 'react'
import { getAuctions, subscribe } from '../services/store'
import type { Auction } from '../types'

export function useAuctions(): Auction[] {
  const [auctions, setAuctions] = useState<Auction[]>(() => getAuctions())
  useEffect(() => subscribe(() => setAuctions(getAuctions())), [])
  return auctions
}
