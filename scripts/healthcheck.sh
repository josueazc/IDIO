#!/usr/bin/env bash
# healthcheck.sh — verifica que el entorno de desarrollo IDIO esté listo
# Uso: bash scripts/healthcheck.sh

set -uo pipefail
PASS=0; FAIL=0

ok()   { echo "  [OK]  $1"; PASS=$((PASS + 1)); }
warn() { echo "  [--]  $1"; }
fail() { echo "  [X]   $1"; FAIL=$((FAIL + 1)); }

echo ""
echo "IDIO — healthcheck del entorno de desarrollo"
echo "============================================="
echo ""

# Node.js
if node --version &>/dev/null; then
  NODE_VER=$(node --version)
  MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
  if [[ "$MAJOR" -ge 18 ]]; then
    ok "Node.js $NODE_VER"
  else
    fail "Node.js $NODE_VER (se requiere >= 18)"
  fi
else
  fail "Node.js no instalado"
fi

# npm
if npm --version &>/dev/null; then
  ok "npm $(npm --version)"
else
  fail "npm no instalado"
fi

# Rust
if cargo --version &>/dev/null; then
  ok "Rust $(cargo --version)"
else
  warn "Rust/cargo no instalado (requerido para compilar contratos)"
fi

# wasm32 target
if rustup target list --installed 2>/dev/null | grep -q wasm32-unknown-unknown; then
  ok "Target wasm32-unknown-unknown disponible"
else
  warn "Target wasm32-unknown-unknown no instalado — ejecutá: rustup target add wasm32-unknown-unknown"
fi

# Stellar CLI
if stellar --version &>/dev/null; then
  ok "stellar-cli $(stellar --version 2>&1 | head -1)"
elif soroban --version &>/dev/null; then
  ok "soroban-cli $(soroban --version 2>&1 | head -1)"
else
  warn "stellar-cli no instalado (requerido para deploy): cargo install stellar-cli"
fi

# Nargo / Noir
if nargo --version &>/dev/null; then
  ok "nargo $(nargo --version)"
else
  warn "nargo (Noir) no instalado (requerido para circuitos): https://noir-lang.org"
fi

# wasm-pack
if wasm-pack --version &>/dev/null; then
  ok "wasm-pack $(wasm-pack --version)"
else
  warn "wasm-pack no instalado (requerido para prover WASM): cargo install wasm-pack"
fi

# Frontend node_modules
if [[ -d "frontend/node_modules" ]]; then
  ok "frontend/node_modules presente"
else
  fail "frontend/node_modules faltante — ejecutá: cd frontend && npm install"
fi

# .env del frontend
if [[ -f "frontend/.env" ]]; then
  ok "frontend/.env presente"
else
  warn "frontend/.env no encontrado — copiá .env.example: cp frontend/.env.example frontend/.env"
fi

# deployments.testnet.json
if [[ -f "deployments.testnet.json" ]]; then
  ok "deployments.testnet.json presente"
else
  warn "deployments.testnet.json no encontrado — ejecutá scripts/deploy.sh"
fi

echo ""
echo "Resumen: $PASS OK, $FAIL errores"
if [[ "$FAIL" -gt 0 ]]; then
  echo "Algunos requisitos no están satisfechos. Ver arriba."
  exit 1
else
  echo "Entorno listo para desarrollo."
fi
