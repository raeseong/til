# Render 배포 (Blueprint)

API 서비스의 Root Directory, Build Filter, 빌드/시작 명령은 **코드**로 관리합니다.

## 설정 파일

- **`render.yaml`** (저장소 루트)  
  - 서비스 한 개: `til-api`  
  - `rootDir: apps/api`  
  - `buildFilter.paths`: `apps/api/**`, `packages/shared/**` → 이 경로가 바뀐 푸시에서만 자동 배포

## Blueprint 연결 방법

1. [Render Dashboard](https://dashboard.render.com/) → **Blueprints** → **New Blueprint Instance**
2. 연결할 Git 저장소 선택
3. **Blueprint Path**에 `render.yaml` (기본값) 지정 후 생성
4. Render가 `render.yaml`을 읽어 서비스를 생성·동기화합니다.

이미 **수동으로 만든 API 서비스**가 있다면:

- **A)** 그 서비스를 삭제한 뒤, 위처럼 Blueprint로 새로 만들면 `render.yaml` 설정이 그대로 적용됩니다.
- **B)** 서비스 이름을 `render.yaml`의 `name: til-api`와 맞추고, 같은 저장소를 Blueprint로 연결해 동기화할 수 있습니다. (이름이 다르면 새 서비스가 생길 수 있음)

## 환경 변수

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD` 등은 `render.yaml`에 넣지 말고 **Render 대시보드 → 해당 서비스 → Environment**에서 설정합니다.

## pnpm

빌드 명령에서 `corepack enable && pnpm`을 사용합니다. Render 기본 Node 이미지에 포함된 Corepack으로 pnpm을 켜고 사용합니다. 문제가 있으면 대시보드에서 Build Command를 `npm install -g pnpm && ...` 형태로 바꿔서 시도할 수 있습니다.
