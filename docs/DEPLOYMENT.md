# Deployment (Stellar Testnet)

> Despliegue activo en testnet — direcciones en
> [`deployments.testnet.json`](../deployments.testnet.json) y en el README.
> El frontend apunta a esos contratos por defecto (`frontend/src/config.ts`).

## Frontend en producción (Vercel)

- **URL:** [https://idio-josueazcs-projects.vercel.app](https://idio-josueazcs-projects.vercel.app)
- **Proyecto Vercel:** `josueazcs-projects/idio` (`projectName`: `idio` en `frontend/.vercel/project.json`)
- **Root Directory:** `frontend` (ver `frontend/vercel.json`)
- El alias corto `idio.vercel.app` **no** está disponible; usar la URL de producción anterior.

## Redespliegue tras cambio del circuito de elegibilidad

El circuito `EligibilityCircuit` ahora incluye **3 entradas públicas**:
`[min_bid, capacity, commitment_fr]` donde `commitment_fr` es
`SHA-256(be16(oferta)‖salt)` interpretado como Fr. Esto ata la prueba ZK al
compromiso sellado y evita pruebas válidas con otro salt.

**Consecuencia:** cualquier cambio en ese circuito genera una **nueva ELIG_VK**.
Hay que redesplegar el contrato `auction` (y sincronizar VKs) antes de que las
ofertas on-chain vuelvan a verificar:

```bash
./scripts/redeploy-auction.sh
```

El frontend debe regenerar el prover WASM (`wasm-pack`) para que
`prove_eligibility_hex` reciba el `salt` y produzca pruebas compatibles con la
VK desplegada.

## Mainnet (Stellar pubnet) y dinero real

**Sí podés usar mainnet** con IDIO, pero implica un despliegue completo separado del testnet — no es un toggle en la UI.

| | Testnet | Mainnet (pubnet) |
|---|---------|------------------|
| XLM | Gratis vía [Friendbot](https://laboratory.stellar.org/#account-creator?network=test) | **Real**: comprar o transferir XLM a la wallet |
| USDC / activos | Testnet assets (sin valor) | USDC real en Stellar (p. ej. desde un exchange) |
| Contratos | IDs en `deployments.testnet.json` | Nuevos IDs tras `./scripts/deploy.sh` con `NETWORK=mainnet` |
| VK Groth16 | `ELIG_VK` del circuito actual | **Regenerar** VK y `redeploy-auction.sh` en pubnet |
| Riesgo | Ninguno para demos | Fees reales + activos reales en subastas |

### Pasos para mainnet con fondos reales

1. Crear identidad Stellar mainnet (`stellar keys generate idio-mainnet`) y **fondearla con XLM real** (exchange → retiro a la dirección G… de la identidad).
2. Desplegar contratos en pubnet (ver sección anterior): `asp`, `token`, `verifier`, `auction`.
3. Regenerar prover WASM y VKs; inicializar `auction` con las VK nuevas.
4. Configurar frontend con variables de entorno:

```bash
# frontend/.env.production (ejemplo)
VITE_STELLAR_NETWORK=mainnet
VITE_STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
VITE_AUCTION_CONTRACT_ID=C…
VITE_TOKEN_CONTRACT_ID=C…
# … resto de contratos
```

5. **Cupos (`set_capacity`)**: en mainnet el cupo sigue siendo un límite administrativo registrado por el **admin on-chain** (la wallet que firmó `initialize` al redesplegar, por defecto la identidad `idio` del deployer) — no lee automáticamente el balance USDC de la wallet. El rol UI "emisor" puede usar otra wallet distinta; la mesa **Cupos** muestra el admin on-chain y bloquea la tx si la wallet conectada no coincide. Para anclar saldo real haría falta integrar el token confidencial Pedersen (roadmap).
6. Los participantes conectan **wallets mainnet** (Freighter, etc.) con XLM para fees y, si aplica, USDC para liquidación.

**Recomendación hackathon/demo:** quedarse en testnet. Mainnet solo cuando el flujo esté auditado y quieras producción con activos reales.

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
5. Actualiza `deployments.testnet.json` y `frontend/src/config.ts` (incluye campo `admin`)

**Admin on-chain vs emisor en la UI:** `set_capacity` exige la firma del admin guardado en el contrato (`deployer` / identidad `idio`), no la wallet con la que un usuario se registró como emisor. Para registrar cupos conectá `GCTXTCGN5W3QG6GARAVOIQ6WV5QBFSAVHZ6J2SJENHFKQHMU36FJAK6R` (o la que hayas pasado a `--admin` en `initialize`). Para usar otra wallet como admin hay que redesplegar con `IDENT=tu_identidad ./scripts/redeploy-auction.sh`.

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
