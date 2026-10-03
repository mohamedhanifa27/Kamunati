import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, props: { params: Promise<{ mediaAssetId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.watchProgress.updateMany({
      where: { mediaId: params.mediaAssetId, userId: session.user.id },
      data: { timestampSec: 0, isCompleted: false, updatedAt: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
  }
}
