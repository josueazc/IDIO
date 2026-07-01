import { Link } from 'react-router-dom'
import { PageHeader, RuledPanel } from '../components/Primitives'
import { accountDescription, accountLabel, getCurrentUser, logOut } from '../services/accounts'
import { useRole } from '../utils/useRole'
import { shortAddress } from '../services/wallet'

interface Props {
  address: string | null
  onLogout: () => void
}

export default function Account({ address, onLogout }: Props) {
  const role = useRole()
  const user = getCurrentUser()

  function handleLogout() {
    logOut()
    onLogout()
  }

  if (!user || !role) return null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Perfil"
        title={user.displayName}
        description={accountDescription(role)}
      />

      <RuledPanel title="Datos de la cuenta">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="micro-label">Tipo</dt>
            <dd className="mt-2 text-white">{accountLabel(role)}</dd>
          </div>
          <div>
            <dt className="micro-label">Email</dt>
            <dd className="mt-2 font-mono text-sm text-zinc-300">{user.email}</dd>
          </div>
          <div>
            <dt className="micro-label">Wallet</dt>
            <dd className="mt-2 font-mono text-sm text-zinc-300">
              {shortAddress(user.walletAddress)}
              {address === user.walletAddress ? (
                <span className="ml-2 text-brand">conectada</span>
              ) : (
                <span className="ml-2 text-amber-400">desconectada</span>
              )}
            </dd>
          </div>
          {user.role === 'oferente' && user.membershipIndex != null && (
            <div>
              <dt className="micro-label">Covenant</dt>
              <dd className="mt-2 text-zinc-300">Miembro #{user.membershipIndex + 1}</dd>
            </div>
          )}
        </dl>
      </RuledPanel>

      <RuledPanel title="Sesión">
        <p className="text-sm leading-relaxed text-zinc-500">
          El rol no se puede cambiar desde aquí. Para probar otro flujo, cerrá sesión y registrá otra
          cuenta.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
          <Link className="btn-secondary" to="/">
            Ir al inicio
          </Link>
        </div>
      </RuledPanel>
    </div>
  )
}
