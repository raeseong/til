-- Partial indexes for posts (Prisma schema cannot express WHERE clause on indexes)
-- Soft-delete 조회(deleted_at IS NULL) 시 스캔 범위 축소

CREATE INDEX IF NOT EXISTS idx_posts_slug
ON posts(slug)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_published
ON posts(published)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_published_updated_at
ON posts(published, updated_at DESC)
WHERE deleted_at IS NULL;
