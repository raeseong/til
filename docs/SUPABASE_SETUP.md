# Supabase 연동 설정 가이드

TIL API가 Supabase PostgreSQL을 사용하도록 설정하는 방법입니다.

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 비밀번호, 리전 입력 후 생성
4. 프로젝트가 준비될 때까지 대기 (1~2분)

## 2. credentials 확인

1. Supabase 대시보드 좌측 **Project Settings** (톱니바퀴) 클릭
2. **API** 메뉴 선택
3. 다음 값 복사:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Key** (anon key 아님) → `SUPABASE_SERVICE_ROLE_KEY`

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

## 4. RLS (Row Level Security) 설정

서버에서 Service Role Key를 사용하므로 RLS를 bypass합니다. 그래도 명시적으로 정책을 설정하려면:

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Service Role Key는 RLS를 우회하므로, 어드민 API 전용으로 사용 시 추가 정책 불필요
-- 클라이언트 직접 접근을 막으려면 아래 정책 추가:
-- CREATE POLICY "Service role only" ON posts FOR ALL USING (false);
```

> **참고**: `SUPABASE_SERVICE_ROLE_KEY`를 사용하면 RLS가 적용되지 않습니다. API 서버 전용이므로 문제없습니다.

## 5. 환경 변수 설정

`apps/api/.env` 파일 생성:

```env
PORT=3001
ADMIN_PASSWORD=admin123
JWT_SECRET=til-secret-key-change-in-production

SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 6. 실행

```bash
pnpm install
pnpm dev:api
```

## 구조 요약

| 이전 (파일) | 이후 (Supabase) |
|-------------|-----------------|
| StorageService | SupabaseService + PostsRepository |
| `data/posts.json` | PostgreSQL `posts` 테이블 |
| 동기 I/O | 비동기 (async/await) |

## 주의사항

- **Service Role Key**는 절대 클라이언트에 노출하지 마세요. 서버 전용입니다.
- Supabase 무료 플랜: 500MB DB, 2개 프로젝트
- `deleted_at`이 null이 아닌 행은 soft delete된 것으로 간주되어 조회에서 제외됩니다.
