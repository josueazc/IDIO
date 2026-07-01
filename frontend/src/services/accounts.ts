/**
 * Cuentas de usuario (demo) — persistencia en localStorage, sin servidor real.
 * Cualquier email/contraseña válidos en el alta; el rol queda fijado al registrarse.
 */
import { config } from '../config'
import { setRole, type Role } from './role'

export type AccountRole = 'emisor' | 'oferente'

export interface UserAccount {
  id: string
  email: string
  /** Demo: se guarda en claro. No usar en producción. */
  password: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction: string
  /** Solo oferentes: índice en el árbol Covenant. */
  membershipIndex?: number
  createdAt: number
}

const USERS_KEY = 'idio.users'
const SESSION_KEY = 'idio.userSession'

const listeners = new Set<() => void>()
export function subscribeAccounts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function emit() {
  listeners.forEach((l) => l())
}

function readAll(): Record<string, UserAccount> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}
function writeAll(all: Record<string, UserAccount>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(all))
  emit()
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function covenantCapacity(): number {
  return config.covenant.secretsCsv.split(',').filter((s: string) => s.trim()).length
}

function nextMembershipIndex(all: Record<string, UserAccount>): number {
  const used = new Set(
    Object.values(all)
      .filter((u) => u.role === 'oferente' && u.membershipIndex != null)
      .map((u) => u.membershipIndex as number)
  )
  let index = 0
  while (used.has(index)) index++
  if (index >= covenantCapacity()) {
    throw new Error(`El set Covenant está completo (${covenantCapacity()} bancos).`)
  }
  return index
}

export function getCurrentUser(): UserAccount | null {
  const email = localStorage.getItem(SESSION_KEY)
  if (!email) return null
  return readAll()[email] ?? null
}

export function signUp(input: {
  email: string
  password: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction?: string
}): UserAccount {
  const email = normalizeEmail(input.email)
  if (!email.includes('@')) throw new Error('Ingresá un email válido.')
  if (!input.password.trim()) throw new Error('Ingresá una contraseña.')
  if (!input.walletAddress) throw new Error('Conectá tu wallet Stellar.')
  if (input.displayName.trim().length < 2) throw new Error('Ingresá el nombre (mínimo 2 caracteres).')

  const all = readAll()
  if (all[email]) throw new Error('Ese email ya está registrado. Iniciá sesión.')

  const walletTaken = Object.values(all).some(
    (u) => u.walletAddress === input.walletAddress && u.role === input.role
  )
  if (walletTaken) {
    throw new Error('Esta wallet ya tiene una cuenta de ese tipo.')
  }

  const account: UserAccount = {
    id: crypto.randomUUID(),
    email,
    password: input.password,
    role: input.role,
    walletAddress: input.walletAddress,
    displayName: input.displayName.trim(),
    jurisdiction: input.jurisdiction?.trim() ?? '',
    createdAt: Date.now(),
  }

  if (input.role === 'oferente') {
    account.membershipIndex = nextMembershipIndex(all)
  }

  all[email] = account
  writeAll(all)
  startSession(account)
  return account
}

export function logIn(email: string, password: string): UserAccount {
  const key = normalizeEmail(email)
  const account = readAll()[key]
  if (!account) throw new Error('No hay cuenta con ese email. Registrate primero.')
  if (account.password !== password) throw new Error('Contraseña incorrecta.')
  startSession(account)
  return account
}

function startSession(account: UserAccount) {
  localStorage.setItem(SESSION_KEY, account.email)
  setRole(account.role as Role)
  emit()
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY)
  setRole(null)
  emit()
}

export function accountLabel(role: AccountRole): string {
  return role === 'emisor' ? 'Emisor' : 'Oferente (banco)'
}

export function accountDescription(role: AccountRole): string {
  if (role === 'emisor') {
    return 'Publica subastas, asigna cupos, audita resultados y gestiona cumplimiento.'
  }
  return 'Participa en subastas selladas con tu wallet y pruebas ZK.'
}
