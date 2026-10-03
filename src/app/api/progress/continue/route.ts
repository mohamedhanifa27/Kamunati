import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.watchProgress.updateMany({
      where: { userId: session.user.id, isCompleted: false, hiddenFromContinue: false },
      data: { hiddenFromContinue: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to hide items' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Convenience endpoint to fetch the list to manage
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await prisma.watchProgress.findMany({
      where: { userId: session.user.id, isCompleted: false, hiddenFromContinue: false },
      orderBy: { updatedAt: 'desc' },
      include: { media: true, episode: true }
    });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
