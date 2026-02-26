import { Outlet, Link } from 'react-router-dom';
import { clearToken } from '../api/client';

export default function AdminLayout() {
  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
          TIL Admin
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/">글 목록</Link>
          <Link
            to="/posts/new"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-accent)',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            새 글
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
