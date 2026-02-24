import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>TIL</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Today I Learned — AI와 함께 공부한 내용을 정리하고 기록합니다.
      </p>
      <p style={{ marginBottom: '1.5rem' }}>
        React, NestJS, 디자인 시스템 등 학습한 내용을 요약·정리해 포트폴리오로 활용하고 있습니다.
      </p>
      <Link
        to="/posts"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: 'var(--color-accent)',
          color: 'white',
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        글 목록 보기
      </Link>
    </div>
  );
}
