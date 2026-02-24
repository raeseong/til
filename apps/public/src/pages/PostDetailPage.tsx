import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '../api/client';

interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  created_at: string;
}

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p style={{ color: '#ef4444' }}>오류: {error}</p>;
  if (!post) return <p>글을 찾을 수 없습니다. <Link to="/posts">목록으로</Link></p>;

  return (
    <article>
      <Link to="/posts" style={{ marginBottom: '1rem', display: 'inline-block', color: 'var(--color-text-muted)' }}>
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
