# Demo: despliegue público y guion de video

## Despliegue público (Vercel)

**Demo en vivo:** [https://idio-josueazcs-projects.vercel.app](https://idio-josueazcs-projects.vercel.app)

El frontend incluye `frontend/vercel.json` con los headers COOP/COEP requeridos
por el prover WASM (SharedArrayBuffer). Pasos para desplegar:

```bash
cd frontend
npm i -g vercel          # si no lo tenés
vercel login
vercel --prod            # primera vez: elige "frontend" como root, framework Vite
```

En el panel de Vercel: **Root Directory = `frontend`**. El backend es opcional:
la app lee los contratos por RPC pública y firma con Freighter/SWK.

Para cambiar la red o los IDs de contrato, definí variables `VITE_*` en el
panel de Vercel (o en `frontend/.env`). Ver `frontend/src/config.ts`.

**Alternativa Netlify:** build `npm run build`, publish `dist`, replicar los
headers COOP/COEP en `netlify.toml`.

---

## Flujo de la UI (estado actual)

### Pantallas y rutas

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Todos | Dashboard: métricas, tabla de subastas, ZK stack info |
| `/auctions` | Todos | Registro de subastas con filtros segmentados |
| `/create` | Emisor | Formulario de emisión + prueba de reservas |
| `/capacity` | Emisor | Cupos de los oferentes (admin) |
| `/audit` | Emisor | Auditoría con view key + descarga SHA-256 |
| `/compliance` | Emisor | Allow-list y cumplimiento regulatorio |
| `/activity` | Todos | Historial de emisiones, ofertas y aperturas |
| `/account` | Todos | Perfil + wallet completa + stellar.expert |
| `/banco/:addr` | Todos | Perfil público del emisor (solo lectura) |
| `/login` | — | Autenticación |

### Modos de operación

**Demo** (por defecto):
- Datos en `localStorage` del navegador
- Cualquier email y contraseña funcionan
- La prueba ZK es simulada (instantánea)
- No requiere wallet ni conexión a Stellar

**Testnet** (requiere wallet Freighter):
- Lee y escribe contra los contratos en Stellar Testnet
- Prueba Groth16 real generada en WASM (~1–3 s)
- El toggle Demo/Testnet está en la sidebar

---

## Guion de video (2–3 min)

### 1. Problema (15s)
"Las subastas de bonos son opacas o públicas: no hay privacidad con
verificabilidad." Mostrar el **dashboard** con el stack ZK panel.

### 2. Rol Emisor (35s)
- Elegir "Emisor" en Welcome → Registrarse
- Crear subasta con plantilla "Bono soberano"
- Al enviar: la barra `ProverProgress` muestra el avance de la prueba
- El contrato verifica la prueba Groth16 on-chain
- Mostrar la subasta nueva en `/auctions`

### 3. Rol Oferente (45s)
- Cambiar a "Oferente" → Registrarse con otro email
- Ir a `/auctions` → Abrir subasta → Ofertar
- El prover WASM genera la prueba de elegibilidad (~1.3 s en Testnet)
- En stellar.expert: mostrar que el contrato solo guarda el hash (monto invisible)

### 4. Cierre y liquidación (30s)
- Tras el cierre: revelar y liquidar desde el panel de inspección
- El ganador paga con token confidencial (Pedersen `v·G + r·H`)
- El monto del pago no es visible públicamente

### 5. Rol Auditor (30s)
- Ir a `/audit` (rol Emisor) con view key
- Con la apertura `(monto, salt)`, `verify_opening` confirma el balance
- Sin la apertura: el público solo ve el hash
- Descargar informe firmado (JSON + SHA-256)

### 6. Cierre (15s)
"Privado para los participantes, verificable para los reguladores, todo en
Stellar." Mostrar los contratos en stellar.expert.

---

## Verificación rápida en Testnet

```bash
# Listar subastas — el monto de las ofertas NO aparece (solo hash)
stellar contract invoke \
  --id CAY7Z6TRRXDRGVYWBNSYVGXMRLW47XF2BGM4YBN2NWJNPU6R66UVOKRR \
  --source idio --network testnet -- get_bids --auction_id 1

# Ver compromiso Pedersen del token de un banco
stellar contract invoke \
  --id <TOKEN_CONTRACT_ID> \
  --source idio --network testnet -- commitment --account <BANK_ADDRESS>
```

---

## Cuentas de demo preconfiguradas

En modo Demo, registrá cualquier email/contraseña. Para una demo más rápida:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| emisor@demo.idio | demo123 | Emisor |
| banco@demo.idio | demo123 | Oferente |

*(Estas cuentas se crean al registrarse por primera vez — los datos viven en localStorage.)*
