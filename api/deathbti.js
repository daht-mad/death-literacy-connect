/**
 * 죽BTI 진단 결과 → Airtable `responses`
 *
 * 두 가지 호출을 받는다.
 *   ① 결과 저장   { session_id, result_code, type_name, sub_code, answers, scores, margin, utm_*, referrer }
 *   ② 행동 기록   { session_id, mark: 'shared' | 'sent_family' }  ← 기존 레코드 PATCH
 *
 * 환경변수: AIRTABLE_TOKEN_DLC · AIRTABLE_BASE_ID
 */
const TABLE = process.env.AIRTABLE_TABLE_DEATHBTI || '죽BTI 응답';
// 프런트에서 오는 영문 키 → Airtable 한국어 필드명
const MARKABLE = { shared: '공유함', sent_family: '공유 클릭', clicked_deathtival: '데스티벌 클릭' };

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const api = (baseId, path = '') =>
  `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}${path}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.AIRTABLE_TOKEN_DLC;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    console.error('[deathbti] missing env', { token: !!token, baseId: !!baseId });
    return res.status(500).json({ error: 'server misconfigured' });
  }
  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const sid = clip(body.session_id, 40);
  if (!sid) return res.status(400).json({ error: 'session_id required' });

  try {
    // ② 행동 기록 — 이미 저장된 레코드를 찾아 체크박스만 켠다
    if (body.mark) {
      const markField = MARKABLE[body.mark];
      if (!markField) return res.status(400).json({ error: 'bad mark' });
      const f = encodeURIComponent(`{세션ID}="${sid.replace(/"/g, '')}"`);
      const found = await fetch(api(baseId, `?filterByFormula=${f}&maxRecords=1`), { headers: H });
      const j = await found.json();
      const rec = j.records?.[0];
      if (!rec) return res.status(200).json({ ok: true, skipped: 'no record yet' });
      await fetch(api(baseId, `/${rec.id}`), {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ fields: { [markField]: true } }),
      });
      return res.status(200).json({ ok: true });
    }

    // ① 결과 저장
    const code = clip(String(body.result_code ?? ''), 8);
    if (!code) return res.status(400).json({ error: 'result_code required' });

    const fields = {
      '세션ID': sid,
      '유형코드': code,
      '유형': clip(body.type_name, 60),
      '서브유형': clip(body.sub_code, 60),
      '점수(JSON)': JSON.stringify(body.scores ?? {}).slice(0, 3000),
      '응답원본(JSON)': JSON.stringify(body.answers ?? {}).slice(0, 3000),
      '검사일시': new Date().toISOString(),
      'utm_source': clip(body.utm_source, 100),
      'utm_campaign': clip(body.utm_campaign, 100),
      '유입 페이지': clip(body.referrer, 300),
    };

    const r = await fetch(api(baseId), {
      method: 'POST', headers: H,
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!r.ok) {
      console.error('[deathbti] airtable', r.status, await r.text());
      return res.status(502).json({ error: 'save failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[deathbti]', e);
    return res.status(500).json({ error: 'unexpected' });
  }
}
