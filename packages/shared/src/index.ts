export type CreatePostDto = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
};

export type UpdatePostDto = Partial<CreatePostDto>;

/** 페이지네이션 메타 (목록 API 응답 공통) */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
};

/** 페이지네이션 목록 응답 (목록 API 공통 형태) */
export type PaginatedResponse<T> = {
  pagination: PaginationMeta;
  list: T[];
};

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
