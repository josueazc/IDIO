<div align="center">

# IDIO

### Institutional Decentralized Issuance & Offerings

**Private, verifiable sealed-bid auctions for institutions — on Stellar, with on-chain Zero-Knowledge proofs.**

[![Stellar](https://img.shields.io/badge/Stellar-Protocol_26-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-SDK_26-000000?style=for-the-badge&logo=rust&logoColor=white)](https://soroban.stellar.org)
[![Groth16](https://img.shields.io/badge/Groth16-BN254_on--chain-1E1E1E?style=for-the-badge)](https://en.wikipedia.org/wiki/Non-interactive_zero-knowledge_proof)
[![Noir](https://img.shields.io/badge/Noir-UltraHonk-2D2D2D?style=for-the-badge)](https://noir-lang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

*Private for participants. Transparent for regulators. Trustless for everyone.*

</div>

---

## The problem

Institutional debt auctions — sovereign bonds, RWAs, deuda emissions — are stuck in a dilemma:

- **If they're public**, every bank sees the others' offers. They coordinate, hide their true price, and bid low. The issuer raises less, and each participant leaks its strategy.
- **If they're opaque**, no one outside the organizer can prove the process was fair. You either trust the auctioneer or you don't.

Today you choose **privacy** *or* **transparency**. There is no infrastructure that delivers both at once.

## The solution

IDIO is a **private, verifiable sealed-bid auction** platform built on Stellar. It uses **Zero-Knowledge proofs** to give you both:

- Each bank bids **in secret** — only a cryptographic commitment is stored on-chain, never the amount.
- Before accepting a bid, the contract **mathematically verifies** the bank has the funds and meets the rules — **without learning how much** it holds or bids.
- When the auction closes, the winner pays with the **amount hidden**; the result becomes **publicly auditable**.

> Blind while the auction runs. Public and provable once it closes.

---

## Live on Stellar Testnet

All four contracts are deployed, initialized and verified on Testnet (**Soroban SDK 26**, **Protocol 26**, native BN254 host functions).

| Contract | ID |
|----------|----|
| Auction | [`CCEDJPYUYYRS7JOOALDV2IZLHBKIMA76XHUDRJ3HAWT2NSTUS2YE5B7T`](https://stellar.expert/explorer/testnet/contract/CCEDJPYUYYRS7JOOALDV2IZLHBKIMA76XHUDRJ3HAWT2NSTUS2YE5B7T) |
| Verifier | [`CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6`](https://stellar.expert/explorer/testnet/contract/CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6) |
| Token | [`CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH`](https://stellar.expert/explorer/testnet/contract/CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH) |
| ASP | [`CBKCM7DFWKYLMQIXN3IE2IRFV7P2ZZQI3DPGZNQZRYB3R3FG7SJ3ZJNR`](https://stellar.expert/explorer/testnet/contract/CBKCM7DFWKYLMQIXN3IE2IRFV7P2ZZQI3DPGZNQZRYB3R3FG7SJ3ZJNR) |

**Admin on-chain** (identidad `idio`, firma `set_capacity` / `pause` / init): [`GCTXTCGN5W3QG6GARAVOIQ6WV5QBFSAVHZ6J2SJENHFKQHMU36FJAK6R`](https://stellar.expert/explorer/testnet/account/GCTXTCGN5W3QG6GARAVOIQ6WV5QBFSAVHZ6J2SJENHFKQHMU36FJAK6R)

> Fuente de verdad: `deployments.testnet.json` y `frontend/src/config.ts`. El contrato `auction` expone
> `version() = 2` (Covenant gate, depósito/slashing, pausa, anti-spam, eventos).
> Redespliegue: `./scripts/redeploy-auction.sh` (redespliega ASP si falta Covenant).

---

## What actually works today

- **Sealed bids on-chain** — only the commitment is stored; the amount never appears until reveal.
- **Browser → chain ZK bridge (Groth16 / BN254)** — when a bank bids, the browser generates a Groth16 eligibility proof with an arkworks prover compiled to **WASM** (~1–3 s on fast hardware; slower machines may need 30–60 s). **Public inputs:** `min_bid`, on-chain **`capacity`** (quota set by admin — *not* wallet balance yet), and **`commitment_fr`** = `SHA-256(be16(bid) ‖ salt)` as a field element. The proof binds the bid amount + salt to the sealed commitment and enforces `capacity ≥ bid ≥ min`. The contract **requires and verifies the proof on-chain** via `auction → verifier` (native `pairing_check`). Creating an auction requires a reserves proof (`total ≥ amount`).
- **Confidential token** — balances are **Pedersen commitments** `v·G + r·H` over BN254; transfers are homomorphic; the amount is never in clear.
- **Confidential settlement** — the winner pays the issuer via `settle_payment` (cross-contract `auction → token`), amount hidden inside a commitment.
- **Private allow-list (Covenant)** — the ASP can verify a **ZK Merkle-membership proof + nullifier**: a bank proves it is approved without revealing *which* member it is, and the one-time nullifier blocks reuse (`asp.verify_membership`).
- **Reserve policy (Auspex+)** — creating an auction proves not just `total ≥ amount` but also a **liquidity ratio** (`liquid/total ≥ 30%`) in ZK, without revealing the balance sheet.
- **Compliance gating** — only allow-listed banks can bid (cross-contract `auction → asp`).
- **Real auditability** — anyone holding the opening `(amount, salt)` / `(amount, blinding)` can verify a commitment via `verify_opening`; the public, who only sees the hash, cannot.
- **Threshold settlement consensus (BEShield)** — settlement can require **k-of-n validator approvals**, where each validator approves with a **ZK membership proof + unique nullifier**: they stay anonymous, can't double-vote, and `settle` is gated until `k` distinct approvals are gathered (`auction.set_consensus` / `approve_settlement`).
- **Post-close transparency** — once settled, all bids and amounts become public and auditable.
- **Role separation** — Issuer / Bidder / Auditor / Regulator; each role only sees and does its own thing.
- **Demo / Testnet toggle** — Demo runs fully offline (localStorage, no wallet required); Testnet reads via Soroban simulation and signs with a Stellar wallet (Freighter, xBull, etc. via Stellar Wallets Kit).

> **How do you know the ZK is real?** Submit a tampered proof to the live contract and it is **rejected on-chain** with `Error(Crypto, InvalidInput)` from `verify_groth16`. If it merely stored data, it would accept anything.

---

## Protocol 26 + Groth16 (brief)

Stellar **Protocol 26** exposes BN254 elliptic-curve ops on the Soroban host (`g1_mul`, `g1_add`, `pairing_check`). IDIO uses that to verify **Groth16** proofs in the `verifier` contract instead of trusting the client.

```
Browser (arkworks WASM)          Soroban (Protocol 26)
─────────────────────────        ─────────────────────
prove_eligibility_hex     ──▶    auction.submit_sealed_bid
  inputs: bid, salt, capacity         └─▶ verifier.verify_groth16 (pairing_check)
prove_reserves_hex        ──▶    auction.create_auction
commitment = SHA256(be16∥salt)   same hash in circuit + contract + frontend
```

El cupo (`capacity`) lo registra el **admin on-chain** en `/capacity`; la prueba no lee el saldo USDC/XLM de la wallet todavía (ver roadmap de endurecimiento).

---

## Demo vs Testnet

| | **Demo** | **Testnet** |
|---|----------|-------------|
| Datos | `localStorage` (subastas sembradas) | Contratos en `deployments.testnet.json` |
| Wallet | Dirección aleatoria opcional | Stellar Wallets Kit (Freighter, xBull, …) |
| ZK / txs | Simulado offline | Prover WASM + txs firmadas on-chain |
| Auth | Email/contraseña demo (sin backend) | Mismo demo auth + perfil local |
| Uso | Workshops, UI, sin XLM | Hackathon, stellar.expert, pruebas reales |

Toggle en la app: esquina superior o ajustes de modo (`frontend/src/services/data.ts`).

---

## Deploy frontend (Vercel)

Root del proyecto en Vercel: **`frontend/`**. Config incluida en `frontend/vercel.json` (SPA rewrites + headers **COOP/COEP** requeridos por el prover WASM).

```bash
cd frontend && npm install && npm run build   # verificar build local
vercel login && vercel --prod                 # Root Directory = frontend
```

Variables opcionales (`VITE_*`): red, RPC, IDs de contrato, `VITE_ON_CHAIN_ADMIN`, `VITE_READ_SOURCE`. Ver `frontend/src/config.ts` y [Deployment](docs/DEPLOYMENT.md). **Mainnet** requiere despliegue de contratos separado — no es un simple toggle; ver sección pubnet en DEPLOYMENT.md.

---

## How it works

```
Issuer ──create_auction (+reserves proof)──▶ Auction ──verify_groth16──▶ Verifier (BN254)
Bidder ──submit_sealed_bid (+eligibility proof)──▶ Auction ──is_allowed──▶ ASP
                                                  │
                              close ─ reveal ─ settle ─ settle_payment ──▶ Token (Pedersen)
                                                  │
Auditor ──verify_opening / opening──▶ Token / commitments   (post-close: public results)
```

| Step | Actor | Action |
|------|-------|--------|
| 1 | **Issuer** | Creates the auction; browser proves reserves (`total ≥ amount`), verified on-chain |
| 2 | **Bidder** | Submits a sealed bid; browser proves eligibility (`capacity ≥ bid ≥ min`, capacity registered on-chain), verified on-chain |
| 3 | **ASP** | Only allow-listed banks may bid (cross-contract) |
| 4 | **Bidder** | May replace its own bid before close (still blind) |
| 5 | **Contract** | After close: reveal `(amount, salt)`, recompute the hash, pick the highest valid bid |
| 6 | **Winner** | Pays the issuer confidentially (Pedersen commitment) |
| 7 | **Everyone / Auditor** | Post-close results are public; the auditor verifies openings |

The commitment `SHA-256(be16(amount) ‖ salt)` is **byte-for-byte identical** across the three layers (frontend, contract, Noir circuit) — verified vector `d772f954…123825`.

---

## Tech stack

| Layer | Tech |
|-------|------|
| **Smart contracts** | Rust · Soroban SDK 26 · 4 contracts (`auction`, `verifier`, `token`, `asp`) |
| **On-chain ZK** | Groth16 over **BN254** with native host functions (`g1_mul`, `g1_add`, `pairing_check`) |
| **Browser prover** | arkworks (Groth16/BN254) compiled to **WASM** (wasm-pack) |
| **Noir circuits** | `sealed_bid`, `proof_of_reserves` — UltraHonk via `@aztec/bb.js` |
| **Confidential token** | Pedersen commitments `v·G + r·H` over BN254 |
| **Frontend** | React 18 · TypeScript · Vite · Tailwind · Stellar Wallets Kit |

## Repository layout

```
idio/
├── contracts/    Soroban workspace (Rust): auction · verifier · token · asp
├── prover/       Groth16 circuits (arkworks) → WASM prover for the browser
├── circuits/     Noir circuits: sealed_bid · proof_of_reserves
├── frontend/     React + Vite + Tailwind app (Demo / Testnet)
├── docs/         ARCHITECTURE · CIRCUITS · SETUP · DEPLOYMENT · DEMO
└── deployments.testnet.json
```

## Quick start

```bash
# Frontend (Demo mode works with no wallet, fully offline)
cd frontend && npm install && npm run dev

# Contracts
cd contracts && cargo test
cargo build --target wasm32v1-none --release

# ZK
cd prover  && cargo test          # Groth16 circuits
cd circuits && nargo test         # Noir circuits
```

## Verify it yourself

```bash
# Versión del contrato desplegado (debe ser 2):
stellar contract invoke --id CCEDJPYUYYRS7JOOALDV2IZLHBKIMA76XHUDRJ3HAWT2NSTUS2YE5B7T \
  --source <your-key> --network testnet -- version

# Admin on-chain (quien puede set_capacity):
stellar contract invoke --id CCEDJPYUYYRS7JOOALDV2IZLHBKIMA76XHUDRJ3HAWT2NSTUS2YE5B7T \
  --source <your-key> --network testnet -- get_admin

# Una oferta sellada on-chain — el monto NO aparece en claro:
stellar contract invoke --id CCEDJPYUYYRS7JOOALDV2IZLHBKIMA76XHUDRJ3HAWT2NSTUS2YE5B7T \
  --source <your-key> --network testnet -- get_bids --auction_id 1
```

Tests: ~30+ green across all layers — contracts (auction 18, asp 3, token 1, verifier 2), Groth16 prover (3), Noir circuits (7), frontend (11).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) · [Circuits](docs/CIRCUITS.md) · [Setup](docs/SETUP.md) · [Deployment](docs/DEPLOYMENT.md) · [Demo & video script](docs/DEMO.md) · [Frontend guide](docs/FRONTEND_GUIDE.md) · [Frontend roadmap (teammate)](docs/FRONTEND_ROADMAP.md) · [Roadmap](docs/ROADMAP.md)

## Status & roadmap (honest)

**Built, tested and on-chain:** sealed-bid core, browser→chain Groth16 bridge (eligibility + reserves), confidential Pedersen token, confidential settlement, Covenant (ZK allow-list + gate del bid activo por defecto), depósito/slashing, pausa/versión/anti-spam, eventos estandarizados, casos borde (empates, reveal tardío, cancel), Auspex+ (reserve policy), BEShield (k-of-n consensus), role separation, post-close transparency, panel de cupos y registro de bancos sin backend.

**Available but not the default path yet:**
- **BEShield** consensus is wired and tested but **off by default** (`threshold = 0`); enabling it needs a real validator set/network.

**Research-grade (documented, not faked):**
- **Eligibility binding** ties each bid to the sealed commitment (`SHA-256(be16(bid)‖salt)`) and to an on-chain **`capacity`** registered by admin — not to the wallet's token balance yet. Binding quota or balance **confidentially** needs in-circuit EC over a 2-cycle curve (BN254/Grumpkin); Soroban has BN254 natively but not Grumpkin — remaining hardening step (same for token `amount ≤ balance` vs Pedersen commitment).

**Frontend / entrega pendiente:** backend real (auth), pulido de wallet kit, deploy Vercel en tu cuenta, video demo ([`docs/DEMO.md`](docs/DEMO.md)), config mainnet opcional — ver [Frontend roadmap](docs/FRONTEND_ROADMAP.md).

> This is a working hackathon MVP: real, tested, verified on-chain — not an audited production system.

## License

MIT — see [LICENSE](LICENSE).

<div align="center">

**Built on Stellar.**

</div>
