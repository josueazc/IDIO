#!/usr/bin/env bash
# Redespliega el contrato de subasta (idio-auction) en Stellar Testnet,
# lo inicializa con las verifying keys Groth16 vigentes y registra el cupo
# (capacity) de los bancos de demo.
#
# Por qué existe: la prueba de elegibilidad ahora ata la oferta a la capacidad
# registrada on-chain (capacidad >= oferta >= minimo). Al cambiar el circuito
# cambia la ELIG_VK, por lo que el contrato debe reinicializarse con la nueva.
#
# Uso:  ./scripts/redeploy-auction.sh
# Reqs: stellar 26.x, identidad 'idio' fondeada, contratos asp/token/verifier ya
#       desplegados (se reutilizan; ver deployments.testnet.json).
set -euo pipefail

cd "$(dirname "$0")/.."

IDENT="${IDENT:-idio}"
NETWORK="${NETWORK:-testnet}"

ASP="$(jq -r .contracts.asp deployments.testnet.json)"
TOKEN="$(jq -r .contracts.token deployments.testnet.json)"
VERIFIER="$(jq -r .contracts.verifier deployments.testnet.json)"
ADMIN="$(stellar keys address "$IDENT")"

# Secretos del set de miembros del Covenant. DEBEN coincidir con
# frontend/src/config.ts (config.covenant.secretsCsv).
COVENANT_SECRETS="${COVENANT_SECRETS:-1,2,3,4,5,6,7,8}"

echo "▶ Generando verifying keys vigentes…"
VK_OUT="$(cd prover && cargo run --quiet --bin vk --release 2>/dev/null)"
ELIG_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^ELIG_VK=//p')"
RESERVES_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^RESERVES_VK=//p')"
MEMBERSHIP_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^MEMBERSHIP_VK=//p')"

echo "▶ Calculando raíz del Covenant (secretos: $COVENANT_SECRETS)…"
MEMBERSHIP_ROOT="$(cd prover && cargo run --quiet --bin covenant --release -- "$COVENANT_SECRETS" 2>/dev/null | sed -n 's/^MEMBERSHIP_ROOT=//p')"

echo "▶ Compilando wasm…"
(cd contracts && cargo build --target wasm32v1-none --release -p idio-auction >/dev/null 2>&1)
WASM="contracts/target/wasm32v1-none/release/idio_auction.wasm"

echo "▶ Desplegando subasta…"
AUCTION="$(stellar contract deploy --wasm "$WASM" --source "$IDENT" --network "$NETWORK" 2>/dev/null)"
echo "  auction = $AUCTION"

echo "▶ Inicializando…"
stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- \
  initialize \
  --admin "$ADMIN" --asp "$ASP" --token "$TOKEN" --verifier "$VERIFIER" \
  --elig_vk "$ELIG_VK" --reserves_vk "$RESERVES_VK" >/dev/null

# Configura el Covenant en el ASP (allow-list ZK): raíz Merkle del set de
# miembros + VK de membresía + verifier. Deja el gate ZK del bid como default.
if [ "${CONFIGURE_COVENANT:-1}" = "1" ]; then
  echo "▶ Configurando Covenant en el ASP (root=$MEMBERSHIP_ROOT)…"
  stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
    set_membership \
    --root "$MEMBERSHIP_ROOT" --vk "$MEMBERSHIP_VK" --verifier "$VERIFIER" >/dev/null
fi

# Registra cupo a los bancos de demo (ajusta a tus direcciones reales).
for BANK in "${BANKS[@]:-}"; do
  [ -z "$BANK" ] && continue
  echo "▶ set_capacity $BANK = ${CAPACITY:-50000000}"
  stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- \
    set_capacity --who "$BANK" --capacity "${CAPACITY:-50000000}" >/dev/null
done

echo "▶ Actualizando deployments.testnet.json…"
tmp="$(mktemp)"
jq --arg a "$AUCTION" '.contracts.auction = $a' deployments.testnet.json > "$tmp" && mv "$tmp" deployments.testnet.json

echo "▶ Sincronizando frontend/src/config.ts…"
PREV_AUCTION="$(sed -n "s/.*VITE_AUCTION_CONTRACT_ID ??[[:space:]]*'\([A-Z0-9]*\)'.*/\1/p" frontend/src/config.ts | head -1)"
if [ -n "$PREV_AUCTION" ]; then
  # El default del auction ocupa dos líneas; reemplazamos el id anterior.
  sed -i.bak "s/$PREV_AUCTION/$AUCTION/g" frontend/src/config.ts && rm -f frontend/src/config.ts.bak
fi

echo "✅ Listo."
echo "   auction          = $AUCTION"
echo "   covenant root    = $MEMBERSHIP_ROOT"
echo "   config.ts + deployments.testnet.json actualizados."
