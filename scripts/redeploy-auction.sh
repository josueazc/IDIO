#!/usr/bin/env bash
# Redespliega el contrato de subasta (idio-auction) en Stellar Testnet,
# lo inicializa con las verifying keys Groth16 vigentes y registra el cupo
# (capacity) de los bancos de demo.
#
# Si el ASP desplegado no expone `set_membership` (versión antigua), redespliega
# el ASP, configura Covenant y vuelve a inicializar la subasta con el ASP nuevo.
#
# Uso:  ./scripts/redeploy-auction.sh
# Reqs: stellar 26.x, identidad 'idio' fondeada, contratos token/verifier ya
#       desplegados (se reutilizan; ver deployments.testnet.json).
set -euo pipefail

cd "$(dirname "$0")/.."

# Cursor (y otros entornos) a veces inyectan HTTP_PROXY y rompen `stellar`.
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy \
  SOCKS_PROXY SOCKS5_PROXY socks_proxy socks5_proxy

IDENT="${IDENT:-idio}"
NETWORK="${NETWORK:-testnet}"
HORIZON="${HORIZON:-https://horizon-testnet.stellar.org}"
FRIENDBOT="${FRIENDBOT:-https://friendbot.stellar.org}"

ASP="$(jq -r .contracts.asp deployments.testnet.json)"
TOKEN="$(jq -r .contracts.token deployments.testnet.json)"
VERIFIER="$(jq -r .contracts.verifier deployments.testnet.json)"
ADMIN="$(stellar keys address "$IDENT")"

COVENANT_SECRETS="${COVENANT_SECRETS:-1,2,3,4,5,6,7,8}"
REDEPLOY_ASP="${REDEPLOY_ASP:-auto}" # auto | 1 | 0

ensure_funded() {
  local addr="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$HORIZON/accounts/$addr" || true)"
  if [ "$code" = "200" ]; then
    echo "  cuenta $addr ya existe on-chain"
    return 0
  fi
  echo "  fondeando $addr vía friendbot…"
  curl -sf "$FRIENDBOT/?addr=$addr" >/dev/null
  sleep 2
}

should_redeploy_asp() {
  case "$REDEPLOY_ASP" in
    1|true|yes) return 0 ;;
    0|false|no) return 1 ;;
    auto)
      local probe
      probe="$(stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
        set_membership --help 2>&1 || true)"
      if printf '%s' "$probe" | grep -q 'unrecognized subcommand'; then
        echo "  ASP desplegado sin API Covenant; se redespliega."
        return 0
      fi
      return 1
      ;;
    *) return 1 ;;
  esac
}

sync_config() {
  local auction_id="$1"
  local asp_id="$2"
  local prev_auction prev_asp
  prev_auction="$(jq -r .contracts.auction deployments.testnet.json)"
  prev_asp="$(jq -r .contracts.asp deployments.testnet.json)"

  echo "▶ Actualizando deployments.testnet.json…"
  tmp="$(mktemp)"
  jq --arg a "$auction_id" --arg s "$asp_id" --arg admin "$ADMIN" \
    '.contracts.auction = $a | .contracts.asp = $s | .admin = $admin | .deployer = $admin' deployments.testnet.json > "$tmp" \
    && mv "$tmp" deployments.testnet.json

  echo "▶ Sincronizando frontend/src/config.ts…"
  if [ -n "$prev_auction" ] && [ "$prev_auction" != "$auction_id" ]; then
    sed -i.bak "s/$prev_auction/$auction_id/g" frontend/src/config.ts && rm -f frontend/src/config.ts.bak
  fi
  if [ -n "$prev_asp" ] && [ "$prev_asp" != "$asp_id" ]; then
    sed -i.bak "s/$prev_asp/$asp_id/g" frontend/src/config.ts && rm -f frontend/src/config.ts.bak
  fi
}

echo "▶ Comprobando fondos de '$IDENT'…"
ensure_funded "$ADMIN"

echo "▶ Generando verifying keys vigentes…"
VK_OUT="$(cd prover && cargo run --quiet --bin vk --release 2>/dev/null)"
ELIG_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^ELIG_VK=//p')"
RESERVES_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^RESERVES_VK=//p')"
MEMBERSHIP_VK="$(printf '%s\n' "$VK_OUT" | sed -n 's/^MEMBERSHIP_VK=//p')"

echo "▶ Calculando raíz del Covenant (secretos: $COVENANT_SECRETS)…"
MEMBERSHIP_ROOT="$(cd prover && cargo run --quiet --bin covenant --release -- "$COVENANT_SECRETS" 2>/dev/null | sed -n 's/^MEMBERSHIP_ROOT=//p')"

echo "▶ Compilando wasm…"
(cd contracts && cargo build --target wasm32v1-none --release -p idio-asp -p idio-auction >/dev/null 2>&1)

if should_redeploy_asp; then
  echo "▶ Redesplegando ASP (Covenant)…"
  ASP_WASM="contracts/target/wasm32v1-none/release/idio_asp.wasm"
  ASP="$(stellar contract deploy --wasm "$ASP_WASM" --source "$IDENT" --network "$NETWORK" 2>/dev/null)"
  echo "  asp = $ASP"
  stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
    initialize --admin "$ADMIN" >/dev/null
  echo "▶ Configurando Covenant en el ASP (root=$MEMBERSHIP_ROOT)…"
  stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
    set_membership \
    --root "$MEMBERSHIP_ROOT" --vk "$MEMBERSHIP_VK" --verifier "$VERIFIER" >/dev/null
else
  echo "▶ Reutilizando ASP $ASP"
  if [ "${CONFIGURE_COVENANT:-1}" = "1" ]; then
    echo "▶ Actualizando Covenant en el ASP (root=$MEMBERSHIP_ROOT)…"
    stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
      set_membership \
      --root "$MEMBERSHIP_ROOT" --vk "$MEMBERSHIP_VK" --verifier "$VERIFIER" >/dev/null
  fi
fi

AUCTION_WASM="contracts/target/wasm32v1-none/release/idio_auction.wasm"
echo "▶ Desplegando subasta…"
AUCTION="$(stellar contract deploy --wasm "$AUCTION_WASM" --source "$IDENT" --network "$NETWORK" 2>/dev/null)"
echo "  auction = $AUCTION"

echo "▶ Inicializando subasta…"
stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- \
  initialize \
  --admin "$ADMIN" --asp "$ASP" --token "$TOKEN" --verifier "$VERIFIER" \
  --elig_vk "$ELIG_VK" --reserves_vk "$RESERVES_VK" >/dev/null

for BANK in "${BANKS[@]:-}"; do
  [ -z "$BANK" ] && continue
  echo "▶ allow $BANK en ASP"
  stellar contract invoke --id "$ASP" --source "$IDENT" --network "$NETWORK" -- \
    allow --who "$BANK" >/dev/null || true
  echo "▶ set_capacity $BANK = ${CAPACITY:-50000000}"
  stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- \
    set_capacity --who "$BANK" --capacity "${CAPACITY:-50000000}" >/dev/null
done

sync_config "$AUCTION" "$ASP"

VER="$(stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- version 2>/dev/null || echo '?')"
GATE="$(stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- get_bid_gate_zk 2>/dev/null || echo '?')"
ONCHAIN_ADMIN="$(stellar contract invoke --id "$AUCTION" --source "$IDENT" --network "$NETWORK" -- get_admin 2>/dev/null || echo "$ADMIN")"

echo "✅ Listo."
echo "   asp              = $ASP"
echo "   auction          = $AUCTION"
echo "   admin (on-chain) = $ONCHAIN_ADMIN"
echo "   covenant root    = $MEMBERSHIP_ROOT"
echo "   version()        = $VER"
echo "   get_bid_gate_zk  = $GATE"
echo "   config.ts + deployments.testnet.json actualizados."
