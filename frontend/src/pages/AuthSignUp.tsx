import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import WalletConnect from '../components/WalletConnect'
import { accountDescription, accountLabel, signUp, type AccountRole } from '../services/accounts'
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
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function submit(e: FormEvent) {
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
    try {
      signUp({ email, password, role, walletAddress: address, displayName, jurisdiction })
      nav(roleHome(role))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const nameLabel = role === 'emisor' ? 'Nombre de la institución' : 'Nombre del banco'

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

          <button type="submit" className="btn-primary w-full">
            Crear cuenta
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
