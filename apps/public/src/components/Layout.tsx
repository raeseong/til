import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
          TIL
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/posts">글 목록</Link>
          <Link to="/architecture">구조</Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: 720, margin: '0 auto', width: '100%' }}>{children}</main>
      <footer
        style={{
          padding: '1rem 2rem',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        Today I Learned · 공부한 내용을 정리하고 공유합니다
      </footer>
    </div>
  );
}
