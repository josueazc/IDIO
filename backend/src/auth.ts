import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findByEmail, findById, upsertUser } from './db.js'
import type { SessionUser } from './types.js'

const SALT_ROUNDS = 10
const router = Router()

function toSession(u: ReturnType<typeof findById>): SessionUser | null {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    walletAddress: u.walletAddress,
    displayName: u.displayName,
    jurisdiction: u.jurisdiction,
    membershipIndex: u.membershipIndex,
    createdAt: u.createdAt,
  }
}

router.post('/register', async (req, res) => {
  const { email, password, role, walletAddress, displayName, jurisdiction, membershipIndex } = req.body as Record<string, string>

  if (!email || !password || !role || !walletAddress || !displayName || !jurisdiction) {
    res.status(400).json({ error: 'Faltan campos requeridos' })
    return
  }
  if (!['emisor', 'oferente'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' })
    return
  }
  if (findByEmail(email)) {
    res.status(409).json({ error: 'Email ya registrado' })
    return
  }

  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  upsertUser({
    id,
    email,
    passwordHash,
    role: role as 'emisor' | 'oferente',
    walletAddress,
    displayName,
    jurisdiction,
    membershipIndex: membershipIndex ? Number(membershipIndex) : undefined,
    createdAt: Date.now(),
  })

  req.session.userId = id
  res.status(201).json(toSession(findById(id)))
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body as Record<string, string>
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' })
    return
  }
  const user = findByEmail(email)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }
  req.session.userId = user.id
  res.json(toSession(user))
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

router.get('/me', (req, res) => {
  const user = req.session.userId ? findById(req.session.userId) : null
  if (!user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }
  res.json(toSession(user))
})

export default router
