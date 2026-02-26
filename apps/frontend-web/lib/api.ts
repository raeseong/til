/**
 * [Next 구성 이유]
 * - 서버 컴포넌트에서는 fetch가 Node 환경에서 실행되므로, 상대 경로 /api 는 Next 서버 자신을 가리킵니다.
 * - 따라서 서버에서는 반드시 절대 URL(실제 API 서버)로 요청해야 합니다.
 *
 * [유리한 점]
 * - 브라우저에서는 /api 로 요청 → next.config rewrites 로 Nest 로 프록시 → CORS 불필요.
 * - 서버에서는 직접 Nest 로 요청 → 응답을 HTML 에 넣어 보내므로 SEO·첫 로드에 유리.
 */

import type { PaginatedResponse } from '@til/shared';

function getApiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
  }
  return '/api';
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || res.statusText || 'Request failed');
  }
  return res.json();
}

export type PostListItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  tags: string[];
};

export type PostDetail = PostListItem & {
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export async function getPosts(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<PostListItem>> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const query = search.toString() ? `?${search.toString()}` : '';
  return fetchApi<PaginatedResponse<PostListItem>>(`/posts${query}`);
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  return fetchApi<PostDetail | null>(`/posts/${slug}`);
}
