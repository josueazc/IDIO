import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { KitEventType, Networks } from '@creit.tech/stellar-wallets-kit/types'
import { config } from '../config'

const DEMO_KEY = 'idio.demoAddress'
const WALLET_KEY = 'idio.walletAddress'

let initialized = false

function networkFromPassphrase(): Networks {
  switch (config.networkPassphrase) {
    case Networks.PUBLIC:
      return Networks.PUBLIC
    case Networks.FUTURENET:
      return Networks.FUTURENET
    case Networks.SANDBOX:
      return Networks.SANDBOX
    case Networks.STANDALONE:
      return Networks.STANDALONE
    default:
      return Networks.TESTNET
  }
}

export function ensureWalletKit() {
  if (initialized) return
  const modules = defaultModules().map((module) => {
    module.productIcon = localWalletIcon(module.productId) ?? module.productIcon
    return module
  })

  StellarWalletsKit.init({
    modules,
    network: networkFromPassphrase(),
    authModal: {
      hideUnsupportedWallets: false,
      showInstallLabel: true,
    },
  })
  initialized = true
}

function localWalletIcon(productId: string): string | null {
  const normalized = productId.toLowerCase()
  const file = WALLET_ICON_FILES[normalized]
  return file ? `/wallet-icons/${file}` : null
}

const WALLET_ICON_FILES: Record<string, string> = {
  albedo: 'albedo.png',
  xbull: 'xbull.png',
  freighter: 'freighter.png',
  fordefi: 'fordefi.png',
  rabet: 'rabet.png',
  lobstr: 'lobstr.png',
  hana: 'hana.png',
  klever: 'klever.png',
  ledger: 'ledger.png',
  trezor: 'trezor.png',
  walletconnect: 'walletconnect.png',
  wallet_connect: 'walletconnect.png',
  bitget: 'bitget.png',
  bitgetwallet: 'bitget.png',
  cactuslink: 'cactuslink.png',
  onekey: 'onekey.png',
  'hot-wallet': 'hotwallet.png',
  hotwallet: 'hotwallet.png',
}

function randomStellarAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let body = 'G'
  for (let i = 0; i < 55; i++) body += chars[Math.floor(Math.random() * chars.length)]
  return body
}

export async function connectWallet(): Promise<{ address: string; demo: boolean }> {
  ensureWalletKit()
  try {
    const { address } = await StellarWalletsKit.authModal()
    localStorage.setItem(WALLET_KEY, address)
    return { address, demo: false }
  } catch {
    localStorage.removeItem(WALLET_KEY)
    return connectDemoWallet()
  }
}

export function connectDemoWallet(): { address: string; demo: boolean } {
  let address = localStorage.getItem(DEMO_KEY)
  if (!address) {
    address = randomStellarAddress()
    localStorage.setItem(DEMO_KEY, address)
  }
  return { address, demo: true }
}

export async function disconnectWallet(): Promise<void> {
  ensureWalletKit()
  await StellarWalletsKit.disconnect()
  localStorage.removeItem(WALLET_KEY)
}

export async function signWithWallet(
  xdr: string,
  opts: { networkPassphrase: string; address: string }
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  ensureWalletKit()
  return StellarWalletsKit.signTransaction(xdr, opts)
}

export function getStoredWalletAddress(): string | null {
  return localStorage.getItem(WALLET_KEY)
}

export function onWalletDisconnect(callback: () => void): () => void {
  ensureWalletKit()
  return StellarWalletsKit.on(KitEventType.DISCONNECT, callback)
}

export function onWalletAddressChange(callback: (address: string | undefined) => void): () => void {
  ensureWalletKit()
  return StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => callback(event.payload.address))
}

export function shortAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}
