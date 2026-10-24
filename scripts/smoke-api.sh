#!/usr/bin/env sh
# Post-deploy smoke checks for the JEE Platform API.
# Usage: ./scripts/smoke-api.sh https://ton-api.onrender.com

set -eu
BASE="${1:-http://localhost:8081}"
BASE="${BASE%/}"

echo "==> Health: $BASE/api/v1/health"
body="$(curl -fsS "$BASE/api/v1/health")"
echo "$body" | grep -q '"status":"UP"' || {
	echo "FAIL: health not UP → $body" >&2
	exit 1
}
echo "OK health"

echo "==> H2 console must not be public"
code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/h2-console" || true)"
case "$code" in
	200|301|302)
		echo "FAIL: /h2-console returned $code (should be closed in prod)" >&2
		exit 1
		;;
esac
echo "OK h2-console not openly served ($code)"

echo "==> Auth login rejects bad credentials (expects 401)"
login_code="$(curl -s -o /dev/null -w '%{http_code}' \
	-X POST "$BASE/api/v1/auth/login" \
	-H 'Content-Type: application/json' \
	-d '{"email":"smoke-nobody@ensem.jee","password":"wrong-password"}')"
if [ "$login_code" != "401" ] && [ "$login_code" != "429" ]; then
	echo "FAIL: login expected 401/429, got $login_code" >&2
	exit 1
fi
echo "OK auth endpoint responds ($login_code)"

echo "Smoke OK against $BASE"
