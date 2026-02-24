import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Post as PostType } from '@til/shared';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { generateSlug } from '@til/shared';
import { PostEntity } from './post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly repo: Repository<PostEntity>,
  ) {}

  async findPublished(): Promise<PostType[]> {
    const entities = await this.repo.find({
      where: { published: true, deletedAt: IsNull() },
      order: { id: 'DESC' },
    });
    return entities.map(this.toPost);
  }

  async findAll(): Promise<PostType[]> {
    const entities = await this.repo.find({
      where: { deletedAt: IsNull() },
      order: { id: 'ASC' },
    });
    return entities.map(this.toPost);
  }

  async findBySlug(slug: string): Promise<PostType | null> {
    const entity = await this.repo.findOne({
      where: { slug, deletedAt: IsNull() },
    });
    if (!entity || !entity.published) return null;
    return this.toPost(entity);
  }

  async findById(id: number): Promise<PostType | null> {
    const entity = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.toPost(entity) : null;
  }

  async create(dto: CreatePostDto): Promise<PostType> {
    const slug = await this.ensureUniqueSlug(generateSlug(dto.title));
    const entity = this.repo.create({
      title: dto.title,
      summary: dto.summary,
      content: dto.content,
      tags: dto.tags,
      published: dto.published ?? false,
      slug,
    });
    const saved = await this.repo.save(entity);
    return this.toPost(saved);
  }

  async update(id: number, dto: UpdatePostDto): Promise<PostType> {
    const existing = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!existing) throw new NotFoundException('Post not found');

    const slug = dto.title ? await this.ensureUniqueSlug(generateSlug(dto.title), id) : existing.slug;
    const merged = this.repo.merge(existing, { ...dto, slug });
    const saved = await this.repo.save(merged);
    return this.toPost(saved);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!existing) throw new NotFoundException('Post not found');
    await this.repo.softRemove(existing);
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    // Simple loop; for low volume this is fine
    // If conflict, append "-1", "-2", ...
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.repo.findOne({
        where: excludeId
          ? [{ slug, deletedAt: IsNull(), id: excludeId }, { slug, deletedAt: IsNull() }]
          : { slug, deletedAt: IsNull() },
      });
      if (!existing || (excludeId && existing.id === excludeId)) break;
      slug = `${baseSlug}-${counter++}`;
    }
    return slug;
  }

  private toPost(entity: PostEntity): PostType {
    return {
      id: entity.id,
      title: entity.title,
      summary: entity.summary,
      content: entity.content,
      tags: entity.tags,
      published: entity.published,
      slug: entity.slug,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      deleted_at: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }
}
