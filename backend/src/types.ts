export type AccountRole = 'emisor' | 'oferente'

export interface User {
  id: string
  email: string
  passwordHash: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction: string
  membershipIndex?: number
  createdAt: number
}

export interface SessionUser {
  id: string
  email: string
  role: AccountRole
  walletAddress: string
  displayName: string
  jurisdiction: string
  membershipIndex?: number
  createdAt: number
}

declare module 'express-session' {
  interface SessionData {
    userId: string
  }
}
