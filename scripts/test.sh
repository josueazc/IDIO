#!/usr/bin/env bash
# Corre todas las suites de tests del monorepo.
set -euo pipefail

echo "▶ Tests de contratos (Rust/Soroban)…"
(cd contracts && cargo test)

if command -v nargo >/dev/null 2>&1; then
  echo "▶ Tests de circuitos (Noir)…"
  (cd circuits && nargo test)
else
  echo "⚠ nargo no instalado — se omiten los tests de circuitos."
fi

echo "▶ Typecheck del frontend…"
(cd frontend && npm run lint)

echo "✅ Todo verde."
