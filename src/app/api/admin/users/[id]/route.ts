import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { featureFlags } from '@/lib/featureFlags';

const prisma = new PrismaClient();

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!featureFlags.adminUserAccess) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });

  try {
    const params = await props.params;
    
    // Instead of hard delete, usually a tombstone is better, but spec says "Remove user" / "hard delete"
    // Let's hard delete via cascade
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/users/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
