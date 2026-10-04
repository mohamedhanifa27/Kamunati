import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const MOCK_ADMIN_ID = 'mock-admin-id'; // Replaced by session in real environment
const prisma = new PrismaClient();

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { type, reason, durationDays } = body; // WATCH_BLOCK | REVIEW_BLOCK | LOGIN | WATCH | REVIEW

    if (!type || !reason) {
      return NextResponse.json({ error: 'Missing type or reason' }, { status: 400 });
    }

    let expiresAt = null;
    if (durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
    }

    const restriction = await prisma.userRestriction.create({
      data: {
        userId: params.id,
        type,
        reason,
        expiresAt,
        createdById: MOCK_ADMIN_ID
      }
    });

    return NextResponse.json(restriction, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/users/:id/restrictions error:', err);
    return NextResponse.json({ error: 'Failed to create restriction' }, { status: 500 });
  }
}
