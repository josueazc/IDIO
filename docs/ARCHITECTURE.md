# Arquitectura

IDIO se compone de cuatro capas que cooperan para ofrecer subastas
*sealed-bid* privadas y verificables sobre Stellar.

```
Usuarios → Frontend (React) → Contratos (Soroban) → Circuitos (Noir) → Stellar
```

## Capas

### 1. Frontend (`frontend/`)
SPA en React + Vite + Tailwind. Responsabilidades:
- Conexión de wallet (Freighter) con fallback a modo demo.
- Generación de compromisos / pruebas en el navegador (`services/proofs.ts`).
- Interacción con los contratos (`services/contracts.ts`, capa de demo en `services/store.ts`).
- Vistas por rol: emisor, bidder, auditor, regulador.

### 2. Contratos (`contracts/`)
Workspace Soroban (soroban-sdk 26) con 4 crates, cada uno su WASM:
- **auction** — ciclo de vida (`create_auction`, `submit_sealed_bid`, `reveal_bid`, `settle`) + `settle_payment` (pago confidencial cross-contract) + gating cross-contract contra el ASP.
- **token** — token confidencial real: balances como compromisos Pedersen `v·G + r·H` sobre BN254, transferencias homomórficas, monto nunca en claro.
- **asp** — Association Set Provider (allow-list para compliance).
- **verifier** — **verificación Groth16 BN254 on-chain** (`verify_groth16`) con las host functions nativas `g1_mul`/`g1_add`/`pairing_check`, más el binding del compromiso `SHA-256`.

### 3. Circuitos (`circuits/`)
Circuitos Noir:
- **sealed_bid** — prueba `balance ≥ oferta ≥ mínimo` y que el compromiso `SHA-256(be16(monto)‖salt)` es correcto, sin revelar el monto. Se ejecuta y se prueba (UltraHonk) en el navegador.
- **proof_of_reserves** — prueba que la cartera del emisor suma el total y cubre el monto subastado.

### 4. Stellar (Protocol 26)
Ejecución de los contratos, primitivas criptográficas BN254 nativas
(`g1_mul`, `g1_add`, `pairing_check`) y liquidación on-chain.

## Dos sistemas de prueba (nota honesta)

IDIO usa **dos** tecnologías ZK que cumplen roles distintos:

- **UltraHonk (Noir)** — la prueba de oferta sellada se genera y se verifica
  *off-chain* (en el navegador, con `@aztec/bb.js`). Es lo que prueba la
  elegibilidad del bidder sin revelar el monto.
- **Groth16 (BN254)** — el `verifier` verifica pruebas Groth16 *on-chain* con
  las host functions nativas. Es un primitivo de verificación on-chain de
  propósito general (probado con pruebas reales de arkworks), listo para
  predicados de elegibilidad expresados como circuitos Groth16.

UltraHonk no se verifica on-chain (su verificador es mucho más complejo que un
par de pairings); por eso la verificación on-chain usa Groth16. Unir ambos
mundos (Noir→Groth16) es trabajo futuro.

## Modelo de privacidad

| Dato | Visibilidad |
|------|-------------|
| Existencia de la subasta | Pública |
| Identidad de los participantes | Pública (direcciones) |
| Monto de cada oferta | **Privado** hasta el reveal |
| Monto ganador | **Confidencial** en la liquidación (compromiso Pedersen) |
| Balance del token | **Oculto** (compromiso Pedersen `v·G + r·H`) |
| Montos completos | Visibles solo con la apertura / *view key* (auditor) |

El compromiso `H(monto ‖ salt)` ancla cada oferta: durante la fase abierta
solo existe el hash; en el reveal el bidder presenta `(monto, salt)` y el
contrato recomputa el hash para validar que nadie cambió su oferta.

> Nota: el MVP instancia `H` con SHA-256 (host function nativo de Soroban)
> para mantener coherencia frontend↔contrato. La versión con circuito Noir
> usa Poseidon2, que es el hash *ZK-friendly* sobre BN254.
