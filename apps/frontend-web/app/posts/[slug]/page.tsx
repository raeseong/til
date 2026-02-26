import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostBySlug } from '@/lib/api';

type Props = { params: { slug: string } };

/**
 * [Next 구성 이유]
 * - app/posts/[slug]/page.tsx 의 [slug] 는 동적 세그먼트입니다.
 * - params.slug 로 URL 의 해당 부분을 받아, 서버에서 getPostBySlug(slug) 호출합니다.
 *
 * [유리한 점]
 * - 글 내용을 서버에서 가져와 HTML 에 넣어 보내므로, 검색엔진·공유 시 미리보기에 본문이 포함됩니다.
 * - 클라이언트에서 useEffect + useState 로 로딩하는 대신, "첫 응답에 이미 본문 포함"이라 체감 속도가 좋습니다.
 * - notFound() 로 404 페이지를 Next 가 처리하게 할 수 있습니다.
 */
export default async function PostDetailPage({ params }: Props) {
  const { slug } = params;
  let post: Awaited<ReturnType<typeof getPostBySlug>> = null;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  return (
    <article>
      <Link
        href="/posts"
        style={{
          marginBottom: '1rem',
          display: 'inline-block',
          color: 'var(--color-text-muted)',
        }}
      >
        ← 목록
      </Link>
      <h1 style={{ marginBottom: '0.5rem' }}>{post.title}</h1>
      <time style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        {new Date(post.created_at).toLocaleDateString('ko-KR')}
      </time>
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
      <div
        className="markdown-body"
        style={{
          marginTop: '2rem',
          lineHeight: 1.8,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
