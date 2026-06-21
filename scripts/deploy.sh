#!/usr/bin/env bash
# Despliega los contratos de IDIO en Stellar Testnet.
# Requiere: stellar CLI, una identidad fondeada (por defecto "idio").
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-idio}"
WASM="contracts/target/wasm32-unknown-unknown/release/idio_contracts.wasm"

echo "▶ Compilando contratos…"
(cd contracts && cargo build --target wasm32-unknown-unknown --release)

echo "▶ Desplegando en $NETWORK (source: $SOURCE)…"
CONTRACT_ID=$(stellar contract deploy --wasm "$WASM" --source "$SOURCE" --network "$NETWORK")

echo "✅ Contrato desplegado: $CONTRACT_ID"
echo "Añade el ID correspondiente a frontend/.env (VITE_*_CONTRACT_ID)."
