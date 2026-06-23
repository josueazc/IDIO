# Demo: despliegue público y guion de video

## Despliegue público (Vercel)

El frontend ya trae `frontend/vercel.json` con los headers COOP/COEP que
necesita el prover WASM. Pasos (requieren tu cuenta de Vercel):

```bash
cd frontend
npm i -g vercel        # si no lo tenés
vercel login
vercel --prod          # primera vez: elige "frontend" como root, framework Vite
```

En el panel de Vercel: **Root Directory = `frontend`**. No hace falta backend:
la app lee los contratos por RPC y firma con Freighter. Para cambiar la red o
los IDs, definí variables `VITE_*` en Vercel (ver `frontend/src/config.ts`).

Alternativa Netlify: build `npm run build`, publish `dist`, y replicar los dos
headers COOP/COEP en `netlify.toml`.

## Guion de video (2-3 min)

1. **Problema (15s).** "Las subastas de bonos son opacas o públicas; no hay
   privacidad con verificabilidad." Mostrar el dashboard.
2. **Rol Emisor (35s).** Elegir "Banco Emisor" → Crear subasta. Al enviar, el
   navegador genera una **prueba de reservas Groth16** y el contrato la
   verifica on-chain. Mostrar la subasta nueva.
3. **Rol Oferente (45s).** Cambiar a "Banco Oferente" → Ofertar. Mostrar que el
   navegador genera la **prueba de elegibilidad Groth16 (~1.3s)** y que el
   contrato la exige/verifica. En `get_bids` (o stellar.expert) mostrar que en
   cadena solo está el hash: el monto NO aparece.
4. **Cierre y liquidación (30s).** Tras el cierre: revelar y liquidar; el ganador
   paga con **token confidencial** (compromiso Pedersen, monto oculto).
5. **Rol Auditor (30s).** Cambiar a "Auditor": con la apertura, `verify_opening`
   confirma el balance sin que el público vea el monto.
6. **Cierre (15s).** "Privado para los participantes, verificable para los
   reguladores, todo sobre Stellar." Mostrar los contratos en stellar.expert.

## Verificación rápida en testnet (para mostrar en cámara)

```bash
# Subasta real on-chain (el monto de la oferta NO aparece)
stellar contract invoke --id CCVBKMZ5ECSTK7QMICWIPIXVFPZN2DHNW7UQNK3ZAJ3VLWFEWFY2TS7R \
  --source idio --network testnet -- get_bids --auction_id 1
```
