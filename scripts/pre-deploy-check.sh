#!/usr/bin/env bash
# scripts/pre-deploy-check.sh
# Run this before every production deployment to catch issues early.
# Usage: bash scripts/pre-deploy-check.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo -e "  ${GREEN}✅${NC} $label"
    ((PASS++)) || true
  else
    echo -e "  ${RED}❌${NC} $label — $result"
    ((FAIL++)) || true
  fi
}

echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║   Kanishka's Salon — Pre-Deploy Checklist    ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Required env vars ──────────────────────────────────────────────────────
echo -e "${BOLD}[1] Environment Variables${NC}"
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "NEXT_PUBLIC_APP_URL"
  "NEXT_PUBLIC_SALON_NAME"
  "NEXT_PUBLIC_SALON_PHONE"
)

ENV_FILE="${ENV_FILE:-.env.local}"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

for var in "${REQUIRED_VARS[@]}"; do
  if [ -n "${!var:-}" ]; then
    check "$var" "ok"
  else
    check "$var" "NOT SET"
  fi
done

# Check NEXTAUTH_SECRET is not placeholder
if [[ "${NEXTAUTH_SECRET:-}" == *"your-secret"* ]] || [[ "${NEXTAUTH_SECRET:-}" == *"change-me"* ]]; then
  check "NEXTAUTH_SECRET (not placeholder)" "STILL A PLACEHOLDER — run: openssl rand -base64 32"
else
  check "NEXTAUTH_SECRET (not placeholder)" "ok"
fi

echo ""

# ── 2. TypeScript strict check ────────────────────────────────────────────────
echo -e "${BOLD}[2] TypeScript${NC}"
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -q "error TS"; then
  check "TypeScript strict check" "type errors found — run: npx tsc --noEmit"
else
  check "TypeScript strict check" "ok"
fi

echo ""

# ── 3. Security audit ─────────────────────────────────────────────────────────
echo -e "${BOLD}[3] Security${NC}"
AUDIT_OUTPUT=$(npm audit --audit-level=high --json 2>/dev/null || true)
HIGH_COUNT=$(echo "$AUDIT_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0)+d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo "0")
if [ "$HIGH_COUNT" -gt "0" ] 2>/dev/null; then
  check "npm audit (high/critical)" "$HIGH_COUNT high/critical vulnerabilities — run: npm audit fix"
else
  check "npm audit (high/critical)" "ok"
fi

echo ""

# ── 4. Database connectivity ──────────────────────────────────────────────────
echo -e "${BOLD}[4] Database${NC}"
if command -v psql &>/dev/null && [ -n "${DATABASE_URL:-}" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1" --no-psqlrc -t 2>/dev/null | grep -q "1"; then
    check "Database reachable" "ok"
  else
    check "Database reachable" "cannot connect to DB"
  fi
else
  echo -e "  ${YELLOW}⚠️${NC}  Database connectivity — skipped (psql not in PATH or DATABASE_URL unset)"
fi

echo ""

# ── 5. Build artefacts ────────────────────────────────────────────────────────
echo -e "${BOLD}[5] Build Artefacts${NC}"
if [ -f ".next/standalone/server.js" ]; then
  check ".next/standalone/server.js exists" "ok"
else
  check ".next/standalone/server.js exists" "NOT FOUND — run: npm run build"
fi

if [ -d ".next/standalone/.next/static" ]; then
  check ".next/standalone/.next/static copied" "ok"
else
  check ".next/standalone/.next/static copied" "NOT FOUND — run: cp -r .next/static .next/standalone/.next/static"
fi

if [ -d ".next/standalone/public" ]; then
  check ".next/standalone/public copied" "ok"
else
  check ".next/standalone/public copied" "NOT FOUND — run: cp -r public .next/standalone/public"
fi

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}║  ALL CHECKS PASSED — Safe to deploy! 🚀     ║${NC}"
else
  echo -e "${BOLD}${RED}║  $FAIL CHECK(S) FAILED — Fix before deploying!${NC}"
fi
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
