import type { Post as PrismaPost } from '@prisma/client';

/** API/서비스 계층용. 스키마와 동일하되 id는 number (JSON 직렬화 대응). */
export type Post = Omit<PrismaPost, 'id'> & { id: number };
