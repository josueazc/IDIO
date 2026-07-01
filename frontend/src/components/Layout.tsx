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
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="min-h-screen text-zinc-100">
      <MobileHeader open={open} setOpen={setOpen} buttonRef={menuButtonRef} user={user} role={role} />

      <div className="layout-grid min-h-screen">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto lg:block">
          <SidebarContent
            address={address}
            demo={demo}
            nav={nav}
            role={role}
            user={user}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onLogout={onLogout}
          />
        </aside>

        <main className="min-w-0 px-4 pb-16 pt-[4.75rem] sm:px-8 lg:px-12 lg:pb-20 lg:pt-12">
          <div key={location.pathname} className="page-surface mx-auto max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`mobile-sidebar fixed inset-y-0 left-0 z-50 overflow-y-auto border-r border-edge bg-surface lg:hidden ${
          open ? 'is-open' : ''
        }`}
        data-open={open}
        aria-hidden={!open}
      >
        <SidebarContent
          address={address}
          demo={demo}
          nav={nav}
          role={role}
          user={user}
          mobile
          menuOpen={open}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onLogout={onLogout}
        />
      </aside>
    </div>
  )
}

function MobileHeader({
  open,
  setOpen,
  buttonRef,
  user,
  role,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  buttonRef: MutableRefObject<HTMLButtonElement | null>
  user: UserAccount
  role: Role | null
}) {
  const roleInfo = ROLES.find((r) => r.id === role)
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-edge bg-surface/90 backdrop-blur-md lg:hidden">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo compact />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{user.displayName}</div>
            <div className="truncate text-xs text-zinc-500">{roleInfo?.label ?? user.role}</div>
          </div>
        </div>
        <button
          ref={buttonRef}
          className="menu-button shrink-0"
          data-open={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 font-display text-lg text-brand">
      {initial}
    </div>
  )
}

function SidebarContent({
  address,
  demo,
  nav,
  role,
  user,
  mobile = false,
  menuOpen = true,
  onConnect,
  onDisconnect,
  onLogout,
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

  const menuItemStyle = (index: number): CSSProperties | undefined =>
    mobile
      ? {
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateX(0)' : 'translateX(16px)',
          transitionDelay: menuOpen ? `${30 + index * 40}ms` : '0ms',
        }
      : undefined

  return (
    <div className="sidebar-shell">
      <div className="flex items-center gap-3" data-menu-item style={menuItemStyle(0)}>
        <BrandLogo />
      </div>

      <div className="mt-10 rounded-2xl border border-edge bg-raised/80 p-4" data-menu-item style={menuItemStyle(1)}>
        <div className="flex items-start gap-3">
          <UserAvatar name={user.displayName} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-white">{user.displayName}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{roleInfo?.label ?? user.role}</div>
            <div className="mt-1 truncate text-xs text-zinc-600">{user.email}</div>
          </div>
        </div>
        {profile && (
          <div className="mt-3 inline-flex rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand">
            Covenant #{profile.membershipIndex + 1}
          </div>
        )}
        <NavLink className="mt-4 inline-block text-xs font-semibold text-brand hover:text-brand-soft" to="/account">
          Ver perfil →
        </NavLink>
      </div>

      <nav className="mt-8 space-y-1" data-menu-item style={menuItemStyle(2)}>
        <div className="mb-3 px-3 micro-label">Menú</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-5 border-t border-edge pt-6" data-menu-item style={menuItemStyle(3)}>
        <div>
          <div className="mb-2.5 px-1 micro-label">Red</div>
          <ModeToggle stacked={mobile} />
        </div>
        <div>
          <div className="mb-2.5 px-1 micro-label">Wallet</div>
          <WalletConnect address={address} demo={demo} compact onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
        <button type="button" className="btn-ghost btn-sm w-full" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
