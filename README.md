<div align="center">

# 🏛️ IDIO

### Institutional Decentralized Issuance & Offerings

**Subastas privadas institucionales sobre Stellar, con privacidad verificable mediante Zero-Knowledge Proofs.**

[![Stellar](https://img.shields.io/badge/Stellar-Protocol_26-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart_Contracts-000000?style=for-the-badge&logo=rust&logoColor=white)](https://soroban.stellar.org)
[![Noir](https://img.shields.io/badge/Noir-ZK_Circuits-1E1E1E?style=for-the-badge&logo=data:image/svg+xml;base64,&logoColor=white)](https://noir-lang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Rust](https://img.shields.io/badge/Rust-Soroban_SDK-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org)

</div>

---

## 🎯 El problema

Las subastas institucionales de activos —bonos soberanos, RWA, emisiones de deuda— enfrentan un dilema:

- 🔓 **Si son públicas**, cada banco revela su estrategia y precio máximo. Los competidores se coordinan, los precios se distorsionan.
- 🕶️ **Si son opacas**, no hay forma de probar que el proceso fue justo. Confías o no confías.

No existe un punto medio donde **la oferta sea privada** *y* **el proceso sea verificable**.

## 💡 La solución

IDIO combina **privacidad** y **verificación matemática** en una sola plataforma sobre Stellar:

- ✅ **Sealed-bid auctions** — las ofertas se envían selladas; nadie ve los montos.
- ✅ **Zero-Knowledge Proofs** — cada participante prueba que tiene fondos suficientes *sin revelar cuánto*.
- ✅ **Liquidación confidencial** — el monto ganador se transfiere oculto en cadena.
- ✅ **Auditoría con view keys** — un auditor autorizado verifica que todo fue justo.
- ✅ **Compliance integrado** — listas ASP (allow/deny) y validación FATF/OFAC.

> Privacidad para los participantes. Transparencia para los reguladores. Confianza para todos.

---

## Estado: en vivo en Stellar Testnet

Los cuatro contratos están desplegados, inicializados y verificados en testnet.

| Contrato | ID |
|----------|----|
| Auction | [`CB5LFRG2ZKWDDIC4EISCJYLHFR5HNENHQKWLHZ6SVSL33WQRWAQQO6LZ`](https://stellar.expert/explorer/testnet/contract/CB5LFRG2ZKWDDIC4EISCJYLHFR5HNENHQKWLHZ6SVSL33WQRWAQQO6LZ) |
| ASP | [`CA7Z7PRBUW4WTBGZQJTKUXQQVCOVEXM3OQSZB2GLDMPDWGZANEXARERO`](https://stellar.expert/explorer/testnet/contract/CA7Z7PRBUW4WTBGZQJTKUXQQVCOVEXM3OQSZB2GLDMPDWGZANEXARERO) |
| Token | [`CD7L23OCVDMB2PQ4Y7GJZ4SPAUQ7R44BF5UHHHZHSD7WGAA3KYFYGCUB`](https://stellar.expert/explorer/testnet/contract/CD7L23OCVDMB2PQ4Y7GJZ4SPAUQ7R44BF5UHHHZHSD7WGAA3KYFYGCUB) |
| Verifier | [`CBJQ3FADEOOVBN3G7ZN66FUHSB7MOK5SBJ2F3NZBJHLWK3PCONYF4YLV`](https://stellar.expert/explorer/testnet/contract/CBJQ3FADEOOVBN3G7ZN66FUHSB7MOK5SBJ2F3NZBJHLWK3PCONYF4YLV) |

**Lo que funciona de verdad, hoy:**

- Subastas, ofertas selladas y gating de compliance **on-chain** (cross-contract real auction → ASP).
- **Pruebas Zero-Knowledge reales en el navegador**: el circuito Noir `sealed_bid` se ejecuta y se genera una prueba UltraHonk (~14.6 KB, ~3.7 s) con `@aztec/bb.js`, sin revelar el monto.
- **Verificación Groth16 BN254 on-chain real**: `verify_groth16` evalúa la ecuación de pairings con las host functions BN254 nativas de Protocol 26 (`g1_mul`/`g1_add`/`pairing_check`); test con prueba real de arkworks.
- **Token confidencial real**: balances como compromisos Pedersen `v·G + r·H` sobre BN254, transferencias homomórficas, monto nunca en claro (verificado on-chain en testnet).
- **Pago/liquidación confidencial**: el ganador paga al emisor vía `settle_payment` (cross-contract auction → token), con el monto oculto en un compromiso.
- Compromiso `SHA-256(be16(monto) ‖ salt)` **idéntico byte a byte** en las tres capas (frontend, contrato y circuito) — vector verificado `d772f954…123825`.
- El frontend tiene un toggle **Demo / Testnet**: Demo funciona offline; Testnet lee por simulación y escribe firmando con Freighter.

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│   USUARIOS  ·  Bancos · Gobiernos · Auditores · Reguladores│
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│   FRONTEND (React + Tailwind)                             │
│   Dashboard · Subastas · Bid Form · Auditoría · Compliance│
│   Wallet (Freighter) · Generación de pruebas ZK (WASM)    │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│   SMART CONTRACTS (Soroban / Rust)                        │
│   auction.rs · token.rs · asp.rs · verifier.rs            │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│   ZK CIRCUITS (Noir)                                      │
│   sealed_bid.nr · proof_of_reserves.nr                    │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│   STELLAR  ·  Protocol 26 · BN254 · Poseidon2 · Soroban   │
└──────────────────────────────────────────────────────────┘
```

## 🔄 Cómo funciona

| Paso | Actor | Acción |
|------|-------|--------|
| 1️⃣ | **Emisor** (Banco Central) | Crea la subasta y genera *proof-of-reserves* del activo |
| 2️⃣ | **Bidders** (Bancos) | Envían ofertas selladas con ZK proof de fondos |
| 3️⃣ | **Smart Contract** | Al cerrar el plazo, revela y determina al ganador |
| 4️⃣ | **Ganador** | Paga de forma confidencial (monto oculto en cadena) |
| 5️⃣ | **On-chain** | Liquidación RWA ↔ USDC verificable |
| 6️⃣ | **Auditor** | Verifica el proceso con su *view key* |
| 7️⃣ | **Regulador** | Confirma compliance (ASP / FATF / OFAC) |

---

## 🧰 Stack tecnológico

<div align="center">

| Capa | Tecnología |
|------|-----------|
| **Frontend** | ![React](https://img.shields.io/badge/-React_18-61DAFB?logo=react&logoColor=black) ![TS](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/-Tailwind-06B6D4?logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) |
| **Contratos** | ![Rust](https://img.shields.io/badge/-Rust-000000?logo=rust&logoColor=white) ![Soroban](https://img.shields.io/badge/-Soroban_SDK-7D00FF?logo=stellar&logoColor=white) |
| **ZK** | ![Noir](https://img.shields.io/badge/-Noir-1E1E1E) Poseidon2 · BN254 |
| **Blockchain** | ![Stellar](https://img.shields.io/badge/-Stellar_P26-7D00FF?logo=stellar&logoColor=white) |

</div>

## 📁 Estructura del repo

```
idio/
├── contracts/        Smart contracts Soroban (Rust)
│   └── src/          auction · token · asp · verifier
├── circuits/         Circuitos ZK (Noir)
├── frontend/         Aplicación React + Tailwind
│   └── src/          components · services · pages · utils
├── docs/             Arquitectura, setup, deployment
└── scripts/          Deploy, test, setup de testnet
```

## 🚀 Quick start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Contratos
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Circuitos
cd circuits
nargo build
```

Requisitos: Node 18+, Rust + target `wasm32-unknown-unknown`, [Stellar CLI](https://developers.stellar.org/docs/tools/cli), [Nargo (Noir)](https://noir-lang.org).

## 📚 Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Setup](docs/SETUP.md)
- [Circuitos ZK](docs/CIRCUITS.md)
- [Deployment](docs/DEPLOYMENT.md)

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).

<div align="center">

**Construido sobre Stellar 🚀**

</div>
