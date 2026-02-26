import { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { login, setToken, isAuthenticated } from '../api/client';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await login(password);
      setToken(access_token);
      window.location.href = from;
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '4rem auto',
        padding: '2rem',
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>TIL Admin 로그인</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
          autoFocus
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            color: 'inherit',
            fontSize: '1rem',
            marginBottom: '1rem',
          }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
        .env의 ADMIN_PASSWORD로 비밀번호 설정 (기본: admin123)
      </p>
    </div>
  );
}
