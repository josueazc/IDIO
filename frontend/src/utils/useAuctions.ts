import { useEffect, useState, useCallback } from 'react'
import { loadAuctions, subscribe, getMode } from '../services/data'
import type { Auction } from '../types'

export function useAuctions(): { auctions: Auction[]; loading: boolean; error: string | null } {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    loadAuctions()
      .then((a) => {
        setAuctions(a)
        setError(null)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    return subscribe(refresh)
  }, [refresh])

  // Re-carga si cambia el modo en otra pestaña.
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  void getMode
  return { auctions, loading, error }
}
