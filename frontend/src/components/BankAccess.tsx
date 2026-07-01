import { useState } from 'react'
import WalletConnect from './WalletConnect'
import { covenantCapacity, getProfile, logOut, signUp } from '../services/auth'
import { shortAddress } from '../services/wallet'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
  onEnter: () => void
}

/**
 * Registro / ingreso de bancos SIN backend: la identidad es la wallet Stellar.
 * - Sin wallet: se pide conectarla.
 * - Wallet conectada sin perfil: formulario de alta (sign up).
 * - Wallet con perfil: ingreso directo (log in) al panel de ofertas.
 */
export default function BankAccess({ address, demo, onConnect, onDisconnect, onEnter }: Props) {
  const [name, setName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [error, setError] = useState<string | null>(null)

  const profile = getProfile(address)

  function register() {
    setError(null)
    if (!address) {
      setError('Conectá una wallet Stellar para registrar el banco.')
      return
    }
    if (name.trim().length < 2) {
      setError('Ingresá el nombre del banco (mínimo 2 caracteres).')
      return
    }
    try {
      signUp({ address, name: name.trim(), jurisdiction: jurisdiction.trim() })
      onEnter()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="border border-edge bg-[#050505] p-6">
      <div className="micro-label mb-3">Para bancos</div>
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
        Registrá tu banco para ofertar.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        No hay servidor ni contraseñas: tu identidad es tu wallet Stellar. Al registrarte recibís una
        posición en el set de miembros del Covenant, con la que probás tu elegibilidad en cada oferta
        sin revelar cuál sos.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
        <div className="space-y-4">
          {!address ? (
            <div className="border border-edge bg-panel p-4 text-sm text-slate-400">
              Conectá tu wallet para continuar con el alta o el ingreso.
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div className="border border-brand/40 bg-brand/10 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-brand">Sesión iniciada</div>
                <div className="mt-2 text-lg font-semibold text-white">{profile.name}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {profile.jurisdiction || 'Jurisdicción no declarada'} ·{' '}
                  <span className="font-mono">{shortAddress(profile.address)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Miembro Covenant #{profile.membershipIndex + 1} de {covenantCapacity()}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={onEnter}>
                  Ingresar al panel de ofertas
                </button>
                <button className="btn-ghost" onClick={() => logOut()}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="label">Nombre del banco</span>
                <input
                  className="input"
                  placeholder="Banco Central de…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Jurisdicción (opcional)</span>
                <input
                  className="input"
                  placeholder="AR · UE · US…"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </label>
              <div className="border border-edge bg-panel p-3 text-xs text-slate-500">
                Wallet: <span className="font-mono text-slate-300">{shortAddress(address)}</span>
              </div>
              {error && (
                <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              <button className="btn-primary w-full" onClick={register}>
                Registrar banco (Sign up)
              </button>
            </div>
          )}
          {error && !address && (
            <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3 md:w-64">
          <div className="micro-label">Billetera</div>
          <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          <p className="text-xs leading-5 text-slate-600">
            El ingreso (log in) es reconectar la misma wallet: si ya tenés perfil, entrás directo.
          </p>
        </div>
      </div>
    </div>
  )
}
