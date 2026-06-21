#!/usr/bin/env bash
# Crea y fondea una identidad en Stellar Testnet para desplegar IDIO.
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
NAME="${1:-idio}"

echo "▶ Generando identidad '$NAME' en $NETWORK…"
stellar keys generate "$NAME" --network "$NETWORK" || true
stellar keys fund "$NAME" --network "$NETWORK"

echo "✅ Identidad lista:"
stellar keys address "$NAME"
