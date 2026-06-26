# Guía de Frontend — trabajar sin romper el backend

> Para el compañero de frontend (y su agente de IA). Léela completa antes de tocar código.
> Regla de oro: **el frontend NO toca contratos, circuitos, prover ni los IDs desplegados.**

---

## TL;DR para el agente de IA

```
PODÉS editar:   frontend/src/{pages,components}/**, frontend/src/index.css, tailwind.config.js
PODÉS leer:     frontend/src/services/**, frontend/src/utils/**, frontend/src/types.ts
NO toques:      contracts/**, prover/**, circuits/**, deployments.testnet.json,
                frontend/src/config.ts, frontend/src/prover-wasm/**,
                frontend/src/services/{contracts,data,groth,noir,proofs,store,role,wallet}.ts
NO cambies:     la firma de las funciones de services/data.ts ni los IDs de contratos
Antes de pushear: `npm run lint` y `npm test` deben pasar
```

---

## Qué es backend y qué es frontend acá

| Carpeta | Qué es | ¿Frontend la toca? |
|---------|--------|--------------------|
| `contracts/` | Contratos Soroban (Rust) | ❌ NO |
| `prover/` | Circuitos Groth16 + prover WASM | ❌ NO |
| `circuits/` | Circuitos Noir | ❌ NO |
| `frontend/src/services/` | Capa de datos (cadena, ZK, store) | ⚠️ solo leer/usar, no reescribir |
| `frontend/src/pages/` | Pantallas | ✅ SÍ |
| `frontend/src/components/` | Componentes UI | ✅ SÍ |
| `frontend/src/index.css`, `tailwind.config.js` | Estilos | ✅ SÍ |

**La frontera real:** todo lo que toca la blockchain o el ZK vive en `frontend/src/services/`. El frontend (pages/components) **consume** esa capa pero no la modifica. Si necesitás un dato nuevo de la cadena, pedilo (no lo agregues vos en `contracts.ts`).

---

## Cómo correr

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

- **Modo Demo** (toggle arriba): funciona **offline**, con datos sembrados. Usalo para desarrollar UI sin wallet.
- **Modo Testnet**: lee de los contratos reales; escribir requiere la wallet (Freighter/Stellar Wallets Kit).

Para desarrollar UI, **quedate en modo Demo**: no necesitás wallet ni red.

---

## La capa de datos (lo único que tenés que entender)

Toda la data pasa por `frontend/src/services/data.ts`. **Usá estas funciones; no llames a `contracts.ts` ni `store.ts` directo.**

```ts
import { loadAuctions, createAuction, submitBid, settle, payWinner,
         revealBid, getMode, setMode } from '../services/data'

// Leer subastas (Demo o Testnet, según el toggle):
const auctions = await loadAuctions()          // Auction[]

// Hooks listos para usar en componentes:
import { useAuctions } from '../utils/useAuctions'   // { auctions, loading, error }
import { useRole } from '../utils/useRole'           // 'emisor' | 'oferente' | 'auditor' | 'regulador' | null
```

Tipos en `frontend/src/types.ts` (`Auction`, `SealedBid`, `AssetType`, etc.).
**No cambies estos tipos** sin avisar — el backend depende de ellos.

---

## Roles (no romper el control de acceso)

Los roles y permisos están en `frontend/src/services/role.ts`:

```ts
import { can, ROLE_ROUTES } from '../services/role'
can(role, 'bid')      // ¿este rol puede ofertar?
can(role, 'create')   // ¿puede crear?
// acciones: 'create' | 'bid' | 'settle' | 'pay' | 'audit' | 'comply'
```

Reglas que **no** se deben aflojar:
- Cada acción se muestra solo si `can(role, accion)` es true.
- Los montos de las ofertas **no** se muestran hasta que la subasta esté `Settled` (privacidad). Para mostrar resultados usá `<BidResults>` (ya respeta esto).

Si agregás una pantalla nueva, sumá su ruta a `ROLE_ROUTES` del rol correcto (y a la guarda en `App.tsx`).

---

## Sistema de diseño (usalo, no inventes)

Usá los primitivos de `frontend/src/components/Primitives.tsx` (`PageHeader`, `RuledPanel`, `Metric`, `EmptyState`, etc.) y las clases utilitarias ya definidas en `index.css` (`.btn-primary`, `.btn-ghost`, `.input`, `.label`, `.card`, `.pill`, `.micro-label`, `.data-row`). Mantené el estilo: bordes finos, monoespaciado para datos, paleta oscura.

Componentes reutilizables existentes: `AuctionCard`, `BidForm`, `BidResults`, `StatusBadge`, `ConfidentialBalance`, `OpeningVerifier`, `WalletConnect`, `ModeToggle`.

---

## Qué NO hacer (te rompe el backend / la demo)

1. ❌ Cambiar IDs de contratos en `config.ts` o `deployments.testnet.json`.
2. ❌ Editar `services/contracts.ts`, `groth.ts`, `noir.ts`, `proofs.ts` (criptografía/cadena).
3. ❌ Regenerar o tocar `frontend/src/prover-wasm/**` (sale del crate Rust `prover/`).
4. ❌ Cambiar firmas/retornos de `services/data.ts` (las pantallas y el backend dependen de eso).
5. ❌ Mostrar montos de ofertas antes del cierre.
6. ❌ `npm install` de librerías nuevas sin necesidad (puede romper el build del WASM/headers COOP/COEP).

## Qué SÍ podés hacer libremente

- Rediseñar/mejorar cualquier `page` o `component` visual.
- Crear componentes nuevos en `components/`.
- Ajustar estilos (`index.css`, `tailwind.config.js`).
- Mejorar estados de carga, errores, responsive, accesibilidad, animaciones.
- Agregar pantallas (recordá registrar la ruta + permiso de rol).

---

## Checklist antes de hacer commit/PR

```bash
cd frontend
npm run lint     # tsc --noEmit, sin errores de tipos
npm test         # vitest, todo verde
npm run build    # build de producción OK (incluye el WASM)
```

Si los tres pasan y no tocaste nada de la lista "NO hacer", tu cambio es seguro.

## Si necesitás algo del backend

¿Falta un dato de la cadena, una función del contrato, o un cambio en la capa ZK?
**No lo implementes en el frontend.** Anotalo y pasáselo al de backend:
> "Necesito que `data.ts` exponga X" / "Necesito que el contrato devuelva Y".

Así el frontend y el backend no se pisan.
