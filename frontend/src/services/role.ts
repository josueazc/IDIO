export type Role = 'emisor' | 'oferente'

const KEY = 'idio.role'
const listeners = new Set<() => void>()

export const ROLES: { id: Role; label: string; desc: string; icon: string }[] = [
  {
    id: 'emisor',
    label: 'Emisor',
    desc: 'Publica subastas, audita, cumplimiento y cupos',
    icon: 'EMI',
  },
  {
    id: 'oferente',
    label: 'Oferente',
    desc: 'Banco que oferta en subastas selladas',
    icon: 'OFE',
  },
]

/** El emisor concentra emisión + auditoría + regulación (una sola mesa). */
export const ROLE_ROUTES: Record<Role, string[]> = {
  emisor: ['/', '/account', '/create', '/auctions', '/capacity', '/audit', '/compliance', '/activity'],
  oferente: ['/', '/account', '/auctions', '/activity'],
}

export function getRole(): Role | null {
  const v = localStorage.getItem(KEY)
  if (v === 'emisor' || v === 'oferente') return v
  return null
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
    case 'audit':
    case 'comply':
      return role === 'emisor'
    case 'bid':
    case 'pay':
      return role === 'oferente'
  }
}
