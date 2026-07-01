import WalletConnect from './WalletConnect'
import BrandLogo from './BrandLogo'
import { getCurrentUser } from '../services/accounts'
import { shortAddress } from '../services/wallet'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

export default function WalletGate({ address, demo, onConnect, onDisconnect }: Props) {
  const user = getCurrentUser()
  if (!user) return null

  const ok = address === user.walletAddress

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="auth-card w-full max-w-md text-center">
        <div className="flex justify-center">
          <BrandLogo compact />
        </div>
        <p className="eyebrow mt-8">Un paso más</p>
        <h1 className="font-display mt-2 text-2xl text-white">Hola, {user.displayName}</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          Tu cuenta de{' '}
          <span className="text-zinc-300">{user.role === 'emisor' ? 'emisor' : 'oferente'}</span> está
          vinculada a{' '}
          <span className="font-mono text-zinc-300">{shortAddress(user.walletAddress)}</span>.
        </p>
        <div className="mt-8">
          <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
        {address && !ok && (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            Conectaste otra wallet. Usá {shortAddress(user.walletAddress)}.
          </p>
        )}
        {ok && <p className="mt-4 text-sm text-brand">Wallet correcta — entrando…</p>}
      </div>
    </main>
  )
}
