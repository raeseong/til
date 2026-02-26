# Supabase + Prisma 연동 설정 가이드

TIL API는 **Supabase를 PostgreSQL 호스팅**으로만 사용하고, 앱 코드에서는 **Prisma ORM**으로 DB에 접근합니다.

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 비밀번호, 리전 입력 후 생성
4. 프로젝트가 준비될 때까지 대기 (1~2분)

## 2. DATABASE_URL 확인

1. Supabase 대시보드 좌측 **Project Settings** (톱니바퀴) 클릭
2. **Database** 메뉴 선택
3. **Connection string** 섹션에서 **URI** 탭 선택
4. **Session mode** 또는 **Transaction mode** 풀러 URL 복사 (포트 6543 권장)
5. 비밀번호 부분 `[YOUR-PASSWORD]`를 실제 DB 비밀번호로 치환

예시:

```
postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

이 값을 `DATABASE_URL` 환경 변수로 사용합니다. (REST API URL이나 Service Role Key는 사용하지 않습니다.)

## 3. posts 테이블 생성

Supabase 대시보드 좌측 **SQL Editor**에서 아래 SQL 실행:

```sql
-- posts 테이블 생성 (BaseEntity + Post 필드)
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- slug에 유니크 인덱스 (이미 UNIQUE 제약으로 생성됨)
CREATE INDEX idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published ON posts(published) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published_updated_at ON posts(published, updated_at DESC) WHERE deleted_at IS NULL;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

> Supabase(PostgreSQL 15)에서는 `EXECUTE FUNCTION`을 사용합니다. 일부 구버전은 `EXECUTE PROCEDURE`로 변경하세요.

**스키마와 DB를 맞추려면** Prisma Migrate를 사용합니다.  
- **테이블이 아직 없을 때**: `apps/backend`에서 `pnpm exec prisma migrate deploy` 한 번 실행하면 `prisma/migrations/`에 있는 마이그레이션이 순서대로 적용됩니다.  
- **이미 Supabase에 테이블을 만들었을 때**: [Prisma ↔ DB 워크플로](prisma-db-workflow.md)의 “3.1 지금 프로젝트에 Migrate 도입하려면”에서 baseline 후 `migrate deploy` 절차를 참고하세요.  
- 인덱스만 수동으로 넣고 싶을 때만 `apps/backend/prisma/scripts/add-post-indexes.sql`를 SQL Editor에서 실행하면 됩니다.

## 4. RLS (Row Level Security) 설정

앱이 **Direct connection (Prisma)** 으로 접속하므로, 풀러 연결 시에도 DB 사용자 권한으로 동작합니다. RLS를 켜두려면:

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 필요한 경우 정책 추가 (예: 서버용 사용자만 접근)
-- CREATE POLICY "Allow service" ON posts FOR ALL USING (true);
```

서버만 붙는 구조라면 RLS 없이 사용해도 됩니다.

## 5. 환경 변수 설정

`apps/backend/.env` 파일 생성:

```env
PORT=3001
ADMIN_PASSWORD=admin123
JWT_SECRET=til-secret-key-change-in-production

DATABASE_URL=postgresql://postgres.[ref]:[비밀번호]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## 6. Prisma 클라이언트 생성 및 실행

```bash
pnpm install
cd apps/backend && pnpm exec prisma generate
pnpm dev:backend
```

스키마 변경 시:

```bash
cd apps/backend && pnpm exec prisma generate
```

**테이블/스키마를 누가 기준으로 관리할지**, **Prod 반영 절차**는 [Prisma ↔ DB 워크플로](prisma-db-workflow.md)를 참고하세요.

## 대시보드에서 테이블·인덱스 확인하기

마이그레이션 적용 여부나 인덱스가 실제로 추가되었는지는 Supabase 대시보드에서 다음처럼 확인할 수 있습니다.

### 1) Table Editor로 보기

- 좌측 **Table Editor** 클릭 → **posts** 테이블 선택  
- 컬럼 목록과 데이터를 확인할 수 있습니다. (인덱스는 여기서는 보이지 않습니다.)

### 2) SQL Editor로 인덱스·마이그레이션 확인

좌측 **SQL Editor**에서 아래 쿼리를 실행하면 `posts` 테이블에 걸린 **인덱스 목록**을 볼 수 있습니다.

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'posts'
ORDER BY indexname;
```

예상되는 인덱스 예시:

- `posts_pkey` — 기본키
- `posts_slug_key` — slug 유니크 (Prisma init 마이그레이션)
- `posts_published_idx`, `posts_published_updated_at_idx` — Prisma 스키마 인덱스
- **Partial index** (마이그레이션 또는 수동 SQL로 추가한 경우):  
  `idx_posts_slug`, `idx_posts_published`, `idx_posts_published_updated_at`  
  (`WHERE deleted_at IS NULL` 이 포함된 인덱스)

Prisma가 적용한 **마이그레이션 이력**은 다음으로 확인할 수 있습니다.

```sql
SELECT * FROM _prisma_migrations ORDER BY finished_at;
```

(마이그레이션을 한 번이라도 적용했다면 `_prisma_migrations` 테이블이 존재합니다.)

### 3) 정리

- **테이블/컬럼**: Table Editor 또는 `\d posts` (psql)
- **인덱스**: 위 `pg_indexes` 쿼리
- **마이그레이션 적용 이력**: `_prisma_migrations` 조회

---

## 구조 요약

| 구분 | 설명 |
|------|------|
| DB 호스팅 | Supabase PostgreSQL (Connection string만 사용) |
| 앱 코드 | Prisma ORM (`apps/backend/prisma/schema/` 멀티파일, `PrismaService`) |
| Repository | `PostsRepository`가 Prisma로 CRUD, soft delete는 `deleted_at` |

## 주의사항

- **DATABASE_URL**에 비밀번호가 포함되므로 절대 클라이언트/공개 저장소에 노출하지 마세요.
- Supabase 무료 플랜: 500MB DB, 2개 프로젝트
- `deleted_at`이 null이 아닌 행은 soft delete된 것으로 간주되어 조회에서 제외됩니다.
