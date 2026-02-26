# Render 배포 (Blueprint)

API 서비스의 Root Directory, Build Filter, 빌드/시작 명령은 **코드**로 관리합니다.

# Render 배포 (Blueprint)

API 서비스의 Root Directory, Build Filter, 빌드/시작 명령은 **코드**로 관리합니다.

## Git 푸시 시 자동 배포가 되려면

**저장소가 Render와 연결되어 있어야** 푸시할 때마다 배포가 트리거됩니다. 연결이 안 되어 있으면 GitHub에는 변경만 올라가고, Render 쪽 배포는 일어나지 않습니다.

- **GitHub "All checks have failed"** 에서 보이는 항목은 보통 **GitHub Actions**, **Vercel** 등이 추가한 status check입니다. **Render는 기본적으로 GitHub에 배포 상태를 check로 남기지 않습니다.** 대신 Render 대시보드에서 배포 이력이 쌓입니다.
- 따라서 “backend가 배포처리되는 과정이 없다”면, **Render에 이 저장소가 연결되지 않았을 가능성**이 큽니다. 아래 순서대로 연결을 확인·설정하면 됩니다.

### 1) GitHub 연동 확인

1. [Render Dashboard](https://dashboard.render.com/) 로그인
2. **Account Settings** 또는 서비스 생성 화면에서 **GitHub** 연결이 되어 있는지 확인
3. 연결이 없다면: **New → Web Service** 또는 **Blueprint** 진행 시 GitHub 연결 유도됨 → 해당 저장소에 대한 접근 허용

### 2) 백엔드를 Blueprint로 연결 (권장)

`render.yaml`을 쓰려면 **Blueprint Instance**로 이 저장소를 한 번 연결해야 합니다.

1. Render Dashboard → **Blueprints** → **New Blueprint Instance**
2. **Connect a repository** 에서 이 GitHub 저장소 선택 후 **Connect**
3. **Blueprint Path**: `render.yaml` (저장소 루트에 있으면 기본값 그대로)
4. **Branch**: 자동 배포할 브랜치 (예: `main`)
5. 생성 완료 후, Render가 `render.yaml`을 읽어 **til-backend** 서비스를 만들고, **이후 해당 브랜치에 푸시할 때마다** (buildFilter 조건 만족 시) 자동 배포됩니다.

한 번만 연결해 두면, 같은 저장소에 푸시할 때마다 Render가 변경을 감지하고 `render.yaml` + buildFilter에 따라 배포합니다.

### 3) 기존에 수동으로 만든 백엔드 서비스가 있는 경우

이미 “Web Service”로 til-backend( 또는 다른 이름)를 만들어 두었다면:

1. 해당 서비스 → **Settings** → **Build & Deploy** (또는 **Git**) 섹션
2. **Repository** / **Branch** 가 이 GitHub 저장소·브랜치로 연결되어 있는지 확인
3. **Auto-Deploy** 가 **Yes** 인지 확인
4. 연결이 없거나 No라면: **Connect repository** 로 이 저장소·브랜치를 지정하고 Auto-Deploy를 켜면, 푸시 시 자동 배포됩니다.

이때 Root Directory, Build Command 등은 `render.yaml`이 아니라 **대시보드에 직접 입력한 값**이 쓰이므로, `render.yaml`과 맞추고 싶다면 위 2)처럼 Blueprint로 새로 만드는 편이 낫습니다.

**대시보드에서 Build Filter만 설정할 때** (Included Paths): backend·shared뿐 아니라 **루트의 package.json, pnpm-lock.yaml, pnpm-workspace.yaml**도 넣어야 합니다. 이 파일들이 바뀌면 의존성/워크스페이스가 바뀌므로 백엔드 빌드가 다시 돼야 합니다. **Included Paths**에 아래 5개를 추가하면 됩니다.

| 추가할 경로 | 설명 |
|-------------|------|
| `apps/backend/**` | 백엔드 앱 전체 (apps/backend/package.json 포함) |
| `packages/shared/**` | shared 패키지 |
| `package.json` | 루트 package.json (워크스페이스·스크립트) |
| `pnpm-lock.yaml` | 루트 lockfile (의존성 변경 시 함께 변경됨) |
| `pnpm-workspace.yaml` | 워크스페이스 정의 |

경로는 모두 **저장소 루트 기준**이며, 대시보드에서 **+ Add Included Path**로 위 값들을 하나씩 넣으면 됩니다.

### 4) GitHub에서 Render 앱 권한 확인

푸시해도 배포가 전혀 안 뜬다면, Render GitHub App이 **이 저장소**에 접근할 수 있는지 확인합니다.

1. [GitHub → Render 앱 설치 페이지](https://github.com/apps/render/installations/new) 이동
2. **Repository access** 에서 이 저장소가 선택되어 있는지 확인 (또는 “All repositories”)
3. 저장소가 비공개라면 Render가 해당 저장소를 볼 수 있도록 허용되어 있어야 합니다.

---

## 설정 파일

- **`render.yaml`** (저장소 루트)  
  - 서비스 한 개: `til-backend`
  - `rootDir: apps/backend`
  - `buildFilter.paths`: `apps/backend/**`, `packages/shared/**` → 이 경로가 바뀐 푸시에서만 자동 배포

## Blueprint 연결 방법

1. [Render Dashboard](https://dashboard.render.com/) → **Blueprints** → **New Blueprint Instance**
2. 연결할 Git 저장소 선택
3. **Blueprint Path**에 `render.yaml` (기본값) 지정 후 생성
4. Render가 `render.yaml`을 읽어 서비스를 생성·동기화합니다.

이미 **수동으로 만든 API 서비스**가 있다면:

- **A)** 그 서비스를 삭제한 뒤, 위처럼 Blueprint로 새로 만들면 `render.yaml` 설정이 그대로 적용됩니다.
- **B)** 서비스 이름을 `render.yaml`의 `name: til-backend`와 맞추고, 같은 저장소를 Blueprint로 연결해 동기화할 수 있습니다. (이름이 다르면 새 서비스가 생길 수 있음)

## 환경 변수

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD` 등은 `render.yaml`에 넣지 말고 **Render 대시보드 → 해당 서비스 → Environment**에서 설정합니다.

## pnpm

빌드 명령에서 `corepack enable && pnpm`을 사용합니다. Render 기본 Node 이미지에 포함된 Corepack으로 pnpm을 켜고 사용합니다. 문제가 있으면 대시보드에서 Build Command를 `npm install -g pnpm && ...` 형태로 바꿔서 시도할 수 있습니다.
