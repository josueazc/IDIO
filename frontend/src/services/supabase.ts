import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('[IDIO] Supabase no configurado — usando modo localStorage demo.')
}

export const supabase = (url && key) ? createClient(url, key) : null

export type Profile = {
  id: string
  email: string
  role: 'emisor' | 'oferente'
  wallet_address: string
  display_name: string
  jurisdiction: string
  membership_index: number | null
  created_at: string
}
