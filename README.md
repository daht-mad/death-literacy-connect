# death-literacy-connect

죽음문해력커넥트 공식 랜딩. `https://death-literacy-connect.kr`

## Stack

- 정적 HTML (Vercel 서빙)
- Vercel scope: `daht-mad-ais-projects`
- 도메인: 가비아 등록, NS는 Vercel(`ns1/ns2.vercel-dns.com`)

## Deploy

```bash
npx vercel deploy --prod --yes --scope daht-mad-ais-projects
```

## Structure

```
public/
  index.html         # 랜딩 본문
  dlc-seal.svg       # 봉인 로고 (히어로)
  dlc-seal.png       # OG 이미지
  dsym-black.png     # D 심볼 (네비/파비콘)
vercel.json
```

## Brand

- 컬러: 검정 `#000` · 화이트 `#fefefe` · 하늘 `#2cb8db` · 햇살 `#e1d973`
- 슬로건: 데스(Death)롭지 않은 이야기
- 폰트: Noto Serif KR (제목) · Noto Sans KR (본문) · Cormorant Garamond (영문)
