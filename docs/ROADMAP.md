# IDIO — Roadmap a producto real

Estado de cada cosa para pasar de **MVP de hackathon** (lo que hay) a **producto
institucional auditado**. Honesto: marca qué está hecho, qué es ingeniería
pendiente, qué es research-grade y qué depende de terceros.

Leyenda: ✅ hecho · 🟦 buildable (puedo hacerlo) · 🟣 research-grade (incierto) ·
🟥 depende de terceros / cuentas / semanas

---

## 0. Hecho y verificado on-chain
- ✅ Subastas selladas (commit → reveal → settle)
- ✅ Puente ZK navegador→cadena: Groth16/BN254 (elegibilidad + reservas) verificado on-chain
- ✅ Token confidencial Pedersen (balances ocultos)
- ✅ Pago/liquidación confidencial (cross-contract)
- ✅ Covenant: allowlist ZK (Merkle membership + nullifier) — en el ASP, testeado
- ✅ Auspex+: política de reservas (solvencia + ratio de liquidez) — activo
- ✅ BEShield: consenso k-de-n con ZK — cableado, testeado
- ✅ Separación por rol, filtros por tipo, perfil de banco, reemplazo de oferta, transparencia post-cierre, verificador de apertura
- ✅ **Binding elegibilidad ↔ cupo registrado**: la prueba demuestra `capacidad ≥ oferta ≥ mínimo` con la `capacity` registrada on-chain por el admin como entrada pública. Una oferta por encima del cupo no puede generar prueba válida (antes el `balance` era autodeclarado y no verificado).
- ✅ ~26 tests verdes en las 4 capas

## 1. Solidez criptográfica (anti-trampa) — lo más importante
- 🟣 **Binding elegibilidad ↔ saldo confidencial**: el cupo (`capacity`) ya está atado on-chain, pero es público. Atarlo a un *saldo confidencial* (sin revelar el cupo) requiere EC in-circuit sobre una curva 2-ciclo (BN254/Grumpkin); Soroban expone BN254/BLS pero no Grumpkin — paso de endurecimiento restante.
- 🟣 **Solvencia confidencial del token** (`monto ≤ balance` ligado al compromiso Pedersen). Mismo problema 2-ciclo.
- 🟣 **Reservas atadas a activos reales** (oráculo/prueba de custodia), no a números declarados.
- 🟦 **Unificar Noir↔Groth16** en un solo sistema de prueba.
- 🟦 **Trusted setup ceremony** real (multi-parte) en vez de semilla fija.
- 🟦 Generadores nothing-up-my-sleeve auditables y reproducibles.

## 2. Contratos (endurecimiento)
- 🟦 **Activar Covenant como gating por defecto** del bid (requiere también provisión de credenciales a los bancos).
- 🟦 Edge cases: empates, cancelaciones, reveal tardío, expiraciones, reentrancy.
- 🟦 Reembolsos / depósitos / penalización por no-pago (slashing).
- 🟦 Upgradeabilidad + pausa de emergencia + versionado.
- 🟦 Anti-spam (fees, rate-limit).
- 🟦 Eventos estandarizados para indexación.

## 3. BEShield / consenso
- 🟥 **Red real de validadores** (entidades independientes con llaves).
- 🟦 Firmas/identidad ligadas al voto; orquestación off-chain (timeouts, heartbeat).

## 4. Identidad / compliance
- 🟥 **KYC/AML real** emitido por un regulador (caducidad + revocación).
- 🟦 Credenciales verificables con TTL on-chain.
- 🟦 View keys reales por auditor (cifrar la apertura a su clave pública).
- 🟥 Marco legal/jurisdiccional, custodia.

## 5. Dinero real / settlement
- 🟥 **Mainnet** con activo real (USDC/EURC) en vez del token de prueba.
- 🟥 **RWA tokenizado real** y su custodia.
- 🟥 On/off-ramp fiat ↔ stablecoin.

## 6. Wallet / llaves / UX de seguridad
- 🟦 Gestión segura de secretos del usuario (salt/openings): cifrado + backup + multi-dispositivo.
- 🟥 Multi-firma / custodia institucional.
- 🟦 Estados de error/carga del modo Testnet.

## 7. Frontend / producto
- 🟦 Flujo en vivo pulido end-to-end con wallet.
- 🟦 Notificaciones (cierre, ganaste, hora de revelar/pagar).
- 🟦 Indexador/backend de lectura (no iterar IDs).
- 🟦 i18n, accesibilidad, responsive fino.

## 8. Infraestructura / ops
- 🟥 **Deploy público** (Vercel/Netlify — configs incluidas, falta tu cuenta).
- 🟦 CI/CD completo (4 capas + deploy).
- 🟦 Observabilidad (logs, métricas, alertas).
- 🟦 Análisis de costos/gas por operación.

## 9. Seguridad
- 🟥 **Auditoría externa** (contratos + circuitos).
- 🟦 Pruebas adversariales / fuzzing / property testing.
- 🟣 Verificación formal de los circuitos.
- 🟥 Bug bounty pre-mainnet.

## 10. Testing / calidad
- 🟦 Cobertura E2E, fallos, concurrencia.
- 🟦 Tests de componentes/flujo en frontend.
- 🟦 Tests de carga.

## 11. Documentación / negocio
- 🟦 Whitepaper + modelo de amenazas.
- 🟦 Modelo de negocio (fees, incentivos de validadores).
- 🟦 Docs de usuario por rol.

## Para el hackathon (bloqueante de entrega)
- 🟥 **Video demo** (guion en docs/DEMO.md) — requiere grabación.
- 🟥 **Deploy público** — requiere tu cuenta.

---

### Cómo leerlo
- 🟦 = lo puede hacer un dev/agente (semanas de ingeniería, sin sorpresas).
- 🟣 = research-grade: puede no salir limpio en un intento (2-cycle, verificación formal).
- 🟥 = no es código: terceros (auditores, reguladores, validadores), dinero real o cuentas.

El siguiente paso de mayor impacto técnico es el **#1 binding anti-trampa**
(atar las pruebas a dinero/activos reales). Es lo que convierte el "te juro"
en "comprobado". Es 🟣 (research-grade) y de alto riesgo, pero es el corazón.
