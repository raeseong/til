import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPostById, createPost, updatePost } from '../api/client';

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    getPostById(id!)
      .then((post) => {
        if (post) {
          setTitle(post.title);
          setSummary(post.summary);
          setContent(post.content);
          setTags(post.tags.join(', '));
          setPublished(post.published);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (isNew) {
        await createPost({ title, summary, content, tags: tagList, published });
      } else {
        await updatePost(id!, { title, summary, content, tags: tagList, published });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>{isNew ? '새 글 작성' : '글 수정'}</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>요약</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>태그 (쉼표 구분)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, NestJS, TypeScript"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>본문 (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>미리보기</label>
            <div
              style={{
                ...inputStyle,
                minHeight: 300,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
              }}
            >
              <ReactMarkdown>{content || '*미리보기*'}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <label htmlFor="published">공개 (published)</label>
        </div>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={() => navigate('/')} style={{ ...buttonStyle, background: 'var(--color-surface)' }}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'inherit',
  fontSize: '1rem',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: 'var(--color-accent)',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: '1rem',
  cursor: 'pointer',
};
