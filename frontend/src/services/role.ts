export type Role = 'emisor' | 'oferente' | 'auditor' | 'regulador'

const KEY = 'idio.role'
const listeners = new Set<() => void>()

export const ROLES: { id: Role; label: string; desc: string; icon: string }[] = [
  { id: 'emisor', label: 'Issuer', desc: 'Creates auctions and proves reserves', icon: 'ISS' },
  { id: 'oferente', label: 'Bidder', desc: 'Submits sealed bids and pays if selected', icon: 'BID' },
  { id: 'auditor', label: 'Auditor', desc: 'Verifies the process with a view key', icon: 'AUD' },
  { id: 'regulador', label: 'Regulator', desc: 'Validates compliance and participant state', icon: 'REG' },
]

export const ROLE_ROUTES: Record<Role, string[]> = {
  emisor: ['/', '/roles', '/create', '/auctions'],
  oferente: ['/', '/roles', '/auctions'],
  auditor: ['/', '/roles', '/audit'],
  regulador: ['/', '/roles', '/compliance'],
}

export function getRole(): Role | null {
  return (localStorage.getItem(KEY) as Role) || null
}

export function setRole(role: Role | null) {
  if (role) localStorage.setItem(KEY, role)
  else localStorage.removeItem(KEY)
  listeners.forEach((listener) => listener())
}

export function subscribeRole(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function can(
  role: Role | null,
  action: 'create' | 'bid' | 'settle' | 'pay' | 'audit' | 'comply'
): boolean {
  switch (action) {
    case 'create':
    case 'settle':
      return role === 'emisor'
    case 'bid':
    case 'pay':
      return role === 'oferente'
    case 'audit':
      return role === 'auditor'
    case 'comply':
      return role === 'regulador'
  }
}
