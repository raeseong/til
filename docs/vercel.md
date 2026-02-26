# Vercel 배포 (Frontend)

Frontend Web(Next.js)과 Frontend Admin(Vite)을 Vercel에 배포할 때의 설정입니다. **해당 앱 경로** 또는 **packages/shared**가 변경됐을 때만 빌드하도록 Ignored Build Step을 사용할 수 있습니다.

---

## 1. Root Directory

Vercel에는 `vercel.json`으로 Root Directory를 지정할 수 없습니다. **대시보드**에서만 설정합니다.

| Vercel 프로젝트 (이름 예시) | Root Directory |
|-----------------------------|----------------|
| 공개 웹 (frontend-web)      | `apps/frontend-web` |
| 어드민 (frontend-admin)     | `apps/frontend-admin` |

**Settings** → **General** → **Root Directory**에서 위와 같이 지정합니다.

---

## 2. Install / Build Command (Turbo 권장)

Root Directory를 앱으로 둔 상태에서, **설치와 빌드를 저장소 루트 기준**으로 하려면 아래처럼 설정합니다.  
이렇게 하면 **shared → 해당 앱** 순서로 빌드되고, Turbo 캐시를 쓸 수 있습니다.

| 설정 | frontend-web | frontend-admin |
|------|----------------|----------------|
| **Install Command** | `cd ../.. && pnpm install` | `cd ../.. && pnpm install` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=@til/frontend-web` | `cd ../.. && pnpm exec turbo run build --filter=@til/frontend-admin` |
| **Output Directory** | (기본값 사용, Next는 `.next`) | `dist` |

- Install을 루트에서 하면 워크스페이스 전체 의존성이 설치되고, Turbo가 shared를 인식합니다.
- Build는 루트에서 `turbo run build --filter=...` 로 실행해 **shared가 먼저 빌드**된 뒤 해당 앱만 빌드됩니다.
- Vercel에서 **Turbo 원격 캐시**를 켜면, shared 등 변경 없을 때 캐시 히트로 빌드 시간이 줄어듭니다 (대시보드 또는 [문서](https://vercel.com/docs/monorepos/remote-caching) 참고).

기존처럼 앱 디렉터리에서만 빌드하려면 Install Command는 비우고, Build Command를 해당 앱의 `pnpm run build`(또는 `next build` / `vite build`)로 두면 됩니다. 이 경우 shared는 `prepare` 등으로 미리 빌드되어 있어야 합니다.

---

## 3. Ignored Build Step (모노레포 배포 최적화)

해당 앱·shared·루트 의존성 외의 변경만 있었을 때는 빌드를 스킵하려면 **Ignored Build Step**을 사용합니다.

### 코드로 설정 (권장)

각 앱의 `vercel.json`에 `ignoreCommand`가 들어 있어 있습니다.

- `apps/frontend-web/vercel.json`
- `apps/frontend-admin/vercel.json`

대시보드에서 따로 넣을 필요 없습니다.

### 대시보드에서 설정

**Settings** → **Git** → **Ignored Build Step**에서 아래처럼 입력할 수 있습니다. (코드에 이미 있으면 `vercel.json`이 우선됩니다.)

| 프로젝트 | Ignored Build Step 명령 |
|----------|-------------------------|
| **frontend-web** | `bash scripts/vercel-ignore-build.sh apps/frontend-web packages/shared package.json pnpm-lock.yaml pnpm-workspace.yaml` |
| **frontend-admin** | `bash scripts/vercel-ignore-build.sh apps/frontend-admin packages/shared` |

- **frontend-web**은 루트의 `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`이 바뀌어도 빌드합니다.
- **exit 0** → 빌드 스킵  
- **exit 1** → 빌드 실행

스크립트는 `VERCEL_GIT_PREVIOUS_SHA`와 `VERCEL_GIT_COMMIT_SHA` 사이 변경 파일을 보고, 인자로 준 **경로 접두사**(예: `apps/frontend-web/`) 또는 **루트 파일 이름**(예: `package.json`)이 포함되면 빌드하도록 동작합니다. 자세한 사용법은 `scripts/vercel-ignore-build.sh` 주석을 참고하세요.

---

## 4. 변경 없는데 빌드가 실행되는 경우

다음 두 경우에는 **경로와 상관없이** 빌드가 실행됩니다.

1. **첫 배포**  
   `VERCEL_GIT_PREVIOUS_SHA`가 비어 있으면 “이전 배포 없음”으로 보고 무조건 빌드합니다.

2. **Shallow clone**  
   Vercel은 저장소를 shallow clone해서 과거 커밋이 제한적입니다.  
   `VERCEL_GIT_PREVIOUS_SHA`가 클론에 없으면 `git diff`가 실패하고, 스크립트는 “diff 불가 → 안전하게 빌드”로 **exit 1**을 반환합니다.  
   스크립트는 `git fetch --depth=100`으로 히스토리를 더 가져온 뒤 diff를 재시도하고, 그래도 실패하면 빌드합니다.

backend·docs만 수정했는데 frontend 빌드가 떴다면 대부분 **2번** 때문입니다. 같은 푸시에서 재시도 시에는 스킵될 가능성이 높습니다.
