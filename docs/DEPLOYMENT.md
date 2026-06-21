# Deployment (Stellar Testnet)

## 1. Identidad y fondos

```bash
stellar keys generate idio --network testnet
stellar keys fund idio --network testnet
```

## 2. Compilar contratos

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

El WASM queda en `target/wasm32-unknown-unknown/release/idio_contracts.wasm`.

## 3. Desplegar

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/idio_contracts.wasm \
  --source idio --network testnet
```

Repite para cada contrato según corresponda y guarda los IDs.

## 4. Inicializar

```bash
# ASP
stellar contract invoke --id <ASP_ID> --source idio --network testnet \
  -- initialize --admin <ADMIN_ADDRESS>

# Auction
stellar contract invoke --id <AUCTION_ID> --source idio --network testnet \
  -- initialize --admin <ADMIN_ADDRESS> --asp <ASP_ID>
```

## 5. Conectar el frontend

Copia los IDs a `frontend/.env`:

```
VITE_AUCTION_CONTRACT_ID=...
VITE_ASP_CONTRACT_ID=...
VITE_TOKEN_CONTRACT_ID=...
VITE_VERIFIER_CONTRACT_ID=...
```

Ver `scripts/deploy.sh` para automatizar los pasos 2–4.
