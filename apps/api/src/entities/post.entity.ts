import { BaseEntity } from './base.entity';

export interface Post extends BaseEntity {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
  slug: string;
}
