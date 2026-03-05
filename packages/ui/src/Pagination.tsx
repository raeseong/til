import type { ReactNode } from 'react';
import React from 'react';

const linkStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '0.9rem',
};

const disabledStyle: React.CSSProperties = {
  ...linkStyle,
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};

const activeStyle: React.CSSProperties = {
  minWidth: '2.25rem',
  textAlign: 'center',
  background: 'var(--color-surface)',
  fontWeight: 600,
};

export type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPage: number;
  /** 라우터 중립: (url, children, style) => Link 노드. 미제공 시 <a href> 사용 */
  renderLink?: (url: string, children: ReactNode, style?: React.CSSProperties) => ReactNode;
};

export function pageUrl(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({ basePath, currentPage, totalPage, renderLink }: PaginationProps) {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPage));
  const total = Math.max(1, totalPage);
  const link = (url: string, children: ReactNode, style?: React.CSSProperties) =>
    renderLink ? renderLink(url, children, style) : <a href={url} style={style}>{children}</a>;

  return (
    <nav
      aria-label="페이지네이션"
      style={{
        marginTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      {safePage > 1 ? (
        link(pageUrl(basePath, safePage - 1), '이전', linkStyle)
      ) : (
        <span style={disabledStyle}>이전</span>
      )}

      <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {Array.from({ length: total }, (_, i) => i + 1).map((p) =>
          p === safePage ? (
            <span key={p} style={{ ...linkStyle, ...activeStyle }}>
              {p}
            </span>
          ) : (
            <React.Fragment key={p}>
              {link(pageUrl(basePath, p), p, { ...linkStyle, minWidth: '2.25rem', textAlign: 'center', display: 'block' })}
            </React.Fragment>
          )
        )}
      </span>

      {safePage < total ? (
        link(pageUrl(basePath, safePage + 1), '다음', linkStyle)
      ) : (
        <span style={disabledStyle}>다음</span>
      )}
    </nav>
  );
}
