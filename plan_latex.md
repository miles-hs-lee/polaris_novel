# Math Feature Plan (Strict CommonMark + Optional Math Extension)

Date: 2026-03-01  
Scope: `packages/headless` + `apps/web`  
Target: 인라인 수식 + 블록 수식을 모두 지원하되, 저장/호환성 기본값은 Strict CommonMark로 맞춘다.

---

## 1. 목표와 설계 원칙

### 1.1 목표
1. 인라인 수식과 블록 수식을 모두 에디터에서 1급 요소로 지원한다.
2. Markdown 저장 시 기본 모드는 Strict CommonMark 호환을 우선한다.
3. 필요할 때만 Optional Math Extension(`$...$`, `$$...$$`)을 켤 수 있게 한다.
4. 기존 문서와 현재 inline `math` 동작을 깨지 않는다.

### 1.2 원칙
1. Canonical model은 ProseMirror/Tiptap 노드(인라인/블록)로 유지한다.
2. Markdown은 출력 프로파일에 따라 다르게 직렬화한다.
3. 파서와 serializer는 가능한 한 round-trip 보존을 보장한다.
4. 수식 렌더 실패는 편집 실패로 이어지지 않게(비파괴 fallback) 처리한다.

---

## 2. 표준/호환성 기준

### 2.1 사실관계
1. CommonMark/GFM 스펙에 "수식 문법"은 표준으로 정의되어 있지 않다.
2. 따라서 `$...$`, `$$...$$`는 표준이 아니라 확장 문법으로 다뤄야 한다.
3. CommonMark에서 허용되는 범위 내에서 수식 표현을 보존하려면 code fence 또는 raw HTML를 사용해야 한다.

### 2.2 Markdown 출력 프로파일

#### Profile A: `strict-commonmark` (기본)
1. 블록 수식(`mathBlock`) -> fenced code block with info string `math`
2. 인라인 수식(`math`) -> raw HTML span

예시:

````md
문장 중간의 <span data-math-inline="E = mc^2">E = mc^2</span> 입니다.

```math
\int_0^1 x^2 \, dx
```
````

주의:
1. `html: true`로 Markdown parser/serializer를 운용해야 inline raw HTML를 보존할 수 있다.
2. HTML sanitize 환경에서는 inline 수식 표현이 제거될 수 있으므로, 이 경우 fallback 정책이 필요하다(아래 5.4 참고).

#### Profile B: `math-extension` (옵션)
1. 인라인 수식 -> `$...$`
2. 블록 수식 -> `$$...$$` (standalone block)

예시:

```md
문장 중간의 $E = mc^2$ 입니다.

$$
\int_0^1 x^2 \, dx
$$
```

### 2.3 가져오기(import) 허용 범위
기본적으로 둘 다 읽는다.
1. Strict forms:
   - ```` ```math ... ``` ````
   - `<span data-math-inline="...">...</span>`
2. Optional extension forms:
   - `$...$`, `\(...\)`
   - `$$...$$`, `\[...\]`

---

## 3. 기능 요구사항 (인라인 + 블록)

### 3.1 인라인 수식
1. 선택 텍스트를 인라인 수식으로 변환 가능
2. 인라인 수식 편집(원본 LaTeX 수정) 가능
3. 해제 시 plain text로 안전하게 되돌릴 수 있어야 함
4. 문장 흐름 내 커서 이동/삭제 동작이 자연스러워야 함

### 3.2 블록 수식
1. Slash command로 삽입 가능 (`/equation`, `/math`)
2. 블록 전체 선택, 드래그, 이동 가능
3. Enter/Backspace 경계 동작 정의
4. 다중 라인 LaTeX(`aligned`, `matrix`) 입력 가능

### 3.3 공통
1. KaTeX 렌더링 실패 시 에러 UI + raw source 보존
2. Copy/Paste, Drag/Drop 시 노드 단위 보존
3. Markdown export/import round-trip 보장

---

## 4. 에디터 데이터 모델 설계

### 4.1 인라인 노드(`math`) 유지
현재 구현을 최대한 유지:
1. `name: "math"`
2. `inline: true`, `atom: true`
3. attrs: `latex: string`

추가/보완:
1. Markdown storage parse/serialize hooks 추가
2. inline 편집 UX 개선(프롬프트 -> 팝오버/모달은 2단계)

### 4.2 블록 노드(`mathBlock`) 신규
제안 스펙:
1. `name: "mathBlock"`
2. `group: "block"`
3. `atom: true`, `selectable: true`, `draggable: true`
4. attrs:
   - `latex: string` (필수)
   - `sourceFormat?: "latex"` (확장 대비, 기본 `"latex"`)

### 4.3 명령(Command) API
1. `setLatex({ latex })` / `unsetLatex()` (기존)
2. `setMathBlock({ latex })`
3. `updateMathBlock({ latex })`
4. `unsetMathBlock({ keepSourceAsText?: boolean })`
5. `convertInlineMathToBlock()` / `convertBlockMathToInline()` (옵션, 2단계)

---

## 5. Markdown 변환 설계

## 5.1 Export 정책

### strict-commonmark
1. `mathBlock`:
   - ```` ```math\n{latex}\n``` ````
2. `math`:
   - `<span data-math-inline="{escaped-latex}">{escaped-latex}</span>`

### math-extension
1. `mathBlock`:
   - `$$\n{latex}\n$$`
2. `math`:
   - `${latex}$`

### 공통 직렬화 규칙
1. trailing spaces 보존은 하지 않음
2. 수식 내부 줄바꿈은 그대로 보존
3. serializer에서 문맥 충돌(예: 인접 텍스트) 시 필요한 escape 적용

## 5.2 Import 정책

우선순위(충돌 방지):
1. fenced code block(`math`)를 가장 먼저 `mathBlock`으로 파싱
2. raw HTML `<span data-math-inline>`를 `math`로 파싱
3. 옵션 활성 시에만 `$...$`, `$$...$$` 파싱
4. 코드블록/코드스팬 내부의 `$`는 절대 수식으로 해석하지 않음

## 5.3 `$` 파싱 안전 규칙 (옵션 모드)
1. 숫자/통화 문맥(`$12.00`)은 수식으로 파싱하지 않음
2. 공백/개행 경계 규칙을 둬서 오탐 줄임
3. escape된 `\$`는 수식 시작으로 인식하지 않음
4. 중첩 `$`는 greedy 금지, shortest valid match 우선

## 5.4 HTML sanitize 환경 fallback
1. import 시 `<span data-math-inline>`가 제거된 입력이면 plain text 유지
2. export 옵션으로 `strictInlineFallback: "html-span" | "verbatim-latex"` 제공
3. `verbatim-latex`일 때 인라인은 `\\(...\\)` 텍스트로 출력 가능

---

## 6. UI/UX 설계

## 6.1 삽입 경로
1. Slash command:
   - `Equation (Block)` 항목 추가
   - 기본 템플릿: `\\frac{a}{b}` 또는 빈 문자열
2. 인라인 수식:
   - 기존 MathSelector 유지
   - 선택 텍스트 -> `setLatex`

## 6.2 편집 경로
1. 인라인: 클릭/버블 메뉴에서 "Edit math"
2. 블록: 블록 선택 시 "Edit equation"
3. 1단계는 prompt 기반, 2단계에서 dialog/textarea로 교체

## 6.3 키보드 동작
1. `Enter` on selected `mathBlock`:
   - 다음 줄 paragraph 생성 후 커서 이동
2. `Backspace` on empty `mathBlock`:
   - 블록 삭제 후 이전/새 paragraph로 커서 이동
3. `Mod-Enter` in equation editor:
   - 저장 + 닫기

## 6.4 드래그/복사
1. `mathBlock`은 atom block으로 통째 이동
2. 인라인 `math`는 텍스트 일부로 함께 복제
3. drop 후 문서 구조가 깨지지 않도록 selection normalize

---

## 7. 파일 단위 변경 계획

### 7.1 `packages/headless`
1. `src/extensions/mathematics.ts`
   - 인라인 수식 markdown storage 확장
2. `src/extensions/math-block.ts` (신규 권장)
   - 블록 노드 + nodeview + commands
3. `src/extensions/index.ts`
   - `MathBlock` export 및 기본 extension 집합 등록
4. 필요 시 `src/extensions/math-markdown.ts` (신규)
   - parse/serialize 보조 유틸 분리

### 7.2 `apps/web`
1. `components/tailwind/extensions.ts`
   - `MathBlock` 등록
   - markdown profile 옵션 연결 (`strict-commonmark` 기본)
2. `components/tailwind/slash-command.tsx`
   - Equation Block 항목 추가
3. `components/tailwind/selectors/math-selector.tsx`
   - 인라인 편집 강화 + (옵션) 블록 변환 액션
4. `styles/prosemirror.css`
   - math inline/block 스타일, 에러 상태 스타일
5. `lib/content.ts`
   - 샘플 문서에 인라인/블록 수식 예시 추가

---

## 8. 옵션/설정 인터페이스

### 8.1 제안 설정
1. `mathMarkdown.profile: "strict-commonmark" | "math-extension"`
2. `mathMarkdown.parseDollarSyntax: boolean` (default `false`)
3. `mathMarkdown.strictInlineFallback: "html-span" | "verbatim-latex"`

### 8.2 기본값
1. profile: `strict-commonmark`
2. parseDollarSyntax: `false`
3. strictInlineFallback: `html-span`

---

## 9. 테스트 계획

## 9.1 단위 테스트
1. 인라인 수식 serialize/parse (strict + extension)
2. 블록 수식 serialize/parse (strict + extension)
3. `$` 파서 오탐 방지(`$12`, `\$x`, code span)
4. KaTeX 에러 fallback 렌더 검증

## 9.2 통합 테스트 (에디터 동작)
1. slash로 블록 삽입
2. 인라인 생성/해제
3. 블록 편집/삭제/Enter/Backspace
4. drag/drop 이후 문서 무결성

## 9.3 round-trip 회귀 테스트
1. `doc -> markdown(strict) -> doc` 동등성
2. `doc -> markdown(extension) -> doc` 동등성
3. 혼합 문서(헤딩/리스트/테이블/definition list/이미지) 회귀

## 9.4 수동 QA 시나리오
1. 모바일 viewport selection/toolbar 동작
2. 복사 후 외부 Markdown 편집기 왕복
3. sanitize 환경에서 inline fallback 확인

---

## 10. 단계별 구현 로드맵

### Phase 1 (MVP, 1-2일)
1. `mathBlock` 노드 + 기본 nodeview + slash 삽입
2. strict-commonmark export: block은 ` ```math `
3. import: ` ```math ` -> `mathBlock`
4. 인라인은 기존 유지

### Phase 2 (2-3일)
1. 인라인 strict export/import (`<span data-math-inline>`)
2. 블록/인라인 편집 UX 개선
3. 키보드 경계 동작 정교화

### Phase 3 (2-3일)
1. optional math-extension parse/export (`$`, `$$`)
2. dollar 파싱 안전 규칙
3. fallback 옵션/설정 UI 노출

### Phase 4 (1-2일)
1. 회귀 테스트 보강
2. 문서화(사용자 가이드 + 개발자 가이드)
3. 릴리즈 체크리스트/릴리즈

---

## 11. 리스크와 대응

1. Risk: `$` 문법 오탐으로 일반 텍스트 깨짐  
   Mitigation: 기본 비활성 + 명시적 opt-in + 보수적 파서

2. Risk: sanitize 환경에서 inline HTML 유실  
   Mitigation: fallback 옵션 제공 + import 시 비파괴 처리

3. Risk: parser 조합 충돌(기존 markdown-it/tiptap-markdown)  
   Mitigation: math 파서 유닛 테스트 + 기존 block 우선 파싱 순서 고정

4. Risk: drag/drop selection edge case  
   Mitigation: atom block + selection normalize + e2e 재현 케이스 추가

---

## 12. Definition of Done

1. 인라인/블록 수식 모두 생성/편집/삭제 가능
2. 기본 export가 Strict CommonMark profile로 동작
3. Optional math-extension 모드에서 `$...$`, `$$...$$` 왕복 동작
4. 기존 문서/기존 inline math 회귀 없음
5. 테스트(단위/통합/round-trip) 통과

---

## 13. 구현 체크리스트

1. `mathBlock` extension 추가
2. extension index 및 web 등록
3. slash command에 Equation Block 추가
4. strict serializer/parser 연결
5. inline strict serializer/parser 연결
6. optional dollar parser/serializer 추가
7. keyboard + drag/drop QA 보정
8. 테스트 추가 및 문서화
