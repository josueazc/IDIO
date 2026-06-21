import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Auctions from './pages/Auctions'
import CreateAuction from './pages/CreateAuction'
import Audit from './pages/Audit'
import Compliance from './pages/Compliance'

export default function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [demo, setDemo] = useState(false)

  function onConnect(a: string, d: boolean) {
    setAddress(a)
    setDemo(d)
  }

  return (
    <Layout address={address} demo={demo} onConnect={onConnect}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions" element={<Auctions address={address} />} />
        <Route path="/create" element={<CreateAuction address={address} />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/compliance" element={<Compliance />} />
      </Routes>
    </Layout>
  )
}
