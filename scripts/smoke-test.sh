#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Post-deployment smoke test — verifies critical paths are healthy
# ─────────────────────────────────────────────────────────────────────
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

green() { printf "\033[32m✓\033[0m %s\n" "$1"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$1"; }

check() {
  local desc="$1" url="$2" expect="$3"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expect" ]; then
    green "$desc ($status)"
    PASS=$((PASS + 1))
  else
    red "$desc — expected $expect got $status"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  local desc="$1" url="$2" key="$3" value="$4"
  local result
  result=$(curl -s --max-time 10 "$url" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$key',''))" 2>/dev/null || echo "")
  if [ "$result" = "$value" ]; then
    green "$desc ($key=$value)"
    PASS=$((PASS + 1))
  else
    red "$desc — expected $key=$value got $result"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Smoke Tests — $BASE_URL"
echo "══════════════════════════════════════════════════════════════"
echo ""

# ── Health check ──────────────────────────────────────────────────
check "Health endpoint"            "$BASE_URL/api/health" 200
check_json "Health: status=ok"     "$BASE_URL/api/health" "success" "True"

# ── Public pages ──────────────────────────────────────────────────
check "Home page"                  "$BASE_URL/" 200
check "Services page"              "$BASE_URL/services" 200
check "Products page"              "$BASE_URL/products" 200
check "Blog page"                  "$BASE_URL/blog" 200
check "Gallery page"               "$BASE_URL/gallery" 200
check "Contact page"               "$BASE_URL/contact" 200
check "Booking page"               "$BASE_URL/book" 200
check "Cart page"                  "$BASE_URL/cart" 200
check "Gift vouchers page"         "$BASE_URL/gift-vouchers" 200
check "Academy page"               "$BASE_URL/academy" 200

# ── Auth pages ────────────────────────────────────────────────────
check "Login page"                 "$BASE_URL/login" 200
check "Register page"              "$BASE_URL/register" 200
check "Forgot password page"       "$BASE_URL/forgot-password" 200

# ── Public API endpoints ──────────────────────────────────────────
check_json "API: services"         "$BASE_URL/api/services" "success" "True"
check_json "API: products"         "$BASE_URL/api/products" "success" "True"
check_json "API: public settings"  "$BASE_URL/api/settings/public" "success" "True"

# ── Security headers ──────────────────────────────────────────────
check "Home page: 200"             "$BASE_URL/" 200
HSTS=$(curl -sI --max-time 10 "$BASE_URL/" 2>/dev/null | grep -i "strict-transport-security" || echo "")
if [ -n "$HSTS" ]; then
  green "HSTS header present"
  PASS=$((PASS + 1))
else
  red "HSTS header missing"
  FAIL=$((FAIL + 1))
fi

CSP=$(curl -sI --max-time 10 "$BASE_URL/" 2>/dev/null | grep -i "content-security-policy" || echo "")
if [ -n "$CSP" ]; then
  green "CSP header present"
  PASS=$((PASS + 1))
else
  red "CSP header missing"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════════════════"
echo ""

exit $FAIL
