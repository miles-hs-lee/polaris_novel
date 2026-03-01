# Polaris Novel

`polaris_novel`은 Novel 기반으로 커스터마이징한 웹 에디터입니다.

현재는 서버 기능 없이 에디터 UI 중심으로 사용하도록 구성되어 있습니다.

## 현재 포함 기능

- Notion 스타일 리치 텍스트 편집
- `docId` 기반 실시간 협업
- Liveblocks 기반 다중 기기 협업(환경 변수 설정 시)
- 로컬 CRDT 협업 fallback (`mode=local`)
- 우측 상단 메뉴(삼선)에서:
- `MD 가져오기`
- `MD 내보내기`
- `JSON 내보내기`
- 라이트/다크/시스템 테마 전환

## 빠른 시작 (로컬 실행)

요구사항:

- Node.js 20+ (권장: 22+)

실행:

```bash
cd apps/web
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

협업 테스트:

- 기본 모드(Liveblocks): `http://localhost:3000/?doc=demo`
- 로컬 모드 강제: `http://localhost:3000/?doc=demo&mode=local`
- 같은 `doc` 값이면 동일 room으로 동기화됨

## 환경 변수

기본 에디터 실행에는 필수 환경 변수가 없습니다.

선택 사항:

- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
  - 다중 기기 실시간 협업에 필요
- `BLOB_READ_WRITE_TOKEN`
  - 이미지 업로드 API(`/api/upload`)를 사용할 때 필요
- AI 생성 API(`/api/generate`)는 현재 비활성화(501 응답)

## 빌드

```bash
cd apps/web
npm run build
npm run start
```

## Vercel 배포

이 저장소는 `apps/web` 기준으로 배포합니다.

```bash
cd apps/web
npx vercel link --project polaris_novel
npx vercel deploy          # Preview
npx vercel deploy --prod   # Production
```

## 프로젝트 구조 (요약)

- `apps/web/app` - Next.js app router
- `apps/web/components/tailwind` - 에디터 UI/메뉴/툴바
- `apps/web/app/api/upload` - 이미지 업로드 API
- `apps/web/app/api/generate` - (현재 비활성화된) AI 생성 API

## 라이선스

Apache-2.0 (`LICENSE`)
