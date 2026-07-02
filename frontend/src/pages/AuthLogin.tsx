import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import WalletConnect from '../components/WalletConnect'
import { getCurrentUser, logIn } from '../services/accounts'
import { roleHome } from '../utils/roleNav'
import { shortAddress } from '../services/wallet'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

export default function AuthLogin({ address, demo, onConnect, onDisconnect }: Props) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const user = logIn(email, password)
      if (address && address !== user.walletAddress) {
        setError(
          `Esta cuenta usa ${shortAddress(user.walletAddress)}. Conectá esa wallet para continuar.`
        )
        return
      }
      nav(roleHome(user.role))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const pending = getCurrentUser()

  return (
    <main className="auth-shell">
      <div className="mx-auto mb-8 max-w-md">
        <Link to="/" className="text-sm text-zinc-500 transition hover:text-white">
          ← Inicio
        </Link>
      </div>

      <div className="auth-card">
        <BrandLogo compact />
        <p className="eyebrow mt-8">Bienvenido</p>
        <h1 className="font-display mt-2 text-3xl text-white">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tu rol quedó fijado al registrarte. Conectá la misma wallet Stellar para continuar.
        </p>
        <div className="mt-4 rounded-xl border border-edge bg-raised/50 px-4 py-3 text-xs text-zinc-500">
          <span className="font-medium text-zinc-300">Modo demo:</span>{' '}
          cualquier email y contraseña funcionan. Datos solo en este navegador.
        </div>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Contraseña</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="rounded-2xl border border-edge bg-raised/60 p-4">
            <div className="micro-label mb-3">Wallet Stellar</div>
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>

          {pending && !address && (
            <p className="text-xs text-amber-200/90">
              Sesión como {pending.displayName}. Conectá {shortAddress(pending.walletAddress)}.
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          ¿Primera vez?{' '}
          <Link className="font-semibold text-brand" to="/">
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  )
}
