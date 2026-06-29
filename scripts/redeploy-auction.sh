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

echo "▶ Generando verifying keys vigentes…"
VK_OUT="$(cd prover && cargo run --quiet --bin vk --release 2>/dev/null)"
ELIG_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^ELIG_VK=//p')"
RESERVES_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^RESERVES_VK=//p')"

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

echo "✅ Listo. Nueva subasta: $AUCTION"
echo "   Actualiza frontend/src/config.ts (auction) o VITE_AUCTION_CONTRACT_ID."
