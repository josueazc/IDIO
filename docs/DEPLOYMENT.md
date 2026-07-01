# Deployment (Stellar Testnet)

> Despliegue activo en testnet — direcciones en
> [`deployments.testnet.json`](../deployments.testnet.json) y en el README.
> El frontend apunta a esos contratos por defecto (`frontend/src/config.ts`).

## Redespliegue rápido (auction + ASP Covenant)

Cuando cambian los circuitos Groth16 o el ABI del contrato `auction`:

```bash
# Identidad fondeada en testnet (por defecto "idio")
./scripts/setup-testnet.sh idio

# Redespliega ASP (si falta Covenant) + auction + sincroniza config
./scripts/redeploy-auction.sh
```

El script:
1. Genera ELIG_VK, RESERVES_VK, MEMBERSHIP_VK (`prover/bin/vk`)
2. Calcula la raíz Covenant desde `COVENANT_SECRETS` (default `1,2,3,4,5,6,7,8`)
3. Redespliega ASP si el contrato on-chain no tiene `set_membership`
4. Despliega auction e inicializa con asp/token/verifier
5. Actualiza `deployments.testnet.json` y `frontend/src/config.ts`

Variables útiles:

```bash
export BANKS=(GXXXX... GYYYY...)   # opcional: allow + set_capacity
export CAPACITY=50000000
export REDEPLOY_ASP=1              # forzar ASP nuevo
export COVENANT_SECRETS='1,2,3,4,5,6,7,8'
```

**Nota:** si Cursor inyecta `HTTP_PROXY`, el script lo limpia automáticamente.
Si `stellar` falla con `client error (Connect)`, ejecuta con proxy desactivado.

## Despliegue completo desde cero

```bash
./scripts/setup-testnet.sh idio
./scripts/deploy.sh          # 4 contratos wasm32v1-none
# Inicializar manualmente o con init (ver contratos)
./scripts/redeploy-auction.sh  # sincroniza VKs + Covenant
```

## Compilar contratos

```bash
cd contracts
cargo build --target wasm32v1-none --release
```

WASM en `contracts/target/wasm32v1-none/release/idio_{asp,token,verifier,auction}.wasm`.

## Conectar el frontend

Copia los IDs a `frontend/.env` (opcional; los defaults vienen de `config.ts`):

```
VITE_AUCTION_CONTRACT_ID=...
VITE_ASP_CONTRACT_ID=...
VITE_TOKEN_CONTRACT_ID=...
VITE_VERIFIER_CONTRACT_ID=...
VITE_COVENANT_SECRETS=1,2,3,4,5,6,7,8
```

## Verificar on-chain

```bash
AUCTION=$(jq -r .contracts.auction deployments.testnet.json)
stellar contract invoke --id "$AUCTION" --source idio --network testnet -- version
stellar contract invoke --id "$AUCTION" --source idio --network testnet -- get_bid_gate_zk
```
