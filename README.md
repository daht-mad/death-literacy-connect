# death-literacy-connect

죽음문해력커넥트 공식 랜딩 · **https://death-literacy-connect.kr**

> 최종 갱신 2026-09-04. 이 문서는 **현재 배포 상태의 정본**이다.
> 구조·환경변수·배포법·정본 문서가 바뀌면 여기부터 고친다.

---

## 1. 지금 살아있는 페이지

| 경로 | 내용 |
|---|---|
| `/` | 홈 (탭: 홈 · 데스티벌) |
| `/deathtival` | **데스티벌 2026 행사 페이지** — 포스터 톤, 프로그램, 협력사 로고 |
| `/deathtival/apply` | 신청 단독 페이지 (**인스타·카톡에 뿌리는 링크**) |
| `/deathbti` | **죽BTI 진단** — 10문항 4지선다 → 8유형 결과 카드 |
| `/en` | **영문 About** — 해외 파트너·연구자용 (통계·DLI 4차원·팀 소개) |
| `/en/deathtival` | **영문 행사 페이지** — 전체 프로그램 + 해외 참가 안내 |
| `/en/deathbti` | **영문 죽BTI 쇼케이스** — 기관 대상. 8유형 카드 갤러리 + 설계·검증 설명. **진단은 안 돌아감**(한국판으로 링크) |
| `/privacy` | 개인정보 처리방침 — **라이브 = v1.0 (시행 2026-09-04)** / **로컬에 v1.1 초안 대기 (시행 예정 2026-09-21)** |
| `/api/apply` | 신청 접수 서버리스 함수 → Airtable |
| `/api/deathbti` | 진단 결과 저장 + 공유 클릭 기록 → Airtable `responses` |

**리다이렉트** (`vercel.json`)

- `/deathival`, `/deathival/*` → `/deathtival*` **(308 영구)** — 옛 철자로 나간 링크 보호
- `/apply`, `/신청` → `/deathtival/apply` (307, 짧은 별칭)

🚨 **철자는 `deathtival`이 확정** (2026-09-04 닿 도장). `deathival`은 아롱이가 지어낸 오표기였고 전량 교체됨. 새로 만들 때 절대 `deathival`을 쓰지 말 것.

---

## 2. 파일 구조

```
api/
  apply.js                 신청 접수 (POST) → Airtable. 검증·허니팟·참가비 자동기입
public/
  index.html               홈 (자체 <style>, base.css 안 씀)
  base.css                 공용 토큰·nav·btn·footer  ← 홈 제외 전 페이지
  apply.css                신청 폼 + 모달 스타일
  apply.js                 신청 폼 로직 (모달·단독페이지 공용 1벌)
  deathbti/index.html      죽BTI 진단 (인트로→문항→결과 1페이지)
  deathbti/deathbti.css    진단 전용 스타일
  deathbti/deathbti.js     진행·채점·공유 로직
  deathbti/items.json      문항·유형 데이터   ← 사본. 정본은 team4/work/deathbti/engine/
  deathbti/score-core.mjs  채점 로직          ← 사본. 정본은 위와 동일
  deathbti/cards/*.jpg     결과 카드 8종 + 표지 (1080×1350)
  deathbti/thumbs/*.jpg    인트로 원형 썸네일 8종 (320px)
  deathtival/index.html    행사 페이지
  deathtival/apply/index.html  신청 단독 페이지
  privacy/index.html       개인정보 처리방침
  deathtival-poster.png    포스터 v1 (지나, 2026-09-04) — 히어로 이미지
  partners/*.png|jpg       협력기관 로고 5곳
  logo-kr.png / dsym-black.png / dsym-white.png / logo-dsym*.png
  en/index.html            영문 About
  en/deathtival/index.html 영문 행사 페이지
  en/deathbti/index.html   영문 죽BTI 쇼케이스 (카드 이미지는 한글판 재사용)
  logo-en.png              영문 로고 락업 (배경 제거본)
event.json                 🔑 행사 사실 정본 (시간·참가비·연사·부스)
scripts/
  check-drift.mjs          사실 드리프트 검사기
  deploy.sh                검사 → 배포 → 라이브 실측
vercel.json                cleanUrls + 리다이렉트
.env.local                 로컬 검증용 (git 제외)
```

🚨 **죽BTI의 `items.json`·`score-core.mjs`는 사본이다.** 정본은 `team4/work/deathbti/engine/`. 여기서 직접 고치면 다음 sync 때 덮어써진다. 반드시 엔진에서 고치고:
```bash
bash team4/work/deathbti/engine/sync.sh   # verify(편차≤2%p) + demo(정확도 8/8) 통과해야 복사됨
```

**폼이 한 벌인 이유**: `apply.js`가 `[data-apply]` 버튼이 있으면 **모달**로, `#dlc-apply-page`가 있으면 **페이지**로 같은 폼을 그린다. 폼을 고칠 땐 `apply.js` 한 곳만 고치면 양쪽에 반영된다.

---

## 3. 배포

```bash
bash scripts/deploy.sh        # ← 이것만 쓴다 (드리프트 검사 → 배포 → 라이브 실측)
```

🚨 **`npx vercel deploy`를 직접 치지 말 것.** 행사 정보가 여러 페이지에 복제돼 있어
검사 없이 배포하면 한 곳만 고친 채로 나간다. `deploy.sh`는 검사 실패 시 배포를 멈춘다.

🚨 **배포 전에 `git status`로 남의 작업을 확인할 것.** 이 폴더는 여러 세션이 동시에 만진다.
Vercel 배포는 **작업 디렉토리 전체를 통째로 내보내므로**, 다른 세션이 "아직 공개 전"으로
남겨둔 파일도 같이 나간다. 2026-09-15에 다른 세션이 대기시켜둔 개인정보 처리방침 v1.1이
그렇게 함께 배포될 뻔했고, 닿에게 확인받고 진행했다. **법적 문서·미공개 초안이 끼어 있으면 반드시 묻는다.**

- **git 연동 없음** → push해도 자동 배포 안 됨. 위 스크립트가 유일한 배포 경로
- 도메인: 가비아 등록 · NS는 Vercel (`ns1/ns2.vercel-dns.com`) · apex + `www` 둘 다 연결됨

🚨 **배포 직후 `curl`로 잰 크기는 옛 값일 수 있다.** Ready 뜬 뒤 몇 초 지나 다시 재거나, 배포 URL로 직접 확인할 것. (2026-09-04에 8,382B로 잘못 읽고 "배포 실패"로 오판한 적 있음)

### 배포 검증

```bash
B=https://death-literacy-connect.kr
for p in / /deathtival /deathtival/apply /deathbti /en /en/deathtival /privacy; do
  curl -sS -o /dev/null -w "$p %{http_code} %{size_download}B\n" -L "$B$p"; done
curl -sS -o /dev/null -w "구철자 %{http_code} → %{redirect_url}\n" "$B/deathival"
```

---

## 4. 환경변수 (Vercel · production/preview/development 3개 다 등록됨)

| 이름 | 값 | 용도 |
|---|---|---|
| `AIRTABLE_TOKEN_DLC` | DLC 계정 PAT (Sensitive) | Airtable 쓰기 |
| `AIRTABLE_BASE_ID` | (Vercel env 참조) | 대상 베이스 |
| `AIRTABLE_TABLE` | (미설정 = 기본값) | 기본 `데스티벌 참여신청` |

로컬 검증은 `.env.local`에 같은 값을 두고 쓴다. 토큰 원본은 `nodak-airtable` 스킬의 공용 저장소(`<skill>/.env` → `AIRTABLE_TOKEN_DLC`)에 있다.

---

## 5. Airtable 연동

**베이스**: Airtable 표시명 **「죽음문해력커넥트」** / `nodak-airtable` 스킬 alias **`DLC`**
베이스·테이블 ID는 **이 공개 레포에 적지 않는다** — Vercel 환경변수와 `nodak-airtable` 스킬의 `references/bases.json`에 있다.
계정: `the.last.hello15@gmail.com` (노닥컴퍼니 계정과 **다름**)

**테이블 `데스티벌 참여신청`** (19필드)

| 묶음 | 필드 |
|---|---|
| 폼 입력 (5) | 이름 · 연락처 · 이메일 · 참여 프로그램 · 개인정보 수집·이용 동의 |
| 자동 기입 | 신청일시 · 상태(`신청접수`) · **참가비** · **입금상태** · utm_source · utm_campaign |
| 운영용 (수동) | 소속·직함 · 동반 인원 · 관심 프로그램 · 사전 질문 · 참가자 유형 · 유입경로 · 소식 수신 동의 · 비고 |

**참가비 자동 규칙** (`api/apply.js`)

- `10/23(금) 온라인 …` 포함 → 참가비 `10000` · 입금상태 `입금대기`
- 오프라인만 → 참가비 `0` · 입금상태 `해당없음(무료)`

**테이블 `죽BTI 응답`** — 진단 결과 (13필드 · 2026-09-04 한국어로 통일)

| 묶음 | 필드 |
|---|---|
| 식별 | 세션ID (**익명** — 검사 1회당 1개, 이름·연락처 안 받음) |
| 결과 | 유형코드 · **유형** · **서브유형** · 점수(JSON) · **응답원본(JSON)** · 검사일시 |
| 유입 | `utm_source` · `utm_campaign` · 유입 페이지 |
| 행동 | **가족에게 보냄** (= **핵심 성공지표**) · 공유함 · 데스티벌 클릭 |

🚨 **필드명을 바꾸면 `api/deathbti.js`·`api/deathbti-stats.js`·`api/apply.js`의 하드코딩된 키도 같이 고쳐야 한다.** 안 고치면 422로 저장이 조용히 실패한다 — 화면엔 결과가 멀쩡히 뜨는데 DB에만 안 쌓인다.

📌 **`utm_source`·`utm_campaign`은 일부러 영문으로 둔다** (닿 결정 2026-09-04). URL 파라미터명 그 자체이고 GA·광고 대시보드와 같은 이름이어야 대조가 된다. 나머지는 운영자가 보는 표이므로 한국어. `유입 페이지`(document.referrer)는 한국어 유지.

`응답원본(JSON)`을 남기는 이유: 문항이나 채점을 고쳤을 때 **과거 응답을 다시 채점**할 수 있어야 한다. 결과 코드만 저장하면 불가능.

**테이블 `죽BTI 문항 (읽기전용)` · `죽BTI 유형 (읽기전용)`** — 응답을 사람이 읽기 위한 참조표

`응답원본(JSON)`은 `{"Q1":1,"Q2":0,…}` 형태라 문항표 없이는 해독이 안 되고, `유형코드`도 숫자뿐이다. 그래서 두 표를 둔다.

🚨 **여기서 고치면 안 된다.** 정본은 `team4/work/deathbti/engine/items.json`이고, 흐름은 **단방향**이다:

```
engine/items.json  →  웹(public/deathbti)  →  공유페이지 8개  →  Airtable 참조표
     (정본)                                                        (사본)
```

갱신은 `bash team4/work/deathbti/engine/sync.sh` 한 줄. 검증(편차 ≤2%p · 정확도 8/8)을 통과해야만 나간다. Airtable에서 직접 문항을 고치면 이 검증을 안 거쳐 진단이 **조용히** 망가진다.

_(구 `questions`·`types`·`Table 1` 테이블은 2026-09-04 닿 집사님이 삭제)_

조회·정리는 스킬로:

```bash
cd ~/.openclaw/nodak-shared/skills/nodak-airtable/scripts
bun run read.ts   --base DLC --table "데스티벌 참여신청" --max 20
bun run delete.ts --base DLC --table "데스티벌 참여신청" --ids '["recXXX"]' --confirm
```

---

## 5-2. 다국어 · 사실 드리프트 방지 (2026-09-14)

### 두 층을 구분한다

| 층 | 내용 | 동기화 |
|---|---|---|
| **사실** | 시간·참가비·날짜·연사·부스 | **언어 무관, 같은 값** → 자동 검사 |
| **문장** | 슬로건·훅·설명문 | **언어마다 다름** → 사람이 판단 |

🚨 **영문판은 한글의 번역본이 아니다.** 한글 홈은 3040 대중에게 말을 걸고,
`/en`은 해외 연구자에게 *왜 한국인지*를 설득한다(통계 20%/18.7%/54.3% · DLI 4차원 ·
La Trobe·한림대 협력). 한글 문장이 바뀌었다고 영문을 기계적으로 맞추지 말 것.

### 드리프트 검사기

```bash
node scripts/check-drift.mjs      # 단독 실행 (deploy.sh가 자동으로 먼저 돌림)
```

- 정본 = **`event.json`** — 사실 8종 × 언어별 표기 + `stale`(있으면 안 되는 옛 값)
- 검사 3종: ①있어야 할 값 누락 ②**옛 값 잔존** ③한글이 영문보다 최근 수정(번역 지연 경고)
- 드리프트 발견 시 `exit 1` → `deploy.sh`가 배포 중단

**행사 정보가 바뀌면**: `event.json` 먼저 고치고 → 해당 페이지들 고치고 → 검사기로 확인.
검사기는 **자동 수정하지 않는다**(문장 맥락은 기계가 못 고침).

🚨 이 장치가 생긴 이유 — 2026-09-04에 `/deathtival`만 고치고 홈을 빠뜨려
**열흘간 홈이 "10:00–12:00 · 참가비 무료"를 말했다.** 유료 행사를 무료로 안내한 것.
9/14 영문판 작업 중 우연히 발견. 검사기로 재현 테스트 시 7건 전부 검출 확인.

---

## 6. 행사 정보의 정본

🚨 **아베 집사님 협력제안서가 최신이다.** 지나 집사님 기획안 V3보다 뒤(9/5자)이고, 내용이 여러 곳 다르다.

| 문서 | 작성 | 구글 ID |
|---|---|---|
| **소개 및 협력제안서 (정본)** | 아베 · 9/4 01:21 공유 | `13F-8zkkyYgC4BlfS9lkmbHnOqrFuX3h1W5xYyfJn7fY` |
| 실행 계획(안) V3 | 지나 · 9/1 | `1ll5sxky4uiuRlAI-WuT8ZMFUhbKe6SKmil-G6nf7UBg` |

**제안서 기준 확정 사실** (페이지에 반영됨)

- 10/23(금) **10:00–12:30** 온라인 Zoom 웨비나 · **참가비 1인 10,000원** (닿 도장 2026-09-04)
  - 참가비는 K-DLI 연구에 사용 · 신청자는 **다음 날 오프라인 무료 참여**
- 10/24(토) 14:00–19:00 서촌 북성재(종로구 필운대로7길 19) · **무료**
- 세션: OPENING(유은실) / S1 이소라 / S2 **하정화**·강원남·손영순·윤은남 / S3 김영아·신아베·박진옥 / Q&A · 휴식 10분 ×2
- 오프라인 6종: 묘비명 백일장 · 관꾸 · 영정네컷 · 동화책 큐레이션 · **북토크(송인주 박사)** · One Last BGM
  - ⚠️ V3의 "데스카페(카페사담)"는 **북토크로 교체됨**
- 참여 대상에 **"죽음문해력과 죽음 준비에 관심이 있는 누구나"** 포함 (전문가 한정 아님)

---

## 7. 브랜드

**컬러 4색** — 죽음 `#000000` · 삶 `#FEFEFE` · 하늘 `#2CB8DB` · 햇살 `#E1D973`

**폰트** (2026-09-04 렌더 대조로 실측 확정)

| 용도 | 폰트 |
|---|---|
| 본문·UI | **Pretendard** (jsDelivr) |
| 행사 타이포(제목·날짜·장소 배지) | **Gmarket Sans** — 포스터가 실제로 쓴 폰트, 상업용 무료 |
| 포스터 대제목 「데스티벌」 | ❌ 폰트 아님 — **손레터링**. 필요하면 포스터 이미지를 쓴다 |

⚠️ 옛 README에 적혀 있던 `Noto Serif KR`·`Cormorant Garamond`는 **틀린 정보**였다. 기획안 슬라이드의 `Asta Sans`·`Arial`도 브랜드 폰트가 아니다(문서 편집 기본값).

**브랜드톤 정본**: `team4/work/260802-dlc-insta-launch/GUIDE.md` (4색 · 폰트 · D 캐릭터 · 사진 처리)

---

## 8. 미결 이슈

- [ ] **입금 안내가 수동** — 유료(10/23) 신청이 쌓여도 문자·메일은 사람이 보내야 함. 자동화 미정
- [ ] **망고하다 로고가 로고가 아님** — `og:image`(1200×630 배너)라 톤이 안 맞음. 기관에 정식 로고 요청 필요
- [ ] **나눔과나눔(120px)·모현(193px) 저해상도** — 웹은 버티나 인쇄 불가
- [ ] **개인정보 처리방침 v1.1 배포 대기** — 2026-09-13 전면 점검 후 초안 완료(🔴7건 반영). **배포 안 됨** = 라이브는 아직 v1.0. 배포 명령은 3장 참고. 시행일 9/21은 9/14 공지 기준이라 **배포가 늦어지면 `public/privacy/index.html`의 날짜 2곳(`.updated` div · 변경 안내 박스)을 같이 밀 것**. 점검 근거·결정 이력 = `team4/work/260908-team-ops-dlc-privacy-audit.md`
- [ ] **처리방침 4조 검토 미완** — 명의(고유번호증 등록명 = 죽음문해력커넥트 / 대표 김영아, 2026-09-13 닿 확인)와 통신판매업 미신고(닿 판단: 소수·계좌이체·실비)는 확정. 문구 전체 4조 리뷰는 아직
- [x] ~~폼 문구 도장~~ — **참가비 용처 대외 문구 = "한국 죽음문해력 지수(K-DLI) 연구"로 확정** (2026-09-14 닿). 현재 `apply.js` 문구 그대로 유지, 수정 없음
- [x] ~~죽BTI 배포~~ — 2026-09-04 배포 완료. 라이브 전체 플로우 + Airtable 저장 검증 통과
- [x] ~~카드의 축 표기~~ — `TYPE 07 · 행동／실전파` → `TYPE 07 · 슬픔과 배고픔을 분리하는 사람`(유형 설명)으로 교체. 축은 채점 엔진 안에만 남음
- [x] ~~죽BTI 개인정보 안내 필요 여부~~ — 필요하다고 판단. **처리방침 v1.1 제3조**에 "개인을 알아볼 수 있는 정보를 일절 수집하지 않음 + 세션 식별자는 어디에도 저장되지 않음"으로 명시 (배포 시 반영)
- [ ] **영문판 = `/en` · `/en/deathtival` · `/en/deathbti` 3장.** 신청폼·처리방침은 한글 전용
- [ ] 죽BTI 영문은 **쇼케이스(설명)이지 진단이 아니다.** 풀 영문화하려면 문항 10 + 선택지 40 + 유형 8 카피를 새로 써야 함 — 단 **카드 이미지는 재작업 불필요**(`output/deathbti-cards-260904/`에 `types.json → v4gen.mjs → v4shot.mjs` 파이프라인이 살아있어 텍스트만 갈면 8장 자동 재생성, 일러스트 재사용). 지금 안 하는 이유 = 성공지표가 「가족에게 보내기」인데 그 공유는 한국어 단톡방에서만 일어남
- [ ] 서브도메인 `deathtival.death-literacy-connect.kr`는 **미설정** (하위경로가 정본, 필요해지면 301로 얹기)

---

## 9. 참고

- 랜딩 기획서 v1: `team4/work/260903-dlc-landing-plan/plan.md`
- 포스터 원본: `team4/_inbox/deathtival-260904/poster-v1.png`
- 협력기관 로고 세트 + 출처·해상도: `team4/work/260901-partner-logos/README.md`
- 문의처: `the.last.hello15@gmail.com` (도메인 메일 `hello@death-literacy-connect.kr`은 **미사용**)
