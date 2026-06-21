import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import WalletConnect from './WalletConnect'
import ModeToggle from './ModeToggle'
import { useRole } from '../utils/useRole'
import { ROLES, ROLE_ROUTES, setRole } from '../services/role'

interface Props {
  children: ReactNode
  address: string | null
  demo: boolean
  onConnect: (a: string, d: boolean) => void
}

const LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/auctions': 'Subastas',
  '/create': 'Crear',
  '/audit': 'Auditoría',
  '/compliance': 'Compliance',
}

export default function Layout({ children, address, demo, onConnect }: Props) {
  const role = useRole()
  const nav = role ? ROLE_ROUTES[role].map((to) => ({ to, label: LABELS[to], end: to === '/' })) : []
  const roleInfo = ROLES.find((r) => r.id === role)
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-edge/70 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight text-white">IDIO</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Private Auctions
              </div>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {roleInfo && (
              <button
                onClick={() => setRole(null)}
                className="pill border border-edge bg-white/5 text-slate-300 hover:bg-white/10"
                title="Cambiar de rol"
              >
                <span>{roleInfo.icon}</span>
                {roleInfo.label}
                <span className="text-slate-500">·</span>
                <span className="text-brand-soft">cambiar</span>
              </button>
            )}
            <ModeToggle />
            <WalletConnect address={address} demo={demo} onConnect={onConnect} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-center text-xs text-slate-600">
        IDIO — Institutional Decentralized Issuance & Offerings · Construido sobre Stellar
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-glow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 20h16M6 20V9m4 11V9m4 11V9m4 11V9M12 3l8 4H4l8-4z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
