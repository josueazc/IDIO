# IDIO — Frontend roadmap (asignación)

Documento para el teammate que mejora el frontend. Estado base: React 18 + Vite + Tailwind, modo **Demo** (localStorage, offline) y **Testnet** (Soroban RPC + wallet). Contratos y admin en [`deployments.testnet.json`](../deployments.testnet.json) y [`frontend/src/config.ts`](../frontend/src/config.ts).

**Prioridad:** Must have → Should have → Nice to have. Cada tarea incluye objetivo, archivos, criterios de aceptación y esfuerzo (**S** = 1–2 días, **M** = 3–5 días, **L** = 1+ semana).

---

## Must have

### 1. Stellar Wallets Kit — integración sólida

| | |
|---|---|
| **Goal** | Conexión y firma confiables en Testnet con Freighter, xBull, Albedo, WalletConnect, etc. Sin caer silenciosamente a wallet demo cuando el usuario cancela el modal. |
| **Files** | `frontend/src/services/wallet.ts`, `frontend/src/components/` (header/sidebar con connect), `frontend/public/wallet-icons/`, páginas que exigen wallet (`Auctions.tsx`, `CreateAuction.tsx`, `AdminCapacity.tsx`) |
| **Acceptance** | (1) Modal del Kit lista wallets soportadas con iconos locales. (2) `signWithWallet` funciona para `create_auction`, `submit_sealed_bid`, `set_capacity`. (3) Estado conectado persiste entre recargas vía Kit (no solo `localStorage`). (4) Cancelar modal ≠ wallet demo aleatoria; mensaje claro. (5) Eventos `DISCONNECT` / `STATE_UPDATED` actualizan la UI. |
| **Effort** | **M** |

### 2. Backend real + DB (login / signup)

| | |
|---|---|
| **Goal** | Reemplazar auth demo (`localStorage`, contraseñas en claro) por API con sesiones seguras, usuarios `emisor` / `oferente`, y wallet Stellar vinculada al perfil. |
| **Suggested stack** | **Opción A (rápida):** Supabase (Postgres + Auth opcional) + Edge Functions o API Node/Hono. **Opción B (simple):** API Express/Fastify + Postgres + `bcrypt` + cookies httpOnly (`express-session` o JWT corto). Tabla mínima: `users(id, email, password_hash, role, wallet_address, display_name, jurisdiction, membership_index, created_at)`. |
| **Files** | Nuevo `backend/` o `api/`; reescribir `frontend/src/services/accounts.ts`, `auth.ts`; `AuthLogin.tsx`, `AuthSignUp.tsx`, `Account.tsx`; variables `VITE_API_URL` en `.env` |
| **Acceptance** | (1) Registro/login con email + bcrypt (nunca password en claro). (2) Sesión server-side o JWT con refresh seguro. (3) Rol fijado al signup (`emisor` \| `oferente`). (4) Wallet obligatoria en alta oferente; validación de formato G…. (5) Demo mode sigue funcionando offline sin API (flag o sin `VITE_API_URL`). |
| **Effort** | **L** |

### 3. Admin on-chain visible en `/capacity`

| | |
|---|---|
| **Goal** | Mostrar siempre la dirección admin del contrato (`get_admin` / fallback `config.onChainAdmin`) y bloquear `set_capacity` con UX clara cuando la wallet conectada ≠ admin. |
| **Files** | `frontend/src/pages/AdminCapacity.tsx`, `frontend/src/services/data.ts` (`getAuctionAdmin`), `frontend/src/services/contracts.ts`, `frontend/src/config.ts` |
| **Acceptance** | (1) Banner con admin on-chain (dirección completa + copiar + link stellar.expert). (2) Si wallet ≠ admin: botón deshabilitado + mensaje en español (ya parcialmente implementado — pulir copy y diseño). (3) Lectura on-chain al montar la página; fallback a env si el wasm no expone `get_admin`. |
| **Effort** | **S** |

### 4. Deploy Vercel + documentación de env vars

| | |
|---|---|
| **Goal** | App en producción con build estable, headers COOP/COEP para WASM del prover, y doc de variables para Testnet (y mainnet opcional). |
| **Files** | `frontend/vercel.json`, `frontend/.env.example`, `docs/DEPLOYMENT.md`, `docs/DEMO.md`, `frontend/src/config.ts` |
| **Acceptance** | (1) Root Directory = `frontend` en Vercel. (2) `vercel --prod` pasa build + rutas SPA. (3) `.env.example` lista todas las `VITE_*`: red, RPC, contratos, `VITE_ON_CHAIN_ADMIN`, `VITE_READ_SOURCE`, `VITE_COVENANT_SECRETS`, `VITE_API_URL`. (4) README enlaza pasos de deploy. (5) Prover WASM carga en prod (verificar consola sin errores COEP). |
| **Effort** | **S** |

---

## Should have

### 5. UI polish — design system consistente

| | |
|---|---|
| **Goal** | Misma tipografía, espaciado, estados vacíos/error y componentes entre subastas, ofertas y auth. |
| **Files** | `docs/FRONTEND_STYLE_GUIDE.md`, `frontend/src/components/` (`BidForm.tsx`, badges, notices), `Auctions.tsx`, `AuthLogin.tsx`, `AuthSignUp.tsx`, `Welcome.tsx`, Tailwind tokens en `index.css` |
| **Acceptance** | (1) Botones primarios/secundarios unificados. (2) Tablas y cards mobile-first coherentes. (3) Empty states y errores con el mismo patrón visual. (4) Sin regresiones en Demo y Testnet. |
| **Effort** | **M** |

### 6. Loading states — prueba ZK (30–60 s)

| | |
|---|---|
| **Goal** | Feedback claro mientras el prover WASM genera elegibilidad/reservas (en hardware lento puede tardar decenas de segundos). |
| **Files** | `frontend/src/components/BidForm.tsx`, `frontend/src/pages/CreateAuction.tsx`, `frontend/src/services/groth.ts`, posible componente `ProverProgress.tsx` |
| **Acceptance** | (1) Spinner + texto (“Generando prueba ZK… ~30–60 s en equipos lentos”). (2) UI no bloqueada sin feedback; deshabilitar submit durante proving. (3) Cancelación o timeout con mensaje útil. |
| **Effort** | **S** |

### 7. Errores Soroban decodificados

| | |
|---|---|
| **Goal** | Traducir `Error(Contract, #N)` y fallos RPC a mensajes legibles en español. |
| **Files** | `frontend/src/services/contracts.ts`, nuevo `frontend/src/services/sorobanErrors.ts`, páginas que muestran `catch` |
| **Acceptance** | (1) Mapa de códigos conocidos del contrato `auction` (ej. `InvalidInput`, `NotAllowed`, capacity). (2) Toast/banner con acción sugerida (“Pedí cupo al admin”, “Conectá Freighter”). (3) Log técnico opcional en consola para debug. |
| **Effort** | **M** |

### 8. Mobile responsive

| | |
|---|---|
| **Goal** | Flujos emisor/oferente usables en teléfono (tablas → cards, modals, wallet connect). |
| **Files** | `Auctions.tsx`, `BidForm.tsx`, layout/sidebar, `AdminCapacity.tsx`, auth pages |
| **Acceptance** | (1) Sin scroll horizontal en 375px. (2) Acciones principales accesibles sin hover. (3) BidForm y create auction completables en móvil. |
| **Effort** | **M** |

### 9. Video demo — pulido para grabación

| | |
|---|---|
| **Goal** | Flujo grabable en 2–3 min sin fricción: datos semilla, roles claros, copy en pantalla alineado con [`DEMO.md`](./DEMO.md). |
| **Files** | `docs/DEMO.md`, `Welcome.tsx`, `RolePicker.tsx`, posible modo “demo script” con tooltips, assets de marca |
| **Acceptance** | (1) Guion DEMO.md actualizado con rutas UI actuales. (2) Subasta de ejemplo creable en &lt; 2 min en Testnet. (3) Pantallas clave sin errores de consola. (4) Opcional: banner “Modo grabación” que oculta IDs técnicos. |
| **Effort** | **S** |

---

## Nice to have

### 10. i18n ES / EN

| | |
|---|---|
| **Goal** | Toggle de idioma; strings externalizados. |
| **Files** | `react-i18next` o similar, `frontend/src/locales/`, componentes con copy hardcodeado |
| **Acceptance** | ES por defecto; EN completo en rutas principales; preferencia persistida. |
| **Effort** | **M** |

### 11. E2E Playwright

| | |
|---|---|
| **Goal** | Smoke tests: login demo, toggle Demo/Testnet, listar subastas, formulario de oferta (mock prover si hace falta). |
| **Files** | `frontend/e2e/`, `playwright.config.ts`, CI workflow |
| **Acceptance** | Suite corre en CI; al menos 3 escenarios críticos verdes. |
| **Effort** | **M** |

### 12. Config mainnet opcional en UI

| | |
|---|---|
| **Goal** | Documentar y, si aplica, selector de red mainnet con env de producción separado (sin mezclar IDs testnet). |
| **Files** | `frontend/src/config.ts`, `deployments.mainnet.json` (futuro), `docs/DEPLOYMENT.md`, env en Vercel |
| **Acceptance** | (1) Doc clara: mainnet ≠ toggle mágico; requiere deploy de contratos + XLM real. (2) Si se implementa selector: warning modal antes de operar en pubnet. (3) Variables `VITE_*` distintas por entorno Vercel (preview vs production). |
| **Effort** | **S** (solo doc) · **M** (selector UI) |

---

## Referencia rápida

| Concepto | Valor Testnet |
|----------|----------------|
| Auction | `CAY7Z6TRRXDRGVYWBNSYVGXMRLW47XF2BGM4YBN2NWJNPU6R66UVOKRR` |
| Admin (`idio`) | `GCTXTCGN5W3QG6GARAVOIQ6WV5QBFSAVHZ6J2SJENHFKQHMU36FJAK6R` |
| ZK elegibilidad | Groth16: `capacity ≥ bid ≥ min` + commitment `SHA-256(be16(bid)‖salt)` — **no** saldo de wallet aún |
| Deploy | Root `frontend/`, config `frontend/vercel.json` |

Docs relacionados: [FRONTEND_GUIDE](./FRONTEND_GUIDE.md) · [FRONTEND_STYLE_GUIDE](./FRONTEND_STYLE_GUIDE.md) · [DEPLOYMENT](./DEPLOYMENT.md) · [DEMO](./DEMO.md) · [ROADMAP general](./ROADMAP.md)
