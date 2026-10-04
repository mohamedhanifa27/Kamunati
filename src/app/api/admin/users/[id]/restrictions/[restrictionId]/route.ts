import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const MOCK_ADMIN_ID = 'mock-admin-id';
const prisma = new PrismaClient();

export async function DELETE(req: Request, props: { params: Promise<{ id: string, restrictionId: string }> }) {
  try {
    const params = await props.params;

    const restriction = await prisma.userRestriction.update({
      where: { id: params.restrictionId },
      data: {
        revokedAt: new Date(),
        revokedById: MOCK_ADMIN_ID,
        expiresAt: new Date() // Force expiration immediately
      }
    });

    return NextResponse.json({ success: true, restriction });
  } catch (err: any) {
    console.error('DELETE /api/admin/users/:id/restrictions/:restrictionId error:', err);
    return NextResponse.json({ error: 'Failed to revoke restriction' }, { status: 500 });
  }
}
