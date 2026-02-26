# TIL (Today I Learned)

AI와 함께 공부한 내용을 정리하고 공유하는 포트폴리오 서비스입니다.

## 구조

- **apps/frontend-web** - 공개 포트폴리오 페이지 (Next.js)
- **apps/frontend-admin** - 어드민 페이지 (React + Vite) - 글 작성/수정
- **apps/backend** - 백엔드 API (NestJS) - CRUD, JWT 인증
- **packages/shared** - 공통 타입

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 데이터베이스 설정

데이터베이스로 Supabase(PostgreSQL)를 사용하고, 앱에서는 Prisma로 접근합니다. 자세한 설정은 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)를 참고하세요.

- Supabase 프로젝트 생성 후 `posts` 테이블 생성 (또는 Prisma Migrate 사용)
- `apps/backend/.env`에 `DATABASE_URL` 설정

### 3. 개발 서버 실행

```bash
pnpm dev
```

- API: http://localhost:3001
- Frontend Web (공개): http://localhost:5173
- Frontend Admin: http://localhost:5174

기본 비밀번호: `admin123`

### 개별 실행

```bash
pnpm dev:backend       # 백엔드(API)만
pnpm dev:frontend-web  # 공개 페이지만
pnpm dev:frontend-admin # 어드민만
```

빌드는 [Turborepo](https://turbo.build/)로 실행됩니다. `pnpm build` 시 shared → 앱 순서로 빌드되고, 변경 없는 패키지는 캐시에서 재사용됩니다.

## 데이터 저장

Supabase PostgreSQL 사용. Prisma ORM으로 `posts` 테이블에 접근합니다.

## 문서

| 주제 | 설명 |
|------|------|
| [Vercel 배포 설정](docs/vercel.md) | Frontend Web/Admin 배포, Root Directory, Ignored Build Step |
| [Render 배포 설정](docs/render.md) | Backend API 배포, Build Filter, 환경 변수, GitHub 체크 표시 |
| [Supabase + Prisma 연동](docs/SUPABASE_SETUP.md) | Supabase 프로젝트, DATABASE_URL, posts 테이블, Prisma 연동 |
| [Prisma ↔ DB 워크플로](docs/prisma-db-workflow.md) | 스키마 vs DB 기준, migrate / db pull, Prod 반영 |
| [Turborepo 동작 원리](docs/turbo.md) | build/dev 순서, 캐시, 필터, 이 프로젝트 적용 기준 |
| [공유 패키지·타입 정책](docs/shared-package.md) | shared 용도, 엔티티/DTO 분리, Prisma 타입 사용 |
| [백엔드 개선·추가 기능](docs/backend-improvements.md) | 보안, 검증, Health check, Rate limit, Swagger 등 |

## 배포

- **Frontend Web / Frontend Admin**: Vercel (정적 빌드)
- **API**: Render 등 (환경변수로 API 주소 지정)
