import { useEffect, useState } from 'react'
import { getCurrentUser, subscribeAccounts } from '../services/accounts'

export function useCurrentUser() {
  const [user, setUser] = useState(() => getCurrentUser())
  useEffect(() => subscribeAccounts(() => setUser(getCurrentUser())), [])
  return user
}
