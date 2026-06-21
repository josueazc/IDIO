import { connectWallet, shortAddress } from '../services/wallet'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
}

export default function WalletConnect({ address, demo, onConnect }: Props) {
  async function handle() {
    const { address, demo } = await connectWallet()
    onConnect(address, demo)
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {demo && (
          <span className="pill bg-gold/10 text-gold" title="Wallet simulada para demo">
            demo
          </span>
        )}
        <span className="pill border border-edge bg-white/5 font-mono text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {shortAddress(address)}
        </span>
      </div>
    )
  }

  return (
    <button className="btn-primary" onClick={handle}>
      <FreighterIcon />
      Conectar Wallet
    </button>
  )
}

function FreighterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 7l9-4 9 4v6c0 5-4 8-9 9-5-1-9-4-9-9V7z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
