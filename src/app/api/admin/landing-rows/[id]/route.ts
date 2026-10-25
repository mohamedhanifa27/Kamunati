export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = await prisma.landingRow.findUnique({
      where: { id }
    });

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch row', details: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, type, genre, category, customMediaIds, limit, isEnabled, sortOrder } = body;

    const existing = await prisma.landingRow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    let stringifiedCustomIds = existing.customMediaIds;
    if (customMediaIds !== undefined) {
      if (Array.isArray(customMediaIds)) {
        stringifiedCustomIds = JSON.stringify(customMediaIds);
      } else if (typeof customMediaIds === 'string') {
        stringifiedCustomIds = customMediaIds;
      } else if (customMediaIds === null) {
        stringifiedCustomIds = null;
      }
    }

    const updated = await prisma.landingRow.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(genre !== undefined ? { genre: genre || null } : {}),
        ...(category !== undefined ? { category: category && category !== 'ALL' ? category : null } : {}),
        ...(customMediaIds !== undefined ? { customMediaIds: stringifiedCustomIds } : {}),
        ...(limit !== undefined ? { limit: parseInt(limit, 10) } : {}),
        ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) } : {})
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PUT /api/admin/landing-rows/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update row', details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.landingRow.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('DELETE /api/admin/landing-rows/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete row', details: err.message }, { status: 500 });
  }
}
