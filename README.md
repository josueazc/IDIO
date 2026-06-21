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
| Auction | [`CAYM26B6AVARFVTQEXPXSB753MMPLA7GZ4RANN7ID3M7LFYM3KTZQRFT`](https://stellar.expert/explorer/testnet/contract/CAYM26B6AVARFVTQEXPXSB753MMPLA7GZ4RANN7ID3M7LFYM3KTZQRFT) |
| ASP | [`CAMRACXOGXS7NZXI6JF7JZNNNYPTUNI6AQRHWGFSMXNQOYJ3RP7DS5JY`](https://stellar.expert/explorer/testnet/contract/CAMRACXOGXS7NZXI6JF7JZNNNYPTUNI6AQRHWGFSMXNQOYJ3RP7DS5JY) |
| Token | [`CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH`](https://stellar.expert/explorer/testnet/contract/CBVDXELQKBRLVQRVZNZJFPPQS3CCJRHPQ6DSCUO3SSONBPUM3YI3BPQH) |
| Verifier | [`CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6`](https://stellar.expert/explorer/testnet/contract/CDPACMY5BFOL4OWEW42ESAICPVVXBNPE6QJVNFASQJTI2UT7JMTR3IB6) |

**Lo que funciona de verdad, hoy:**

- Subastas, ofertas selladas y gating de compliance **on-chain** (cross-contract real auction → ASP).
- **Puente ZK navegador → cadena (Groth16 BN254):** al ofertar, el navegador genera una prueba Groth16 de elegibilidad (`balance ≥ oferta ≥ mínimo`) con un prover arkworks compilado a **WASM** (~1.3 s); el contrato la **exige y la verifica on-chain** vía cross-contract `auction → verifier` (`pairing_check` nativo). Al crear una subasta exige una prueba de reservas (`total ≥ monto`). Verificado en testnet.
- **Token confidencial real**: balances como compromisos Pedersen `v·G + r·H` sobre BN254, transferencias homomórficas, monto nunca en claro.
- **Pago/liquidación confidencial**: el ganador paga al emisor vía `settle_payment` (cross-contract auction → token), con el monto oculto en un compromiso.
- **Pruebas Noir UltraHonk en el navegador** (modo demo): el circuito `sealed_bid` se ejecuta y se prueba con `@aztec/bb.js`, sin revelar el monto.
- Compromiso `SHA-256(be16(monto) ‖ salt)` **idéntico byte a byte** en las tres capas — vector verificado `d772f954…123825`.
- **Separación por rol**: Emisor / Oferente / Auditor / Regulador; cada rol ve y puede hacer solo lo suyo.
- Toggle **Demo / Testnet**: Demo funciona offline; Testnet lee por simulación y escribe firmando con Freighter.

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
