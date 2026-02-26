# Render 배포 (Backend)

이 문서는 **Blueprint를 사용하지 않고** 수동으로 만든 Web Service 기준입니다. `render.yaml`은 참고용이며, 실제 배포 설정은 **Render 대시보드**에서 합니다.

---

## Backend만 필요한 변경 시에만 배포되게 하기

모노레포에서 **frontend/docs/scripts만 수정했을 때는 backend가 배포되지 않고**, **backend·shared·루트 pnpm 파일**이 바뀔 때만 배포되려면 아래를 모두 설정해야 합니다.

### 1) 저장소 연결 및 자동 배포

1. [Render Dashboard](https://dashboard.render.com/) → 해당 **Web Service**(til-backend 등) 선택
2. **Settings** → **Build & Deploy** (또는 **Git**) 섹션
3. **Repository** / **Branch** 가 이 GitHub 저장소·브랜치(예: `main`)로 연결되어 있는지 확인
4. **Auto-Deploy** 를 **Yes** 로 두면, 푸시 시 조건에 맞을 때만 배포됩니다.

연결이 안 되어 있다면 **Connect repository** 로 저장소·브랜치를 지정합니다.

### 2) Root Directory

- **Root Directory**를 **비워 두면** 작업 디렉터리는 **저장소 루트**입니다.  
- **`apps/backend`** 로 두면 빌드/시작이 그 디렉터리 기준으로 실행됩니다.

둘 다 가능하지만, **Start Command**는 선택한 Root Directory에 맞춰야 합니다(아래 3) 참고).

### 3) Build Command / Start Command

**Root Directory를 비워 둔 경우 (저장소 루트)**

- **Build Command** (Turbo 사용 권장):
  ```bash
  pnpm install --frozen-lockfile && pnpm exec turbo run build --filter=@til/backend
  ```
  shared → backend 순서로 빌드되고, Turbo 캐시가 적용됩니다.
- **Start Command** (실행 파일이 `apps/backend/dist/main` 에 있으므로):
  ```bash
  node apps/backend/dist/main
  ```
  루트가 작업 디렉터리이므로 `node dist/main` 이 아니라 **`node apps/backend/dist/main`** 이어야 합니다.

**Root Directory를 `apps/backend`로 둔 경우**

- **Build Command** (Turbo 사용 권장):
  ```bash
  cd ../.. && corepack enable && pnpm install --frozen-lockfile && pnpm exec turbo run build --filter=@til/backend
  ```
- **Start Command**: `node dist/main`  
  (현재 디렉터리가 `apps/backend`이므로 `dist/main` = `apps/backend/dist/main`)

**기존 방식** (Turbo 없이):  
`pnpm --filter @til/shared build && pnpm --filter @til/backend build` 로도 동작하지만, Turbo를 쓰면 빌드 순서·캐시가 로컬과 동일해집니다.

### 4) Build Filter (Included Paths) — 필수

**이 경로가 변경된 푸시에서만** 자동 배포됩니다. 설정하지 않으면 **모든 푸시**에서 배포됩니다.

1. **Settings** → **Build & Deploy** 에서 **Build Filter** / **Included Paths** (또는 **Deploy** 관련 필터) 찾기
2. **+ Add Included Path** 로 아래 **5개**를 **저장소 루트 기준**으로 추가:

| Included Path | 설명 |
|----------------|------|
| `apps/backend/**` | 백엔드 앱 코드·설정 전체 |
| `packages/shared/**` | shared 패키지 (API 타입 등) |
| `package.json` | 루트 package.json (워크스페이스·스크립트) |
| `pnpm-lock.yaml` | 루트 lockfile (의존성 변경 시) |
| `pnpm-workspace.yaml` | 워크스페이스 정의 |

경로는 **루트 기준**이며, `apps/backend/package.json` 같은 하위 파일은 `apps/backend/**`에 포함됩니다.

이렇게 설정하면 **위 5개 외**(예: `apps/frontend-web`, `apps/frontend-admin`, `docs`, `scripts`)만 변경된 푸시에서는 **backend 배포가 스킵**됩니다.

### 5) 환경 변수

`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CORS_ORIGINS` 등은 **Render 대시보드 → 해당 서비스 → Environment**에서 설정합니다. 코드(`render.yaml`)에 비밀을 넣지 마세요.

---

## 배포가 안 될 때 확인할 것

### "배포 시도조차 하지 않는" 경우

**의도한 동작인지 먼저 구분합니다.**

- **Build Filter(Included Paths)가 설정되어 있고**, 최근 푸시가 `apps/backend/**`, `packages/shared/**`, 루트 `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` **어디에도 해당하지 않으면**  
  → Render가 “해당 경로 변경 없음”으로 보고 **배포를 스킵**합니다. 이때는 대시보드에 “Skipped” 또는 배포 생성이 안 보이는 식으로 동작할 수 있습니다. **Build Filter만의 영향**입니다.

- **backend나 shared를 수정해 푸시했는데도** 배포가 전혀 시도되지 않는다면, Build Filter 외에 아래를 확인하세요.
  - **Repository / Branch** 가 이 저장소·배포하려는 브랜치(예: `main`)로 연결되어 있는지
  - **Auto-Deploy** 가 **Yes** 인지
  - [GitHub → Render 앱](https://github.com/apps/render/installations/new) 에서 이 저장소에 대한 접근 권한이 있는지
  - 해당 서비스 **Dashboard** 또는 **Events** 에서 최근 푸시에 대한 “Skipped” / “Ignored” 메시지가 있는지 (Build Filter로 스킵된 경우 여기서 확인 가능)

### 그밖에

- **푸시해도 배포가 아예 안 됨**  
  - Render에 이 저장소가 연결되어 있는지  
  - Auto-Deploy가 Yes인지  
  - [GitHub → Render 앱](https://github.com/apps/render/installations/new) 에서 이 저장소 접근 권한이 있는지  

- **frontend만 수정했는데 backend까지 배포됨**  
  - **Included Paths**가 비어 있거나, 너무 넓은 경로(예: `**`)만 있으면 모든 푸시에서 배포됩니다.  
  - 위 5개만 넣었는지, **Included Paths**가 실제로 적용되어 있는지 확인하세요.

- **backend 수정했는데 배포가 안 됨**  
  - 변경한 파일이 `apps/backend/**`, `packages/shared/**`, 루트 `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` 중 하나에 해당하는지 확인  
  - 해당 서비스의 최근 배포/로그에서 “Skipped” 여부 확인

- **빌드는 되는데 서버가 안 뜸**  
  - Root Directory를 **비워 둔 경우** Start Command가 **`node apps/backend/dist/main`** 인지 확인. `node dist/main`이면 루트의 `dist`를 찾아 실패합니다.

---

## GitHub 커밋/PR에 배포 상태가 안 보일 때

**Render는 GitHub에 배포 성공/실패를 자동으로 보내지 않습니다.**  
Vercel처럼 커밋 옆에 “▲ Vercel - til-admin” 같은 체크가 Render 쪽으로는 기본 제공되지 않습니다. 그래서:

- **배포 자체는** Render 대시보드에서 정상적으로 되고 있고
- **GitHub 커밋/PR에는** Render 배포 상태가 표시되지 않는 것이 **현재 동작**입니다.

### Render GitHub Action으로 커밋 체크 표시 (권장)

이 저장소에는 **`.github/workflows/render-status.yml`** 가 포함되어 있습니다. 아래 시크릿만 설정하면 **main에 push할 때** (backend 관련 경로 변경 시) Render 배포가 끝날 때까지 기다린 뒤, GitHub 커밋에 “Render backend” 체크가 표시됩니다.

#### 1) Render API 키 발급

1. [Render Dashboard](https://dashboard.render.com/) 로그인
2. 우측 상단 **Account Settings** → **API Keys** (또는 [https://dashboard.render.com/u/settings#api-keys](https://dashboard.render.com/u/settings#api-keys))
3. **Create API Key** → 이름 입력 후 생성
4. 생성된 키를 복사 (한 번만 표시되므로 안전한 곳에 보관)

#### 2) Render 서비스 ID 확인

1. Render Dashboard에서 백엔드 **Web Service** 클릭
2. 브라우저 주소창 URL 확인  
   예: `https://dashboard.render.com/web/srv-xxxxxxxxxxxxxxxxxxxx`  
   → **`srv-` 로 시작하는 부분**이 서비스 ID입니다.

#### 3) GitHub 저장소 시크릿 추가

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 로 아래 두 개 추가:

| Name | Value |
|------|--------|
| `RENDER_TOKEN` | 1)에서 복사한 Render API 키 |
| `RENDER_SERVICE_ID` | 2)에서 확인한 서비스 ID (예: `srv-xxxxxxxxxxxxxxxxxxxx`) |

저장 후 **main 브랜치에 backend 관련 경로를 수정해 push**하면, 해당 커밋에 “Render deployment status” 워크플로가 돌고, Render 배포가 끝나면 커밋 체크가 성공/실패로 갱신됩니다.

- **backend 관련 경로**: `apps/backend/**`, `packages/shared/**`, 루트 `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`  
  (Render Build Filter와 같은 범위라서, 배포가 스킵된 푸시에는 이 워크플로도 실행되지 않습니다.)

---

Blueprint를 **쓰지 않으면** `render.yaml`은 배포에 사용되지 않습니다. 수동 Web Service 설정은 위 대시보드 절차를 따르면 됩니다.

나중에 Blueprint로 전환할 때를 위해, 루트에 `render.yaml`이 있고 그 안에 rootDir, buildCommand, startCommand, buildFilter가 정의되어 있으면 위 표와 동일한 동작을 코드로 맞춰 둘 수 있습니다.

---

## pnpm

빌드 명령에서 `corepack enable && pnpm`을 사용합니다. Render 기본 Node 이미지의 Corepack으로 pnpm을 켜고 사용합니다. 문제가 있으면 Build Command에서 `npm install -g pnpm` 등을 앞에 붙여 시도할 수 있습니다.
