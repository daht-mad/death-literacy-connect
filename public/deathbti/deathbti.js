import { scoreWith } from '/deathbti/score-core.mjs';

const $ = s => document.querySelector(s);
const DATA = await (await fetch('/deathbti/items.json')).json();
// 리소스 문항 먼저, 시점 문항 나중 — 무거운 상황 문항으로 시작하지 않게 첫 문항은 그대로 둔다
const QS = [...DATA.resQuestions, ...DATA.axisQuestions];
const answers = {};
let idx = 0;

const sid = (crypto.randomUUID?.() || String(Date.now() + Math.random())).slice(0, 18);
const params = new URLSearchParams(location.search);

/* ── 집계 (소셜 프루프 · 희귀도). 실패해도 진단은 그대로 돌아간다 ── */
let STATS = { total: 0, counts: {} };
fetch('/api/deathbti-stats').then(r => r.json()).then(d => {
  STATS = d || STATS;
  // 표본이 너무 적을 땐 숫자를 보여주지 않는다 — "3명 참여"는 오히려 신뢰를 깎는다
  if (STATS.total > 20) $('#introStat').textContent = `이미 ${STATS.total.toLocaleString()}명이 해봤어요`;
}).catch(() => {});

/* ── 인트로 썸네일 ── */
$('#introGrid').innerHTML = Object.values(DATA.types)
  .map((t, i) => `<img src="/deathbti/thumbs/type${i + 1}.jpg" alt="${t.name}" loading="lazy">`).join('');

const show = id => document.querySelectorAll('.step')
  .forEach(s => s.classList.toggle('on', s.id === id));

/* ── 문항 렌더 ── */
function render() {
  const q = QS[idx];
  $('#qcnt').textContent = `${idx + 1} / ${QS.length}`;
  $('#qbar').style.width = `${(idx + 1) / QS.length * 100}%`;
  $('#qtext').textContent = q.q;
  $('#backBtn').style.visibility = idx === 0 ? 'hidden' : 'visible';
  $('#qopts').innerHTML = q.a.map((a, i) =>
    `<button class="opt${answers[q.id] === i ? ' sel' : ''}" data-i="${i}">${a.text}</button>`).join('');
  $('#qopts').querySelectorAll('.opt').forEach(b => b.onclick = () => {
    answers[q.id] = +b.dataset.i;
    b.classList.add('sel');
    setTimeout(next, 180);                       // 선택이 눈에 보이고 넘어가게
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function next() {
  if (idx < QS.length - 1) { idx++; render(); }
  else finish();
}

/* ── 결과 ── */
function finish() {
  const r = scoreWith(DATA, answers);
  const t = { ...DATA.types[r.typeId], id: r.typeId };

  $('#rdesc').innerHTML = (t.desc || []).map(p => `<p>${p}</p>`).join('');
  $('#rcard').src = t.card;
  $('#rcard').alt = `${t.name} — ${t.tagline}`;
  $('#rsub').innerHTML = r.sub
    ? `당신은 <b>${t.name}</b>이지만 <b>${r.sub}</b> 기질도 함께 있어요. 두 얼굴을 가진 사람.`
    : `8가지 유형 중 <b>${t.name}</b>. 주변에 같은 유형이 있는지 물어보세요.`;
  $('#rquote').textContent = `"나 ${t.name} 나왔는데 너는 뭐 나왔어?"`;
  document.title = `나는 ${t.name} | 죽BTI`;

  // 희귀도 — 표본 50명 넘을 때만. 그 전엔 숫자가 튀어서 오히려 이상하다
  const mine = STATS.counts?.[r.typeId] || 0;
  if (STATS.total >= 50 && mine > 0) {
    const pct = Math.round(mine / STATS.total * 100);
    $('#rrarity').textContent = pct <= 8
      ? `🏆 참여자 중 ${pct}%뿐인 희귀 유형이에요`
      : `참여자 ${STATS.total.toLocaleString()}명 중 ${pct}%가 같은 유형이에요`;
    $('#rstat').textContent = `지금까지 ${STATS.total.toLocaleString()}명이 참여했어요`;
  } else if (STATS.total > 20) {
    $('#rstat').textContent = `지금까지 ${STATS.total.toLocaleString()}명이 참여했어요`;
  }

  // 정반대 유형 — "이 사람한테 보내라"고 대상을 지목해주면 일반 공유보다 훨씬 잘 눌린다
  const opp = Object.entries(DATA.types).find(([, x]) =>
    x.res !== t.res && x.axis !== t.axis && x.sub === t.res);
  const oppT = opp ? opp[1] : null;
  if (oppT) {
    $('#ropp').innerHTML = `
      <div class="lbl">당신과 정반대인 유형</div>
      <div class="who">${oppT.name}</div>
      <div class="why">${oppT.tagline}. 주변에 이런 사람 한 명쯤 있지 않나요?</div>
      <button id="oppBtn">그 사람한테 보내기</button>`;
    $('#oppBtn').onclick = () => copy(shareText(t), '메시지를 복사했어요. 그 사람한테 붙여넣기 하세요!');
  }

  show('s-result');
  save(r, t);
}

let myLink = `${location.origin}/deathbti`;
const shareText = t => `나 "${t.name}" 나왔는데 너는 뭐 나왔어?\n${t.tagline}\n\n죽BTI 같이 해봐요 → ${myLink}`;

function bindShare(t) {
  myLink = `${location.origin}/deathbti/t/${t.id}`;
  $('#shareBtn').onclick = async () => {
    mark('sent_family');   // 공유 클릭 = 핵심 성공지표
    mark('shared');
    const data = { title: '죽BTI', text: shareText(t), url: myLink };
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e.name === 'AbortError') return; } }
    copy(shareText(t), '메시지를 복사했어요. 가족에게 붙여넣기 하세요!');
  };
  $('#copyBtn').onclick = () => copy(myLink, '내 결과 링크를 복사했어요');

  // 카드 저장 — 링크보다 이미지가 훨씬 잘 퍼진다 (스토리·단톡방에 그대로 올라감)
  $('#saveBtn').onclick = async () => {
    try {
      const blob = await (await fetch(t.card)).blob();
      const file = new File([blob], `죽BTI-${t.name}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `죽BTI-${t.name}.jpg`; a.click();
      URL.revokeObjectURL(a.href);
      toast('결과 카드를 저장했어요');
    } catch { toast('이미지를 길게 눌러 저장해주세요'); }
  };
}

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { toast('복사에 실패했어요. 주소창의 링크를 직접 공유해주세요'); }
}
function toast(m) {
  const el = $('#toast'); el.textContent = m; el.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 2400);
}

/* ── 저장 (실패해도 사용자 흐름은 막지 않는다) ── */
let saved = false;
function save(r, t) {
  bindShare(t);
  if (saved) return; saved = true;
  fetch('/api/deathbti', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sid, result_code: r.typeId, type_name: t.name,
      sub_code: r.sub || '', answers, scores: r.scores, margin: r.margin,
      utm_source: params.get('utm_source') || '', utm_campaign: params.get('utm_campaign') || '',
      referrer: document.referrer || '',
    }),
  }).catch(() => {});
}
function mark(field) {
  fetch('/api/deathbti', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sid, mark: field }),
  }).catch(() => {});
}

/* ── 이벤트 ── */
$('#startBtn').onclick = () => { show('s-quiz'); render(); };
$('#backBtn').onclick = () => { if (idx > 0) { idx--; render(); } };
$('#retryBtn').onclick = () => {
  for (const k of Object.keys(answers)) delete answers[k];
  idx = 0; saved = false; document.title = '죽BTI — 당신은 죽음 앞에서 어떤 사람인가요? | 죽음문해력커넥트';
  show('s-quiz'); render();
};
