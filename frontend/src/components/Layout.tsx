import { NavLink, useLocation } from 'react-router-dom'
import type { CSSProperties, MutableRefObject, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import WalletConnect from './WalletConnect'
import ModeToggle from './ModeToggle'
import BrandLogo from './BrandLogo'
import { useRole } from '../utils/useRole'
import { ROLES, ROLE_ROUTES, setRole, type Role } from '../services/role'

interface Props {
  children: ReactNode
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

const LABELS: Record<string, string> = {
  '/': 'Protocol overview',
  '/roles': 'Authority switch',
  '/auctions': 'Auction registry',
  '/create': 'Issue auction',
  '/audit': 'Audit desk',
  '/compliance': 'Compliance desk',
}

export default function Layout({ children, address, demo, onConnect, onDisconnect }: Props) {
  const role = useRole()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  const nav = useMemo(
    () => (role ? ROLE_ROUTES[role].map((to, i) => ({ to, label: LABELS[to], end: to === '/', index: i + 1 })) : []),
    [role]
  )

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

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
    <div className="min-h-screen bg-ink text-slate-100">
      <MobileHeader open={open} setOpen={setOpen} buttonRef={menuButtonRef} role={role} />

      <div className="layout-grid min-h-screen">
        <aside className="sticky top-0 hidden h-screen border-r border-edge bg-[#080a08] lg:block">
          <SidebarContent
            address={address}
            demo={demo}
            nav={nav}
            role={role}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </aside>

        <main className="min-w-0 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-10">
          <div key={location.pathname} className="page-surface mx-auto max-w-[1320px]">
            {children}
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`mobile-sidebar fixed inset-y-0 left-0 z-50 overflow-y-auto border-r border-edge bg-[#080a08] lg:hidden ${
          open ? 'is-open translate-x-0' : '-translate-x-full'
        }`}
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
        data-open={open}
        aria-hidden={!open}
      >
        <SidebarContent
          address={address}
          demo={demo}
          nav={nav}
          role={role}
          mobile
          menuOpen={open}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </aside>
    </div>
  )
}

function MobileHeader({
  open,
  setOpen,
  buttonRef,
  role,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  buttonRef: MutableRefObject<HTMLButtonElement | null>
  role: Role | null
}) {
  const roleInfo = ROLES.find((r) => r.id === role)
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-edge bg-[#080a08] lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <BrandLogo compact />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {roleInfo?.label ?? 'Demo console'}
            </div>
          </div>
        </div>
        <button
          ref={buttonRef}
          className="menu-button grid h-11 w-11 place-items-center gap-[5px] border border-edge bg-white/[0.03]"
          data-open={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
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

function SidebarContent({
  address,
  demo,
  nav,
  role,
  mobile = false,
  menuOpen = true,
  onConnect,
  onDisconnect,
}: {
  address: string | null
  demo: boolean
  nav: { to: string; label: string; end: boolean; index: number }[]
  role: Role | null
  mobile?: boolean
  menuOpen?: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}) {
  const roleInfo = ROLES.find((r) => r.id === role)
  const menuItemStyle = (index: number): CSSProperties | undefined =>
    mobile
      ? {
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateX(0)' : 'translateX(24px)',
          transitionDelay: menuOpen ? `${40 + index * 30}ms` : '0ms',
        }
      : undefined

  return (
    <div className="flex min-h-full flex-col px-5 py-6">
      <div className="flex items-center gap-3" data-menu-item style={menuItemStyle(0)}>
        <BrandLogo />
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Private auctions</div>
        </div>
      </div>

      <div className="mt-8 border border-edge bg-white/[0.02] p-4" data-menu-item style={menuItemStyle(1)}>
        <div className="micro-label">Active authority</div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-white">{roleInfo?.label ?? 'No role selected'}</div>
            <div className="mt-1 text-xs text-slate-500">{roleInfo?.desc ?? 'Choose an operating desk.'}</div>
          </div>
          {role && (
            <NavLink
              className="text-xs font-semibold text-brand transition duration-200 ease-out hover:translate-x-0.5 hover:text-brand-soft"
              to="/roles"
            >
              Switch
            </NavLink>
          )}
        </div>
      </div>

      <nav className="mt-8 space-y-1" data-menu-item style={menuItemStyle(2)}>
        {nav.length > 0 ? (
          nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-3 px-3 text-sm transition duration-200 ease-out hover:translate-x-1 ${
                  isActive ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-6 font-mono text-[11px] ${isActive ? 'text-brand' : 'text-white'}`}>
                    {String(item.index).padStart(2, '0')}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))
        ) : (
          <div className="space-y-2">
            {ROLES.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setRole(item.id)}
                className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm text-slate-400 transition duration-200 ease-out hover:translate-x-1 hover:bg-white/[0.03] hover:text-white"
              >
                <span className="w-6 font-mono text-[11px] text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto space-y-4 border-t border-edge pt-5" data-menu-item style={menuItemStyle(3)}>
        <div>
          <div className="micro-label mb-2">Execution environment</div>
          <ModeToggle stacked={mobile} />
        </div>
        <div>
          <div className="micro-label mb-2">Wallet</div>
          <WalletConnect
            address={address}
            demo={demo}
            compact
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>
    </div>
  )
}
