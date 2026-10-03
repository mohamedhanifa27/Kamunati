import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request, props: { params: Promise<{ mediaAssetId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.watchProgress.updateMany({
      where: { mediaId: params.mediaAssetId, userId: session.user.id },
      data: { hiddenFromContinue: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to hide item' }, { status: 500 });
  }
}
