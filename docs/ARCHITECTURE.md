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
Contratos Soroban en Rust:
- **auction.rs** — ciclo de vida de la subasta (`create_auction`, `submit_sealed_bid`, `reveal_bid`, `settle`, `cancel_auction`).
- **token.rs** — token confidencial (balances comprometidos, direcciones visibles).
- **asp.rs** — Association Set Provider (allow-list para compliance).
- **verifier.rs** — verificación de compromisos y punto de extensión para la prueba ZK.

### 3. Circuitos (`circuits/`)
Circuitos Noir:
- **sealed_bid** — prueba `balance ≥ oferta ≥ mínimo` y que el compromiso `Poseidon2(monto, salt)` es correcto, sin revelar el monto.
- **proof_of_reserves** — prueba que la cartera del emisor suma el total y cubre el monto subastado.

### 4. Stellar (Protocol 26)
Ejecución de los contratos, primitivas criptográficas (BN254, Poseidon2)
y liquidación on-chain.

## Modelo de privacidad

| Dato | Visibilidad |
|------|-------------|
| Existencia de la subasta | Pública |
| Identidad de los participantes | Pública (direcciones) |
| Monto de cada oferta | **Privado** hasta el reveal |
| Monto ganador | **Confidencial** en la liquidación |
| Montos completos | Visibles solo con *view key* (auditor) |

El compromiso `H(monto ‖ salt)` ancla cada oferta: durante la fase abierta
solo existe el hash; en el reveal el bidder presenta `(monto, salt)` y el
contrato recomputa el hash para validar que nadie cambió su oferta.

> Nota: el MVP instancia `H` con SHA-256 (host function nativo de Soroban)
> para mantener coherencia frontend↔contrato. La versión con circuito Noir
> usa Poseidon2, que es el hash *ZK-friendly* sobre BN254.
