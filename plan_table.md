# Table Feature Implementation Plan

작성일: 2026-03-01 (KST)  
분석 기준: `/Users/cnt-22-70004/Documents/Polaris Novel` 현재 코드베이스

---

## 1. 목표와 범위

요구사항(사용자 요청) 기준 최종 목표:

1. Markdown 테이블을 실사용 관점에서 완전 지원
2. UI에서 행 추가/열 추가/셀 병합 제공
3. `/` 커맨드로 테이블 삽입 가능
4. 드래그는 테이블 단위(블록 단위)로 동작

중요 해석:

- 순수 Markdown 파이프 테이블 문법은 `rowspan/colspan`(셀 병합)을 표현할 수 없다.
- 따라서 “완전 지원”은 아래 이중 정책으로 정의한다.
1. 단순 테이블은 파이프 테이블로 import/export
2. 병합/복합 셀 포함 테이블은 HTML `<table>`로 손실 없이 보존

이 정책은 현재 사용 중인 `tiptap-markdown` 내부 동작과 정합적이다.

---

## 2. 현재 상태 분석 (research.md + 추가 점검)

## 2.1 이미 갖춘 기반

1. Markdown 입출력 파이프라인이 이미 연결됨
- `apps/web/components/tailwind/ui/menu.tsx`
- import: `editor.commands.setContent(markdown, true)`
- export: `editor.storage.markdown.getMarkdown()`

2. 확장 조립 구조가 명확함
- `apps/web/components/tailwind/extensions.ts`에서 앱 실제 확장 조립
- `packages/headless/src/extensions/index.ts`와 `packages/headless/src/index.ts`가 공용 export 허브

3. Slash command 확장/렌더 구조가 준비됨
- `packages/headless/src/extensions/slash-command.tsx`
- `apps/web/components/tailwind/slash-command.tsx`

4. 전역 Drag Handle이 이미 있음
- `GlobalDragHandle` 사용 중
- 정의목록은 별도 drag guard로 “그룹 단위 이동”까지 보정됨 (`DefinitionListDragGuard`)

## 2.2 현재의 명확한 갭

1. 테이블 관련 TipTap 확장 미등록
- `apps/web/components/tailwind/extensions.ts`에 table 계열 확장 없음

2. 의존성 미설치
- `packages/headless/node_modules/@tiptap`에 table 계열 패키지 부재

3. Slash 메뉴에 테이블 항목 없음
- `apps/web/components/tailwind/slash-command.tsx`에 insertTable 커맨드 없음

4. 테이블 조작 UI 없음
- 행/열 추가, 병합/분할, 헤더 토글 UI 부재

5. 현재 bubble 노출 조건과 테이블 UX 충돌 가능
- `EditorBubble` 기본 조건이 “빈 선택(empty) 숨김” 중심
- 테이블 셀 내부 커서 상태에서도 조작 UI가 필요하므로 전용 shouldShow 조건 필요

## 2.3 Markdown 관련 핵심 사실 (추가 코드 점검)

`tiptap-markdown`의 `table` serializer 로직 확인 결과:

1. 단순 테이블은 파이프 테이블로 직렬화
2. 다음 조건이면 HTML로 폴백 직렬화
- `colspan > 1` 또는 `rowspan > 1`
- 복합 셀 구조(헤더/바디 구조 불일치, 다중 블록 등)

즉, 셀 병합을 포함한 손실 없는 round-trip은 “HTML 폴백 포함 Markdown” 전략이 필수이며, 라이브러리도 이미 그렇게 동작한다.

---

## 3. 구현 전략 (권장 아키텍처)

## 3.1 스키마/확장 계층

1. headless 확장에 Table 번들 추가
- 파일 신설: `packages/headless/src/extensions/table.ts` (권장)
- 내용:
  - table/tableRow/tableHeader/tableCell 확장 구성
  - 테이블 공통 설정(`resizable`, `allowTableNodeSelection` 등)
  - 클래스/HTML attributes 지정

2. headless export 연결
- `packages/headless/src/extensions/index.ts` export
- `packages/headless/src/index.ts` re-export

3. app 조립에 테이블 확장 등록
- `apps/web/components/tailwind/extensions.ts`의 `createExtensions`에 table 계열 추가
- 등록 순서는 block 계열(StarterKit 이후) + markdown extension 이전 구간 권장

## 3.2 드래그(테이블 단위) 전략

1. 기본 전략
- table 노드를 block 단위 선택 가능하게 구성
- 전역 drag handle로 table 블록 드래그 유도

2. 보강 전략 (필요 시)
- `DefinitionListDragGuard` 패턴을 재사용해 `TableDragGuard` 추가
- dragstart 시 table 내부 selection을 table NodeSelection으로 강제 보정
- 결과적으로 “행/셀”이 아니라 “테이블 전체” 이동 일관성 확보

---

## 4. UI/UX 설계

## 4.1 Slash command

파일: `apps/web/components/tailwind/slash-command.tsx`

추가 항목:

1. `Table`
2. 설명: `Insert a table (3x3)`
3. 커맨드:
- `deleteRange(range)` 후 `insertTable({ rows: 3, cols: 3, withHeaderRow: true })`

검색어:
- `table`, `grid`, `sheet`

## 4.2 테이블 조작 UI (행/열/병합)

권장 구현:

1. 전용 테이블 버블/툴바 컴포넌트 추가
- 예: `apps/web/components/tailwind/selectors/table-selector.tsx`
- 표시 조건: `editor.isActive("table") || editor.isActive("tableCell")`

2. 제공 액션 (MVP)
- 행: 위/아래 추가, 행 삭제
- 열: 좌/우 추가, 열 삭제
- 셀: 병합, 분할
- 테이블: 삭제
- 헤더: 헤더 행 토글(옵션)

3. disabled 로직
- 병합: 다중 셀 선택일 때만 활성
- 분할: 병합 셀에서만 활성

4. 기존 버블과 충돌 방지
- 기존 `GenerativeMenuSwitch`는 텍스트 선택 중심 유지
- 테이블 조작 UI는 별도 버블로 분리해서 노출

---

## 5. Markdown “완전 지원” 정의 및 정책

## 5.1 Import

1. 파이프 테이블(`|---|`) 입력 시 table 노드로 파싱 가능해야 함
2. HTML `<table>` 입력 시 동일하게 table 노드로 유지되어야 함
3. 기존 MD import 경로(`setContent(markdown, true)`) 그대로 사용

## 5.2 Export

1. 단순 테이블: 파이프 테이블로 export
2. 병합/복합 테이블: HTML `<table>`로 export
3. 목표는 문법 순수성보다 “데이터 손실 없음(round-trip)” 우선

## 5.3 사용자 관점 명세

1. 병합을 사용하지 않은 테이블은 일반 MD 에디터와 호환되는 파이프 표 유지
2. 병합을 사용한 테이블은 HTML이 포함되더라도 재-import 시 편집 상태 보존

---

## 6. 파일별 변경 계획

## 6.1 `packages/headless`

1. `packages/headless/package.json`
- table 관련 TipTap 의존성 추가

2. `packages/headless/src/extensions/table.ts` (new)
- table/tableRow/tableHeader/tableCell 구성 + 옵션

3. `packages/headless/src/extensions/table-drag-guard.ts` (optional new)
- 테이블 단위 drag 보정 plugin

4. `packages/headless/src/extensions/index.ts`
- Table 관련 export 추가

5. `packages/headless/src/index.ts`
- public API re-export 추가

## 6.2 `apps/web`

1. `apps/web/components/tailwind/extensions.ts`
- `createExtensions`에 table 계열 + (선택) drag guard 등록

2. `apps/web/components/tailwind/slash-command.tsx`
- `/table` 항목 추가

3. `apps/web/components/tailwind/selectors/table-selector.tsx` (new)
- 행/열/병합/분할 조작 UI

4. `apps/web/components/tailwind/advanced-editor.tsx`
- 테이블 전용 버블/컨트롤 컴포넌트 연결

5. `apps/web/styles/prosemirror.css`
- 테이블 렌더/선택/리사이즈 핸들 스타일 추가
- (`.ProseMirror table`, `th`, `td`, `.selectedCell`, `.column-resize-handle`)

6. `apps/web/lib/content.ts` (optional)
- 샘플 문서에 간단한 테이블 추가(회귀 확인용)

---

## 7. 단계별 실행 플랜

## Phase 0: 준비

1. table 의존성 추가
2. 타입체크/빌드 baseline 확인

완료 조건:

- `pnpm --filter novel typecheck`
- `pnpm --filter novel-next-app typecheck`

## Phase 1: 스키마 연결

1. Table 확장 등록
2. 에디터 로딩/기본 편집 안정성 확인

완료 조건:

- 테이블 JSON 노드 생성 가능
- 커서 이동/입력 오류 없음

## Phase 2: Slash 삽입

1. `/table` 명령 추가
2. 3x3 기본 테이블 삽입

완료 조건:

- `/table` 검색/선택으로 테이블 즉시 생성

## Phase 3: 테이블 조작 UI

1. 테이블 버블/툴바 추가
2. 행/열 추가/삭제 + 병합/분할 동작 연결

완료 조건:

- 마우스 기준으로 조작 가능
- 병합/분할 버튼 상태가 유효성에 맞게 활성/비활성

## Phase 4: 테이블 단위 드래그

1. 기본 drag handle로 table 블록 이동 확인
2. 불안정 시 `TableDragGuard` 추가

완료 조건:

- 드래그 시 테이블 전체가 이동(행/셀 단위 분해 이동 없음)

## Phase 5: Markdown round-trip

1. 단순 표: Markdown 파이프 표 왕복 확인
2. 병합 표: HTML 폴백 왕복 확인

완료 조건:

- import/export 후 구조 손실 없음

## Phase 6: 안정화

1. 스타일/접근성/에지 케이스 정리
2. 문서 업데이트(`research.md` 링크/정책 반영)

---

## 8. 검증 시나리오 (수용 기준)

## 8.1 기능

1. `/table`로 생성
2. 행 추가(위/아래), 열 추가(좌/우)
3. 셀 병합/분할
4. 테이블 삭제
5. 테이블 단위 드래그 이동

## 8.2 Markdown

1. 단순 표 export가 파이프 문법인지 확인
2. 파이프 표 import 후 편집 가능 여부
3. 병합 표 export 시 HTML 포함 확인
4. HTML table import 후 구조 보존 확인

## 8.3 회귀

1. 기존 slash command 정상 동작
2. definition list drag 동작 유지
3. 이미지 업로드/수식 노드 동작 유지
4. 협업 탭 간 동기화 중 테이블 편집 충돌 없는지 확인

---

## 9. 리스크와 대응

1. 리스크: “MD 완전 지원” 용어 오해
- 원인: 표준 Markdown은 셀 병합 불가
- 대응: 제품 명세에 “병합 시 HTML 폴백”을 명시

2. 리스크: 버블 메뉴 충돌
- 원인: 현재 버블이 텍스트 선택 중심
- 대응: 테이블 전용 버블 분리

3. 리스크: 드래그 동작 불안정
- 원인: NodeSelection/drag image 처리 편차
- 대응: `TableDragGuard`로 dragstart 보정

4. 리스크: 복잡 셀 콘텐츠 직렬화 차이
- 원인: 테이블 셀 내부 다중 블록/커스텀 노드
- 대응: HTML 폴백을 정식 지원 정책으로 채택

---

## 10. 최종 결정 포인트 (구현 전 확정 필요)

1. 병합 테이블 export 정책:
- A안: HTML 폴백 허용 (권장)
- B안: 병합 자체 금지(요구사항 불일치)

2. 테이블 UI 노출 방식:
- A안: 테이블 전용 버블 (권장)
- B안: 기존 버블에 조건 분기 추가(복잡도 증가)

3. 드래그 보정:
- A안: 기본 DragHandle 우선, 문제 시 Guard 추가 (권장)
- B안: 초기부터 Guard 강제 적용

---

## 11. 결론

현재 코드베이스는 Markdown 파이프라인/Slash/Drag 기반이 이미 갖춰져 있어, 테이블 기능은 “확장 등록 + UI 조작 레이어 + drag 보정” 중심으로 구현하면 된다.  
핵심은 셀 병합을 표준 Markdown으로 강제하지 않고 HTML 폴백을 공식 정책으로 채택해 round-trip 손실을 막는 것이다.
