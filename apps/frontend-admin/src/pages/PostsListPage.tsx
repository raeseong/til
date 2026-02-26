import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts, deletePost, type Post } from '../api/client';

export default function PostsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => getAllPosts().then(setPosts).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('삭제할까요?')) return;
    try {
      await deletePost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>글 목록</h1>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>
          아직 글이 없습니다. <Link to="/posts/new">새 글 작성</Link>
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{post.title}</strong>
                  {!post.published && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.4rem',
                        background: '#f59e0b',
                        color: '#000',
                        borderRadius: 4,
                      }}
                    >
                      Draft
                    </span>
                  )}
                </div>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {post.summary}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to={`/posts/${post.id}/edit`}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'var(--color-surface)',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  수정
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
