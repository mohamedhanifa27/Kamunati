import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // We expect slug to be provided in body.slug
    const { slug, title, type, category, isPublished, releaseYear, overview } = body;
    
    if (!slug || !title) {
      return NextResponse.json({ error: 'Missing slug or title' }, { status: 400 });
    }

    const existing = await prisma.media.findUnique({ where: { id: slug } });
    if (existing) {
      return NextResponse.json({ error: 'Title with this slug already exists' }, { status: 409 });
    }

    const created = await prisma.media.create({
      data: {
        id: slug,
        title,
        type: type || 'MOVIE',
        category: category || 'MOVIE',
        isPublished: isPublished ?? false,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        overview: overview || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/titles error:', err);
    return NextResponse.json({ error: 'Failed to create title' }, { status: 500 });
  }
}
