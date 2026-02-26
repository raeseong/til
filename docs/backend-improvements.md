# 백엔드 개선·추가 기능 정리

## 1. 개선 사항 (보안·안정성)

### 1.1 환경 변수 기본값 (프로덕션 위험)
- **현재**: `ADMIN_PASSWORD`, `JWT_SECRET`에 코드 상 기본값이 있음 (`admin123`, `til-secret-key-change-in-production`).
- **문제**: 프로덕션에서 env를 빼먹으면 그대로 노출됨.
- **제안**: `NODE_ENV=production`일 때는 이 값들이 없으면 앱 시작 시 에러를 던지거나, 기본값을 아예 두지 않고 필수로만 사용.

### 1.2 Path 파라미터 검증
- **현재**: `@Param('id') id: string` → `Number(id)`만 사용. `id=abc`면 `NaN`으로 DB 조회해 결과 없음 → 404.
- **제안**: `ParseIntPipe` 또는 `ParseIntPipe` + `Min(1)` 적용해 숫자가 아니거나 1 미만이면 **400 Bad Request**로 명확히 반환.

### 1.3 미사용 import
- **현재**: `posts.repository.ts`에서 `InternalServerErrorException` import만 하고 사용하지 않음.
- **제안**: 제거.

### 1.4 Health check 엔드포인트
- **현재**: 없음.
- **제안**: Render·로드밸런서·모니터링용으로 `GET /health` 또는 `GET /` 에서 `{ status: 'ok' }` 정도 반환. DB 연결 여부까지 포함할지 선택 (예: `GET /health` = 라이브, `GET /ready` = DB 체크).

---

## 2. 추가할 만한 기능

### 2.1 로그인 Rate limiting
- **목적**: 브루트포스 방지.
- **방법**: `@nestjs/throttler` 등으로 `/auth/login`에만 분당 요청 횟수 제한 (예: 5회/분).

### 2.2 API 문서 (Swagger)
- **목적**: API 스펙 공유·테스트.
- **방법**: `@nestjs/swagger` 추가 후 컨트롤러·DTO에 데코레이터로 스키마 정의. `GET /api` 또는 `/docs`에서 UI 노출.

### 2.3 목록 페이징
- **현재**: `findAllAdmin`, `findPublished`가 전부 반환.
- **제안**: 글이 많아질 때를 대비해 `page`, `limit` (또는 `offset`, `limit`) 쿼리 추가. 응답에 `items`, `total` 등 메타 포함 여부 선택.

### 2.4 JWT 만료 시간 환경 변수화
- **현재**: `expiresIn: '7d'` 하드코딩.
- **제안**: `JWT_EXPIRES_IN=7d` 같은 env로 분리해 배포 환경별 조정 가능하게.

### 2.5 보안 헤더 (Helmet)
- **목적**: XSS·클릭재킹 등 완화.
- **방법**: `helmet` 미들웨어 적용. (일부 헤더는 CORS·SPA와 충돌할 수 있어 선택 적용.)

---

## 3. 우선 적용 추천

| 순서 | 항목 | 난이도 | 효과 | 비고 |
|------|------|--------|------|------|
| 1 | Path 파라미터 `ParseIntPipe` 적용 | 낮음 | 잘못된 id 요청 시 400으로 명확히 처리 | ✅ 적용됨 |
| 2 | `InternalServerErrorException` 미사용 import 제거 | 낮음 | 코드 정리 | ✅ 적용됨 |
| 3 | `GET /health` 추가 | 낮음 | Render/모니터링 연동 용이 | ✅ 적용됨 |
| 4 | 프로덕션에서 ADMIN_PASSWORD·JWT_SECRET 필수화 | 낮음 | 보안 강화 | ✅ 적용됨 |
| 5 | 로그인 Rate limiting | 중간 | 브루트포스 완화 | ✅ 적용됨 (ThrottlerGuard, 5회/분) |
| 6 | Swagger 도입 | 중간 | API 문서·협업 편의 | ✅ 적용됨 (`GET /api`) |

나머지(페이징, JWT_EXPIRES_IN, Helmet)는 필요해질 때 추가해도 됩니다.
