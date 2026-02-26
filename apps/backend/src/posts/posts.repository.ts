import { Injectable } from '@nestjs/common';
import type { Post as PrismaPost } from '@prisma/client';
import { Post } from './posts.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: PrismaPost): Post {
    return { ...row, id: Number(row.id) };
  }

  async findAll(): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
      where: { deleted_at: null },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async findAllPaginated(skip: number, take: number): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
      where: { deleted_at: null },
      orderBy: { id: 'asc' },
      skip,
      take,
    });
    return rows.map((row) => this.mapRow(row));
  }

  async countAll(): Promise<number> {
    return this.prisma.post.count({
      where: { deleted_at: null },
    });
  }

  async findPublished(): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
      where: { published: true, deleted_at: null },
      orderBy: { id: 'desc' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async findPublishedPaginated(skip: number, take: number): Promise<Post[]> {
    const rows = await this.prisma.post.findMany({
      where: { published: true, deleted_at: null },
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    return rows.map((row) => this.mapRow(row));
  }

  async countPublished(): Promise<number> {
    return this.prisma.post.count({
      where: { published: true, deleted_at: null },
    });
  }

  async findById(id: number): Promise<Post | null> {
    const row = await this.prisma.post.findFirst({
      where: { id, deleted_at: null },
    });
    return row ? this.mapRow(row) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const row = await this.prisma.post.findFirst({
      where: { slug, deleted_at: null },
    });
    return row ? this.mapRow(row) : null;
  }

  /** slug가 이미 존재하는지 확인 (excludeId 제외). */
  async existsBySlug(slug: string, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.post.count({
      where: {
        slug,
        deleted_at: null,
        ...(excludeId != null ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async create(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Post> {
    const row = await this.prisma.post.create({
      data: {
        title: post.title,
        summary: post.summary,
        content: post.content,
        tags: post.tags,
        published: post.published,
        slug: post.slug,
      },
    });
    return this.mapRow(row);
  }

  async update(id: number, updates: Partial<Omit<Post, 'id' | 'created_at'>>): Promise<Post | null> {
    const { updated_at, deleted_at, ...rest } = updates as Partial<Post>;
    const existing = await this.prisma.post.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) return null;
    const row = await this.prisma.post.update({
      where: { id },
      data: {
        ...(rest.title != null && { title: rest.title }),
        ...(rest.summary != null && { summary: rest.summary }),
        ...(rest.content != null && { content: rest.content }),
        ...(rest.tags != null && { tags: rest.tags }),
        ...(rest.published != null && { published: rest.published }),
        ...(rest.slug != null && { slug: rest.slug }),
      },
    });
    return this.mapRow(row);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.prisma.post.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    return result.count > 0;
  }
}
