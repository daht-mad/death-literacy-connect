#!/usr/bin/env node
/**
 * 데스티벌 사실 드리프트 검사기
 *
 * 행사 정보(시간·참가비·연사·부스)가 한글 2장 + 영문 2장에 복제돼 있어서
 * 한 곳만 고치면 나머지가 조용히 낡는다. 실제로 2026-09-04~14 열흘간
 * 홈이 "12:00 · 참가비 무료"를 말하고 있었다.
 *
 * 이 스크립트는 event.json 을 정본으로 삼아
 *   ① 각 페이지에 있어야 할 값이 있는지
 *   ② 있으면 안 되는 옛 값이 남았는지
 *   ③ 한글을 고친 뒤 영문을 안 고쳤는지(수정 시각 비교)
 * 를 검사한다. 고치는 건 사람이 한다 — 자동 수정은 하지 않는다.
 *
 * Usage: node scripts/check-drift.mjs
 * exit 0 = 이상 없음 / exit 1 = 드리프트 발견
 */
import { readFileSync, statSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'event.json'), 'utf-8'));

const C = { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', x: '\x1b[0m', b: '\x1b[1m' };

/** HTML → 보이는 텍스트 (style/script 제거, 엔티티 일부 복원) */
function visibleText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}

/** 하이픈·대시·공백 흔들림 흡수 */
function norm(s) {
  return s.replace(/[–—−]/g, '-').replace(/\s+/g, ' ').trim();
}

let missing = 0;
let stale = 0;
const rows = [];

for (const page of cfg.pages) {
  const abs = join(ROOT, page.path);
  if (!existsSync(abs)) {
    rows.push({ kind: 'gone', page: page.path, msg: '파일 없음' });
    missing++;
    continue;
  }
  const text = norm(visibleText(readFileSync(abs, 'utf-8')));

  for (const key of page.facts) {
    const fact = cfg.facts[key];
    if (!fact) {
      rows.push({ kind: 'cfg', page: page.path, msg: `event.json에 fact "${key}" 없음` });
      missing++;
      continue;
    }
    const expected = norm(fact[page.lang] ?? '');
    if (expected && !text.includes(expected)) {
      rows.push({ kind: 'missing', page: page.path, label: fact.label, msg: `"${expected}" 없음` });
      missing++;
    }
    for (const old of fact.stale ?? []) {
      if (text.includes(norm(old))) {
        rows.push({ kind: 'stale', page: page.path, label: fact.label, msg: `옛 값 "${old}" 남아있음` });
        stale++;
      }
    }
  }
}

// ③ 번역 지연 — 한글이 더 최근에 수정됐으면 영문 확인 필요
const lagging = [];
for (const pair of cfg.translationPairs ?? []) {
  const k = join(ROOT, pair.ko), e = join(ROOT, pair.en);
  if (!existsSync(k) || !existsSync(e)) continue;
  const km = statSync(k).mtimeMs, em = statSync(e).mtimeMs;
  if (km > em + 60_000) {
    lagging.push({ ko: pair.ko, en: pair.en, gapMin: Math.round((km - em) / 60000) });
  }
}

// ── 출력
console.log(`${C.b}데스티벌 사실 드리프트 검사${C.x}  ${C.d}(정본 event.json · ${cfg.updated})${C.x}`);
console.log(`${C.d}${cfg.source}${C.x}\n`);

if (rows.length === 0) {
  console.log(`${C.g}✅ 사실 일치 — 페이지 ${cfg.pages.length}장 전부 정본과 같음${C.x}`);
} else {
  const byPage = {};
  for (const r of rows) (byPage[r.page] ??= []).push(r);
  for (const [p, rs] of Object.entries(byPage)) {
    console.log(`${C.b}${p}${C.x}`);
    for (const r of rs) {
      const mark = r.kind === 'stale' ? `${C.r}✗ 낡음${C.x}` : `${C.y}! 누락${C.x}`;
      console.log(`  ${mark}  ${r.label ? r.label + ' — ' : ''}${r.msg}`);
    }
    console.log('');
  }
}

if (lagging.length) {
  console.log(`${C.y}⚠️  한글을 고친 뒤 영문을 안 고쳤을 수 있음 — 문장은 자동 동기화되지 않는다${C.x}`);
  for (const l of lagging) {
    console.log(`   ${l.ko}  →  ${l.en}  ${C.d}(한글이 ${l.gapMin}분 더 최근)${C.x}`);
  }
  console.log('');
}

const bad = missing + stale;
if (bad > 0) {
  console.log(`${C.r}${C.b}드리프트 ${bad}건 (낡음 ${stale} · 누락 ${missing}) — 고치고 다시 돌릴 것${C.x}`);
  process.exit(1);
}
if (lagging.length) {
  console.log(`${C.y}사실은 일치. 위 번역 지연만 눈으로 확인.${C.x}`);
}
process.exit(0);
