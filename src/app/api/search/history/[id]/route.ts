import { NextResponse } from 'next/server';
import { featureFlags } from '../../../../../lib/featureFlags';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  if (!featureFlags.searchCard) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.searchHistory.deleteMany({
      where: { 
        id: params.id,
        userId: session.user.id
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 });
  }
}
