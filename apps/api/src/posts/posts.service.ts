import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { Post } from '@til/shared';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { generateSlug } from '@til/shared';

@Injectable()
export class PostsService {
  constructor(private readonly repo: PostsRepository) {}

  async findPublished(): Promise<Post[]> {
    return this.repo.findPublished();
  }

  async findAll(): Promise<Post[]> {
    return this.repo.findAll();
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
    const posts = await this.repo.findAll();
    let slug = baseSlug;
    let counter = 1;
    while (posts.some((p) => p.slug === slug && p.id !== excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
