/**
 * Perfil operativo del oferente — derivado de la cuenta registrada.
 * Compatibilidad con módulos que usan BankProfile (pujas ZK, sidebar).
 */
import { config } from '../config'
import { getCurrentUser, logOut as accountLogOut, subscribeAccounts } from './accounts'

export interface BankProfile {
  address: string
  name: string
  jurisdiction: string
  membershipIndex: number
  registeredAt: number
}

export function subscribeAuth(listener: () => void): () => void {
  return subscribeAccounts(listener)
}

export function covenantCapacity(): number {
  return config.covenant.secretsCsv.split(',').filter((s: string) => s.trim()).length
}

export function covenantSecretsCsv(): string {
  return config.covenant.secretsCsv
}

export function getProfile(address: string | null): BankProfile | null {
  const user = getCurrentUser()
  if (!user || user.role !== 'oferente') return null
  if (address && user.walletAddress !== address) return null
  if (user.membershipIndex == null) return null
  return {
    address: user.walletAddress,
    name: user.displayName,
    jurisdiction: user.jurisdiction,
    membershipIndex: user.membershipIndex,
    registeredAt: user.createdAt,
  }
}

export function listBanks(): BankProfile[] {
  const p = getProfile(null)
  return p ? [p] : []
}

export function isRegistered(address: string | null): boolean {
  return !!getProfile(address)
}

/** @deprecated Usar accounts.signUp en el flujo de registro. */
export function signUp(_input: unknown): BankProfile {
  throw new Error('Usá el registro con email en /signup/oferente')
}

export function logOut() {
  accountLogOut()
}

export function getSession(): string | null {
  return getCurrentUser()?.walletAddress ?? null
}

export function setSession(_address: string | null) {
  /* sesión manejada por accounts.ts */
}
