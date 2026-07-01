import type { Role } from '../services/role'

export function roleHome(role: Role): string {
  return role === 'emisor' ? '/create' : '/auctions'
}
