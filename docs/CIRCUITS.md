# Circuitos ZK (Noir)

Los circuitos viven en `circuits/` como un workspace Nargo con dos miembros.

## `sealed_bid`

Demuestra, sin revelar el monto, que una oferta es válida y está respaldada.

| Entrada | Tipo | Visibilidad |
|---------|------|-------------|
| `bid_amount` | Field | privada |
| `available_balance` | Field | privada |
| `salt` | Field | privada |
| `min_bid` | Field | **pública** |
| `commitment` | Field | **pública** |

Restricciones:
1. `bid_amount ≥ min_bid`
2. `available_balance ≥ bid_amount`
3. `commitment == Poseidon2(bid_amount, salt)`

## `proof_of_reserves`

El emisor demuestra que respalda la subasta.

| Entrada | Tipo | Visibilidad |
|---------|------|-------------|
| `bonds[16]` | Field | privada |
| `total` | Field | privada |
| `salt` | Field | privada |
| `auction_amount` | Field | **pública** |
| `commitment` | Field | **pública** |

Restricciones:
1. `sum(bonds) == total`
2. `total ≥ auction_amount`
3. `commitment == Poseidon2(total, salt)`

## Compilar y probar

```bash
cd circuits
nargo test
nargo build
```

## Integración con el contrato

El compromiso público (`commitment`) es el mismo valor que `auction.rs`
almacena por oferta. En el reveal, el contrato recomputa el hash y exige
coincidencia. El verificador on-chain de la prueba Noir se conecta en
`verifier.rs::verify_proof` usando las host functions BN254 de Protocol 26.
