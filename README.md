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

### 2. Supabase 설정

데이터베이스로 Supabase(PostgreSQL)를 사용합니다. 자세한 설정은 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)를 참고하세요.

- Supabase 프로젝트 생성 후 `posts` 테이블 생성
- `apps/backend/.env`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정

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

## 데이터 저장

Supabase PostgreSQL 사용. `posts` 테이블에 저장됩니다.

## 배포

- **Frontend Web / Frontend Admin**: Vercel (정적 빌드)
- **API**: Render 등 (환경변수로 API 주소 지정)
