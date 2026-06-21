/**
 * Integración con Freighter.
 *
 * Si la extensión está disponible, se usa de verdad. Si no (entorno de
 * demo / preview), se genera una dirección simulada para que el flujo
 * completo sea navegable sin instalar nada.
 */

const DEMO_KEY = 'idio.demoAddress'

function randomStellarAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let body = ''
  for (let i = 0; i < 55; i++) body += chars[Math.floor(Math.random() * chars.length)]
  return 'G' + body.slice(1)
}

export async function connectWallet(): Promise<{ address: string; demo: boolean }> {
  try {
    const freighter = await import('@stellar/freighter-api')
    const connected = await freighter.isConnected()
    if (connected?.isConnected) {
      const access = await freighter.requestAccess()
      if (access?.address) return { address: access.address, demo: false }
    }
  } catch {
    // Freighter no disponible — caemos a modo demo.
  }
  let addr = localStorage.getItem(DEMO_KEY)
  if (!addr) {
    addr = randomStellarAddress()
    localStorage.setItem(DEMO_KEY, addr)
  }
  return { address: addr, demo: true }
}

export function shortAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}
