import { useEffect, useState } from 'react'
import { getRole, subscribeRole, type Role } from '../services/role'

export function useRole(): Role | null {
  const [role, setRole] = useState<Role | null>(() => getRole())
  useEffect(() => subscribeRole(() => setRole(getRole())), [])
  return role
}
