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
| `/privacy` | 개인정보 처리방침 (시행일 2026-09-04 · v1.0) |
| `/api/apply` | 신청 접수 서버리스 함수 → Airtable |

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
  deathtival/index.html    행사 페이지
  deathtival/apply/index.html  신청 단독 페이지
  privacy/index.html       개인정보 처리방침
  deathtival-poster.png    포스터 v1 (지나, 2026-09-04) — 히어로 이미지
  partners/*.png|jpg       협력기관 로고 5곳
  logo-kr.png / dsym-black.png / dsym-white.png / logo-dsym*.png
vercel.json                cleanUrls + 리다이렉트
.env.local                 로컬 검증용 (git 제외)
```

**폼이 한 벌인 이유**: `apply.js`가 `[data-apply]` 버튼이 있으면 **모달**로, `#dlc-apply-page`가 있으면 **페이지**로 같은 폼을 그린다. 폼을 고칠 땐 `apply.js` 한 곳만 고치면 양쪽에 반영된다.

---

## 3. 배포

```bash
npx vercel deploy --prod --yes --scope daht-mad-ais-projects
```

- **git 연동 없음** → push해도 자동 배포 안 됨. 위 명령이 유일한 배포 경로
- 도메인: 가비아 등록 · NS는 Vercel (`ns1/ns2.vercel-dns.com`) · apex + `www` 둘 다 연결됨

🚨 **배포 직후 `curl`로 잰 크기는 옛 값일 수 있다.** Ready 뜬 뒤 몇 초 지나 다시 재거나, 배포 URL로 직접 확인할 것. (2026-09-04에 8,382B로 잘못 읽고 "배포 실패"로 오판한 적 있음)

### 배포 검증

```bash
B=https://death-literacy-connect.kr
for p in / /deathtival /deathtival/apply /privacy; do
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

조회·정리는 스킬로:

```bash
cd ~/.openclaw/nodak-shared/skills/nodak-airtable/scripts
bun run read.ts   --base DLC --table "데스티벌 참여신청" --max 20
bun run delete.ts --base DLC --table "데스티벌 참여신청" --ids '["recXXX"]' --confirm
```

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
- [ ] **개인정보 처리방침 4조 검토 미완** — 고유번호 `122-82-94522`는 닿 확인 완료, 문구 전체 검토는 아직
- [ ] 죽BTI 진단(`questions`/`types`/`responses` 테이블 신설됨) — 축 확정 후 랜딩 연결
- [ ] 서브도메인 `deathtival.death-literacy-connect.kr`는 **미설정** (하위경로가 정본, 필요해지면 301로 얹기)

---

## 9. 참고

- 랜딩 기획서 v1: `team4/work/260903-dlc-landing-plan/plan.md`
- 포스터 원본: `team4/_inbox/deathtival-260904/poster-v1.png`
- 협력기관 로고 세트 + 출처·해상도: `team4/work/260901-partner-logos/README.md`
- 문의처: `the.last.hello15@gmail.com` (도메인 메일 `hello@death-literacy-connect.kr`은 **미사용**)
