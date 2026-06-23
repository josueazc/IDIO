/**
 * Capa de integración real con los contratos Soroban de IDIO en Stellar.
 *
 * - Lecturas (`total_auctions`, `get_auction`, `is_allowed`): se resuelven
 *   por simulación contra el RPC, sin firmar ni gastar fees.
 * - Escrituras (`create_auction`, `submit_sealed_bid`, `reveal_bid`,
 *   `settle`): se construyen, se preparan, se firman con Freighter y se
 *   envían a la red.
 */
import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'
import { config } from '../config'
import type { Auction, AuctionStatus, SealedBid } from '../types'

const server = new rpc.Server(config.rpcUrl, {
  allowHttp: config.rpcUrl.startsWith('http://'),
})

// ---- Codificadores de argumentos ----

const addr = (a: string): xdr.ScVal => new Address(a).toScVal()
const str = (s: string): xdr.ScVal => nativeToScVal(s, { type: 'string' })
const i128 = (n: number | bigint): xdr.ScVal => nativeToScVal(BigInt(n), { type: 'i128' })
const u64 = (n: number | bigint): xdr.ScVal => nativeToScVal(BigInt(n), { type: 'u64' })
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const buf = new Uint8Array(clean.length / 2)
  for (let i = 0; i < buf.length; i++) buf[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return buf
}
const bytes32 = (hex: string): xdr.ScVal => nativeToScVal(hexToBytes(hex), { type: 'bytes' })

/** Construye el ScVal del struct `Groth16Proof { a, b, c }` (bytes). */
function proofScVal(p: { a: string; b: string; c: string }): xdr.ScVal {
  return nativeToScVal(
    { a: hexToBytes(p.a), b: hexToBytes(p.b), c: hexToBytes(p.c) },
    { type: { a: ['symbol', 'bytes'], b: ['symbol', 'bytes'], c: ['symbol', 'bytes'] } }
  )
}

// ---- Lectura por simulación ----

async function readContract(contractId: string, method: string, args: xdr.ScVal[] = []): Promise<unknown> {
  const source = await server.getAccount(config.readSource)
  const contract = new Contract(contractId)
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const sim = await server.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulación falló (${method}): ${sim.error}`)
  }
  const retval = sim.result?.retval
  if (!retval) return undefined
  return scValToNative(retval)
}

// ---- Escritura firmada con Freighter ----

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signerAddress: string
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const source = await server.getAccount(signerAddress)
  const contract = new Contract(contractId)
  const built = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build()

  const prepared = await server.prepareTransaction(built)

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: config.networkPassphrase,
    address: signerAddress,
  })

  const signed = TransactionBuilder.fromXDR(signedTxXdr, config.networkPassphrase)
  const sent = await server.sendTransaction(signed)
  if (sent.status === 'ERROR') {
    throw new Error(`Envío falló (${method}): ${JSON.stringify(sent.errorResult)}`)
  }

  // Poll hasta confirmación.
  let result = await server.getTransaction(sent.hash)
  for (let i = 0; i < 30 && result.status === 'NOT_FOUND'; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    result = await server.getTransaction(sent.hash)
  }
  if (result.status !== 'SUCCESS') {
    throw new Error(`Transacción no confirmada (${method}): ${result.status}`)
  }
  return result
}

// ---- Mapeo a tipos del frontend ----

function mapStatus(s: unknown): AuctionStatus {
  const tag = Array.isArray(s) ? s[0] : (s as { tag?: string })?.tag ?? s
  switch (tag) {
    case 'BiddingOpen':
      return 'BiddingOpen'
    case 'BiddingClosed':
      return 'BiddingClosed'
    case 'Settled':
      return 'Settled'
    default:
      return 'Cancelled'
  }
}

function hex(u: Uint8Array | undefined): string {
  if (!u) return ''
  return [...u].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapBids(raw: any[]): SealedBid[] {
  return (raw ?? []).map((b: any) => ({
    bidderName: '',
    bidderAddress: typeof b.bidder === 'string' ? b.bidder : b.bidder?.toString?.() ?? '',
    commitment: hex(b.commitment).slice(0, 8) + '…',
    amount: Number(b.revealed_amount ?? 0n),
    revealed: Boolean(b.revealed),
    timestamp: Number(b.timestamp ?? 0n) * 1000,
    whitelisted: true,
  }))
}

function inferAssetType(asset: string): import('../types').AssetType {
  const s = asset.toLowerCase()
  if (s.includes('rwa') || s.includes('hipotec')) return 'rwa'
  if (s.includes('corporativo') || s.includes('corp')) return 'corporativo'
  if (s.includes('licitaci')) return 'licitacion'
  return 'soberano'
}

function mapAuction(raw: any, bids: SealedBid[]): Auction {
  return {
    id: Number(raw.id),
    issuer: typeof raw.issuer === 'string' ? raw.issuer : raw.issuer?.toString?.() ?? '',
    asset: raw.asset,
    assetType: inferAssetType(String(raw.asset ?? '')),
    amount: Number(raw.amount),
    minBid: Number(raw.min_bid),
    currency: 'USDC',
    status: mapStatus(raw.status),
    description: 'Subasta on-chain (Stellar Testnet).',
    reservesCommitment: hex(raw.reserves_commitment).slice(0, 8) + '…',
    bids,
    winner: raw.winner ? raw.winner.toString?.() : undefined,
    winnerName: raw.winner ? raw.winner.toString?.().slice(0, 4) + '…' : undefined,
    winningAmount: Number(raw.winning_amount ?? 0n),
    paid: Boolean(raw.paid),
    createdAt: Date.now(),
    endTime: Number(raw.end_time) * 1000,
  }
}

// ---- API pública ----

export const chain = {
  contracts: config.contracts,

  async totalAuctions(): Promise<number> {
    return Number((await readContract(config.contracts.auction, 'total_auctions')) ?? 0)
  },

  async getAuction(id: number): Promise<Auction> {
    const [raw, rawBids] = await Promise.all([
      readContract(config.contracts.auction, 'get_auction', [u64(id)]),
      readContract(config.contracts.auction, 'get_bids', [u64(id)]) as Promise<any[]>,
    ])
    return mapAuction(raw, mapBids(rawBids))
  },

  async listAuctions(): Promise<Auction[]> {
    const total = await chain.totalAuctions()
    const out: Auction[] = []
    for (let id = 1; id <= total; id++) {
      try {
        out.push(await chain.getAuction(id))
      } catch {
        /* salta subastas inaccesibles */
      }
    }
    return out.reverse()
  },

  async isAllowed(who: string): Promise<boolean> {
    return Boolean(await readContract(config.contracts.asp, 'is_allowed', [addr(who)]))
  },

  async createAuction(
    issuer: string,
    asset: string,
    amount: number,
    minBid: number,
    durationSecs: number,
    reservesCommitmentHex: string,
    reservesProof: { a: string; b: string; c: string }
  ): Promise<void> {
    await invokeContract(
      config.contracts.auction,
      'create_auction',
      [
        addr(issuer),
        str(asset),
        i128(amount),
        i128(minBid),
        u64(durationSecs),
        bytes32(reservesCommitmentHex),
        proofScVal(reservesProof),
      ],
      issuer
    )
  },

  async submitSealedBid(
    auctionId: number,
    bidder: string,
    commitmentHex: string,
    eligibilityProof: { a: string; b: string; c: string }
  ): Promise<void> {
    await invokeContract(
      config.contracts.auction,
      'submit_sealed_bid',
      [u64(auctionId), addr(bidder), bytes32(commitmentHex), proofScVal(eligibilityProof)],
      bidder
    )
  },

  async revealBid(
    auctionId: number,
    bidder: string,
    amount: number,
    saltHex: string
  ): Promise<void> {
    await invokeContract(
      config.contracts.auction,
      'reveal_bid',
      [u64(auctionId), addr(bidder), i128(amount), bytes32(saltHex)],
      bidder
    )
  },

  async settle(auctionId: number, caller: string): Promise<void> {
    await invokeContract(config.contracts.auction, 'settle', [u64(auctionId)], caller)
  },

  /** Compromiso Pedersen del balance de una cuenta (64 bytes hex). */
  async tokenCommitment(who: string): Promise<string> {
    const res = (await readContract(config.contracts.token, 'commitment', [addr(who)])) as Uint8Array
    return [...res].map((b) => b.toString(16).padStart(2, '0')).join('')
  },

  /** Verifica una apertura del balance: ¿C_who == amount·G + blinding·H? */
  async tokenVerifyOpening(who: string, amount: number, blindingHex: string): Promise<boolean> {
    return Boolean(
      await readContract(config.contracts.token, 'verify_opening', [
        addr(who),
        i128(amount),
        bytes32(blindingHex),
      ])
    )
  },

  /** Compromiso Pedersen del monto (lectura): `amount·G + blinding·H`. */
  async tokenCommitValue(amount: number, blindingHex: string): Promise<string> {
    const res = (await readContract(config.contracts.token, 'commit_value', [
      i128(amount),
      bytes32(blindingHex),
    ])) as Uint8Array
    return [...res].map((b) => b.toString(16).padStart(2, '0')).join('')
  },

  /** Pago confidencial ganador→emisor: `settle_payment(auction_id, value_commitment)`. */
  async settlePayment(auctionId: number, valueCommitmentHex: string, winner: string): Promise<void> {
    await invokeContract(
      config.contracts.auction,
      'settle_payment',
      [u64(auctionId), bytes32(valueCommitmentHex)],
      winner
    )
  },
}
