const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('til_token');
}

export function setToken(token: string) {
  localStorage.setItem('til_token', token);
}

export function clearToken() {
  localStorage.removeItem('til_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(password: string): Promise<{ access_token: string }> {
  return fetchApi<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getAllPosts(): Promise<Post[]> {
  return fetchApi<Post[]>('/posts/admin/all');
}

export async function getPostById(id: number): Promise<Post | null> {
  return fetchApi<Post | null>(`/posts/admin/${id}`);
}

export async function createPost(dto: {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
}): Promise<Post> {
  return fetchApi<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updatePost(
  id: number,
  dto: Partial<{ title: string; summary: string; content: string; tags: string[]; published: boolean }>
): Promise<Post> {
  return fetchApi<Post>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deletePost(id: number): Promise<void> {
  return fetchApi<void>(`/posts/${id}`, { method: 'DELETE' });
}
