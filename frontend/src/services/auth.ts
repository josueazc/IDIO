/**
 * Registro y sesión de bancos — SIN backend.
 *
 * El "sign up" no crea cuentas en un servidor: la identidad es la wallet
 * Stellar del banco. Este módulo solo guarda, en `localStorage`, el perfil
 * asociado a esa dirección (nombre, índice de membresía Covenant, etc.) y la
 * sesión activa. El "log in" es reconectar la wallet: si la dirección ya tiene
 * perfil, queda logueada; si no, se le ofrece registrarse.
 *
 * El índice de membresía apunta a una posición del set de secretos del Covenant
 * (`config.covenant.secretsCsv`), que permite generar la prueba ZK de
 * pertenencia al ofertar.
 */
import { config } from '../config'

export interface BankProfile {
  address: string
  name: string
  /** País/jurisdicción declarada (informativo). */
  jurisdiction: string
  /** Índice del banco en el árbol de miembros del Covenant. */
  membershipIndex: number
  registeredAt: number
}

const BANKS_KEY = 'idio.banks'
const SESSION_KEY = 'idio.session'

const listeners = new Set<() => void>()
export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function emit() {
  listeners.forEach((l) => l())
}

function readAll(): Record<string, BankProfile> {
  try {
    return JSON.parse(localStorage.getItem(BANKS_KEY) || '{}')
  } catch {
    return {}
  }
}
function writeAll(all: Record<string, BankProfile>) {
  localStorage.setItem(BANKS_KEY, JSON.stringify(all))
  emit()
}

/** Cantidad máxima de miembros que admite el set del Covenant. */
export function covenantCapacity(): number {
  return config.covenant.secretsCsv.split(',').filter((s: string) => s.trim()).length
}

export function covenantSecretsCsv(): string {
  return config.covenant.secretsCsv
}

export function listBanks(): BankProfile[] {
  return Object.values(readAll()).sort((a, b) => a.membershipIndex - b.membershipIndex)
}

export function getProfile(address: string | null): BankProfile | null {
  if (!address) return null
  return readAll()[address] ?? null
}

export function isRegistered(address: string | null): boolean {
  return !!getProfile(address)
}

/**
 * Registra un banco (sign up). Le asigna el siguiente índice de membresía libre.
 * Idempotente: si ya existe, actualiza nombre/jurisdicción y conserva el índice.
 */
export function signUp(input: { address: string; name: string; jurisdiction?: string }): BankProfile {
  const all = readAll()
  const existing = all[input.address]
  if (existing) {
    existing.name = input.name || existing.name
    existing.jurisdiction = input.jurisdiction ?? existing.jurisdiction
    writeAll(all)
    setSession(input.address)
    return existing
  }
  const usedIndices = new Set(Object.values(all).map((b) => b.membershipIndex))
  let index = 0
  while (usedIndices.has(index)) index++
  if (index >= covenantCapacity()) {
    throw new Error(
      `El set de miembros del Covenant está completo (${covenantCapacity()} bancos).`
    )
  }
  const profile: BankProfile = {
    address: input.address,
    name: input.name,
    jurisdiction: input.jurisdiction ?? '',
    membershipIndex: index,
    registeredAt: Date.now(),
  }
  all[input.address] = profile
  writeAll(all)
  setSession(input.address)
  return profile
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY)
}
export function setSession(address: string | null) {
  if (address) localStorage.setItem(SESSION_KEY, address)
  else localStorage.removeItem(SESSION_KEY)
  emit()
}
export function logOut() {
  setSession(null)
}
