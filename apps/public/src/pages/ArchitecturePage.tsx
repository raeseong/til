export default function ArchitecturePage() {
  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>서비스 구조</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        이 프로젝트의 아키텍처와 기술 스택을 설명합니다.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>모노레포 구성</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li><code>apps/public</code> — 공개 포트폴리오 페이지 (React + Vite)</li>
          <li><code>apps/admin</code> — 어드민 페이지 (React + Vite)</li>
          <li><code>apps/api</code> — 백엔드 API (NestJS)</li>
          <li><code>packages/shared</code> — 공통 타입·유틸</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>기술 스택</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li>프론트엔드: React, React Router, Vite</li>
          <li>백엔드: NestJS, JWT 인증, Supabase</li>
          <li>공통: TypeScript, shared 패키지로 타입 공유</li>
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>데이터 흐름</h2>
        <p>
          어드민에서 글 작성·수정 → API를 통해 Supabase에 저장 → 공개 페이지에서 조회
        </p>
      </section>
    </div>
  );
}
