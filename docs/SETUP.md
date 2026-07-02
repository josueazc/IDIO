# Setup

## Requisitos del sistema

| Herramienta | Versión mínima | Para |
|-------------|----------------|------|
| Node.js | ≥ 18 | Frontend |
| npm | ≥ 9 | Frontend |
| Rust + `wasm32-unknown-unknown` | estable | Contratos |
| [Stellar CLI](https://developers.stellar.org/docs/tools/cli) | ≥ 21 | Deploy |
| [Nargo (Noir)](https://noir-lang.org) | ≥ 0.30 | Circuitos |

```bash
rustup target add wasm32-unknown-unknown
```

---

## 1. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

La app funciona sin wallet ni contratos desplegados: usa un **modo demo** con
datos sembrados en `localStorage`. El botón **Reset demo** reinicia la sesión.

Para apuntar a contratos reales en Testnet, copiá `.env.example` a `.env` y
rellenó los IDs de contrato:

```bash
cp frontend/.env.example frontend/.env
# Editá frontend/.env con los IDs de deployments.testnet.json
```

Variables principales:

| Variable | Descripción |
|----------|-------------|
| `VITE_AUCTION_CONTRACT_ID` | ID del contrato auction en Testnet |
| `VITE_VERIFIER_CONTRACT_ID` | ID del verifier Groth16 |
| `VITE_TOKEN_CONTRACT_ID` | ID del token confidencial |
| `VITE_ASP_CONTRACT_ID` | ID del contrato ASP (allow-list) |
| `VITE_DEFAULT_MODE` | `demo` o `chain` |
| `VITE_ON_CHAIN_ADMIN` | Dirección G... del admin en Testnet |

---

## 2. Backend (opcional — solo para auth real)

El backend implementa autenticación con bcrypt + sesiones httpOnly en lugar del
`localStorage` plano del modo demo.

```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

Configurable con `.env`:

```bash
PORT=3001
SESSION_SECRET=change-this-in-production
FRONTEND_ORIGIN=http://localhost:5173
```

Rutas disponibles:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/health` | Estado del servidor |

Apuntá el frontend al backend editando:

```
VITE_API_URL=http://localhost:3001
```

---

## 3. Contratos

```bash
cd contracts
cargo test                                          # tests unitarios
cargo build --target wasm32-unknown-unknown --release
```

Los 4 contratos están en `contracts/`:
- `auction` — subasta sellada con prueba ZK de elegibilidad
- `verifier` — verificador Groth16 BN254 on-chain
- `token` — token con balance confidencial (Pedersen)
- `asp` — allow-list ZK para cumplimiento

---

## 4. Circuitos

```bash
cd circuits
nargo test         # tests de los circuitos
nargo build        # compila a ACIR (Noir)
```

Circuitos disponibles:
- `sealed_bid` — prueba de elegibilidad: `capacity ≥ bid ≥ min`
- `proof_of_reserves` — prueba de reservas del emisor

---

## 5. Prover WASM (arkworks)

El prover WASM se compila desde el crate `prover/` con wasm-pack:

```bash
cd prover
wasm-pack build --target web --out-dir ../frontend/src/wasm
```

El resultado se incluye en el bundle de Vite. El prover genera pruebas Groth16
directamente en el navegador (~1–3 s en hardware moderno).

---

## 6. Deploy a Testnet

Ver [DEPLOYMENT.md](DEPLOYMENT.md) o ejecutá directamente:

```bash
bash scripts/deploy.sh
```

Los IDs de contrato desplegados se encuentran en `deployments.testnet.json`.
