import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    
    // Convert releaseYear to int if provided
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.originalName !== undefined) updateData.originalName = body.originalName;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.hoverTagline !== undefined) updateData.hoverTagline = body.hoverTagline;
    if (body.overview !== undefined) updateData.overview = body.overview;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.releaseYear !== undefined) updateData.releaseYear = parseInt(body.releaseYear);
    if (body.runtime !== undefined) updateData.runtime = parseInt(body.runtime);
    if (body.maturityRating !== undefined) updateData.maturityRating = body.maturityRating;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    
    // If slug is provided and different from id, we might need to handle redirects (omitted for brevity)

    const updated = await prisma.media.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/admin/titles/:id error:', err);
    return NextResponse.json({ error: 'Failed to update title metadata' }, { status: 500 });
  }
}
