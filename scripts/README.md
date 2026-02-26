# Scripts

## Vercel Ignored Build Step (모노레포 배포 최적화)

각 Vercel 프로젝트는 **해당 앱 경로** 또는 **packages/shared** 가 변경됐을 때만 빌드하도록 설정할 수 있습니다.

**Root Directory는 코드로 설정할 수 없습니다.** Vercel에는 `vercel.json`에 `rootDirectory` 같은 필드가 없고, 프로젝트별 Root Directory는 **대시보드**(Settings → General → Root Directory) 또는 Vercel API로만 지정할 수 있습니다. 새 프로젝트를 만들거나 연결할 때 아래 표를 참고해 대시보드에서 지정하면 됩니다.

| Vercel 프로젝트 (이름 예시) | Root Directory |
|-----------------------------|----------------|
| 공개 웹 (frontend-web)      | `apps/frontend-web` |
| 어드민 (frontend-admin)     | `apps/frontend-admin` |

**Root Directory**를 `apps/frontend-web`, `apps/frontend-admin` 처럼 앱 단위로 이미 설정해 두었다면 그대로 두면 됩니다.

### 설정 방법 (둘 중 하나)

1. **코드로 설정 (권장)**  
   각 앱에 `vercel.json`에 `ignoreCommand`가 들어 있어서, **대시보드에서 따로 넣을 필요 없습니다.**  
   - `apps/frontend-web/vercel.json`
   - `apps/frontend-admin/vercel.json`

2. **대시보드에서 설정**  
   Vercel → 프로젝트 선택 → **Settings** → **Git** → **Ignored Build Step** 에서 아래를 입력해도 됩니다. (코드에 있는 값이 없을 때만 필요합니다.)

| 프로젝트 | Ignored Build Step 명령 |
|----------|-------------------------|
| **frontend-web** (Next 공개 앱) | `bash scripts/vercel-ignore-build.sh apps/frontend-web packages/shared` |
| **frontend-admin** (어드민) | `bash scripts/vercel-ignore-build.sh apps/frontend-admin packages/shared` |

대시보드에 이미 값을 넣었다면, **vercel.json의 ignoreCommand가 우선**됩니다. 대시보드 설정은 코드에 없을 때만 쓰면 됩니다.

- **exit 0** → 빌드 스킵 (해당 경로 변경 없음)
- **exit 1** → 빌드 실행 (해당 경로 또는 shared 변경됨, 또는 첫 배포)

스크립트는 `VERCEL_GIT_PREVIOUS_SHA`와 `VERCEL_GIT_COMMIT_SHA` 사이 변경 파일을 보고, 인자로 준 경로 접두사가 포함된 변경이 있으면 빌드하도록 동작합니다.

---

## Render (API 등) — 필요한 경우에만 배포

Render도 **Root Directory**와 **Build Filters**로 “해당 경로 변경 시에만 자동 배포”가 가능합니다. 별도 스크립트 없이 대시보드(또는 `render.yaml`)만으로 설정할 수 있습니다.

### 동작 방식

- **Root Directory**: 서비스의 빌드/시작 작업 기준 디렉터리. 지정하면 **이 디렉터리 아래 변경**이 있을 때만 자동 배포가 트리거됩니다.
- **Build Filters**: **Included Paths**에 넣은 경로가 바뀔 때만 배포. 경로는 **항상 저장소 루트 기준**입니다.  
  → API 서비스는 `apps/backend/**` 와 `packages/shared/**` 만 포함하면 됩니다.

### API 서비스 설정 방법 (대시보드)

1. [Render Dashboard](https://dashboard.render.com/) → 해당 **Web Service**(API) 선택.
2. **Settings** → **Build & Deploy** 섹션으로 이동.
3. **Root Directory**  
   - 이미 `apps/backend` 로 두었다면 그대로 사용.  
   - (선택) 루트에서 전체 모노레포를 빌드한다면 비워 둠.
4. **Build Filters**  
   - **+ Add Included Path** 로 아래 두 개 추가:
     - `apps/backend/**`
     - `packages/shared/**`  
   - 이렇게 하면 **이 두 경로 중 하나라도 변경될 때만** 자동 배포됩니다.

### 참고

- **Included Paths**를 하나라도 지정하면, 그 경로에 해당하지 않는 변경은 자동 배포를 트리거하지 않습니다.
- 수동 배포나 설정 변경으로 시작한 배포는 Build Filter와 관계없이 항상 실행됩니다.
- 상세: [Render – Monorepo Support](https://docs.render.com/monorepo-support) (Root Directory, Build Filters, filter 문법).

**코드로 관리하려면** 저장소 루트에 **`render.yaml`** (Blueprint)을 두고, Render 대시보드에서 해당 저장소를 **Blueprint**로 연결하면 됩니다. 예시는 루트의 `render.yaml`, 설명은 `docs/render.md`를 참고하세요.
