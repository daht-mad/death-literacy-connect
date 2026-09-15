import fs from 'fs';
const D = JSON.parse(fs.readFileSync('public/deathbti/items.json'));
const BASE = 'https://death-literacy-connect.kr';
const page = (id, t) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.name} — 죽BTI</title>
<meta name="description" content="${t.tagline}. 당신은 죽음 앞에서 어떤 사람인가요? 10문항으로 알아보는 죽음문해력 유형 8가지.">
<meta property="og:title" content="나는 「${t.name}」 — 당신은요?">
<meta property="og:description" content="${t.tagline}. 10문항 · 1분이면 나와요.">
<meta property="og:image" content="${BASE}${t.card}">
<meta property="og:url" content="${BASE}/deathbti/t/${id}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${BASE}/deathbti/t/${id}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/base.css">
<link rel="stylesheet" href="/deathbti/deathbti.css">
</head>
<body>
<nav><div class="wrap">
  <a class="brand" href="/"><img src="/logo-kr.png" alt="죽음문해력커넥트"></a>
  <div class="tabs"><a href="/">홈</a><a href="/deathtival">데스티벌</a><a class="on" href="/deathbti">죽BTI</a></div>
  <a class="cta" href="/deathtival/apply">신청하기 →</a>
</div></nav>

<main class="dbti">
 <section class="step on res share-view"><div class="wrap">
  <div class="shared-by">누군가 당신에게 보냈어요 💌</div>
  <div class="card"><img src="${t.card}" alt="${t.name}"></div>
  <p class="sub">이 사람은 <b>${t.name}</b>.<br>${t.tagline}.</p>
  <div class="desc">${(t.desc || []).map(p => `<p>${p}</p>`).join('')}</div>

  <div class="cta-family">
    <div class="h">당신은<br>몇 번일까요?</div>
    <div class="p">8가지 유형 중 하나예요.<br>10문항 · 1분이면 나와요.</div>
    <div class="btns"><a class="mainbtn" href="/deathbti">나도 해보기 →</a></div>
    <div class="stat" id="stat"></div>
  </div>

  <div class="again">
    <a href="/deathtival">데스티벌 보러 가기 →</a>
  </div>
 </div></section>
</main>

<footer><div class="wrap">
  <div>© 2026 죽음문해력커넥트 · 데스<span>(Death)</span>롭지 않은 이야기</div>
  <div><a href="/privacy">개인정보 처리방침</a></div>
</div></footer>
<script>
fetch('/api/deathbti-stats').then(r=>r.json()).then(d=>{
  if(d.total>20) document.getElementById('stat').textContent = '지금까지 ' + d.total.toLocaleString() + '명이 해봤어요';
}).catch(()=>{});
</script>
</body></html>`;

let n = 0;
for (const [id, t] of Object.entries(D.types)) {
  fs.mkdirSync(`public/deathbti/t/${id}`, { recursive: true });
  fs.writeFileSync(`public/deathbti/t/${id}/index.html`, page(id, t));
  n++;
}
console.log(`유형별 공유 페이지 ${n}개 생성`);
