import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import WalletConnect from '../components/WalletConnect'
import { accountDescription, accountLabel, signUp, type AccountRole, EmailConfirmationRequiredError } from '../services/accounts'
import { supabase } from '../services/supabase'
import { roleHome } from '../utils/roleNav'
import { shortAddress } from '../services/wallet'

interface Props {
  role: AccountRole
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

export default function AuthSignUp({ role, address, demo, onConnect, onDisconnect }: Props) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setTouched({ email: true, password: true, displayName: true })

    if (!address) {
      setError('Conectá tu wallet Stellar antes de registrarte.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await signUp({ email, password, role, walletAddress: address, displayName, jurisdiction })
      nav(roleHome(role))
    } catch (err) {
      if (err instanceof EmailConfirmationRequiredError) {
        setConfirmEmail(err.email)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de confirmación de email
  if (confirmEmail) {
    return (
      <main className="auth-shell">
        <div className="auth-card w-full max-w-md text-center">
          <BrandLogo compact />

          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-brand/30 bg-brand/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="font-display mt-6 text-2xl text-white">Revisá tu email</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Te enviamos un link de confirmación a:
          </p>
          <p className="mt-1 font-semibold text-zinc-100">{confirmEmail}</p>

          <div className="mt-6 rounded-xl border border-edge bg-raised/50 px-5 py-4 text-left text-sm text-zinc-400 space-y-2">
            <p>1. Abrí el email de Supabase en tu bandeja de entrada.</p>
            <p>2. Hacé click en <strong className="text-zinc-200">"Confirm your email"</strong>.</p>
            <p>3. Volvé acá e iniciá sesión con tu email y contraseña.</p>
          </div>

          <Link
            to="/login"
            className="btn-primary mt-8 w-full"
          >
            Ir a iniciar sesión
          </Link>

          <p className="mt-4 text-xs text-zinc-600">
            ¿No llegó el email? Revisá la carpeta de spam o intentá registrarte de nuevo.
          </p>
        </div>
      </main>
    )
  }

  const nameLabel = role === 'emisor' ? 'Nombre de la institución' : 'Nombre del banco'
  const usingSupabase = !!supabase

  return (
    <main className="auth-shell">
      <div className="mx-auto mb-8 max-w-md">
        <Link to="/" className="text-sm text-zinc-500 transition hover:text-white">
          ← Inicio
        </Link>
      </div>

      <div className="auth-card">
        <BrandLogo compact />
        <p className="eyebrow mt-8">Registro</p>
        <h1 className="font-display mt-2 text-3xl text-white">{accountLabel(role)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{accountDescription(role)}</p>

        {usingSupabase && (
          <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-xs text-brand/80">
            <span className="font-medium text-brand">Cuenta real</span> — vas a recibir un email de confirmación antes de poder entrar.
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              placeholder="tu@banco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="label">Contraseña</span>
            <input
              className={`input ${touched.password && password.length > 0 && password.length < 6 ? 'border-red-400/40' : ''}`}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched('password')}
              required
              autoComplete="new-password"
            />
            {touched.password && password.length > 0 && password.length < 6 && (
              <p className="mt-1 text-xs text-red-300">Mínimo 6 caracteres.</p>
            )}
          </label>

          <label className="block">
            <span className="label">{nameLabel}</span>
            <input
              className="input"
              placeholder={role === 'emisor' ? 'Tesorería Nacional' : 'Banco Central'}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="label">Jurisdicción (opcional)</span>
            <input
              className="input"
              placeholder="MX · AR · UE"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
            />
          </label>

          <div className="rounded-2xl border border-edge bg-raised/60 p-4">
            <div className="micro-label mb-3">Wallet Stellar</div>
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
            {address && (
              <p className="mt-3 text-xs text-zinc-500">
                Vinculada: <span className="font-mono text-zinc-300">{shortAddress(address)}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          ¿Ya tenés cuenta?{' '}
          <Link className="font-semibold text-brand" to="/login">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
