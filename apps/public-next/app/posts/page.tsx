import Link from 'next/link';
import { getPosts } from '@/lib/api';

/**
 * [Next 구성 이유]
 * - 이 파일은 async 로 선언된 Server Component 입니다.
 * - getPosts() 를 서버에서 호출하고, 그 결과를 바로 HTML 로 그립니다.
 *
 * [유리한 점]
 * - 브라우저는 "로딩 중..." 없이 처음부터 글 목록이 찍힌 HTML 을 받습니다 (첫 화면 빠름).
 * - 검색엔진·SNS 크롤러가 전체 목록을 수집할 수 있어 SEO 에 유리합니다.
 * - 클라이언트 JS 없이도 내용이 보이므로 접근성·저사양 환경에 좋습니다.
 */
export default async function PostsPage() {
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  let error: string | null = null;
  try {
    posts = await getPosts();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Request failed';
  }

  if (error) {
    return (
      <p style={{ color: '#ef4444' }}>
        오류: {error}
      </p>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>글 목록</h1>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>아직 작성된 글이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                padding: '1rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <Link
                href={`/posts/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem' }}>{post.title}</h2>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {post.summary}
                </p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        background: 'var(--color-surface)',
                        borderRadius: 4,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
