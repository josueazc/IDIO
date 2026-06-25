import type { Role } from '../services/role'

export function roleHome(role: Role): string {
  switch (role) {
    case 'emisor':
      return '/create'
    case 'oferente':
      return '/auctions'
    case 'auditor':
      return '/audit'
    case 'regulador':
      return '/compliance'
  }
}
