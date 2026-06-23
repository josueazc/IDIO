import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import RolePicker from './pages/RolePicker'
import Home from './pages/Home'
import Auctions from './pages/Auctions'
import CreateAuction from './pages/CreateAuction'
import Audit from './pages/Audit'
import Compliance from './pages/Compliance'
import BankProfile from './pages/BankProfile'
import { useRole } from './utils/useRole'
import { ROLE_ROUTES } from './services/role'

export default function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [demo, setDemo] = useState(false)
  const role = useRole()
  const location = useLocation()

  function onConnect(a: string, d: boolean) {
    setAddress(a)
    setDemo(d)
  }

  // Sin rol: solo el selector de rol.
  if (!role) {
    return (
      <Layout address={address} demo={demo} onConnect={onConnect}>
        <RolePicker />
      </Layout>
    )
  }

  // Guarda: si la ruta no pertenece al rol, vuelve al inicio del rol.
  // El perfil de banco (/banco/:address) es de solo lectura para todos.
  const allowed = ROLE_ROUTES[role]
  const isPublic = location.pathname.startsWith('/banco/')
  if (!isPublic && !allowed.includes(location.pathname)) {
    return <Navigate to="/" replace />
  }

  return (
    <Layout address={address} demo={demo} onConnect={onConnect}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions" element={<Auctions address={address} />} />
        <Route path="/create" element={<CreateAuction address={address} />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/banco/:address" element={<BankProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
