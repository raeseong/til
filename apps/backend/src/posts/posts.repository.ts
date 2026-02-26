import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Post } from '@til/shared';

const TABLE = 'posts';

@Injectable()
export class PostsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private throwOnError(error: { message: string }): never {
    throw new InternalServerErrorException(error.message);
  }

  async findAll(): Promise<Post[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('id', { ascending: true });
    if (error) this.throwOnError(error);
    return (data ?? []).map(this.mapRow);
  }

  async findPublished(): Promise<Post[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('published', true)
      .is('deleted_at', null)
      .order('id', { ascending: false });
    if (error) this.throwOnError(error);
    return (data ?? []).map(this.mapRow);
  }

  async findById(id: number): Promise<Post | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      this.throwOnError(error);
    }
    return data ? this.mapRow(data) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      this.throwOnError(error);
    }
    return data ? this.mapRow(data) : null;
  }

  /** slug가 이미 존재하는지 확인 (excludeId 제외). */
  async existsBySlug(slug: string, excludeId?: number): Promise<boolean> {
    let q = this.supabase
      .getClient()
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
      .is('deleted_at', null);
    if (excludeId != null) {
      q = q.neq('id', excludeId);
    }
    const { count, error } = await q;
    if (error) this.throwOnError(error);
    return (count ?? 0) > 0;
  }

  async create(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Post> {
    const now = new Date().toISOString();
    const row = {
      title: post.title,
      summary: post.summary,
      content: post.content,
      tags: post.tags,
      published: post.published,
      slug: post.slug,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) this.throwOnError(error);
    return this.mapRow(data);
  }

  async update(id: number, updates: Partial<Omit<Post, 'id' | 'created_at'>>): Promise<Post | null> {
    const { updated_at, deleted_at, ...rest } = updates as Partial<Post>;
    const row = { ...rest, updated_at: new Date().toISOString() };
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      this.throwOnError(error);
    }
    return data ? this.mapRow(data) : null;
  }

  async softDelete(id: number): Promise<boolean> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .update({ updated_at: now, deleted_at: now })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id');
    if (error) this.throwOnError(error);
    return (data?.length ?? 0) > 0;
  }

  private mapRow(row: Record<string, unknown>): Post {
    return {
      id: row.id as number,
      title: row.title as string,
      summary: row.summary as string,
      content: row.content as string,
      tags: (row.tags as string[]) ?? [],
      published: row.published as boolean,
      slug: row.slug as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: (row.deleted_at as string) ?? null,
    };
  }
}
