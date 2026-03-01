# Polaris Novel 자동 테스트 도입 상세 계획서

작성일: 2026-03-01 (KST)  
분석 기준: `/Users/cnt-22-70004/Documents/Polaris Novel` 현재 코드베이스

추적 기준(변경 이력):

1. upstream merge-base: `fa95098e66476c466faebb8211baa5869c101a9c`
2. 누적 추적 범위: `fa95098e..main` (23 commits, 36 files, `+4663/-2130`)
3. 현재 워킹트리 미커밋 변경:
- `apps/web/lib/content.ts`
- `packages/headless/src/extensions/mathematics.ts`

---

## 1. 프로젝트 상세 분석

## 1.1 모노레포 구조와 실행 단위

1. 루트는 `pnpm workspace + turbo` 기반 모노레포다.
2. 실제 제품 실행 진입점은 `apps/web`(Next.js 15, App Router)이다.
3. 에디터 핵심 로직은 `packages/headless` 라이브러리(`novel`)에 구현되어 `apps/web`에서 소비한다.
4. 현재 루트/패키지 스크립트에는 `test` 관련 스크립트가 없다.
5. CI(`.github/workflows/release.yaml`)는 릴리즈/빌드만 수행하고 테스트를 수행하지 않는다.

## 1.2 현재 기능 아키텍처 요약

### 1.2.1 앱 레이어 (`apps/web`)

1. `app/page.tsx`
- URL 쿼리 `doc`를 문서 ID로 정규화하고, 기본값은 `"local-default"`다.

2. `components/tailwind/advanced-editor.tsx`
- 협업 초기화(`LocalBroadcastProvider` + `Y.Doc`) 담당.
- 동기화 상태 배지(`connecting/disconnected/synced`)와 저장 상태(`Saved/Unsaved`) 관리.
- 디바운스 저장(500ms)으로 `html-content`, `novel-content`, `markdown`를 `localStorage`에 저장.
- 협업 스냅샷/원격 업데이트/피어 부재 조건에서만 기본 문서(`defaultEditorContent`)를 부트스트랩한다.

3. `components/tailwind/ui/menu.tsx`
- 새 문서, 기능 소개 문서 로딩, Markdown 가져오기, Markdown/JSON 내보내기, 테마 전환 제공.
- `window.confirm`, `input[type=file]`, `Blob`, `URL.createObjectURL` 등 브라우저 API 의존성이 크다.

4. `lib/collab/local-provider.ts`
- `BroadcastChannel` 기반 로컬 CRDT 동기화 구현.
- 메시지 타입: `sync-request`, `sync-response`, `doc-update`, `awareness-update`.
- 스냅샷 디바운스 저장, beforeunload 처리, peer 수 계산, synced 상태 전이 처리.

5. `lib/collab/persistence.ts`
- Yjs 업데이트를 base64로 직렬화해 `localStorage`에 저장/복원.
- 손상 스냅샷 자동 정리 로직 포함.

6. `app/api/upload/route.ts`
- `BLOB_READ_WRITE_TOKEN` 미존재 시 401 반환.
- 토큰 존재 시 `@vercel/blob`의 `put` 호출.

7. `app/api/generate/route.ts`
- 현재 501 반환(의도적으로 AI 비활성화).

### 1.2.2 라이브러리 레이어 (`packages/headless`)

1. `extensions/mathematics.ts`
- 인라인 수식 노드(`math`) 구현.
- `$...$` 인라인 수식 토크나이저/렌더러를 Markdown-it 룰로 주입.
- 통화 표기/이스케이프/코드블록 문맥 오탐 방지 로직 존재.

2. `extensions/definition-list.ts`
- definition list 노드( `definitionList`, `definitionTerm`, `definitionDescription`) 구현.
- Markdown serialize/parse 커스텀 로직과 Enter 키 동작(그룹 경계 기반 삽입) 포함.

3. `extensions/table-drag-guard.ts`, `extensions/definition-list-drag-guard.ts`
- drag-handle 사용 시 노드 단위 선택을 강제해 블록 이동 안정화.

4. `plugins/upload-images.tsx`
- 업로드 placeholder decoration 관리.
- paste/drop 핸들러와 업로드 성공/실패 시 노드 삽입/placeholder 제거 로직 포함.

5. `extensions/slash-command.tsx`
- `/` suggestion popup 렌더링/키보드 네비게이션 처리.

## 1.3 테스트 관점 핵심 리스크

1. 협업 상태 전이 리스크
- `connecting -> synced` 전이가 타이머/원격 업데이트/스냅샷 복원 조건과 결합되어 있어 회귀 위험이 높다.

2. Markdown 라운드트립 리스크
- `mathematics`, `definition-list`, `table`이 각각 커스텀 parse/serialize를 가진다.
- 작은 변경에도 import/export 동등성이 쉽게 깨질 수 있다.

3. 브라우저 API 의존 리스크
- 메뉴, 업로드, 테마, local/session storage, BroadcastChannel 등 브라우저 API mocking 품질에 따라 테스트 신뢰도가 크게 달라진다.

4. 에디터 상호작용 리스크
- slash command, bubble menu, table selector, 수식 토글은 키보드/선택 상태에 민감하다.

5. API 안전성 리스크
- 업로드 라우트는 헤더 기반 파일명 조합과 환경 변수 분기 로직이 있어 최소한의 계약 테스트가 필요하다.

6. 변경 이력 기반 회귀 리스크
- 최근 커밋이 `table + definition-list + collab + math` 축에 집중되어 있어, 단순 기능 테스트만으로는 회귀를 놓치기 쉽다.
- 특히 “테이블 삽입 직후 bootstrap 덮어쓰기 방지”, “테이블 셀 내부 placeholder 숨김”, “private mode 복원 안정화”는 과거 실제 fix 이력 기반 회귀 포인트다.

## 1.4 현재 테스트 공백

1. `*.test.*`, `*.spec.*`, `vitest/jest/playwright` 설정 파일 부재.
2. package scripts에 `test` 부재.
3. turbo pipeline에 테스트 태스크 부재.
4. CI에 테스트 단계 부재.

---

## 2. 자동 테스트 전략

## 2.1 목표

1. 핵심 편집 플로우 회귀를 PR 단계에서 자동 감지.
2. 로직(순수 함수/규칙)과 UI 상호작용을 분리해 빠르고 안정적인 테스트 레이어 구축.
3. 로컬 협업/Markdown 라운드트립/업로드 경계조건을 우선 보호.

## 2.2 테스트 피라미드

1. Unit Test (가장 많이)
- 순수 함수, 파싱/직렬화 규칙, 작은 상태 전이 함수 중심.

2. Integration Test (중간)
- Tiptap extension + editor state + DOM 상호작용 결합.
- route handler 계약 검증.

3. E2E Test (핵심 시나리오 소수)
- 실제 브라우저에서 문서 작성/가져오기/내보내기/협업/테마 전환을 검증.

## 2.3 권장 도구 스택

1. 단위/통합
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `jsdom`

2. E2E
- `@playwright/test`

3. 커버리지
- Vitest V8 coverage (`@vitest/coverage-v8`)

4. Mock/보조
- `vi.spyOn` + 수동 mock
- 필요 시 `msw`(네트워크 모킹 확장용, 2차 도입)

## 2.4 테스트 우선순위 (P0/P1/P2)

1. P0 (즉시)
- 협업 provider, persistence, upload route, math parsing/serialize, definition-list parsing/serialize, 업로드 plugin 핵심 분기.

2. P1
- 메뉴/테이블 selector/수식 selector 등 핵심 UI 상호작용.
- 기본 페이지 docId 정규화.

3. P2
- 스타일/아이콘 중심 컴포넌트, 사소한 유틸.

## 2.5 변경 이력 기반 회귀 전략

1. 최근 23개 커밋에서 실제로 수정된 영역을 “회귀 팩”으로 고정한다.
2. 회귀 팩은 기능 축별로 분리한다.
- `Regression Pack A`: table/placeholder/bubble/layout
- `Regression Pack B`: definition-list parse/serialize/drag
- `Regression Pack C`: collab bootstrap/snapshot/private mode
- `Regression Pack D`: math inline parse/serialize/currency false-positive
3. 신규 PR에서 변경 파일이 회귀 팩 파일과 겹치면 해당 팩 테스트를 필수 실행한다.
4. 미커밋 수식 변경이 존재하므로, `mathematics.ts` 관련 테스트는 우선 작성 후 기능 커밋을 권장한다.

---

## 3. 단계별 구현 로드맵

## Phase 0. 테스트 인프라 부트스트랩

1. 의존성 추가
- 루트 또는 패키지별: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `@playwright/test`.

2. 설정 파일 추가
- `vitest.workspace.ts` 또는 패키지별 `vitest.config.ts`.
- 공통 setup 파일(`tests/setup.ts`)에서 `jest-dom`, 브라우저 API mock 등록.
- `playwright.config.ts` 추가.

3. 스크립트 추가
- 루트: `test`, `test:unit`, `test:coverage`, `test:e2e`.
- 패키지별: `test`.

4. turbo 태스크 추가
- `test` 태스크 추가(캐시 가능), 필요 시 `test:e2e`는 non-cache.

5. 회귀 기준선 스냅샷
- `fa95098e..main` 범위에서 변경된 36개 파일을 회귀 매핑표로 고정.
- 우선 보호 파일(협업/테이블/정의목록/수식/API)을 `must-test` 목록으로 문서화.

완료 조건:
1. `pnpm test`가 최소 샘플 테스트를 성공한다.
2. CI 로컬 dry-run 기준 실패 시 1 이상의 exit code를 반환한다.

## Phase 1. P0 유닛 테스트 구축

대상:
1. `apps/web/lib/collab/persistence.ts`
2. `apps/web/lib/collab/user.ts`
3. `packages/headless/src/extensions/mathematics.ts` (핵심 규칙 분리/노출 포함)
4. `packages/headless/src/extensions/definition-list.ts` (핵심 파서/serializer 보조 로직 대상)
5. `packages/headless/src/utils/index.ts`

완료 조건:
1. 파서 오탐/누락 대표 케이스가 고정된다.
2. local/session storage 오류 분기 포함.

## Phase 2. P0 통합 테스트 구축

대상:
1. `apps/web/lib/collab/local-provider.ts`
2. `packages/headless/src/plugins/upload-images.tsx`
3. `apps/web/app/api/upload/route.ts`
4. `apps/web/app/api/generate/route.ts`

완료 조건:
1. sync 요청/응답/업데이트 전파, snapshot 저장 타이밍, destroy 정리 동작 검증.
2. 업로드 성공/401/실패 분기 검증.
3. 501 route 계약 검증.

## Phase 2.5 변경 이력 기반 회귀팩 구축

대상:

1. 테이블 관련 과거 fix 회귀
- bootstrap overwrite 방지
- 셀 내부 placeholder 비노출
- 셀 선택 시 레이아웃 안정성

2. 협업 관련 과거 fix 회귀
- private mode에서 snapshot read/write 실패 내성
- no-peer/no-remote/no-snapshot 조건에서만 default bootstrap

3. 수식 관련 워킹트리 변경 회귀
- `$` 파싱 false-positive(`$12`, `\\$x\\$`, `$$x$$`) 방지
- parseHTML fallback(`latex`, `data-latex`, textContent) 보장

완료 조건:
1. 최근 실제 fix 이력을 테스트 케이스 ID와 1:1로 매핑.
2. 해당 케이스를 변경 파일 조건부(required)로 CI에 연결.

## Phase 3. P1 컴포넌트 테스트 구축

대상:
1. `apps/web/app/page.tsx`
2. `apps/web/components/tailwind/ui/menu.tsx`
3. `apps/web/components/tailwind/selectors/table-selector.tsx`
4. `apps/web/components/tailwind/selectors/math-selector.tsx`

완료 조건:
1. 핵심 버튼/명령이 기대 command chain 호출로 이어진다.
2. disabled/confirm/cancel 분기가 안정적으로 보호된다.

## Phase 4. E2E 스모크 + 회귀 시나리오

대상 시나리오:
1. 기본 문서 로딩 및 편집/저장 상태 배지 전환.
2. Slash command(`/table`, `/definition list`, `/code`) 삽입.
3. Markdown/JSON 내보내기 동작(다운로드 이벤트 감시).
4. 문서 ID 기반 다중 탭 협업(동일 `?doc=`) 동기화.
5. 테마 전환 반영.
6. AI API 비활성 안내(501 경로 영향 없음 확인).

완료 조건:
1. 핵심 6개 시나리오를 PR마다 headless chromium으로 검증.
2. flakiness 2% 이하(최근 50회 기준 재시도 없이 통과 목표).

## Phase 5. CI 통합/품질 게이트 고정

1. 신규 워크플로 추가: `.github/workflows/test.yaml`
2. 기본 파이프라인: install -> typecheck -> lint -> test(unit/integration) -> build -> e2e(선택/스케줄)
3. 최소 커버리지 게이트 설정(초기 완만):
- line 55%
- branch 45%
- function 55%
- statement 55%
4. 이후 2주 단위로 상향.

---

## 4. 모듈별 상세 테스트 명세

## 4.1 `apps/web/app/page.tsx`

1. `TC-PAGE-001`: `doc` 미존재 시 `"local-default"` 전달.
2. `TC-PAGE-002`: `doc` 공백 문자열일 때 `"local-default"` 전달.
3. `TC-PAGE-003`: `doc` 배열일 때 첫 번째 요소 사용.
4. `TC-PAGE-004`: trim 처리 확인.

## 4.2 `apps/web/lib/collab/persistence.ts`

1. `TC-PERSIST-001`: 정상 snapshot 저장(base64).
2. `TC-PERSIST-002`: 손상 snapshot 복원 실패 시 `localStorage.removeItem` 호출.
3. `TC-PERSIST-003`: `window` 미존재 환경에서 안전 종료.
4. `TC-PERSIST-004`: localStorage 예외(Quota/private mode) 무시.

## 4.3 `apps/web/lib/collab/user.ts`

1. `TC-USER-001`: SSR 환경 fallback 사용자 반환.
2. `TC-USER-002`: 유효 sessionStorage 값 재사용.
3. `TC-USER-003`: 잘못된 JSON/스키마일 때 새 사용자 생성.
4. `TC-USER-004`: 저장 실패 시에도 사용자 객체 반환.

## 4.4 `apps/web/lib/collab/local-provider.ts`

1. `TC-COLLAB-001`: 생성 직후 `status=connected` 이벤트 발생.
2. `TC-COLLAB-002`: snapshot 복원 시 즉시 `synced`.
3. `TC-COLLAB-003`: snapshot 없을 때 fallback timer 이후 `synced`.
4. `TC-COLLAB-004`: `sync-request` 수신 시 `sync-response` 전송.
5. `TC-COLLAB-005`: `sync-response(target=self)` 수신 시 update 적용.
6. `TC-COLLAB-006`: `doc-update` 수신 시 remote flag 및 synced 처리.
7. `TC-COLLAB-007`: awareness update 송수신.
8. `TC-COLLAB-008`: `getPeerCount`가 local client 제외하고 계산.
9. `TC-COLLAB-009`: destroy 시 이벤트 리스너/채널 정리 + `status=disconnected`.
10. `TC-COLLAB-010`: beforeunload에서 local awareness 제거.

## 4.5 `packages/headless/src/extensions/mathematics.ts`

1. `TC-MATH-001`: `$x^2$`를 math token으로 파싱.
2. `TC-MATH-002`: `\$x\$`는 파싱하지 않음.
3. `TC-MATH-003`: `$12`/`$12.50` 등 통화 표기 오탐 방지.
4. `TC-MATH-004`: `$$x$$`에서 두 번째 `$` 오탐 방지.
5. `TC-MATH-005`: 코드스팬 문맥(backticks) 파싱 제외.
6. `TC-MATH-006`: serialize 시 내부 `$`를 `\$`로 escape.
7. `TC-MATH-007`: 빈 latex serialize 생략.
8. `TC-MATH-008`: `setLatex`가 codeBlock 문맥에서는 false.
9. `TC-MATH-009`: `unsetLatex`가 선택 범위에 원문 latex 복원.
10. `TC-MATH-010`: parseHTML이 `latex`, `data-latex`, `textContent` 우선순위로 읽음.

## 4.6 `packages/headless/src/extensions/definition-list.ts`

1. `TC-DL-001`: 정상 정의문법 paragraph를 `<dl>`로 변환(parse updateDOM).
2. `TC-DL-002`: 다중 term + 다중 description 그룹 파싱.
3. `TC-DL-003`: 비정상 구조는 HTML serialize fallback.
4. `TC-DL-004`: markdown serialize에서 각 description continuation line에 2칸 들여쓰기.
5. `TC-DL-005`: Enter on `definitionTerm` + description 없음 -> description 삽입.
6. `TC-DL-006`: Enter on `definitionTerm` + description 있음 -> 다음 term 삽입.
7. `TC-DL-007`: `setDefinitionList()` 기본값 `Term/Definition`.

## 4.7 `packages/headless/src/plugins/upload-images.tsx`

1. `TC-UPLOAD-001`: validate 실패 시 업로드 중단.
2. `TC-UPLOAD-002`: placeholder decoration 추가/제거.
3. `TC-UPLOAD-003`: 업로드 성공 시 image node 삽입.
4. `TC-UPLOAD-004`: 업로드 실패 시 placeholder 삭제.
5. `TC-UPLOAD-005`: 401 fallback(로컬 파일 src) 동작.
6. `TC-UPLOAD-006`: paste 이벤트 파일 처리 및 `preventDefault`.
7. `TC-UPLOAD-007`: drop 이벤트 파일 처리 및 좌표 기반 삽입 위치 적용.

## 4.8 `apps/web/components/tailwind/ui/menu.tsx`

1. `TC-MENU-001`: editor 미준비 상태에서 액션 클릭 시 error toast.
2. `TC-MENU-002`: 새 문서 confirm 취소 시 setContent 미호출.
3. `TC-MENU-003`: 새 문서 confirm 승인 시 빈 문서 setContent + focus.
4. `TC-MENU-004`: 기능 소개 로드 시 `defaultEditorContent` 적용.
5. `TC-MENU-005`: Markdown import 성공/실패 토스트 분기.
6. `TC-MENU-006`: Markdown export 파일명 `novel-YYYYMMDD.md`.
7. `TC-MENU-007`: JSON export 파일명/포맷 검증.
8. `TC-MENU-008`: 테마 버튼 클릭 시 `setTheme(system/light/dark)`.

## 4.9 API 라우트

### 4.9.1 `app/api/upload/route.ts`
1. `TC-API-UPLOAD-001`: 토큰 없으면 401 + 에러 메시지.
2. `TC-API-UPLOAD-002`: 확장자 없는 filename이면 content-type 기반 suffix 부여.
3. `TC-API-UPLOAD-003`: 이미 확장자가 맞으면 filename 유지.
4. `TC-API-UPLOAD-004`: `put` 호출 인자(`contentType`, `access`) 검증.

### 4.9.2 `app/api/generate/route.ts`
1. `TC-API-GEN-001`: 항상 501 반환.
2. `TC-API-GEN-002`: 응답 메시지 계약 확인.

## 4.10 E2E 시나리오 상세

1. `E2E-001 기본 편집`
- 페이지 접속 -> 본문 타이핑 -> 저장 상태 `Unsaved -> Saved` 전이.

2. `E2E-002 Slash 삽입`
- `/table` 입력 후 테이블 생성 확인.
- `/definition list` 입력 후 정의목록 생성 확인.

3. `E2E-003 Markdown import/export`
- 샘플 md 업로드 후 본문 반영.
- MD 내보내기 트리거 확인(다운로드 이벤트).

4. `E2E-004 협업 동기화`
- 같은 `?doc=e2e-sync`로 두 페이지 열기.
- 페이지 A 입력이 페이지 B에 반영되는지 확인.

5. `E2E-005 이미지 업로드 fallback`
- `/api/upload` 401 모킹 -> 로컬 DataURL 이미지 삽입 확인.

6. `E2E-006 테마 전환`
- 메뉴에서 dark/light/system 선택 시 html class 반영 확인.

## 4.11 변경 이력 회귀 테스트 팩 (추가)

1. `REG-TABLE-001`
- 테이블 삽입 직후 문서가 기본 콘텐츠로 재부트스트랩되지 않아야 한다.

2. `REG-TABLE-002`
- 테이블 셀/헤더 내부 paragraph placeholder(`Press '/' for commands`)가 노출되지 않아야 한다.

3. `REG-TABLE-003`
- 셀 선택 상태에서 bubble 메뉴와 table selector가 충돌하지 않아야 한다.

4. `REG-COLLAB-001`
- private mode(localStorage read/write 예외)에서도 에디터 초기화가 실패하지 않아야 한다.

5. `REG-COLLAB-002`
- snapshot 복원 성공 시 default content bootstrap이 실행되지 않아야 한다.

6. `REG-MATH-001`
- `$12$`/`Price is $12$`는 인라인 수식으로 파싱되지 않아야 한다.

7. `REG-MATH-002`
- `\\$x\\$`, code span `` `$x$` ``은 수식 토큰으로 변환되지 않아야 한다.

8. `REG-MATH-003`
- `span[data-type=\"math\"]`에 latex 속성이 없어도 parse 단계에서 보정되어야 한다.

---

## 5. 테스트 인프라 파일 변경 계획

## 5.1 루트

1. `package.json`
- `test`, `test:unit`, `test:coverage`, `test:e2e` 스크립트 추가.

2. `turbo.json`
- `tasks.test` 추가.

3. `vitest.workspace.ts` (신규)
- `apps/web`, `packages/headless` 프로젝트 분리 실행.

4. `playwright.config.ts` (신규)
- `apps/web` dev 서버 기준 설정.

5. `.github/workflows/test.yaml` (신규)
- PR/Push 테스트 게이트.

6. `testing-regression-map.md` (신규 권장)
- 커밋/파일/회귀팩 매핑 문서.

## 5.2 `apps/web`

1. `apps/web/vitest.config.ts` (신규)
2. `apps/web/tests/setup.ts` (신규)
3. `apps/web/tests/unit/...` (신규)
4. `apps/web/tests/integration/...` (신규)
5. `apps/web/tests/e2e/...` 또는 루트 `e2e/...` (신규)
6. `apps/web/tests/regression/...` (신규 권장)
- table/collab/math 회귀팩 전용.

## 5.3 `packages/headless`

1. `packages/headless/vitest.config.ts` (신규)
2. `packages/headless/tests/setup.ts` (신규)
3. `packages/headless/src/**/__tests__/*.test.ts(x)` (신규)
4. `packages/headless/src/extensions/__tests__/regression/*.test.ts` (신규 권장)
- `definition-list`, `table-drag-guard`, `mathematics` 회귀 케이스 분리.

---

## 6. Mock/테스트 헬퍼 설계

1. `BroadcastChannel` mock 클래스
- channel 별 메시지 fan-out 지원.
- `onmessage`, `postMessage`, `close` 동작 재현.

2. storage mock
- localStorage/sessionStorage 성공/실패 케이스 토글 가능.

3. timer 제어
- `vi.useFakeTimers()`로 snapshot debounce/sync fallback 검증.

4. DOM API mock
- `window.confirm`, `prompt`, `alert`, `URL.createObjectURL`, `FileReader`.

5. 네트워크/서버 mock
- `global.fetch`, `@vercel/blob.put` mock.

6. editor mock factory
- command chain(`chain().focus().xxx().run()`)를 일관된 stub으로 생성.

7. ProseMirror 선택/좌표 mock
- `CellSelection`, `posAtCoords`, `DOMRect` 경로를 안정적으로 재현하는 헬퍼 추가.

---

## 7. 품질 게이트와 커버리지 정책

## 7.1 초기 게이트 (도입 1차)

1. 모든 PR에서 `typecheck + lint + test(unit/integration)` 필수.
2. E2E는 핵심 브랜치(`main`) 또는 라벨(`e2e-required`) 조건으로 우선 운영 가능.
3. flaky test는 병합 금지, 원인 해결 후 재활성화.
4. 회귀팩(`REG-*`) 실패 시 coverage 수치와 무관하게 merge 차단.

## 7.2 커버리지 기준 (점진적 상향)

1. 1차(도입 즉시): line/function 55%, branch 45%.
2. 2차(2주 후): line/function 65%, branch 55%.
3. 3차(안정화 후): line/function 75%, branch 65%.

## 7.3 필수 보호 영역 규칙

아래 영역은 전체 커버리지와 별개로 “파일별 최소 테스트 존재”를 강제한다.

1. `apps/web/lib/collab/local-provider.ts`
2. `apps/web/lib/collab/persistence.ts`
3. `packages/headless/src/extensions/mathematics.ts`
4. `packages/headless/src/extensions/definition-list.ts`
5. `packages/headless/src/plugins/upload-images.tsx`
6. `apps/web/app/api/upload/route.ts`

---

## 8. 예상 이슈와 대응 전략

1. Tiptap/ProseMirror 테스트 난이도
- 대응: pure helper 분리(파싱/직렬화/선택 위치 계산) 후 unit coverage 우선 확보.

2. 브라우저 API mock 불안정
- 대응: 공통 setup에 표준 mock을 고정하고, 테스트별 재정의 최소화.

3. 협업 테스트 flaky
- 대응: fake timers + deterministic BroadcastChannel mock 사용, 실제 시간 의존 제거.

4. E2E 속도
- 대응: 스모크 6개만 PR에 고정, 확장 시나리오는 nightly/수동 워크플로로 분리.

5. 현재 코드의 내부 비공개 함수 테스트 한계
- 대응: 테스트 가능성을 해치지 않는 선에서 `internal utils` 분리 리팩터링을 Phase 1에 포함.

6. 워킹트리 미커밋 변경과 테스트 괴리
- 대응: `mathematics.ts`, `content.ts` 변경은 커밋 전 회귀팩(`REG-MATH-*`) 통과를 필수로 적용.

---

## 9. 일정 제안 (현실적 기준)

1. Day 1
- Phase 0 완료(인프라/스크립트/CI 골격).

2. Day 2-3
- Phase 1 완료(P0 unit).

3. Day 4-5
- Phase 2 완료(P0 integration).

4. Day 6
- Phase 3 완료(P1 component).

5. Day 7
- Phase 4 완료(E2E 6개) + 게이트 조정.

6. Day 8
- Phase 5 완료(CI 안정화, 커버리지 리포트 정착).

7. Day 9
- Phase 2.5 회귀팩 고도화 + 변경파일 조건부 실행 규칙 튜닝.

---

## 10. 완료 기준 (Definition of Done)

1. `pnpm test`가 로컬/CI에서 일관되게 성공.
2. P0 항목(협업, markdown 핵심 확장, 업로드/API) 테스트가 모두 구현됨.
3. 핵심 E2E 6개 시나리오가 통과.
4. 신규 PR은 테스트 없이 merge 불가한 정책 적용.
5. 테스트 실행/디버깅 가이드가 README 또는 별도 `TESTING.md`에 문서화됨.
6. 최근 fix 이력 기반 `REG-*` 회귀팩이 CI에서 자동 실행됨.

---

## 11. 즉시 실행 체크리스트

1. `test` 인프라 파일 생성 및 의존성 설치.
2. `turbo.json` 테스트 태스크 추가.
3. `apps/web/lib/collab/*` 테스트부터 시작.
4. `mathematics`/`definition-list` helper 분리 후 unit 테스트 추가.
5. upload route + generate route 계약 테스트 추가.
6. 메뉴/테이블/수식 selector 컴포넌트 테스트 추가.
7. Playwright 스모크 6개 작성.
8. GitHub Actions 테스트 워크플로 배치.
9. `REG-*` 회귀팩(테이블/협업/수식) 작성 후 변경파일 조건부 실행 연결.
