const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText || 'Request failed');
  }
  return res.json();
}

export async function getPosts() {
  return fetchApi<Array<{
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    tags: string[];
    published: boolean;
    created_at: string;
    updated_at: string;
  }>>('/posts');
}

export async function getPostBySlug(slug: string) {
  return fetchApi<{
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    tags: string[];
    published: boolean;
    created_at: string;
    updated_at: string;
  } | null>(`/posts/${slug}`);
}
