import Link from 'next/link';
import { getPosts, type PostListItem } from '@/lib/api';
import { Pagination } from '@til/ui';

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<{ page?: string }> | { page?: string };
};

function parsePage(raw: { page?: string } | undefined): number {
  const n = parseInt(String(raw?.page), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * Server Component: getPosts()로 목록을 가져와 첫 로드부터 HTML로 렌더해 SEO·첫 화면 속도에 유리.
 */
export default async function PostsPage(props: Props) {
  const searchParams = await Promise.resolve(props.searchParams);
  const currentPage = parsePage(searchParams);

  let list: PostListItem[] = [];
  let totalPage = 1;
  let error: string | null = null;

  try {
    const res = await getPosts({ page: currentPage, pageSize: PAGE_SIZE });
    list = res.list;
    totalPage = res.pagination?.totalPage ?? 1;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Request failed';
  }

  if (error) {
    return <p style={{ color: '#ef4444' }}>오류: {error}</p>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>글 목록</h1>
      {list.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>아직 작성된 글이 없습니다.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map((post) => (
              <li
                key={post.id}
                style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}
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
          <Pagination
            basePath="/posts"
            currentPage={currentPage}
            totalPage={totalPage}
            renderLink={(url, children, style) => <Link href={url} style={style}>{children}</Link>}
          />
        </>
      )}
    </div>
  );
}
