# 공유 패키지·타입 정책

`packages/shared`와 백엔드 타입을 어떻게 나누는지 정리합니다.

---

## 1. shared 패키지에 두는 것

- **요청용 DTO 타입**: `CreatePostDto`, `UpdatePostDto`  
  API 요청 바디·폼 타입으로 프론트/백이 함께 쓸 수 있음.
- **유틸**: `generateSlug` 등 도메인 공용 함수.

응답·엔티티 타입은 shared에 두지 않습니다. (프론트는 각자 필요한 응답 타입을 정의.)

---

## 2. 백엔드에서만 쓰는 것

- **엔티티/도메인 타입**: DB·API 응답용 타입은 **스키마(Prisma)를 단일 소스**로 두고, 필요한 부분만 유도해서 씀.
  - 예: `id`가 `BigInt`이면 JSON 직렬화를 위해 `Omit<Prisma.Post, 'id'> & { id: number }` 같은 한 줄 타입만 둠.
  - 별도로 필드를 나열한 “수동 엔티티”는 두지 않음 → 관리 포인트를 스키마 + DB 두 곳으로 유지.
- **Nest용 DTO 클래스**: `class CreatePostDto` (class-validator 등)는 백엔드 전용. shared의 타입과 **형태만 맞추면** 됨.

---

## 3. 정리

| 구분 | 위치 | 비고 |
|------|------|------|
| 요청 DTO 타입 | shared | CreatePostDto, UpdatePostDto |
| 응답/엔티티 타입 | shared에 두지 않음 | 프론트는 자체 타입, 백은 Prisma 타입 유도 |
| Prisma 스키마 | 백엔드 | 스키마 + DB만 관리 (TypeORM의 엔티티+DB와 동일 수준) |

이렇게 하면 “엔티티, 스키마, DB” 세 곳을 따로 관리하지 않고, **스키마 + DB** 두 곳만 맞추면 됩니다.
