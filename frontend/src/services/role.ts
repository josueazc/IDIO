/**
 * Rol activo del usuario. Cada rol ve y puede hacer cosas distintas; no se
 * puede ejecutar la acción de otro rol desde la vista equivocada.
 */
export type Role = 'emisor' | 'oferente' | 'auditor' | 'regulador'

const KEY = 'idio.role'
const listeners = new Set<() => void>()

export const ROLES: { id: Role; label: string; desc: string; icon: string }[] = [
  { id: 'emisor', label: 'Banco Emisor', desc: 'Crea subastas y prueba reservas', icon: '🏛️' },
  { id: 'oferente', label: 'Banco Oferente', desc: 'Oferta de forma sellada y paga si gana', icon: '🏦' },
  { id: 'auditor', label: 'Auditor', desc: 'Verifica el proceso con view key', icon: '🔍' },
  { id: 'regulador', label: 'Regulador', desc: 'Valida compliance (ASP / FATF)', icon: '🛡️' },
]

/** Rutas permitidas por rol. */
export const ROLE_ROUTES: Record<Role, string[]> = {
  emisor: ['/', '/create', '/auctions'],
  oferente: ['/', '/auctions'],
  auditor: ['/', '/audit'],
  regulador: ['/', '/compliance'],
}

export function getRole(): Role | null {
  return (localStorage.getItem(KEY) as Role) || null
}
export function setRole(r: Role | null) {
  if (r) localStorage.setItem(KEY, r)
  else localStorage.removeItem(KEY)
  listeners.forEach((l) => l())
}
export function subscribeRole(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function can(role: Role | null, action: 'create' | 'bid' | 'settle' | 'pay' | 'audit' | 'comply'): boolean {
  switch (action) {
    case 'create':
      return role === 'emisor'
    case 'settle':
      return role === 'emisor'
    case 'bid':
      return role === 'oferente'
    case 'pay':
      return role === 'oferente'
    case 'audit':
      return role === 'auditor'
    case 'comply':
      return role === 'regulador'
  }
}
