import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { Post } from './posts.types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { generateSlug } from '@til/shared';
import type { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PaginationQueryDto, buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class PostsService {
  constructor(private readonly repo: PostsRepository) {}

  async findPublishedPaginated(query: PaginationQueryDto): Promise<PaginatedResponseDto<Post>> {
    const { skip, take } = query.toSkipTake();
    const [list, totalCount] = await Promise.all([
      this.repo.findPublishedPaginated(skip, take),
      this.repo.countPublished(),
    ]);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    return {
      pagination: buildPaginationMeta(page, pageSize, totalCount),
      list,
    };
  }

  async findAllAdminPaginated(query: PaginationQueryDto): Promise<PaginatedResponseDto<Post>> {
    const { skip, take } = query.toSkipTake();
    const [list, totalCount] = await Promise.all([
      this.repo.findAllPaginated(skip, take),
      this.repo.countAll(),
    ]);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    return {
      pagination: buildPaginationMeta(page, pageSize, totalCount),
      list,
    };
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const post = await this.repo.findBySlug(slug);
    if (!post || !post.published) return null;
    return post;
  }

  async findById(id: number): Promise<Post | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const slug = await this.ensureUniqueSlug(generateSlug(dto.title));
    return this.repo.create({
      title: dto.title,
      slug,
      summary: dto.summary,
      content: dto.content,
      tags: dto.tags,
      published: dto.published ?? false,
    });
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Post not found');
    const slug = dto.title ? await this.ensureUniqueSlug(generateSlug(dto.title), id) : existing.slug;
    const updated = await this.repo.update(id, { ...dto, slug });
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.repo.softDelete(id);
    if (!deleted) throw new NotFoundException('Post not found');
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await this.repo.existsBySlug(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
