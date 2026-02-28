# Polaris Novel Research

작성일: 2026-03-01 (KST)  
분석 기준: `/Users/cnt-22-70004/Documents/Polaris Novel` 워크스페이스의 현재 코드

## 1. 조사 범위

이 문서는 아래를 기준으로 작성했다.

- 실제 소스 코드: `apps/web/**`, `packages/headless/src/**`
- 빌드/배포/툴링 설정: `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `apps/web/vercel.json`, `*.tsconfig*`, `biome`, `husky`, `changeset`
- 동작 검증:
  - `pnpm --filter novel build` 통과
  - `pnpm --filter novel-next-app typecheck` 통과
  - `pnpm --filter novel-next-app build` 통과

제외:

- `node_modules`, `.next`, `.turbo` 등 생성 산출물/캐시
- 비밀정보가 포함될 수 있는 `.env.local` 내용

---

## 2. 전체 구조 (Monorepo)

```text
.
├─ apps/
│  └─ web/                 # Next.js 앱 (실행 대상)
├─ packages/
│  ├─ headless/            # "novel" 패키지 (에디터 코어/확장)
│  └─ tsconfig/            # 공유 tsconfig presets
├─ package.json            # turbo + changesets + lint/format orchestration
├─ turbo.json              # task graph
└─ pnpm-workspace.yaml
```

핵심 포인트:

- `apps/web`가 실제 사용자 앱 UI다.
- `packages/headless`는 `name: "novel"` 패키지로, `apps/web`에서 `workspace:*`로 참조한다.
- 즉, 에디터 엔진/컴포넌트는 headless 패키지, 제품 UI는 web 앱 계층으로 분리되어 있다.

---

## 3. 런타임 진입점과 렌더링 흐름

### 3.1 App Router 진입

- `apps/web/app/page.tsx`
  - URL 쿼리 `?doc=...`를 읽어 `docId`를 결정
  - 미지정 시 `"local-default"`
  - `<TailwindAdvancedEditor docId={normalizedDocId} />` 렌더

### 3.2 Layout/Provider

- `apps/web/app/layout.tsx`
  - global css + prosemirror css + KaTeX css 로딩
  - `suppressHydrationWarning` 설정
- `apps/web/app/providers.tsx`
  - `next-themes` ThemeProvider
  - `sonner` Toaster
  - `@vercel/analytics`
  - `AppContext`에 `font` 상태를 두지만, 현재 폰트 선택 UI는 비활성(주석) 상태

### 3.3 실제 에디터 렌더

- `apps/web/components/tailwind/advanced-editor.tsx`
  - `EditorRoot` + `EditorContent` (from `novel`)
  - `createExtensions(...)` + `slashCommand` 등록
  - 상단 status badge:
    - Sync: `Connecting... / Synced / Disconnected`
    - Save: `Unsaved / Saved`
    - Word count
  - 우측 상단 삼선 메뉴(`Menu`)에서 Import/Export/Theme 처리

---

## 4. 에디터 내부 데이터 모델

### 4.1 Canonical 문서 구조

문서 원본 모델은 TipTap/ProseMirror JSON (`editor.getJSON()`)이다.

- root: `{ type: "doc", content: [...] }`
- 노드/마크는 확장(extension) 조합으로 결정

`apps/web/lib/content.ts`의 `defaultEditorContent`가 기본 seed 데이터이며, 아래 커스텀 노드도 포함한다.

- `twitter`
- `math`
- `image`(width/height attrs 확장)
- `taskList/taskItem`
- `definitionList/definitionTerm/definitionDescription`

### 4.2 로컬 저장 키

`advanced-editor.tsx`의 디바운스 업데이트(500ms)에서 아래를 `localStorage`에 저장한다.

- `html-content`: syntax highlight 적용된 HTML
- `novel-content`: ProseMirror JSON 문자열
- `markdown`: markdown serializer 결과

추가 저장:

- 협업 스냅샷: `novel-collab:snapshot:<docId>` (Yjs state update base64)
- 협업 사용자(sessionStorage): `novel-collab:user`
- 폰트 설정(localStorage): `novel__font` (현재 실사용 거의 없음)

---

## 5. 협업(CRDT) 구조: 서버 없는 로컬 동기화

핵심 파일: `apps/web/lib/collab/local-provider.ts`

- 기반:
  - `Y.Doc`
  - `BroadcastChannel("novel-collab:<docId>")`
  - `Awareness` (cursor presence)
- 통신 프로토콜:
  - `sync-request`
  - `sync-response`
  - `doc-update`
  - `awareness-update`

특징:

- 같은 브라우저 프로필/동일 오리진 탭 간 실시간 동기화
- 서버, DB, 소켓 없이 동작
- snapshot 복원 지원 (`restoreDocSnapshot`)
- snapshot 저장 디바운스 500ms
- sync fallback 350ms 후 강제 synced 처리

부트스트랩 조건(`advanced-editor.tsx`):

초기 기본문서(`defaultEditorContent`) 삽입은 아래 조건을 모두 만족할 때만 수행한다.

1. snapshot 복원 안 됨
2. remote update 없음
3. 피어 없음
4. editor가 비어 있음

즉, 협업/복원 데이터가 있으면 default content로 덮어쓰지 않게 설계됨.

---

## 6. 확장(Extension) 시스템 상세

핵심 파일: `apps/web/components/tailwind/extensions.ts`

기본 구조:

1. `StarterKit` 기반 기본 블록/마크
2. Novel headless 확장들 추가
3. markdown 확장 연결 (`tiptap-markdown`)
4. 협업 모드일 때만 `Collaboration`, `CollaborationCursor` 추가

주요 커스텀/확장 구성:

- 텍스트/서식: underline, highlight, color, textStyle
- 블록: heading, list, task list, blockquote, code block
- 미디어: image(+upload plugin), youtube, twitter
- 수식: `math` (KaTeX 렌더 node view)
- 정의목록:
  - `definitionList`, `definitionTerm`, `definitionDescription`
  - markdown serialize/parse 커스텀 로직 포함
  - drag guard plugin으로 그룹 단위 이동 보정
- 편집 UX:
  - placeholder
  - global drag handle
  - custom keymap (`Mod-a` 동작 보정)
  - character count

중요: 협업 모드에서는 `StarterKit.history`가 비활성화된다.

### 6.1 실제 등록 확장 순서 (`createExtensions`)

아래 순서대로 등록된다.

1. `StarterKit` (collab일 때 history off)
2. `Placeholder`
3. `TiptapLink`
4. `TiptapImage`(+UploadImagesPlugin)
5. `UpdatedImage`
6. `TaskList`
7. `TaskItem`
8. `DefinitionList`
9. `DefinitionTerm`
10. `DefinitionDescription`
11. `HorizontalRule`
12. `AIHighlight`
13. `CodeBlockLowlight`
14. `Youtube`
15. `Twitter`
16. `Mathematics`
17. `CharacterCount`
18. `TiptapUnderline`
19. `Markdown`
20. `Highlight`
21. `TextStyle`
22. `Color`
23. `CustomKeymap`
24. `GlobalDragHandle`
25. `DefinitionListDragGuard`
26. (collab 모드 추가) `Collaboration`
27. (collab 모드 추가) `CollaborationCursor`

---

## 7. headless 패키지(`packages/headless`) 동작

### 7.1 컴포넌트 레이어

- `EditorRoot`:
  - Jotai store provider
  - tunnel-rat context로 slash command portal 연결
- `EditorContent`:
  - 내부적으로 TipTap `EditorProvider`를 감싼 wrapper
- `EditorBubble`, `EditorBubbleItem`:
  - bubble menu 노출 조건/선택 핸들링
- `EditorCommand*`:
  - slash command UI cmdk + atom(query/range) + keyboard bridge

### 7.2 slash command extension

`extensions/slash-command.tsx`:

- trigger 문자: `/`
- Suggestion plugin 기반
- ReactRenderer + tippy popup로 메뉴 렌더
- codeBlock 안에서는 slash command popup 비활성

### 7.3 이미지 업로드 plugin

`plugins/upload-images.tsx`:

- 업로드 중 placeholder decoration 노출
- 업로드 성공 시 placeholder 위치에 image node 치환
- 업로드 실패 시 placeholder 정리
- Blob token 없을 때 local data URL fallback 동작을 app 계층에서 활용

---

## 8. UI 동작 상세

### 8.1 상단 우측 삼선 메뉴 (`ui/menu.tsx`)

현재 메뉴 기능:

- `MD 가져오기`
- `MD 내보내기`
- `JSON 내보내기`
- Appearance (System/Light/Dark)

### MD 가져오기

- 파일 선택 (`.md/.markdown/.txt`)
- `editor.commands.setContent(markdown, true)` 호출
- 기존 문서를 교체(confirm 포함)

### MD 내보내기

- `editor.storage.markdown.getMarkdown()` 결과를 파일 다운로드

### JSON 내보내기

- `editor.getJSON()`을 pretty JSON으로 다운로드

### 8.2 Slash command (`slash-command.tsx`)

항목:

- 텍스트/헤딩/리스트/할일/인용/코드
- Definition list
- 이미지 업로드
- Youtube embed
- Twitter embed
- Feedback 링크 이동

### 8.3 Bubble menu

- `GenerativeMenuSwitch`:
  - 일반 편집 버튼과 AI 패널 전환
- 편집 버튼:
  - 노드 타입 selector
  - 링크
  - 수식 삽입/해제
  - 볼드/이탤릭/밑줄/취소선/인라인코드
  - 텍스트 색/하이라이트

---

## 9. Markdown 호환성 분석

결론: **기본적인 MD 호환은 가능**하며, 커스텀 노드도 일부 대응했다. 다만 100% 손실 없는 round-trip은 보장되지 않는다.

### 9.1 왜 가능한가

- `tiptap-markdown` serializer/parser를 사용
- definition list는 별도 serialize/parse 커스텀 구현(`packages/headless/src/extensions/definition-list.ts`)

### 9.2 손실 가능 구간

아래는 마크다운 표준으로 완전 표현이 어려워 HTML 또는 축약 표현으로 변환될 수 있다.

- Twitter embed
- Youtube embed
- 일부 이미지 attrs(width/height)
- 복잡한 custom node/mark 조합

### 9.3 앱 구성상의 설정 차이

- headless 기본 export의 `MarkdownExtension`은 `html: false`
- web 앱의 실제 extension 설정은 `Markdown.configure({ html: true, ... })`

즉, 이 앱에서는 비표준 표현을 HTML로 보존하려는 방향이다.

---

## 10. API 및 서버 의존성

### 10.1 `/api/upload` (Edge)

- `BLOB_READ_WRITE_TOKEN` 있으면 Vercel Blob에 업로드
- 없으면 401 반환
- 프론트 업로더는 401이면 로컬 data URL fallback

### 10.2 `/api/generate` (Edge)

- 현재 501 고정 응답
- UI에는 AI 패널이 남아 있으나, 실제 생성은 비활성 상태

---

## 11. 레이아웃/스타일 특성

- 본문 폭:
  - wrapper가 `max-w-screen-lg`
  - 에디터도 `max-w-screen-lg`
  - 즉 “완전 유동 폭”이 아니라 상한이 있는 중앙 컬럼
- ProseMirror 스타일:
  - placeholder, task checkbox 커스텀
  - drag handle
  - youtube iframe
  - collaboration cursor caret/label
- 테마:
  - CSS 변수(light/dark) + `next-themes`

---

## 12. 빌드/배포 파이프라인

### 12.1 Task graph

- root: turbo orchestrator
- `build`는 `typecheck`와 상위 패키지 build 의존
- `typecheck`는 상위 topo/build 의존

### 12.2 Vercel

- `apps/web/vercel.json`
  - framework: nextjs
  - install: `pnpm install --frozen-lockfile`
  - build: `pnpm --filter novel-next-app build`
- 로컬 `.vercel/project.json`에 프로젝트 링크 정보 존재

---

## 13. 핵심 리스크/정리 포인트

아래는 코드 기준으로 보이는 “정리 우선순위 후보”다.

1. 브랜딩/메타데이터 잔존
- `layout.tsx` title/description/metadataBase가 아직 Novel 기준
- `next.config.js` redirect도 upstream 링크 다수 포함

2. AI UI/백엔드 불일치
- AI 버튼/패널은 보이지만 `/api/generate`는 501
- 사용자는 기능 고장으로 인식할 수 있음

3. 폰트 설정 경로 미완성
- AppContext에 `font` 저장은 있으나 실제 적용 루트 연결이 약함
- `styles/fonts.ts` mapper가 현재 렌더 경로에서 거의 사용되지 않음

4. `.env.example`와 실제 사용 괴리
- `OPENAI_API_KEY`, `KV_*`가 예시엔 있으나 현재 코드 사용은 사실상 없음

5. 번들 크기
- `/` route가 약 920kB (First Load JS ~1.03MB)
- 에디터 특성상 무거운 편이지만 성능 개선 여지 큼

6. 구현 디테일 개선 후보
- `link-selector.tsx`의 input focus effect가 dependency 없이 매 렌더 실행
- `upload-images.tsx`의 drop pos 계산 주석과 실제 식이 불일치 여지

---

## 14. 커스터마이징 진입점 추천

요구사항 확장 시 가장 먼저 보는 파일:

1. 에디터 전체 조립: `apps/web/components/tailwind/advanced-editor.tsx`
2. 스키마/기능 확장: `apps/web/components/tailwind/extensions.ts`
3. slash 항목: `apps/web/components/tailwind/slash-command.tsx`
4. import/export 정책: `apps/web/components/tailwind/ui/menu.tsx`
5. 협업 정책(local-only): `apps/web/lib/collab/local-provider.ts`
6. headless 확장 제작: `packages/headless/src/extensions/*`

---

## 15. 현재 상태 요약

- 이 프로젝트는 **서버 없는 로컬 협업형 TipTap 편집기**로 동작한다.
- 데이터 canonical form은 **ProseMirror JSON**이고, MD/HTML은 파생 결과다.
- MD import/export는 이미 UI에 연결되어 있으며, 커스텀 노드까지 일정 수준 호환한다.
- 배포는 Vercel 중심으로 준비되어 있고, 현재 빌드/타입체크는 통과 상태다.
- 제품화 단계에서는 브랜딩 정리, AI 경로 정책 통일, 성능 최적화가 다음 우선순위다.

---

## 16. 파일별 역할 인덱스

### 16.1 `apps/web` 핵심 파일

| 파일 | 역할 |
| --- | --- |
| `apps/web/app/page.tsx` | `docId` 라우팅 및 에디터 페이지 진입점 |
| `apps/web/components/tailwind/advanced-editor.tsx` | 에디터 조립, collab 연결, 저장 상태/메뉴/버블 메뉴 |
| `apps/web/components/tailwind/extensions.ts` | 실제 스키마/노드/마크/플러그인 구성 |
| `apps/web/components/tailwind/slash-command.tsx` | slash 항목 정의 |
| `apps/web/components/tailwind/ui/menu.tsx` | MD import, MD export, JSON export, theme 변경 |
| `apps/web/components/tailwind/image-upload.ts` | 업로드 요청 + 토스트 + fallback |
| `apps/web/lib/collab/local-provider.ts` | 로컬 BroadcastChannel CRDT provider |
| `apps/web/lib/collab/persistence.ts` | Yjs snapshot base64 저장/복원 |
| `apps/web/lib/collab/user.ts` | 세션 사용자명/색상 생성 |
| `apps/web/lib/content.ts` | 기본 seed 문서 JSON |
| `apps/web/app/api/upload/route.ts` | Vercel Blob 업로드 API |
| `apps/web/app/api/generate/route.ts` | AI API 비활성 501 endpoint |
| `apps/web/next.config.js` | 리다이렉트/브라우저 소스맵 설정 |
| `apps/web/vercel.json` | Vercel install/build/rewrite 정책 |
| `apps/web/styles/prosemirror.css` | 에디터 본문/drag/task/youtube/collab cursor 스타일 |

### 16.2 `packages/headless/src` 핵심 파일

| 파일 | 역할 |
| --- | --- |
| `packages/headless/src/index.ts` | public API export 집약점 |
| `.../components/editor.tsx` | `EditorRoot`, `EditorContent` wrapper |
| `.../components/editor-command.tsx` | slash command portal/atom/keyboard relay |
| `.../components/editor-bubble.tsx` | bubble show 조건 + tippy 제어 |
| `.../extensions/slash-command.tsx` | slash trigger extension |
| `.../extensions/definition-list.ts` | definition list 스키마 + markdown parse/serialize |
| `.../extensions/definition-list-drag-guard.ts` | definition list drag 안정화 |
| `.../extensions/mathematics.ts` | math inline node + KaTeX rendering |
| `.../extensions/twitter.tsx` | tweet node + paste rule + node view |
| `.../extensions/updated-image.ts` | image width/height attrs 확장 |
| `.../plugins/upload-images.tsx` | placeholder 기반 이미지 업로드 plugin |
| `.../utils/index.ts` | URL 유틸, markdown text 추출 유틸 |

---

## 17. 실제 이벤트 플로우 (요약 시퀀스)

### 17.1 문서 편집 저장 플로우

1. 사용자가 본문 변경
2. `onUpdate` 호출 (`advanced-editor.tsx`)
3. `saveStatus = "Unsaved"`
4. 500ms 디바운스 후:
   - `html-content` 갱신
   - `novel-content` 갱신
   - `markdown` 갱신
5. `saveStatus = "Saved"`

### 17.2 MD 내보내기 플로우

1. 메뉴 `MD 내보내기` 클릭
2. `editor.storage.markdown.getMarkdown()` 호출
3. Blob 생성 후 `a.download`로 파일 다운로드

### 17.3 이미지 업로드 플로우

1. paste/drop/slash-image로 파일 획득
2. `validateFn`으로 이미지 타입/용량 확인
3. placeholder decoration 삽입
4. `/api/upload` 요청
5. 성공:
   - URL 반환 시 URL 이미지 삽입
   - token 미설정(401) fallback이면 data URL 이미지 삽입
6. 실패:
   - placeholder 제거

### 17.4 로컬 협업 동기화 플로우

1. 탭 A/B가 같은 `docId`로 열림
2. 각 탭 provider가 `sync-request` 전송
3. 상대가 `sync-response`로 diff update 전달
4. 문서 변경 시 `doc-update` 브로드캐스트
5. 커서/사용자 상태는 `awareness-update`로 동기화
