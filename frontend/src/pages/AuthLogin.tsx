import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import WalletConnect from '../components/WalletConnect'
import { getCurrentUser, logIn } from '../services/accounts'
import { supabase } from '../services/supabase'
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
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await logIn(email, password)
      if (address && address !== user.walletAddress) {
        setError(`Esta cuenta usa ${shortAddress(user.walletAddress)}. Conectá esa wallet para continuar.`)
        return
      }
      nav(roleHome(user.role))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const pending = getCurrentUser()
  const usingSupabase = !!supabase

  return (
    <main className="auth-shell dot-grid">
      {/* orbs */}
      <div className="orb orb-green" style={{ width: 500, height: 500, top: -150, left: -100, pointerEvents:'none' }} />
      <div className="orb orb-blue"  style={{ width: 400, height: 400, bottom: -100, right: -80, pointerEvents:'none' }} />
      <div className="mx-auto mb-8 max-w-md" style={{ position:'relative', zIndex:1 }}>
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

        {!usingSupabase && (
          <div className="mt-4 rounded-xl border border-edge bg-raised/50 px-4 py-3 text-xs text-zinc-500">
            <span className="font-medium text-zinc-300">Modo demo:</span>{' '}
            cualquier email y contraseña funcionan. Datos solo en este navegador.
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="label">Contraseña</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              error.includes('Confirmá tu email')
                ? 'border-amber-400/25 bg-amber-500/10 text-amber-200'
                : 'border-red-400/25 bg-red-500/10 text-red-200'
            }`}>
              {error}
              {error.includes('Confirmá tu email') && (
                <p className="mt-1 text-xs opacity-75">Revisá tu bandeja de entrada y la carpeta de spam.</p>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Entrar'}
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
