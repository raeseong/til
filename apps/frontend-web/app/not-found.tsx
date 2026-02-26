import Link from 'next/link';

/**
 * notFound() 호출 시 Next 가 이 파일을 렌더합니다.
 * app/not-found.tsx 가 있으면 404 시 일관된 UI를 보여줄 수 있습니다.
 */
export default function NotFound() {
  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>글을 찾을 수 없습니다</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        요청한 경로에 해당하는 글이 없거나 삭제되었을 수 있습니다.
      </p>
      <Link href="/posts" style={{ color: 'var(--color-accent)' }}>
        목록으로 돌아가기
      </Link>
    </div>
  );
}
