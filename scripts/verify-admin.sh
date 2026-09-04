#!/usr/bin/env bash
# Verify admin panel + subscription flows (run against the live server).
set -e
BASE=${BASE:-http://localhost:3000}
J=$(mktemp); JA=$(mktemp)
PASS=$(grep ADMIN_PASSCODE .env | cut -d'"' -f2)
EMAIL=$(grep ADMIN_EMAIL .env | cut -d'"' -f2)

echo "== landing (empty DB) =="
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"

echo "== register user (gets trial) =="
SUF=$RANDOM
curl -s -X POST "$BASE/api/auth/register" -c "$J" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Trial User\",\"email\":\"trial$SUF@test.dev\",\"password\":\"password123\",\"intent\":\"student\"}"

echo; echo "== trial banner on dashboard =="
curl -s -b "$J" "$BASE/dashboard" | grep -o "Free trial: [0-9]* days left" | head -1

echo "== subscribe page =="
curl -s -o /dev/null -w "%{http_code}\n" -b "$J" "$BASE/subscribe"

echo "== mock subscription payment =="
curl -s -X POST "$BASE/api/subscribe/pay" -b "$J" -H 'Content-Type: application/json' -d '{}' | head -c 200; echo
curl -s -X POST "$BASE/api/subscribe/verify" -b "$J" -H 'Content-Type: application/json' -d '{"paymentId":"pay_SUBMOCK1"}' | head -c 200; echo

echo "== admin login (wrong passcode rejected) =="
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/admin/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"passcode\":\"wrong-passcode\"}"

echo "== admin login (correct) =="
curl -s -X POST "$BASE/api/admin/login" -c "$JA" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"passcode\":\"$PASS\"}" | head -c 100; echo

echo "== admin panel pages =="
for p in /admin /admin/users /admin/orders; do
  printf "%-14s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' -b "$JA" "$BASE$p")"
done

echo "== admin guard blocks non-admin =="
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/admin/config" -X POST -H 'Content-Type: application/json' -d '{}'

echo "== admin edits subscription price to 120 =="
curl -s -X POST "$BASE/api/admin/config" -b "$JA" -H 'Content-Type: application/json' \
  -d '{"platformFeePercent":"10","subscriptionPriceInr":"120","subscriptionTrialDays":"60","minOfferRupees":"50","maxOfferRupees":"100000"}' | head -c 150; echo
node -e "const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();db.platformConfig.findUnique({where:{key:'subscriptionPriceInr'}}).then(r=>{console.log('DB value:',r.value);return db.\$disconnect()})"

echo "== restore price to 100 =="
curl -s -X POST "$BASE/api/admin/config" -b "$JA" -H 'Content-Type: application/json' \
  -d '{"platformFeePercent":"10","subscriptionPriceInr":"100","subscriptionTrialDays":"60","minOfferRupees":"50","maxOfferRupees":"100000"}' > /dev/null
echo done

echo "== /admin/login redirects when authed =="
curl -s -o /dev/null -w "%{http_code}\n" -b "$JA" "$BASE/admin/login"

echo "ADMIN/SUBSCRIPTION CHECKS DONE"
