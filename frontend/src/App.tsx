import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import RolePicker from './pages/RolePicker'
import Home from './pages/Home'
import Auctions from './pages/Auctions'
import CreateAuction from './pages/CreateAuction'
import Audit from './pages/Audit'
import Activity from './pages/Activity'
import Compliance from './pages/Compliance'
import BankProfile from './pages/BankProfile'
import RoleSwitch from './pages/RoleSwitch'
import { useRole } from './utils/useRole'
import { ROLE_ROUTES } from './services/role'
import { getStoredWalletAddress } from './services/wallet'

export default function App() {
  const [address, setAddress] = useState<string | null>(() => getStoredWalletAddress())
  const [demo, setDemo] = useState(false)
  const role = useRole()
  const location = useLocation()

  function onConnect(a: string, d: boolean) {
    setAddress(a)
    setDemo(d)
  }

  function onDisconnect() {
    setAddress(null)
    setDemo(false)
  }

  // Sin rol: solo el selector de rol.
  if (!role) {
    return <RolePicker address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
  }

  // Guarda: si la ruta no pertenece al rol, vuelve al inicio del rol.
  // El perfil de banco (/banco/:address) es de solo lectura para todos.
  const allowed = ROLE_ROUTES[role]
  const isPublic = location.pathname.startsWith('/banco/')
  if (!isPublic && !allowed.includes(location.pathname)) {
    return <Navigate to="/" replace />
  }

  return (
    <Layout address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roles" element={<RoleSwitch />} />
        <Route path="/auctions" element={<Auctions address={address} />} />
        <Route path="/create" element={<CreateAuction address={address} />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/activity" element={<Activity address={address} />} />
        <Route path="/banco/:address" element={<BankProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
