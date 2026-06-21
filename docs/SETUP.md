# Setup

## Requisitos

| Herramienta | Versión | Para |
|-------------|---------|------|
| Node.js | ≥ 18 | Frontend |
| Rust + `wasm32-unknown-unknown` | estable | Contratos |
| [Stellar CLI](https://developers.stellar.org/docs/tools/cli) | ≥ 21 | Deploy |
| [Nargo (Noir)](https://noir-lang.org) | ≥ 0.30 | Circuitos |

```bash
rustup target add wasm32-unknown-unknown
```

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

La app funciona sin wallet ni contratos desplegados: usa un modo demo con
datos sembrados en `localStorage`. Botón **Reset demo** para reiniciar.

Para apuntar a contratos reales, copia `.env.example` a `.env` y rellena
los `VITE_*_CONTRACT_ID` tras el deploy.

## Contratos

```bash
cd contracts
cargo test                                          # tests unitarios
cargo build --target wasm32-unknown-unknown --release
```

## Circuitos

```bash
cd circuits
nargo test         # tests de los circuitos
nargo build        # compila a ACIR
```

## Deploy a testnet

Ver [DEPLOYMENT.md](DEPLOYMENT.md) o `scripts/deploy.sh`.
