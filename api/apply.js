/**
 * 데스티벌 참여신청 → Airtable
 *
 * 환경변수 (Vercel):
 *   AIRTABLE_TOKEN_DLC  죽음문해력커넥트 계정 PAT
 *   AIRTABLE_BASE_ID    대상 베이스 ID (Vercel env에 설정)
 *   AIRTABLE_TABLE      기본값 "데스티벌 참여신청"
 */
const TABLE = process.env.AIRTABLE_TABLE || '데스티벌 참여신청';
const VALID_PROGRAMS = [
  '10/23(금) 온라인 · 데스 커넥터즈 토크',
  '10/24(토) 오프라인 · Dive in Death',
];

const PAID_PROGRAM = '10/23(금) 온라인 · 데스 커넥터즈 토크';
const FEE_KRW = 10000; // 10/23 온라인 참가비 (계획안 V3 · 아베 제안서 9/5판 기준)

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.AIRTABLE_TOKEN_DLC;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    console.error('[apply] missing env', { token: !!token, baseId: !!baseId });
    return res.status(500).json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  // 허니팟 — 봇이 채우면 성공한 척하고 버린다
  if (clip(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const email = clip(body.email, 200);
  const programs = Array.isArray(body.programs)
    ? body.programs.filter((p) => VALID_PROGRAMS.includes(p))
    : [];

  if (!programs.length) return res.status(400).json({ error: '참여하실 날짜를 골라주세요.' });
  if (!name) return res.status(400).json({ error: '이름을 적어주세요.' });
  if (!phone) return res.status(400).json({ error: '연락처를 적어주세요.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: '이메일 주소를 확인해주세요.' });
  if (body.agree !== true) return res.status(400).json({ error: '개인정보 수집·이용 동의가 필요합니다.' });

  const isPaid = programs.includes(PAID_PROGRAM);

  const fields = {
    '이름': name,
    '연락처': phone,
    '이메일': email,
    '참여 프로그램': programs,
    '개인정보 수집·이용 동의': true,
    '신청일시': new Date().toISOString(),
    '상태': '신청접수',
    '참가비': isPaid ? FEE_KRW : 0,
    '입금상태': isPaid ? '입금대기' : '해당없음(무료)',
    'utm_source': clip(body.utm_source, 100),
    'utm_campaign': clip(body.utm_campaign, 100),
  };
  if (!fields.utm_source) delete fields.utm_source;
  if (!fields.utm_campaign) delete fields.utm_campaign;

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );
    if (!r.ok) {
      console.error('[apply] airtable', r.status, await r.text());
      return res.status(502).json({ error: '신청 저장에 실패했어요. 잠시 후 다시 시도해주세요.' });
    }
    const data = await r.json();
    return res.status(200).json({ ok: true, id: data.records?.[0]?.id });
  } catch (err) {
    console.error('[apply]', err);
    return res.status(500).json({ error: '일시적인 오류입니다. 잠시 후 다시 시도해주세요.' });
  }
}
