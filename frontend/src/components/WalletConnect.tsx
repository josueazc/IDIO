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
    const offDisconnect = onWalletDisconnect(() => onDisconnect?.())
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
      if (wallet.demo) {
        setError('Cancelaste la conexión. Conectá Freighter, xBull u otra wallet Stellar para operar en Testnet.')
        setBusy(false)
        return
      }
      onConnect(wallet.address, wallet.demo)
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('user')) {
        setError('Cancelaste la conexión de wallet.')
      } else {
        setError(msg || 'No se pudo conectar la wallet.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleConnectDemo() {
    setBusy(true)
    setError(null)
    try {
      const { connectDemoWallet } = await import('../services/wallet')
      const wallet = connectDemoWallet()
      onConnect(wallet.address, wallet.demo)
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
      setError((e as Error).message || 'No se pudo desconectar')
    } finally {
      setBusy(false)
    }
  }

  if (address) {
    return (
      <div className={compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
        <span className="pill w-full justify-between bg-raised font-mono text-zinc-200 sm:w-auto" aria-live="polite">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${demo ? 'bg-gold' : 'bg-brand'}`} />
            {shortAddress(address)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">{demo ? 'demo' : 'live'}</span>
        </span>
        <button type="button" className="btn-ghost btn-sm w-full sm:w-auto" onClick={handleDisconnect} disabled={busy}>
          Desconectar
        </button>
        {error && (
          <div className="text-xs text-red-300" role="status">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
      <button
        type="button"
        className={`btn-primary ${compact ? 'w-full' : ''} btn-sm`}
        onClick={handleConnect}
        disabled={busy}
      >
        <WalletIcon />
        {busy ? 'Conectando…' : 'Conectar wallet'}
      </button>
      {!compact && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={handleConnectDemo}
          disabled={busy}
          title="Usar dirección aleatoria para el modo demo"
        >
          Modo demo
        </button>
      )}
      {error && (
        <div className="text-xs text-red-300" role="status">
          {error}
        </div>
      )}
    </div>
  )
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
