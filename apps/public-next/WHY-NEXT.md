# Public 앱을 Next.js로 옮긴 이유와 이점

이 문서는 **왜 Vite SPA 대신 Next를 쓰는지**, 그리고 **각 구성이 어떤 이점을 주는지**를 정리한 것입니다.  
**불리해진 점·단점(트레이드오프)**은 [TRADEOFFS.md](./TRADEOFFS.md)를 참고하세요.

---

## 1. 전체적으로 Next가 유리한 이유

| 관점 | Vite SPA (기존) | Next (현재) |
|------|------------------|-------------|
| **SEO** | 첫 응답은 빈 껍데기 HTML → JS 로드 후 API 호출 → 화면 완성. 크롤러가 콘텐츠를 보려면 JS 실행 필요 | 서버에서 API 호출 후 **이미 글 목록·본문이 들어간 HTML**을 보냄. 크롤러·SNS 미리보기에 유리 |
| **첫 화면 속도** | "로딩 중..." → API 응답 후에야 본문 표시 | **첫 응답에 본문 포함** → 로딩 스피너 없이 바로 내용 표시 가능 |
| **라우팅** | React Router로 `<Route>` 수동 정의 | **파일/폴더 구조 = URL** (Convention). 새 페이지는 폴더만 추가 |
| **배포** | 정적 파일 호스팅 또는 SPA 모드 | Vercel 등에 올리면 **SSR·정적 생성·API 프록시** 등 한 번에 활용 가능 |
| **API 연동** | 브라우저에서 직접 API 서버 호출 → CORS 설정 필요 | Next 쪽에서 **rewrites** 로 `/api` → Nest 로 프록시 가능 → 브라우저는 같은 오리진처럼 사용 |

즉, **실제로 Next를 쓰면 더 유리한 부분**은 다음 세 가지입니다.

1. **공개 블로그/포트폴리오**이므로 검색·공유 시 **SEO·미리보기**가 중요함 → 서버에서 렌더링된 HTML이 유리함.
2. **첫 화면에 곧바로 글 내용이 나오는 것**이 체감 속도와 접근성에 좋음.
3. **파일 기반 라우팅 + 레이아웃**으로 구조가 단순해지고, 배포·프록시 설정이 Next 생태계와 잘 맞음.

---

## 2. 작업별 구성 이유와 이점

### 2.1 프로젝트 셋업 (next.config, rewrites)

- **구성**  
  - `next.config.mjs` 에 `rewrites`: `/api/*` → Nest API 서버로 프록시.

- **이유**  
  - 브라우저는 항상 같은 도메인(`/api`)으로 요청하게 하고, Next 서버가 그 요청을 Nest로 넘깁니다.

- **이점**  
  - CORS를 브라우저–Nest 간에 걸 필요가 없음.  
  - 배포 시 `NEXT_PUBLIC_API_URL`(또는 `API_URL`)만 바꾸면 됨.

---

### 2.2 루트 레이아웃 (`app/layout.tsx`)

- **구성**  
  - 전체 공통 UI(헤더, 푸터, 메인 영역)를 `app/layout.tsx`에 두고, `children`으로 각 페이지가 들어감.  
  - `metadata` export 로 제목·설명 등 SEO 메타 설정.

- **이유**  
  - Next App Router에서는 **레이아웃이 세그먼트 단위로 한 번만 마운트**되고, 페이지 전환 시에는 `children`만 바뀝니다.

- **이점**  
  - 헤더/푸터가 매번 다시 그려지지 않아 전환 시 부드럽고, 레이아웃 코드를 한 곳에서 관리할 수 있음.  
  - `metadata`를 사용하면 각 layout/page에서 `<head>` 를 직접 다루지 않아도 됨.

---

### 2.3 파일 기반 라우팅 (app/page.tsx, app/posts/page.tsx, app/posts/[slug]/page.tsx)

- **구성**  
  - `/` → `app/page.tsx`  
  - `/posts` → `app/posts/page.tsx`  
  - `/posts/:slug` → `app/posts/[slug]/page.tsx`  
  - `/architecture` → `app/architecture/page.tsx`

- **이유**  
  - **Convention over Configuration**: URL과 파일 경로를 일치시키면, 별도 라우터 설정 없이도 경로가 결정됨.

- **이점**  
  - 새 페이지 추가 시 **폴더/파일만 추가**하면 됨.  
  - `[slug]` 같은 동적 세그먼트도 파일 이름만으로 표현 가능.

---

### 2.4 API 클라이언트와 서버/클라이언트 구분 (`lib/api.ts`)

- **구성**  
  - `getApiBase()`:  
    - **서버**(`typeof window === 'undefined'`) → `NEXT_PUBLIC_API_URL` 또는 `API_URL` 또는 `http://localhost:3001`  
    - **클라이언트** → `'/api'` (rewrites로 Nest에 전달)  
  - `getPosts()`, `getPostBySlug(slug)` 는 이 base를 사용하는 공통 `fetchApi` 사용.

- **이유**  
  - 서버 컴포넌트에서 `fetch('/api/...')`를 하면, 그 요청은 **Next 서버 자신**에게 가므로 의미가 없음.  
  - 서버에서는 반드시 **실제 API 서버 주소(절대 URL)**로 요청해야 함.

- **이점**  
  - 같은 함수(`getPosts`, `getPostBySlug`)를 **서버 컴포넌트**와 (필요 시) **클라이언트**에서 모두 사용 가능.  
  - 환경 변수만 맞추면 로컬/스테이징/프로덕션 모두 대응.

---

### 2.5 글 목록·글 상세를 Server Component로 데이터 페칭

- **구성**  
  - `app/posts/page.tsx`, `app/posts/[slug]/page.tsx` 를 **async Server Component**로 두고, 내부에서 `getPosts()`, `getPostBySlug(slug)` 호출.  
  - 예외 시 `notFound()` 호출 → `app/not-found.tsx` 렌더.

- **이유**  
  - 이 페이지들은 **항상 최신 글 목록/본문을 보여주면 되는** 공개 페이지이므로, 서버에서 한 번만 fetch 해서 HTML에 넣어 주는 것이 목적에 맞음.

- **이점**  
  - **SEO**: 크롤러·SNS가 JS 없이도 본문이 포함된 HTML을 받음.  
  - **첫 로드**: "로딩 중..." 없이 **첫 응답에 이미 내용이 포함**되어 체감 속도가 좋음.  
  - **접근성**: JS가 꺼져 있어도 본문까지 표시 가능.

---

### 2.6 구조 페이지 (`app/architecture/page.tsx`)

- **구성**  
  - 데이터 fetch 없이 정적 JSX만 반환.

- **이유**  
  - 내용이 고정이므로 서버에서 한 번 렌더하면 됨.

- **이점**  
  - 빌드 시 **정적 HTML로 생성**(Static Generation) 가능 → 배포 후 이 경로는 CDN에서 바로 서빙되어 응답이 빠름.

---

### 2.7 404 처리 (`app/not-found.tsx`)

- **구성**  
  - `notFound()` 호출 시 Next가 `app/not-found.tsx`를 렌더하도록 함.  
  - 글 상세에서 글이 없으면 `notFound()` 호출.

- **이유**  
  - 404를 앱 전역에서 일관된 UI와 메시지로 처리하기 위함.

- **이점**  
  - 사용자에게 "목록으로 돌아가기" 등 명확한 다음 행동을 제시할 수 있음.

---

## 3. 요약

- **Next로 옮긴 이유**  
  - 공개용 블로그/포트폴리오이기 때문에 **SEO**, **첫 화면 속도**, **배포·프록시** 측면에서 Next가 더 유리함.

- **각 작업**  
  - 위 섹션처럼 **구성 이유**와 **그로 인한 이점**을 코드 주석과 이 문서에 나눠 적어 두었습니다.  
  - 실제로 "Next를 쓰면 더 나은 부분"에 초점을 맞춰 구성했고, 단순 이전이 아니라 **서버 렌더링·파일 라우팅·API 프록시**를 활용하는 형태로 맞춰 두었습니다.

- **불리해진 점**  
  - 배포 요구사항, 빌드/개발 속도, 복잡도, 환경 변수, 디버깅, 캐싱, 앱 공존 등은 [TRADEOFFS.md](./TRADEOFFS.md) 참고.
