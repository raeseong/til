# Prisma ↔ DB 워크플로

테이블을 **실제 DB에서 관리할지**, **Prisma 스키마에서 관리할지**에 따라 워크플로가 달라집니다. Prod에서 변경 사항을 검증·반영하는 방법도 함께 정리합니다.

---

## 1. 두 가지 방식 요약

| 구분 | DB가 기준 (DB-first) | 스키마가 기준 (Schema-first) |
|------|----------------------|------------------------------|
| **변경 주체** | DB에서 직접 DDL/SQL 실행 (Supabase SQL Editor, 마이그레이션 도구 등) | `schema.prisma` 수정 후 `prisma migrate` |
| **스키마 동기화** | `prisma db pull`로 DB → 스키마 반영 | `prisma migrate dev/deploy`로 스키마 → DB 반영 |
| **마이그레이션 이력** | Prisma 밖에서 관리 (Supabase, 별도 SQL 파일 등) | `prisma/migrations/`에 SQL로 버전 관리 |
| **Prod 대비** | “DB 변경 검토 → Prod DB 적용 → (선택) db pull” | “마이그레이션 SQL 검토 → prod에서 migrate deploy” |

---

## 2. 자동 반영: DB → Prisma 스키마 (DB-first)

**“테이블은 실제 DB에서 관리하고, Prisma 스키마는 그에 맞춰 맞춘다”**가 목표면 **DB를 기준**으로 두고, 변경 후 스키마만 갱신하면 됩니다.

- DB에서 테이블/컬럼/인덱스를 추가·수정·삭제한 뒤
- 다음 명령으로 **현재 DB 구조를 읽어서** `schema.prisma`를 덮어씁니다.

```bash
cd apps/backend
pnpm exec prisma db pull
```

- `db pull`은 **introspect**라서, 현재 DB 상태를 보고 Prisma 모델을 생성/갱신합니다.
- 그 후 `prisma generate`만 다시 돌리면 됩니다 (보통 `db pull` 후 자동으로 안내됩니다).

**주의**

- DB에만 있고 Prisma에서 표현하기 애매한 제약/타입은 주석으로 남거나 수동으로 다듬어야 할 수 있습니다.
- **기본값·커스텀 타입·일부 인덱스** 등은 100% 동일하게 안 나올 수 있어, pull 후 스키마를 한 번 검토하는 것이 좋습니다.

즉, **“자동 반영”은 DB-first일 때 `prisma db pull`로 하는 것**이라고 보면 됩니다.

---

## 3. Prod에서 안전하게 반영 (Schema-first 권장)

Prod에서 **데이터베이스 동작을 정확히 확인하고 반영**하려면, **스키마를 기준으로 두고 마이그레이션을 사용하는 방식**이 더 적합합니다.

- **개발**: `schema.prisma` 수정 → `prisma migrate dev`  
  - 적용될 SQL이 `prisma/migrations/`에 파일로 생성되고, 로컬/개발 DB에 적용됩니다.
- **Prod**:
  - 저장소에 올라간 **마이그레이션 SQL을 코드 리뷰**로 확인한 뒤
  - 배포 시점에 `prisma migrate deploy`로 **미적용 분만** 순서대로 적용합니다.

이렇게 하면:

- 모든 DB 변경이 **파일로 남고**, diff로 검토할 수 있고,
- Prod에는 **정해진 순서대로만** 적용되므로 대비책이 됩니다.

**스키마와 DB를 맞추려면** 스키마 수정 후 `prisma migrate dev`로 마이그레이션을 만들고, 배포 시 `prisma migrate deploy`로 적용하면 됩니다. (인덱스만 수동으로 넣고 싶을 때만 `apps/backend/prisma/scripts/add-post-indexes.sql` 같은 수동 SQL을 쓰면 됩니다.)

### 3.1 지금 프로젝트에 Migrate 도입하려면

**스키마와 DB를 맞추는 공식 방법은 `prisma migrate`입니다.** (`schema.prisma` 수정 → `prisma migrate dev` → 생성된 SQL이 `prisma/migrations/`에 저장 → Prod에서는 `prisma migrate deploy`로 적용.)

- **이미 Supabase에 `posts` 테이블이 있는 경우 (baseline)**  
  1. `prisma migrate deploy`를 그대로 실행하면, 첫 마이그레이션(init)이 “테이블 생성”이라 이미 있는 테이블과 충돌할 수 있습니다.  
  2. **이미 적용된 것으로만 표시**하려면:  
     `pnpm exec prisma migrate resolve --applied "20250226100000_init"`  
     (연결된 DB가 Supabase라면, Supabase용 `DATABASE_URL`로 실행.)  
  3. 그 다음 `pnpm exec prisma migrate deploy`를 실행하면 **두 번째 마이그레이션(partial index)** 만 적용됩니다.

- **테이블이 아직 없는 새 DB**  
  - `pnpm exec prisma migrate deploy` 한 번만 실행하면, init + partial index 마이그레이션이 순서대로 적용됩니다.

### 3.2 정리: SQL 직접 실행 vs prisma migrate

| 목적 | 사용할 것 |
|------|------------|
| 스키마와 DB를 맞추고, 변경 이력을 코드로 관리 | **`prisma migrate dev`** (개발) / **`prisma migrate deploy`** (배포) |
| 스키마에 없는 수동 DDL(예: partial index만 추가)을 한 번만 적용 | 수동 SQL 또는 마이그레이션 파일에 raw SQL 추가 후 `migrate deploy` |

이 프로젝트에는 이미 `prisma/migrations/`에 init + partial index 마이그레이션이 있으므로, **앞으로는 스키마 수정 후 `prisma migrate`만 사용**하면 됩니다.

---

## 4. 정리

- **테이블을 실제 DB에서 관리하고, Prisma는 그에 맞추고 싶다**  
  → DB에서 DDL 실행 후 **`prisma db pull`**로 스키마 자동 반영. Prod는 기존처럼 DB 변경을 검토·적용하고, 필요 시 pull만 다시 실행하면 됩니다.
- **Prod까지 포함해 “동작을 정확히 확인하고 반영”하고 싶다**  
  → **스키마를 기준(Schema-first)** 으로 두고, **`prisma migrate`** 로 마이그레이션을 관리하는 쪽이 대비책이 됩니다.  
  - 변경은 모두 `schema.prisma` + `prisma/migrations/*.sql`로 남고,  
  - Prod에서는 `prisma migrate deploy`만 실행하면 됩니다.

둘을 섞어 쓸 수도 있습니다. 예: 기존 테이블은 DB에서 관리하고 가끔 `db pull`로 맞추고, **새로 추가되는 테이블/컬럼만** Prisma 스키마를 먼저 수정한 뒤 `migrate dev`로 마이그레이션을 만들고 Prod에는 `migrate deploy`로 반영하는 방식입니다.
