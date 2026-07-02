import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { User } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'users.json')

function ensureDir() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
}

export function readUsers(): User[] {
  ensureDir()
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as User[]
  } catch {
    return []
  }
}

export function writeUsers(users: User[]): void {
  ensureDir()
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8')
}

export function findByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id)
}

export function upsertUser(user: User): void {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) {
    users[index] = user
  } else {
    users.push(user)
  }
  writeUsers(users)
}
