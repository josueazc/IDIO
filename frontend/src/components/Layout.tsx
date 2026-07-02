import { NavLink, useLocation } from 'react-router-dom'
import type { CSSProperties, MutableRefObject, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import WalletConnect from './WalletConnect'
import ModeToggle from './ModeToggle'
import BrandLogo from './BrandLogo'
import { useRole } from '../utils/useRole'
import { ROLES, ROLE_ROUTES, type Role } from '../services/role'
import { getProfile, subscribeAuth } from '../services/auth'
import type { UserAccount } from '../services/accounts'

interface Props {
  children: ReactNode
  address: string | null
  demo: boolean
  user: UserAccount
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
  onLogout: () => void
}

const LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/account': 'Mi cuenta',
  '/auctions': 'Subastas',
  '/create': 'Nueva emisión',
  '/capacity': 'Cupos',
  '/audit': 'Auditoría',
  '/compliance': 'Cumplimiento',
  '/activity': 'Actividad',
}

const NAV_ICONS: Record<string, ReactNode> = {
  '/': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 6.5L7.5 1.5L13.5 6.5V13H9.5V9.5H5.5V13H1.5V6.5Z"/>
    </svg>
  ),
  '/auctions': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="3" width="12" height="9" rx="1.5"/>
      <path d="M1.5 6h12"/>
      <path d="M5.5 6v6"/>
    </svg>
  ),
  '/create': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7.5" cy="7.5" r="6"/>
      <path d="M7.5 4.5v6M4.5 7.5h6"/>
    </svg>
  ),
  '/capacity': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1.5 11.5a6 6 0 0112 0"/>
      <circle cx="7.5" cy="6" r="2.5"/>
    </svg>
  ),
  '/audit': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2.5h9a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1v-8a1 1 0 011-1z"/>
      <path d="M5 6h5M5 8.5h3"/>
    </svg>
  ),
  '/compliance': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7.5 1.5L13 4v4c0 3.5-2.5 5.5-5.5 6C4.5 13.5 2 11.5 2 8V4l5.5-2.5z"/>
      <path d="M5 7.5l2 2 3.5-3.5"/>
    </svg>
  ),
  '/activity': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1.5,9 4.5,5 7.5,7.5 10.5,3 13.5,6"/>
    </svg>
  ),
  '/account': (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7.5" cy="5" r="2.5"/>
      <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
    </svg>
  ),
}

export default function Layout({ children, address, demo, user, onConnect, onDisconnect, onLogout }: Props) {
  const role = useRole()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  const nav = useMemo(
    () => (role ? ROLE_ROUTES[role].map((to) => ({ to, label: LABELS[to], end: to === '/' })) : []),
    [role]
  )

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="min-h-screen" style={{ color: 'var(--text)' }}>
      <MobileHeader open={open} setOpen={setOpen} buttonRef={menuButtonRef} user={user} role={role} />

      <div className="layout-grid min-h-screen">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto lg:block">
          <SidebarContent
            address={address} demo={demo} nav={nav} role={role} user={user}
            onConnect={onConnect} onDisconnect={onDisconnect} onLogout={onLogout}
          />
        </aside>

        <main className="min-w-0 px-5 pb-16 pt-[4.5rem] lg:px-10 lg:pb-20 lg:pt-10">
          <div key={location.pathname} className="page-surface mx-auto max-w-[1140px]">
            {children}
          </div>
        </main>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className="mobile-sidebar fixed inset-y-0 left-0 z-50 overflow-y-auto border-r border-edge bg-surface lg:hidden"
        data-open={open}
        aria-hidden={!open}
      >
        <SidebarContent
          address={address} demo={demo} nav={nav} role={role} user={user}
          mobile menuOpen={open}
          onConnect={onConnect} onDisconnect={onDisconnect} onLogout={onLogout}
        />
      </aside>
    </div>
  )
}

function MobileHeader({
  open, setOpen, buttonRef, user,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  buttonRef: MutableRefObject<HTMLButtonElement | null>
  user: UserAccount
  role: Role | null
}) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-edge lg:hidden"
      style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex h-[4rem] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <BrandLogo compact />
          <div className="h-4 w-px" style={{ background: 'var(--line-strong)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            {user.displayName}
          </span>
        </div>
        <button
          ref={buttonRef}
          className="menu-button shrink-0"
          data-open={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
      style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-line)' }}
    >
      {initial}
    </div>
  )
}

function SidebarContent({
  address, demo, nav, role, user,
  mobile = false, menuOpen = true,
  onConnect, onDisconnect, onLogout,
}: {
  address: string | null
  demo: boolean
  nav: { to: string; label: string; end: boolean }[]
  role: Role | null
  user: UserAccount
  mobile?: boolean
  menuOpen?: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
  onLogout: () => void
}) {
  const roleInfo = ROLES.find((r) => r.id === role)
  const [profile, setProfile] = useState(() => getProfile(address))
  useEffect(() => {
    setProfile(getProfile(address))
    return subscribeAuth(() => setProfile(getProfile(address)))
  }, [address])

  const itemStyle = (i: number): CSSProperties | undefined =>
    mobile ? {
      opacity: menuOpen ? 1 : 0,
      transform: menuOpen ? 'none' : 'translateX(12px)',
      transition: 'opacity 200ms, transform 200ms',
      transitionDelay: menuOpen ? `${i * 35}ms` : '0ms',
    } : undefined

  return (
    <div className="sidebar-shell">
      {/* Logo */}
      <div style={itemStyle(0)}>
        <BrandLogo />
      </div>

      {/* User card */}
      <div
        className="mt-6 rounded-xl border border-edge p-3.5"
        style={{ background: 'var(--raised)', ...itemStyle(1) }}
      >
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user.displayName} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user.displayName}</div>
            <div className="truncate text-xs" style={{ color: 'var(--text-3)' }}>{user.email}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="pill" style={{ color: 'var(--text-2)' }}>
            {roleInfo?.label ?? user.role}
          </span>
          {user.jurisdiction && (
            <span className="pill" style={{ color: 'var(--text-3)' }}>
              {user.jurisdiction}
            </span>
          )}
          {profile && (
            <span
              className="pill"
              style={{ borderColor: 'var(--brand-line)', color: 'var(--brand)', background: 'var(--brand-dim)' }}
            >
              #{profile.membershipIndex + 1}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-6 space-y-0.5" style={itemStyle(2)}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <span className="shrink-0 opacity-60">{NAV_ICONS[item.to]}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="mt-auto space-y-4 border-t border-edge pt-5"
        style={itemStyle(3)}
      >
        <div>
          <div className="mb-2 px-1 micro-label">Red</div>
          <ModeToggle stacked />
        </div>
        <div>
          <div className="mb-2 px-1 micro-label">Wallet Stellar</div>
          <WalletConnect address={address} demo={demo} compact onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
        <button type="button" className="btn-danger btn-sm w-full" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
