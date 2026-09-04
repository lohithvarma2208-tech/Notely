#!/usr/bin/env bash
# End-to-end smoke test for Notely core flows.
# Usage: BASE=http://localhost:3000 bash scripts/smoke.sh
set -e
BASE=${BASE:-http://localhost:3000}
J=$(mktemp)      # student jar
JW=$(mktemp)     # writer jar
SUF=$RANDOM$RANDOM
STU="smoke.student$SUF@test.dev"
WRI="smoke.writer$SUF@test.dev"

step() { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }
api() { # method path jar json
  local m=$1 p=$2 j=$3 d=$4
  if [ -n "$d" ]; then
    curl -s -X "$m" "$BASE$p" -b "$j" -c "$j" -H 'Content-Type: application/json' -d "$d"
  else
    curl -s -X "$m" "$BASE$p" -b "$j" -c "$j"
  fi
}

step "register student"
api POST /api/auth/register "$J" "{\"name\":\"Smoke Student\",\"email\":\"$STU\",\"password\":\"password123\",\"intent\":\"student\"}"
step "register writer"
api POST /api/auth/register "$JW" "{\"name\":\"Smoke Writer\",\"email\":\"$WRI\",\"password\":\"password123\",\"intent\":\"writer\"}"

step "writer fills profile"
api PATCH /api/profile/writer "$JW" '{"title":"Smoke tester","bio":"test","languages":"English","subjects":"Physics","handwritingStyles":"Fast","pricePerPage":7,"digitalPricePerPage":4,"availability":"AVAILABLE","turnaroundDays":1,"acceptsDigital":true,"acceptsHandwritten":true}' | head -c 200

step "student posts request"
REQ=$(api POST /api/requests "$J" '{"title":"Smoke Physics notes","subject":"Physics","noteType":"HANDWRITTEN","instructions":"test","estPages":20,"pagesUnknown":false,"writingStyle":"NEAT","deliveryMethod":"DIGITAL","deadline":"2026-12-31","budgetMin":100,"budgetMax":200,"sources":[]}')
echo "$REQ"
RID=$(echo "$REQ" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$RID" ] && RID=$(echo "$REQ" | grep -o '"requestId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "request id: $RID"

step "writer submits offer"
OFF=$(api POST "/api/requests/$RID/offers" "$JW" '{"priceType":"PER_PAGE","pricePerPage":7,"totalPrice":140,"estimatedDays":2,"message":"smoke offer"}')
echo "$OFF"
OID=$(echo "$OFF" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$OID" ] && OID=$(echo "$OFF" | grep -o '"offerId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "offer id: $OID"

step "student accepts offer"
ACC=$(api POST "/api/offers/$OID/accept" "$J" "")
echo "$ACC"
ORD=$(echo "$ACC" | grep -o '"orderId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "order id: $ORD"

step "student pays (mock)"
api POST "/api/orders/$ORD/pay" "$J" "" | head -c 300; echo
step "student verifies payment"
api POST "/api/orders/$ORD/verify" "$J" '{"paymentId":"pay_SMOKE123"}' | head -c 300; echo

step "writer starts"
api POST "/api/orders/$ORD/start" "$JW" "" | head -c 300; echo
step "writer posts progress"
api POST "/api/orders/$ORD/progress" "$JW" '{"pagesCompleted":12,"note":"12/20 done"}' | head -c 300; echo
step "writer completes progress"
api POST "/api/orders/$ORD/progress" "$JW" '{"pagesCompleted":20,"note":"all done"}' | head -c 300; echo
step "writer submits delivery"
api POST "/api/orders/$ORD/submit" "$JW" '{"deliveryFiles":[{"fileName":"notes.pdf","url":"#","fileType":"PDF","sizeKb":100}],"message":"done"}' | head -c 300; echo

step "student sends chat message"
api POST "/api/orders/$ORD/messages" "$J" '{"body":"looks great, approving!"}' | head -c 200; echo
step "writer reads chat"
api GET "/api/orders/$ORD/messages" "$JW" "" | head -c 300; echo

step "student approves"
api POST "/api/orders/$ORD/approve" "$J" "" | head -c 300; echo
step "student reviews"
api POST "/api/orders/$ORD/review" "$J" '{"overall":5,"handwriting":5,"accuracy":5,"neatness":5,"communication":5,"onTime":5,"text":"smoke review"}' | head -c 300; echo

step "writer earnings page"
curl -s -o /dev/null -w "earnings page: %{http_code}\n" "$BASE/earnings" -b "$JW"
step "order page loads"
curl -s -o /dev/null -w "order page: %{http_code}\n" "$BASE/orders/$ORD" -b "$J"

printf "\n\033[1mSMOKE DONE\033[0m\n"
