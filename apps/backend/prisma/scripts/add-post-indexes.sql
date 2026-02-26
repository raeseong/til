-- =============================================================================
-- posts 테이블 인덱스 (Supabase 등 실제 DB에 적용)
-- =============================================================================
-- Prisma 스키마의 @@index는 기본 인덱스만 정의.
-- soft delete(deleted_at IS NULL) 조건이 붙은 조회가 많으므로
-- partial index로 적용하면 스캔 범위를 줄일 수 있음.
-- 실행: Supabase SQL Editor 또는 psql에서 실행.
-- Prod 적용 시: CREATE INDEX CONCURRENTLY 사용 권장 (테이블 락 최소화).
-- =============================================================================

-- slug로 조회 (published 목록·상세 조회 시 deleted_at IS NULL 조건 사용)
CREATE INDEX IF NOT EXISTS idx_posts_slug
  ON posts(slug)
  WHERE deleted_at IS NULL;

-- published 목록 필터
CREATE INDEX IF NOT EXISTS idx_posts_published
  ON posts(published)
  WHERE deleted_at IS NULL;

-- published + 최신순 정렬 (findPublished order by id desc / updated_at desc)
CREATE INDEX IF NOT EXISTS idx_posts_published_updated_at
  ON posts(published, updated_at DESC)
  WHERE deleted_at IS NULL;

-- (선택) Prod에서 락 없이 적용하려면 CONCURRENTLY 사용:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published ON posts(published) WHERE deleted_at IS NULL;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_updated_at ON posts(published, updated_at DESC) WHERE deleted_at IS NULL;
