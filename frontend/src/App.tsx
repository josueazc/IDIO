import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import WalletGate from './components/WalletGate'
import Welcome from './pages/Welcome'
import AuthLogin from './pages/AuthLogin'
import AuthSignUp from './pages/AuthSignUp'
import Home from './pages/Home'
import Auctions from './pages/Auctions'
import CreateAuction from './pages/CreateAuction'
import AdminCapacity from './pages/AdminCapacity'
import Audit from './pages/Audit'
import Activity from './pages/Activity'
import Compliance from './pages/Compliance'
import BankProfile from './pages/BankProfile'
import Account from './pages/Account'
import { useRole } from './utils/useRole'
import { useCurrentUser } from './utils/useCurrentUser'
import { ROLE_ROUTES } from './services/role'
import { getStoredWalletAddress } from './services/wallet'
import { logOut, restoreSession } from './services/accounts'
import { roleHome } from './utils/roleNav'

export default function App() {
  const [address, setAddress] = useState<string | null>(() => getStoredWalletAddress())
  const [demo, setDemo] = useState(false)
  const [sessionRestored, setSessionRestored] = useState(false)
  const user = useCurrentUser()
  const role = useRole()
  const location = useLocation()

  // Restaurar sesión de Supabase al recargar la página
  useEffect(() => {
    restoreSession().finally(() => setSessionRestored(true))
  }, [])

  function onConnect(a: string, d: boolean) {
    setAddress(a)
    setDemo(d)
  }

  function onDisconnect() {
    setAddress(null)
    setDemo(false)
  }

  async function onLogout() {
    await logOut()
    onDisconnect()
  }

  const authProps = { address, demo, onConnect, onDisconnect }

  // Esperar a que se restaure la sesión antes de decidir qué mostrar
  if (!sessionRestored) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-brand" />
          <p className="text-sm text-zinc-500">Iniciando…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<AuthLogin {...authProps} />} />
        <Route path="/signup/emisor" element={<AuthSignUp role="emisor" {...authProps} />} />
        <Route path="/signup/oferente" element={<AuthSignUp role="oferente" {...authProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!address || address !== user.walletAddress) {
    return <WalletGate {...authProps} />
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const allowed = ROLE_ROUTES[role]
  const isPublic = location.pathname.startsWith('/banco/')
  if (!isPublic && !allowed.includes(location.pathname)) {
    return <Navigate to={roleHome(role)} replace />
  }

  return (
    <Layout address={address} demo={demo} user={user} onConnect={onConnect} onDisconnect={onDisconnect} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account address={address} onLogout={onLogout} />} />
        <Route path="/auctions" element={<Auctions address={address} />} />
        <Route path="/create" element={<CreateAuction address={address} />} />
        <Route path="/capacity" element={<AdminCapacity address={address} />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/activity" element={<Activity address={address} />} />
        <Route path="/banco/:address" element={<BankProfile />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to={roleHome(role)} replace />} />
      </Routes>
    </Layout>
  )
}
