#!/usr/bin/env bash
# Despliega los 4 contratos de IDIO en Stellar Testnet e imprime sus IDs.
# Requiere: stellar CLI, una identidad fondeada (por defecto "idio").
# Tras desplegar, inicializa con scripts/init.sh o manualmente (ver DEPLOYMENT.md).
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-idio}"
REL="contracts/target/wasm32v1-none/release"

echo "▶ Compilando contratos (wasm32v1-none)…"
(cd contracts && cargo build --target wasm32v1-none --release)

for name in asp token verifier auction; do
  WASM="$REL/idio_${name}.wasm"
  ID=$(stellar contract deploy --wasm "$WASM" --source "$SOURCE" --network "$NETWORK")
  echo "${name}: ${ID}"
done

echo "Copia los IDs a deployments.testnet.json y frontend/src/config.ts."
