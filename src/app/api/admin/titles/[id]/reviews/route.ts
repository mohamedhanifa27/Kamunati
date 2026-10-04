import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { rating, body: textBody, authorLabel, containsSpoilers } = body;

    if (!rating || !textBody) {
      return NextResponse.json({ error: 'Missing rating or body' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        mediaId: params.id,
        rating: parseInt(rating),
        body: textBody,
        isEditorial: true,
        authorLabel: authorLabel || 'Editor',
        containsSpoilers: containsSpoilers || false,
        status: 'VISIBLE'
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/titles/:id/reviews error:', err);
    return NextResponse.json({ error: 'Failed to create editorial review' }, { status: 500 });
  }
}
