/**
 * Cuentas de usuario.
 * - Si Supabase está configurado (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY):
 *   usa Supabase Auth + tabla `profiles` (real, multi-dispositivo).
 * - Si no está configurado: fallback a localStorage demo (como antes).
 */
import { supabase } from './supabase'
import type { Profile } from './supabase'
import { setRole, type Role } from './role'
import { config } from '../config'

export type AccountRole = 'emisor' | 'oferente'

export interface UserAccount {
  id: string
  email: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction: string
  membershipIndex?: number
  createdAt: number
}

// ─── localStorage fallback (demo sin Supabase) ───────────────────────────────

const USERS_KEY = 'idio.users'
const SESSION_KEY = 'idio.userSession'

const listeners = new Set<() => void>()
export function subscribeAccounts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function emit() { listeners.forEach((l) => l()) }

function readAll(): Record<string, UserAccount> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} }
}
function writeAll(all: Record<string, UserAccount>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(all))
  emit()
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
  if (index >= covenantCapacity()) throw new Error(`Set Covenant completo (${covenantCapacity()} bancos).`)
  return index
}

function profileToAccount(p: Profile): UserAccount {
  return {
    id: p.id,
    email: p.email,
    role: p.role,
    walletAddress: p.wallet_address,
    displayName: p.display_name,
    jurisdiction: p.jurisdiction,
    membershipIndex: p.membership_index ?? undefined,
    createdAt: new Date(p.created_at).getTime(),
  }
}

// ─── Sesión en memoria (para Supabase mode) ──────────────────────────────────

let _currentUser: UserAccount | null = null

export function getCurrentUser(): UserAccount | null {
  if (supabase) return _currentUser
  const email = localStorage.getItem(SESSION_KEY)
  if (!email) return null
  return readAll()[email] ?? null
}

export function setCurrentUser(u: UserAccount | null) {
  _currentUser = u
  if (u) setRole(u.role as Role)
  else setRole(null)
  emit()
}

// ─── Registro ────────────────────────────────────────────────────────────────

export async function signUp(input: {
  email: string
  password: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction?: string
}): Promise<UserAccount> {
  if (!input.email.includes('@')) throw new Error('Ingresá un email válido.')
  if (input.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
  if (!input.walletAddress) throw new Error('Conectá tu wallet Stellar.')
  if (input.displayName.trim().length < 2) throw new Error('Nombre demasiado corto.')

  // ── Supabase ──
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    })
    if (error) throw new Error(translateSupabaseError(error.message))
    const userId = data.user?.id
    if (!userId) throw new Error('No se pudo crear el usuario.')

    // Calcular membership index (usamos localStorage temporal para calcular)
    const all = readAll()
    const membershipIndex = input.role === 'oferente' ? nextMembershipIndex(all) : undefined

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      wallet_address: input.walletAddress,
      display_name: input.displayName.trim(),
      jurisdiction: input.jurisdiction?.trim() ?? '',
      membership_index: membershipIndex ?? null,
    })
    if (profileError) throw new Error('Error al guardar el perfil: ' + profileError.message)

    const account: UserAccount = {
      id: userId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      walletAddress: input.walletAddress,
      displayName: input.displayName.trim(),
      jurisdiction: input.jurisdiction?.trim() ?? '',
      membershipIndex,
      createdAt: Date.now(),
    }
    setCurrentUser(account)
    return account
  }

  // ── Fallback localStorage ──
  const email = input.email.trim().toLowerCase()
  const all = readAll()
  if (all[email]) throw new Error('Ese email ya está registrado.')

  const membershipIndex = input.role === 'oferente' ? nextMembershipIndex(all) : undefined
  const account: UserAccount = {
    id: crypto.randomUUID(),
    email,
    role: input.role,
    walletAddress: input.walletAddress,
    displayName: input.displayName.trim(),
    jurisdiction: input.jurisdiction?.trim() ?? '',
    membershipIndex,
    createdAt: Date.now(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all[email] = { ...account, password: input.password } as any
  writeAll(all)
  localStorage.setItem(SESSION_KEY, email)
  setRole(account.role as Role)
  emit()
  return account
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function logIn(email: string, password: string): Promise<UserAccount> {
  // ── Supabase ──
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw new Error(translateSupabaseError(error.message))
    const userId = data.user?.id
    if (!userId) throw new Error('Error de autenticación.')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) throw new Error('No se encontró el perfil del usuario.')

    const account = profileToAccount(profile as Profile)
    setCurrentUser(account)
    return account
  }

  // ── Fallback localStorage ──
  const key = email.trim().toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stored = readAll()[key] as any
  if (!stored) throw new Error('No hay cuenta con ese email.')
  if (stored.password !== password) throw new Error('Contraseña incorrecta.')
  const account: UserAccount = {
    id: stored.id,
    email: stored.email,
    role: stored.role,
    walletAddress: stored.walletAddress,
    displayName: stored.displayName,
    jurisdiction: stored.jurisdiction,
    membershipIndex: stored.membershipIndex,
    createdAt: stored.createdAt,
  }
  localStorage.setItem(SESSION_KEY, key)
  setRole(account.role as Role)
  emit()
  return account
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
  setCurrentUser(null)
  localStorage.removeItem(SESSION_KEY)
  setRole(null)
  emit()
}

// ─── Restaurar sesión al recargar la página ──────────────────────────────────

export async function restoreSession(): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!userId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profile) setCurrentUser(profileToAccount(profile as Profile))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function accountLabel(role: AccountRole): string {
  return role === 'emisor' ? 'Emisor' : 'Oferente (banco)'
}

export function accountDescription(role: AccountRole): string {
  if (role === 'emisor') return 'Publica subastas, asigna cupos, audita resultados y gestiona cumplimiento.'
  return 'Participa en subastas selladas con tu wallet y pruebas ZK.'
}

function translateSupabaseError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Ese email ya está registrado. Iniciá sesión.'
  if (msg.includes('Invalid login credentials'))
    return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed'))
    return 'Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.'
  if (msg.includes('Password should be'))
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate email'))
    return 'Email inválido.'
  if (msg.includes('rate limit'))
    return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}
