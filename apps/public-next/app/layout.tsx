import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIL - Today I Learned',
  description: 'Today I Learned — AI와 함께 공부한 내용을 정리하고 기록합니다.',
};

/**
 * [Next 구성 이유]
 * - layout.tsx는 해당 세그먼트와 그 하위의 공통 UI를 담당합니다.
 * - 루트 layout은 전체 앱에 한 번만 마운트되므로, 헤더/푸터처럼 매 페이지 공통인 요소를 두기 좋습니다.
 *
 * [유리한 점]
 * - 페이지 전환 시 레이아웃은 다시 렌더되지 않고, children만 바뀝니다 (레이아웃은 유지).
 * - SEO용 metadata를 layout 또는 page에서 export하면 자동으로 <head>에 반영됩니다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
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
            <Link
              href="/"
              style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}
            >
              TIL
            </Link>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link href="/posts">글 목록</Link>
              <Link href="/architecture">구조</Link>
            </nav>
          </header>
          <main
            style={{
              flex: 1,
              padding: '2rem',
              maxWidth: 720,
              margin: '0 auto',
              width: '100%',
            }}
          >
            {children}
          </main>
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
      </body>
    </html>
  );
}
