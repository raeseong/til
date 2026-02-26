# Scripts

모노레포 배포 시 **해당 앱만 변경됐을 때만** 빌드/배포되도록 하는 스크립트와 설정입니다.

| 용도 | 설명 | 상세 문서 |
|------|------|------------|
| **Vercel** (frontend-web, frontend-admin) | `ignoreCommand`로 Ignored Build Step 사용 | [docs/vercel.md](../docs/vercel.md) |
| **Render** (backend) | Included Paths로 Build Filter 사용 | [docs/render.md](../docs/render.md) |

- **Vercel**: `scripts/vercel-ignore-build.sh` — 변경 경로에 따라 exit 0(스킵) / 1(빌드). 각 앱의 `vercel.json`에서 호출.
- **Render**: 별도 스크립트 없음. Render 대시보드(또는 `render.yaml`)에서 Root Directory·Included Paths만 설정.

자세한 설정 방법·Root Directory·환경 변수는 위 문서를 참고하세요.
