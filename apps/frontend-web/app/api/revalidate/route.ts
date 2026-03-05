import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

/** 허용 경로: 목록 또는 /posts/[slug] 형식 */
function isAllowedPath(path: string): boolean {
  if (path === '/posts') return true;
  if (path.startsWith('/posts/') && path.length > 7) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Revalidate not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (path && isAllowedPath(path)) {
      revalidatePath(path);
      revalidateTag('posts');
    }
    if (tag && (tag === 'posts' || tag.startsWith('post-'))) {
      revalidateTag(tag);
    }
    if (!path && !tag) {
      return NextResponse.json({ error: 'path or tag required' }, { status: 400 });
    }
    return NextResponse.json({ revalidated: true, path: path ?? undefined, tag: tag ?? undefined });
  } catch (e) {
    console.error('[revalidate]', e);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
