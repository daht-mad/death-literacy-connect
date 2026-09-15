#!/usr/bin/env bash
# 배포 = 반드시 이 스크립트로. 드리프트 검사를 통과해야만 배포된다.
#   bash scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── 1/3 사실 드리프트 검사"
if ! node scripts/check-drift.mjs; then
  echo ""
  echo "🚫 드리프트가 있어 배포를 멈춥니다. 위 항목을 고치고 다시 실행하세요."
  exit 1
fi

echo ""
echo "── 2/3 Vercel 배포"
npx vercel deploy --prod --yes --scope daht-mad-ais-projects

echo ""
echo "── 3/3 라이브 실측 (배포 반영에 몇 초 걸릴 수 있음)"
sleep 8
B=https://death-literacy-connect.kr
for p in / /deathtival /deathtival/apply /deathbti /en /en/deathtival /privacy; do
  printf "  %-22s " "$p"
  curl -sS -o /dev/null -w "%{http_code}  %{size_download}B\n" -L --max-time 20 "$B$p"
done
