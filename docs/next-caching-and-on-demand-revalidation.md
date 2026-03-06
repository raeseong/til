# Next.js 캐싱 전략과 On-Demand Revalidation 구현

블로그·TIL 같은 콘텐츠 사이트에서 공개 웹은 Next.js로, 관리용 어드민은 별도 앱으로 두는 구성이 많다. 이때 **어드민에서 글을 수정하면 공개 웹에 곧바로 반영**되게 하려면, Next의 캐시를 “데이터가 바뀐 시점”에만 무효화하는 **On-Demand Revalidation**을 쓰는 방식이 적합하다. 이 글에서는 Next의 캐싱 특성, 선택한 전략, 그리고 실제 구현 내용을 정리한다.

---

## 1. Next.js에서의 캐시가 동작하는 위치

Next(App Router)에서는 **캐시가 브라우저가 아니라 Next 서버(또는 서버리스 함수가 돌아가는 런타임) 쪽**에 있다.

- 사용자가 `/posts`를 요청하면 → **Next 서버**가 해당 라우트를 렌더링한다.
- 이때 서버 컴포넌트 안에서 `fetch`로 API를 호출하면, 그 **fetch 결과**와 **렌더 결과(RSC payload)** 가 Next가 관리하는 캐시에 저장될 수 있다.
- 브라우저는 “그때 그 시점의 HTML(또는 RSC)”만 받는다. **캐시를 들고 있는 쪽은 Next 서버**이지, 탭이 아니다.

그래서 “데이터가 바뀌었다”는 **신호를 받는 쪽도 Next 서버**여야 한다. 백엔드(또는 어드민)가 **Next 서버로 HTTP 요청을 한 번 보내서** “이 경로/이 태그 캐시 무효화해”라고 알려주는 구조가 된다.

---

## 2. Next.js의 캐싱 요소 (App Router 기준)

### 2.1 Data Cache (fetch 캐시)

- 서버 컴포넌트·서버 액션 안에서 쓰는 **`fetch`** 는 Next가 확장해서, 기본적으로 **캐시**된다.
- `fetch(url, { cache: 'no-store' })` → 캐시 안 함(매 요청마다 새로 fetch).
- `fetch(url, { next: { revalidate: 60 } })` → 60초마다 재검증.
- `fetch(url, { next: { tags: ['posts'] } })` → **태그**를 붙여 두고, 나중에 `revalidateTag('posts')`로 이 태그가 붙은 fetch만 무효화할 수 있다.

우리 구현에서는 “글 목록/상세”용 fetch에 **태그 `posts`** 를 붙여 두고, on-demand revalidate 시 `revalidateTag('posts')`로 무효화한다.

### 2.2 Full Route Cache (라우트 단위 렌더 캐시)

- **어떤 경로**에 대해 “이미 렌더해 둔 결과”를 Next가 저장해 두는 캐시다.
- **`revalidatePath('/posts')`** 를 호출하면 “`/posts` 경로에 대한 캐시”를 버린다.
- 그 다음에 누군가 `/posts`를 요청하면, Next는 캐시가 없으니 **다시 렌더**하고, 그 과정에서 **다시 fetch**를 하게 된다.

즉, **경로 단위 무효화**는 “다음 요청부터는 새로 그려라”는 뜻이고, **태그 단위 무효화**는 “이 태그가 붙은 fetch 결과는 더 이상 쓰지 마라”는 뜻이다. 둘 다 써 주면, “경로 캐시 + 그 경로에서 쓰는 fetch 캐시”를 함께 갱신할 수 있다.

---

## 3. 전략 선택: 시간 기반 vs On-Demand

| 방식 | 설명 | 장단점 |
|------|------|--------|
| **시간 기반** | `next: { revalidate: 60 }` 처럼 N초마다 캐시 만료 | 구현 간단. 하지만 “방금 수정한 내용”이 최대 N초까지 안 보일 수 있고, 수정이 없어도 주기적으로 API를 다시 호출하게 됨. |
| **On-Demand** | 데이터가 바뀐 시점에만 백엔드가 Next에 “이 경로/태그 무효화해” 요청 | 수정 직후 반영 가능. 수정이 없으면 추가 API 호출 없음. 대신 “무효화 API”와 “백엔드에서 그 API 호출”을 한 번 구현해야 함. |

우리는 **어드민에서 글을 저장하는 순간에 가깝게 공개 웹에 반영**되길 원하므로 **On-Demand Revalidation**을 사용했다.

---

## 4. 전체 흐름

1. **평소**: 사용자가 `/posts` 또는 `/posts/[slug]` 요청 → Next 서버가 (캐시가 있으면) 캐시된 렌더 + fetch 결과를 반환.
2. **어드민에서 글 생성/수정/삭제** → 백엔드(Nest)가 DB 반영 후, **Next의 revalidate API**를 호출 (`POST /api/revalidate?secret=...&path=...`).
3. **Next** → `revalidatePath(path)` + `revalidateTag('posts')` 실행 → 해당 경로와 “posts” 태그가 붙은 fetch 캐시 무효화.
4. **그 다음** 누군가 해당 페이지를 요청(또는 새로고침) → Next가 다시 렌더하고, fetch도 다시 하므로 **최신 데이터**가 보인다.

브라우저는 “신호”를 받지 않는다. **Next 서버만** 신호를 받고, “다음 요청부터는 캐시를 쓰지 말고 다시 그려라” 상태로 바꾸는 것이다.

---

## 5. 구현 내용

### 5.1 공개 웹(Next): fetch에 태그 붙이기

목록/상세를 가져오는 `fetch`에 **`next: { tags: ['posts'] }`** 를 넘겨, 나중에 한 번에 무효화할 수 있게 했다. `cache: 'no-store'`를 제거해 두어서, revalidate가 호출되기 전까지는 캐시가 적용된다.

```typescript
// lib/api.ts
const nextFetchOptions = {
  next: { tags: ['posts'] as const },
} as RequestInit;

export async function getPosts(params?: { page?: number; pageSize?: number }) {
  // ...
  return fetchApi<PaginatedResponse<PostListItem>>(`/posts${query}`, nextFetchOptions);
}

export async function getPostBySlug(slug: string) {
  return fetchApi<PostDetail | null>(`/posts/${slug}`, nextFetchOptions);
}
```

서버 컴포넌트에서는 이 함수들을 그대로 호출한다. 캐시 여부는 위 옵션에만 의존한다.

```tsx
// app/posts/page.tsx (요약)
export default async function PostsPage(props: Props) {
  const res = await getPosts({ page: currentPage, pageSize: PAGE_SIZE });
  // ...
}
```

### 5.2 공개 웹(Next): Revalidate API 라우트

“비밀값 + 경로(또는 태그)”를 받아서, 검증 후 `revalidatePath` / `revalidateTag`만 호출하는 API 라우트를 둔다.

```typescript
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

function isAllowedPath(path: string): boolean {
  if (path === '/posts') return true;
  if (path.startsWith('/posts/') && path.length > 7) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Revalidate not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (path && isAllowedPath(path)) {
      revalidatePath(path);
      revalidateTag('posts');
    }
    if (tag && (tag === 'posts' || tag.startsWith('post-'))) {
      revalidateTag(tag);
    }
    if (!path && !tag) {
      return NextResponse.json({ error: 'path or tag required' }, { status: 400 });
    }
    return NextResponse.json({ revalidated: true, path: path ?? undefined, tag: tag ?? undefined });
  } catch (e) {
    console.error('[revalidate]', e);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
```

- **경로 화이트리스트**: `/posts`, `/posts/...` 만 허용해, 임의 경로 무효화는 막는다.
- **path**가 오면 해당 경로 `revalidatePath` + `revalidateTag('posts')`로 목록/상세용 fetch 캐시까지 함께 무효화한다.

### 5.3 백엔드(Nest): 글 변경 후 Revalidate API 호출

백엔드에서는 **글 생성/수정/삭제가 성공한 뒤**에만, Next 서버의 revalidate API를 호출한다. 응답을 기다리지 않고 “한 번 보내고 끝”으로 두어, 글 저장 지연이 생기지 않게 했다.

```typescript
// posts.service.ts (요약)
private notifyRevalidate(path: string): void {
  const baseUrl = this.config.get<string>('WEB_REVALIDATE_URL');
  const secret = this.config.get<string>('WEB_REVALIDATE_SECRET');
  if (!baseUrl || !secret) return;

  const url = `${baseUrl.replace(/\/$/, '')}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;
  fetch(url, { method: 'POST' }).catch((err) => {
    console.warn('[PostsService] revalidate failed', path, err?.message);
  });
}

async create(dto: CreatePostDto): Promise<Post> {
  const post = await this.repo.create({ ... });
  this.notifyRevalidate('/posts');
  return post;
}

async update(id: number, dto: UpdatePostDto): Promise<Post> {
  const updated = await this.repo.update(id, { ... });
  this.notifyRevalidate('/posts');
  this.notifyRevalidate(`/posts/${updated.slug}`);
  return updated;
}

async remove(id: number): Promise<void> {
  await this.repo.softDelete(id);
  this.notifyRevalidate('/posts');
}
```

- **생성**: 목록만 바뀌므로 `/posts`만 무효화.
- **수정**: 목록 + 해당 글 상세가 바뀌므로 `/posts`와 `/posts/{slug}` 무효화.
- **삭제**: 목록만 무효화. (삭제된 글 상세는 다음 접근 시 404 처리되면 됨.)
- `WEB_REVALIDATE_URL` / `WEB_REVALIDATE_SECRET`이 없으면 호출하지 않아, 로컬 백엔드만 돌릴 때도 동작한다.

---

## 6. 배포 시 설정

- **Next(공개 웹, 예: Vercel)**  
  - `REVALIDATE_SECRET`: 임의의 긴 시크릿 문자열 (백엔드와 동일한 값 사용).

- **백엔드(예: Render, EKS)**  
  - `WEB_REVALIDATE_URL`: 공개 웹 루트 URL (예: `https://til-public.vercel.app`).  
  - `WEB_REVALIDATE_SECRET`: Next에 설정한 `REVALIDATE_SECRET`과 **같은 값**.

이렇게 하면 백엔드만 Next 쪽 revalidate API를 호출할 수 있고, 브라우저나 다른 서비스는 시크릿을 모르므로 무효화 요청을 보낼 수 없다.

---

## 7. 정리

- Next에서는 **캐시가 서버(또는 서버리스 런타임) 쪽**에 있어서, “데이터가 바뀌었다”는 신호를 **Next 서버가 받을 수 있는 API**로 주는 방식이 필요하다.
- **Data Cache(fetch)** 는 `next: { tags: ['posts'] }`로 태그를 걸어 두고, **On-Demand** 시점에 `revalidateTag('posts')`로 무효화했다.
- **Full Route Cache**는 `revalidatePath('/posts')`, `revalidatePath('/posts/[slug]')`로 경로 단위 무효화했다.
- 백엔드에서 **글 생성/수정/삭제 직후** Next의 revalidate API를 한 번 호출하도록 해 두었고, 브라우저는 별도 신호 없이 **다음 요청(새로고침 등)** 시 갱신된 데이터를 받게 된다.

이 구성을 적용하면 어드민에서 글을 저장한 뒤, 공개 웹에서 해당 페이지를 다시 열거나 새로고침했을 때 캐시되지 않은 최신 데이터가 반영된다.
