# Circuitos ZK (Noir)

Los circuitos viven en `circuits/` como un workspace Nargo con dos miembros.
Compilan con Noir `1.0.0-beta` y usan la librería `sha256` v0.3.0.

## Esquema de compromiso

Las tres capas (frontend, contrato Soroban y circuito) usan el **mismo**
compromiso:

```
commitment = SHA-256( be16(monto) ‖ salt )
```

donde `be16(monto)` son los 16 bytes big-endian del monto (igual que
`i128::to_be_bytes`) y `salt` son 32 bytes. Vector de prueba verificado en
las tres capas: para `monto = 15_000_000` y `salt = [0x07; 32]` →
`d772f95448892f507a9803a892c5f6ca436a113f3a20b88730997cd8a1123825`.

> Se eligió SHA-256 (no Poseidon2) porque es la función hash nativa de
> Soroban (`env.crypto().sha256`), lo que permite que el contrato recompute
> el compromiso en el reveal y coincida exactamente con el circuito.

## `sealed_bid`

Demuestra, sin revelar el monto, que una oferta es válida y está respaldada.

| Entrada | Tipo | Visibilidad |
|---------|------|-------------|
| `bid_amount` | u64 | privada |
| `available_balance` | u64 | privada |
| `salt` | [u8; 32] | privada |
| `min_bid` | u64 | **pública** |
| `commitment` | [u8; 32] | **pública** |

Restricciones:
1. `bid_amount ≥ min_bid`
2. `available_balance ≥ bid_amount`
3. `commitment == SHA-256(be16(bid_amount) ‖ salt)`

## `proof_of_reserves`

El emisor demuestra que respalda la subasta.

| Entrada | Tipo | Visibilidad |
|---------|------|-------------|
| `bonds[16]` | [u64; 16] | privada |
| `total` | u64 | privada |
| `salt` | [u8; 32] | privada |
| `auction_amount` | u64 | **pública** |
| `commitment` | [u8; 32] | **pública** |

Restricciones:
1. `sum(bonds) == total`
2. `total ≥ auction_amount`
3. `commitment == SHA-256(be16(total) ‖ salt)`

## Compilar y probar

```bash
cd circuits
nargo test       # 7 tests (4 sealed_bid + 3 proof_of_reserves)
nargo compile    # genera target/*.json (consumidos por el frontend)
```

## Proving en el navegador

El frontend (`frontend/src/services/noir.ts`) carga el artefacto
`sealed_bid.json`, ejecuta el witness con `@noir-lang/noir_js` (ACVM en
WASM) y genera una prueba **UltraHonk** con `@aztec/bb.js`. Una prueba
válida (~14.6 KB) demuestra que `balance ≥ oferta ≥ mínimo` y que el
compromiso es correcto, sin revelar el monto.

## Integración con el contrato

El compromiso público es el mismo valor que el contrato almacena por oferta.
En el reveal, `auction.rs` recomputa `SHA-256(be16(monto) ‖ salt)` y exige
coincidencia. La verificación on-chain de la prueba UltraHonk (BN254) es
trabajo futuro; `verifier.rs` valida hoy el binding del compromiso y deja
`verify_proof` como punto de extensión.
