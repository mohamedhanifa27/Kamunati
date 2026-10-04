import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const MOCK_ADMIN_ID = 'mock-admin-id';
const prisma = new PrismaClient();

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { status } = body; // OPEN | RESOLVED | REJECTED

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    const updated = await prisma.reviewReport.update({
      where: { id: params.id },
      data: { 
        status,
        handledById: MOCK_ADMIN_ID
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/admin/review-reports/:id error:', err);
    return NextResponse.json({ error: 'Failed to update review report' }, { status: 500 });
  }
}
