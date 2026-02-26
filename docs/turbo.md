# Turborepo 동작 원리 (이 프로젝트 기준)

이 문서는 TIL 모노레포에 적용된 Turbo 설정을 기준으로, Turbo가 **무엇을 하고**, **어떤 순서로 실행되며**, **캐시는 어떻게 동작하는지** 구체적으로 정리합니다.  
(Admin 앱에서 TIL 글을 작성·수정하고, 공개 웹과 API가 그 데이터를 사용하는 구조를 전제로 합니다.)

---

## 1. Turbo가 하는 일

Turbo는 **모노레포 내 패키지별 스크립트(build, dev 등)** 를:

1. **의존 관계에 맞는 순서**로 실행하고,
2. **입력(코드·의존성)이 바뀌지 않았으면** 이전 결과를 **캐시에서 재사용**합니다.

즉, “누가 먼저 빌드되어야 하는지”와 “다시 안 돌려도 되는 작업”을 Turbo가 관리합니다.

---

## 2. 이 프로젝트의 워크스페이스·의존 관계

- **패키지**: `packages/shared`, `apps/backend`, `apps/frontend-web`, `apps/frontend-admin` (pnpm-workspace.yaml의 `apps/*`, `packages/*`).
- **의존 관계**:
  - `@til/shared`: 다른 패키지에 의존하지 않음.
  - `@til/backend`, `@til/frontend-web`, `@til/frontend-admin`: 각각 `@til/shared`를 의존성으로 가짐.

따라서 **빌드 순서**는 반드시 **shared → backend / frontend-web / frontend-admin** 이어야 합니다.  
Turbo는 이 순서를 `turbo.json`의 `dependsOn`으로 보장합니다.

---

## 3. turbo.json 태스크 정의

### 3.1 `build` 태스크

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**", ".next/**", ".next/static/**"]
}
```

- **`dependsOn: ["^build"]`**  
  `^`는 “**내 패키지가 의존하는 워크스페이스 패키지들**”을 가리킵니다.  
  즉, “나의 build를 돌리기 전에, **의존 패키지들의 build**를 먼저 실행해라”는 뜻입니다.  
  - `@til/shared`: 의존 패키지 없음 → `build`만 실행.  
  - `@til/backend` 등: 의존 패키지 `@til/shared`가 있음 → **shared의 build가 끝난 뒤** 자신의 build 실행.
- **`outputs`**  
  이 태스크의 “결과물”로 볼 디렉터리입니다.  
  Turbo는 **입력(소스·의존성) 해시**를 기준으로 캐시를 만들고, 다음 실행 시 **입력이 같으면** `outputs`에 해당하는 이전 결과를 그대로 재사용합니다.  
  - shared / backend / frontend-admin: `dist/**`  
  - frontend-web (Next): `.next/**`, `.next/static/**`

정리하면, **`pnpm build`(= `turbo run build`) 시 shared가 먼저 빌드되고, 그 다음 backend·frontend-web·frontend-admin이 (서로 독립이므로) 병렬로 빌드**됩니다.

### 3.2 `dev` 태스크

```json
"dev": {
  "dependsOn": ["^build"],
  "cache": false,
  "persistent": true
}
```

- **`dependsOn: ["^build"]`**  
  dev 서버를 띄우기 전에, **의존 패키지들은 먼저 빌드**되어 있어야 합니다.  
  그래서 `turbo run dev`를 하면 shared가 (필요 시) 빌드된 뒤, 각 앱의 `dev`가 실행됩니다.
- **`cache: false`**  
  dev는 “한 번 실행한 결과를 재사용”하는 대상이 아니므로 캐시하지 않습니다.
- **`persistent: true`**  
  이 태스크는 **끝나지 않고 계속 떠 있는 프로세스**라는 뜻입니다.  
  Turbo는 persistent 태스크를 “완료된 작업”이 아니라 “계속 돌아가는 서버”로 취급하고, 여러 패키지의 dev를 동시에 띄울 수 있게 합니다.

그래서 **`pnpm dev`** 시 shared가 빌드된 뒤, backend·frontend-web·frontend-admin·shared의 dev가 함께 실행됩니다 (admin에서 글 작성·수정할 때 필요한 서비스들이 모두 떠 있는 상태).

---

## 4. 루트 package.json 스크립트와 동작

| 스크립트 | 명령 | 동작 |
|----------|------|------|
| **prepare** | `turbo run build --filter=@til/shared` | `pnpm install` 후 자동 실행. shared만 먼저 빌드해 두어, 다른 앱이 shared를 참조할 수 있게 함. |
| **build** | `turbo run build` | 위에서 설명한 대로 **shared → 나머지** 순서로 build 실행. 변경 없으면 캐시 사용. |
| **dev** | `turbo run dev` | 의존 관계대로 ^build 후 모든 패키지의 dev를 띄움 (shared watch + backend + frontend-web + frontend-admin). |
| **dev:backend** | `turbo run dev --filter=@til/backend` | backend만 dev 실행. (실행 전 필요 시 shared build.) |
| **dev:frontend-web** | `turbo run dev --filter=@til/frontend-web` | frontend-web만 dev. |
| **dev:frontend-admin** | `turbo run dev --filter=@til/frontend-admin` | frontend-admin만 dev. (admin에서 글 남기는 화면 띄울 때 사용.) |
| **build:backend** 등 | `turbo run build --filter=@til/backend` | 해당 패키지와 **그 패키지가 의존하는 패키지**만 build. (예: backend 시 shared도 함께 build.) |

`--filter=@til/...` 은 “이 패키지(와 그 의존 패키지)만 대상으로 한다”는 의미입니다.  
Admin에서 post로 글을 남길 때는 보통 **전체 `pnpm dev`** 로 API·admin·공개 웹을 다 띄우거나, **`pnpm dev:backend` + `pnpm dev:frontend-admin`** 만 켜서 사용하면 됩니다.

---

## 5. 캐시가 동작하는 방식

- **저장 위치**: 루트의 `.turbo` 디렉터리 (`.gitignore`에 포함되어 커밋되지 않음).
- **캐시 키**: 각 패키지·태스크별로 **입력 해시**가 계산됩니다.  
  소스 코드, 의존성(lockfile·package.json), 환경 변수(필요 시), `outputs` 외에 읽는 파일 등이 반영됩니다.
- **동작**:
  - **캐시 미스**: 입력이 이전과 다르면 해당 패키지의 build를 실제로 실행하고, 결과를 `outputs`에 맞춰 저장한 뒤 캐시에 넣습니다.
  - **캐시 히트**: 입력이 같으면 build를 다시 실행하지 않고, 이전에 저장된 출력을 복원하고 로그만 “replaying”해서 보여줍니다.  
  그래서 “아무것도 수정 안 하고 `pnpm build` 한 번 더” 하면 거의 즉시 끝나고, 로그에 `FULL TURBO` / `Cached: N cached, N total` 처럼 나옵니다.

이렇게 **빌드 순서 + 캐시** 덕분에, 프로젝트가 커져도 “바뀐 패키지만 다시 빌드”되고 나머지는 캐시로 스킵할 수 있습니다.

---

## 6. packageManager 필드

루트 `package.json`에 `"packageManager": "pnpm@10.22.0"` 이 있는 이유는, Turbo가 **어떤 패키지 매니저로 워크스페이스를 해석할지** 알기 위해서입니다.  
이 값이 있으면 Turbo는 `pnpm-workspace.yaml`과 워크스페이스 의존 관계를 올바르게 읽고, `^build` 같은 의존 관계를 계산할 수 있습니다.

---

## 7. 요약

- **build**: `^build`로 **shared 먼저**, 그 다음 backend·frontend들 **병렬** 빌드. `outputs` 기준으로 **캐시**.
- **dev**: **의존 패키지 build** 후, 모든(또는 `--filter`로 고른) 앱의 dev 서버를 **동시에** 띄움. 캐시 없음, persistent.
- **Admin에서 post로 글 남기기**: `pnpm dev`로 전체를 띄우거나, `pnpm dev:backend` + `pnpm dev:frontend-admin`으로 API와 Admin만 띄워서 사용하면 됩니다.

추가로 “이 태스크만 캐시 비우고 다시 돌리고 싶다”면 `turbo run build --force` 같은 식으로 사용할 수 있고, CI에서는 같은 `turbo run build`를 쓰면 로컬과 동일한 순서·캐시 규칙이 적용됩니다.

**배포**에서도 Turbo로 빌드하면 로컬과 동일한 순서·캐시를 사용할 수 있습니다.  
- Vercel: [docs/vercel.md](vercel.md) § Install / Build Command (Turbo 권장)  
- Render: [docs/render.md](render.md) § Build Command (Turbo 사용 권장)
