import { useEffect, useState } from 'react'
import { getCurrentUser, subscribeAccounts, setCurrentUser } from '../services/accounts'
import { supabase } from '../services/supabase'
import type { Profile } from '../services/supabase'

function profileToAccount(p: Profile) {
  return {
    id: p.id,
    email: p.email,
    role: p.role as 'emisor' | 'oferente',
    walletAddress: p.wallet_address,
    displayName: p.display_name,
    jurisdiction: p.jurisdiction,
    membershipIndex: p.membership_index ?? undefined,
    createdAt: new Date(p.created_at).getTime(),
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    // Escuchar cambios internos (localStorage fallback)
    const unsub = subscribeAccounts(() => setUser(getCurrentUser()))

    // Escuchar cambios de sesión de Supabase (login/logout desde otra pestaña)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null)
          setUser(null)
          return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            const account = profileToAccount(profile as Profile)
            setCurrentUser(account)
            setUser(account)
          }
        }
      })
      return () => {
        unsub()
        subscription.unsubscribe()
      }
    }

    return unsub
  }, [])

  return user
}
