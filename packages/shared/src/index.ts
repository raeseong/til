export type BaseEntity = {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Post = BaseEntity & {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
  slug: string;
};

export type CreatePostDto = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
};

export type UpdatePostDto = Partial<CreatePostDto>;

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
