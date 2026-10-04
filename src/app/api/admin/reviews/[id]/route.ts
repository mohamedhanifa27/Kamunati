import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// In a real app we'd extract the admin user from the session, mocked for now
const MOCK_ADMIN_ID = 'mock-admin-id';

const prisma = new PrismaClient();

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { status, isPinned, body: newBody, moderationNote } = body;

    const dataToUpdate: any = {
      moderatedById: MOCK_ADMIN_ID,
      moderationNote
    };

    if (status !== undefined) dataToUpdate.status = status;
    if (isPinned !== undefined) dataToUpdate.isPinned = isPinned;
    if (newBody !== undefined) {
      dataToUpdate.body = newBody;
      dataToUpdate.editedAt = new Date(); // leave 'Edited by admin' badge marker
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: dataToUpdate
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/admin/reviews/:id error:', err);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    // Note: SUPER_ADMIN only, mock check
    // if (session.user.role !== 'SUPER_ADMIN') return 403;
    
    await prisma.review.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/reviews/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
