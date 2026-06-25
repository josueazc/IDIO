import { useEffect, useState } from 'react'
import {
  connectWallet,
  disconnectWallet,
  onWalletAddressChange,
  onWalletDisconnect,
  shortAddress,
} from '../services/wallet'

interface Props {
  address: string | null
  demo: boolean
  compact?: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect?: () => void
}

export default function WalletConnect({ address, demo, compact = false, onConnect, onDisconnect }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const offDisconnect = onWalletDisconnect(() => {
      onDisconnect?.()
    })
    const offAddress = onWalletAddressChange((next) => {
      if (next) onConnect(next, false)
    })
    return () => {
      offDisconnect()
      offAddress()
    }
  }, [onConnect, onDisconnect])

  async function handleConnect() {
    setBusy(true)
    setError(null)
    try {
      const wallet = await connectWallet()
      onConnect(wallet.address, wallet.demo)
    } catch (e) {
      setError((e as Error).message || 'Wallet connection failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    setBusy(true)
    setError(null)
    try {
      if (!demo) await disconnectWallet()
      onDisconnect?.()
    } catch (e) {
      setError((e as Error).message || 'Wallet disconnect failed')
    } finally {
      setBusy(false)
    }
  }

  if (address) {
    return (
      <div className={compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
        <span className="pill border border-edge bg-white/[0.03] font-mono text-slate-200" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${demo ? 'bg-gold' : 'bg-brand'}`} />
          {demo ? 'demo session' : 'wallet'} {shortAddress(address)}
        </span>
        <button className="btn-ghost min-h-9 px-3 py-1.5 text-xs" onClick={handleDisconnect} disabled={busy}>
          Disconnect
        </button>
        {error && <div className="text-xs text-red-300" role="status">{error}</div>}
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
      <button className="btn-primary min-h-10 px-3 py-2 text-xs" onClick={handleConnect} disabled={busy}>
        <WalletIcon />
        {busy ? 'Opening wallet' : 'Connect wallet'}
      </button>
      {error && <div className="max-w-[220px] text-xs text-red-300" role="status">{error}</div>}
    </div>
  )
}

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5h15A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6.75A2.25 2.25 0 0 1 5.25 4.5H18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M16.5 13.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}
