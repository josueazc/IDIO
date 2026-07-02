import { Link } from 'react-router-dom'
import { CopyButton, InlineAlert, PageHeader, RuledPanel } from '../components/Primitives'
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
          <div className="sm:col-span-2">
            <dt className="micro-label">Wallet Stellar</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-sm text-zinc-300">{user.walletAddress}</span>
              <CopyButton text={user.walletAddress} />
              <a
                href={`https://stellar.expert/explorer/testnet/account/${user.walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand hover:underline"
              >
                stellar.expert →
              </a>
              {address === user.walletAddress ? (
                <span className="text-xs font-semibold text-brand">● conectada</span>
              ) : (
                <span className="text-xs font-semibold text-amber-400">○ desconectada</span>
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
        <InlineAlert variant="info">
          El rol no se puede cambiar desde aquí. Para probar otro flujo, cerrá sesión y registrá otra cuenta con otro email.
        </InlineAlert>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-danger" onClick={handleLogout}>
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
