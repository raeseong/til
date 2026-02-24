import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/client';

export default function PostsPage() {
  const [posts, setPosts] = useState<{ id: number; title: string; slug: string; summary: string; tags: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p style={{ color: '#ef4444' }}>오류: {error}</p>;

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
                to={`/posts/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem' }}>{post.title}</h2>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{post.summary}</p>
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
