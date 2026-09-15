/**
 * 죽BTI 집계 — 총 참여 수 + 유형별 분포
 * 결과 화면의 "N명 참여 · 당신은 상위 X%" 소셜프루프에 쓰인다.
 *
 * 레코드를 매번 전부 세므로 CDN 캐시(s-maxage=120)를 반드시 태운다.
 */
const TABLE = process.env.AIRTABLE_TABLE_DEATHBTI || '죽BTI 응답';

export default async function handler(req, res) {
  const token = process.env.AIRTABLE_TOKEN_DLC;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) return res.status(500).json({ error: 'server misconfigured' });

  try {
    const counts = {};
    let total = 0, offset = '';
    // fields를 좁혀 페이로드를 줄인다. 최대 20페이지(2만건)까지만 — 그 이상이면 캐시 테이블로 옮길 것
    for (let page = 0; page < 20; page++) {
      const qs = new URLSearchParams({ pageSize: '100', 'fields[]': '유형코드' });
      if (offset) qs.set('offset', offset);
      const r = await fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}?${qs}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!r.ok) break;
      const j = await r.json();
      for (const rec of j.records || []) {
        const c = rec.fields?.['유형코드'];
        if (!c) continue;
        counts[c] = (counts[c] || 0) + 1;
        total++;
      }
      offset = j.offset || '';
      if (!offset) break;
    }

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.status(200).json({ total, counts });
  } catch (e) {
    console.error('[deathbti-stats]', e);
    return res.status(200).json({ total: 0, counts: {} });   // 통계 실패가 진단을 막지 않게
  }
}
