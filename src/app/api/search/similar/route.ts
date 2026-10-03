import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    // 1. Suggest titles that start with or contain the query
    const titles = await prisma.media.findMany({
      where: {
        isPublished: true,
        title: { startsWith: q }
      },
      select: { title: true },
      take: 4
    });

    const suggestions = titles.map((t: any) => ({ query: t.title, type: 'title' }));

    // 2. If short on suggestions, add some related genres
    if (suggestions.length < 6) {
      const allGenres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Animation', 'Horror', 'Romance'];
      const matchingGenres = allGenres.filter(g => g.toLowerCase().includes(q.toLowerCase()));
      
      for (const g of matchingGenres) {
        if (suggestions.length < 6) {
          suggestions.push({ query: g, type: 'genre' });
        }
      }
    }

    // Return deduplicated queries
    const unique = Array.from(new Map(suggestions.map((s: any) => [s.query.toLowerCase(), s])).values());
    
    return NextResponse.json({ results: unique });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch similar searches' }, { status: 500 });
  }
}
