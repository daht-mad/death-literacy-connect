// 브라우저·Node 공용 채점 로직 (파일시스템 의존 없음)
// 정본. 수정 후 반드시 `node verify.mjs` + `bash sync.sh`
const RES_ORDER = ['rel', 'exp', 'act', 'know'];  // 최후 동점 시에만 사용

/**
 * answers: { Q1..Q6: 0..3 (리소스 문항), S1..S4: 0..3 (시점 문항) }
 *
 * 채점은 리소스와 시점을 **분리 측정**한다.
 *  - 리소스: 선택지의 주 리소스 +2, 부 리소스 +1 (점수 해상도를 높여 동점을 줄임)
 *  - 시점  : 전용 문항 4개의 값 합(+2/+1/-1/-2). 양수=평소파 / 음수=실전파
 *    ※ 리소스 선택지에 시점을 묶어두면, 리소스를 고를 때 시점이 딸려와 판별이 흔들린다(실측 4/8 오판)
 */
export function scoreWith(DATA, answers) {
  const res = { know: 0, rel: 0, exp: 0, act: 0 };
  const hit = { know: [], rel: [], exp: [], act: [] };
  const axisOf = {};   // 리소스별로, 그 리소스를 고르게 만든 선택지들의 시점 (폴백용)

  DATA.resQuestions.forEach((q, qi) => {
    const i = answers[q.id];
    if (i == null) return;
    const t = DATA.types[q.a[i].t];
    res[t.res] += DATA.scoring.main;
    if (t.sub) res[t.sub] += DATA.scoring.sub;
    hit[t.res].push(qi);
    (axisOf[t.res] ||= []).push(t.axis);
  });

  // ── 시점 ──
  let axisRaw = 0, axisAnswered = 0;
  for (const q of DATA.axisQuestions) {
    const i = answers[q.id];
    if (i == null) continue;
    axisRaw += q.a[i].v;
    axisAnswered++;
  }

  // ── 리소스 승자: ① 점수 → ② 고른 횟수 → ③ 더 늦은 문항 → ④ 고정 순위 ──
  const max = Math.max(...Object.values(res));
  let tied = Object.keys(res).filter(k => res[k] === max);
  let resBy = null;
  if (tied.length > 1) {
    const mc = Math.max(...tied.map(k => hit[k].length));
    let t2 = tied.filter(k => hit[k].length === mc); resBy = 'count';
    if (t2.length > 1) {
      const last = k => Math.max(...hit[k], -1);
      const ml = Math.max(...t2.map(last));
      t2 = t2.filter(k => last(k) === ml); resBy = 'recency';
    }
    if (t2.length > 1) { t2 = [RES_ORDER.find(o => t2.includes(o))]; resBy = 'order'; }
    tied = t2;
  }
  const resKey = tied[0];

  // ── 시점 승자: 합이 0이면 그 리소스를 고르게 만든 선택지들의 시점 다수결로 폴백 ──
  let axisKey, axisBy = 'items';
  if (axisRaw !== 0) {
    axisKey = axisRaw > 0 ? 'prep' : 'real';
  } else {
    const v = axisOf[resKey] || [];
    const p = v.filter(x => x === 'prep').length;
    axisKey = p > v.length - p ? 'prep' : (p < v.length - p ? 'real' : 'real');
    axisBy = p === v.length - p ? 'default' : 'res-fallback';
  }

  const typeId = Object.keys(DATA.types)
    .find(id => DATA.types[id].res === resKey && DATA.types[id].axis === axisKey);

  const sorted = Object.entries(res).sort((a, b) => b[1] - a[1]);
  const margin = sorted[0][1] - sorted[1][1];
  const sub = margin <= 1
    ? Object.keys(DATA.types).find(id => DATA.types[id].res === sorted[1][0] && DATA.types[id].axis === axisKey)
    : null;

  return {
    typeId, type: DATA.types[typeId].name,
    res: resKey, axis: axisKey,
    scores: { res, axisRaw },
    sub: sub ? DATA.types[sub].name : null,
    margin,
    flags: { resTie: !!resBy, resBy, axisBy, axisAnswered },
  };
}
