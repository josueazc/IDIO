import WalletConnect from './WalletConnect'
import BrandLogo from './BrandLogo'
import { getCurrentUser } from '../services/accounts'
import { shortAddress } from '../services/wallet'
import { ROLES } from '../services/role'

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
  const roleInfo = ROLES.find((r) => r.id === user.role)

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 bg-surface">
      <div className="auth-card w-full max-w-md text-center">
        <div className="flex justify-center">
          <BrandLogo compact />
        </div>

        <p className="eyebrow mt-8">Verificación de identidad</p>
        <h1 className="font-display mt-2 text-2xl text-white">Hola, {user.displayName}</h1>

        <div className="mt-4 space-y-2">
          <p className="text-sm leading-relaxed text-zinc-500">
            Tu cuenta de{' '}
            <span className="font-semibold text-zinc-300">{roleInfo?.label ?? user.role}</span>{' '}
            está vinculada a la wallet:
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl border border-edge bg-raised/60 px-4 py-2.5">
            <span className="font-mono text-sm text-zinc-200">{shortAddress(user.walletAddress)}</span>
            {demo && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                demo
              </span>
            )}
          </div>
        </div>

        <div className="mt-8">
          <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>

        {address && !ok && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            <strong>Wallet incorrecta.</strong> Conectaste{' '}
            <span className="font-mono">{shortAddress(address)}</span>. Necesitás conectar{' '}
            <span className="font-mono">{shortAddress(user.walletAddress)}</span>.
          </div>
        )}

        {ok && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Wallet verificada — accediendo al protocolo…
          </div>
        )}

        {!address && (
          <p className="mt-6 text-xs text-zinc-600">
            Usá Freighter, xBull, Albedo u otra wallet compatible con Stellar Wallets Kit.
          </p>
        )}
      </div>
    </main>
  )
}
